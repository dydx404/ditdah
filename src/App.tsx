/*
 * App root / composition.
 * Wires the long-lived engine + persisted trainer into the practice screen.
 *
 * Persistence: load saved Progress, start the trainer at the saved unlock level
 * (via initialUnlockCount — no trainer-contract change), and save after every
 * answer. `baseRef` is the progress at session start; lifetime stats = base +
 * this session (recomputed each save, so it never double-counts).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ToneEngine } from '@/core/audio/types'
import { WebAudioToneEngine } from '@/core/audio'
import type { Trainer } from '@/core/trainer/types'
import { createTrainer } from '@/core/trainer'
import { createProgressStore } from '@/core/storage'
import type { Progress, ProgressStore, Streak } from '@/core/storage/types'
import { PracticeScreen } from '@/ui/PracticeScreen'
import { I18nProvider, useT } from '@/i18n'
import type { RoundSummary } from '@/ui/useTrainerSession'
import { mergeSessionIntoProgress } from '@/app/progress'
import { mergeProgress, type SyncClient } from '@/app/sync'
import {
  createSupabaseSyncClient,
  onAuthChange,
  signInWithEmail,
  signOut,
  type AuthUser,
} from '@/app/cloudSync'
import { loadSettings, saveSettings, type Settings } from '@/app/settings'
import {
  trainerConfigForSettings,
  unlockedCharsForProgress,
} from '@/app/trainerConfig'
import {
  appendRound,
  clearHistory,
  loadHistory,
  type RoundRecord,
} from '@/app/history'

function App() {
  const engineRef = useRef<ToneEngine | null>(null)
  if (!engineRef.current) engineRef.current = new WebAudioToneEngine()

  const storeRef = useRef<ProgressStore | null>(null)
  if (!storeRef.current) storeRef.current = createProgressStore()

  // Progress loaded at session start; fixed for the whole session.
  const baseRef = useRef<Progress | null>(null)
  const streakRef = useRef<Streak | null>(null)
  const [trainer, setTrainerState] = useState<Trainer | null>(null)
  const trainerRef = useRef<Trainer | null>(null)
  const setTrainer = useCallback((next: Trainer) => {
    trainerRef.current = next
    setTrainerState(next)
  }, [])
  const [streakCount, setStreakCount] = useState(0)

  // Cloud sync (optional): anonymous use never touches any of this.
  const syncRef = useRef<SyncClient | null>(null)
  if (!syncRef.current) syncRef.current = createSupabaseSyncClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const userRef = useRef<AuthUser | null>(null)
  const [syncing, setSyncing] = useState(false)
  const reconciledUserRef = useRef<string | null>(null)
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestProgressRef = useRef<Progress | null>(null)

  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [history, setHistory] = useState<readonly RoundRecord[]>(() =>
    loadHistory(),
  )
  const initialSettingsRef = useRef(settings)
  const settingsRef = useRef(settings)
  const trainerSettingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])
  const timing = useMemo(
    () => ({
      charWpm: settings.charWpm,
      effectiveWpm: settings.effectiveWpm,
      toneHz: settings.toneHz,
    }),
    [settings],
  )

  const buildTrainer = useCallback(
    (unlockedCount: number, s: Settings): Trainer =>
      createTrainer(
        trainerConfigForSettings(
          unlockedCount,
          s,
          Math.floor(Math.random() * 0xffffffff),
        ),
      ),
    [],
  )

  const installTrainer = useCallback(
    (unlockedCount: number, s: Settings) => {
      trainerSettingsRef.current = s
      setTrainer(buildTrainer(unlockedCount, s))
    },
    [buildTrainer, setTrainer],
  )

  // The up-to-date local snapshot (base + this session), used for sync.
  const currentLocalProgress = useCallback((): Progress => {
    const tr = trainerRef.current
    const trainerSettings = trainerSettingsRef.current
    return mergeSessionIntoProgress(
      baseRef.current,
      unlockedCharsForProgress(baseRef.current?.unlocked, tr, trainerSettings),
      tr ? tr.summary().perChar : [],
      { streak: streakRef.current },
    )
  }, [])

  // Debounced upload — coalesce the flurry of per-answer saves into one push.
  const schedulePush = useCallback((progress: Progress) => {
    if (!userRef.current) return
    latestProgressRef.current = progress
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(() => {
      const p = latestProgressRef.current
      if (p) void syncRef.current?.push(p).catch(() => {})
    }, 4000)
  }, [])

  // On sign-in: merge local ↔ remote, save both, and rebuild the trainer so its
  // (now folded) session resets and any newly synced unlocks take effect.
  const reconcile = useCallback(async () => {
    const sync = syncRef.current
    const store = storeRef.current
    if (!sync || !store) return
    setSyncing(true)
    try {
      const local = currentLocalProgress()
      const remote = await sync.pull()
      const merged = mergeProgress(local, remote) ?? local
      baseRef.current = merged
      streakRef.current = merged.streak
      setStreakCount(merged.streak.count)
      await store.save(merged)
      await sync.push(merged)
      installTrainer(merged.unlocked.length, settingsRef.current)
    } catch {
      // Sync is best-effort; local practice continues regardless.
    } finally {
      setSyncing(false)
    }
  }, [currentLocalProgress, installTrainer])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => onAuthChange(setUser), [])

  useEffect(() => {
    if (!user) {
      reconciledUserRef.current = null
      return
    }
    if (!trainer || reconciledUserRef.current === user.id) return
    reconciledUserRef.current = user.id
    void reconcile()
  }, [user, trainer, reconcile])

  useEffect(() => {
    let cancelled = false
    void storeRef.current?.load().then((base) => {
      if (cancelled) return
      baseRef.current = base
      streakRef.current = base?.streak ?? null
      setStreakCount(base?.streak?.count ?? 0)
      installTrainer(base?.unlocked.length ?? 0, initialSettingsRef.current)
    })
    return () => {
      cancelled = true
    }
  }, [installTrainer])

  // Prompt mode / group size are baked into the trainer at creation, so switching
  // them rebuilds it. Fold the outgoing session's stats into base first, or a
  // subsequent save would drop everything copied before the switch.
  const customCharsetKey = settings.customCharset.join('')
  const promptPoolKey = settings.promptPool.join('\u0000')
  useEffect(() => {
    const outgoing = trainerRef.current
    if (!outgoing) return
    const outgoingSettings = trainerSettingsRef.current
    const folded = mergeSessionIntoProgress(
      baseRef.current,
      unlockedCharsForProgress(
        baseRef.current?.unlocked,
        outgoing,
        outgoingSettings,
      ),
      outgoing.summary().perChar,
      { streak: streakRef.current },
    )
    baseRef.current = folded
    streakRef.current = folded.streak
    void storeRef.current?.save(folded)
    schedulePush(folded)
    installTrainer(folded.unlocked.length, settingsRef.current)
  }, [
    settings.promptMode,
    settings.groupSize,
    settings.charSource,
    customCharsetKey,
    promptPoolKey,
    installTrainer,
    schedulePush,
  ])

  useEffect(() => {
    engineRef.current?.setVolume(settings.volume)
  }, [settings.volume])

  const handleAnswered = useCallback(() => {
    const store = storeRef.current
    if (!trainer || !store) return
    const next = mergeSessionIntoProgress(
      baseRef.current,
      unlockedCharsForProgress(
        baseRef.current?.unlocked,
        trainer,
        trainerSettingsRef.current,
      ),
      trainer.summary().perChar,
      { streak: streakRef.current },
    )
    streakRef.current = next.streak
    setStreakCount(next.streak.count)
    void store.save(next)
    schedulePush(next)
  }, [trainer, schedulePush])

  const handleSettingsChange = useCallback((next: Settings) => {
    setSettings(next)
    saveSettings(next)
  }, [])

  const handleSignIn = useCallback(async (email: string) => {
    await signInWithEmail(
      email,
      window.location.origin + window.location.pathname,
    )
  }, [])

  const handleSignOut = useCallback(() => {
    void signOut()
  }, [])

  const handleRoundComplete = useCallback((summary: RoundSummary) => {
    setHistory(
      appendRound({
        at: new Date().toISOString(),
        total: summary.total,
        correct: summary.correct,
        accuracy: summary.accuracy,
        effectiveWpm: summary.effectiveWpm,
      }),
    )
  }, [])

  const handleClearHistory = useCallback(() => {
    clearHistory()
    setHistory([])
  }, [])

  if (!trainer) {
    return (
      <I18nProvider locale={settings.locale}>
        <LoadingScreen />
      </I18nProvider>
    )
  }

  const progressSnapshot = currentLocalProgress()

  return (
    <I18nProvider locale={settings.locale}>
      <PracticeScreen
        trainer={trainer}
        engine={engineRef.current}
        timing={timing}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        roundLength={settings.roundLength}
        gateOnMiss={settings.strictGate}
        answerSounds={settings.answerSounds}
        account={{
          user,
          syncing,
          onSignIn: handleSignIn,
          onSignOut: handleSignOut,
        }}
        charStats={progressSnapshot.charStats}
        unlockedPresetChars={progressSnapshot.unlocked}
        streak={streakCount}
        history={history}
        onAnswered={handleAnswered}
        onRoundComplete={handleRoundComplete}
        onClearHistory={handleClearHistory}
      />
    </I18nProvider>
  )
}

function LoadingScreen() {
  const t = useT()

  return (
    <div className="grid h-full place-items-center">
      <span className="font-mono text-sm text-muted">{t('app.loading')}</span>
    </div>
  )
}

export default App
