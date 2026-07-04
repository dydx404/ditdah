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
import { I18nProvider } from '@/i18n'
import type { RoundSummary } from '@/ui/useTrainerSession'
import { mergeSessionIntoProgress } from '@/app/progress'
import { DEFAULT_TRAINER } from '@/app/config'
import { loadSettings, saveSettings, type Settings } from '@/app/settings'
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
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [history, setHistory] = useState<readonly RoundRecord[]>(() =>
    loadHistory(),
  )
  const initialSettingsRef = useRef(settings)
  const settingsRef = useRef(settings)
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
      createTrainer({
        ...DEFAULT_TRAINER,
        timing: {
          charWpm: s.charWpm,
          effectiveWpm: s.effectiveWpm,
          toneHz: s.toneHz,
        },
        initialUnlockCount: Math.max(
          DEFAULT_TRAINER.initialUnlockCount,
          unlockedCount,
        ),
        promptMode: s.promptMode,
        groupSize: s.groupSize,
        seed: Math.floor(Math.random() * 0xffffffff),
      }),
    [],
  )

  useEffect(() => {
    let cancelled = false
    void storeRef.current?.load().then((base) => {
      if (cancelled) return
      baseRef.current = base
      streakRef.current = base?.streak ?? null
      setStreakCount(base?.streak?.count ?? 0)
      setTrainer(buildTrainer(base?.unlocked.length ?? 0, initialSettingsRef.current))
    })
    return () => {
      cancelled = true
    }
  }, [buildTrainer, setTrainer])

  // Prompt mode / group size are baked into the trainer at creation, so switching
  // them rebuilds it. Fold the outgoing session's stats into base first, or a
  // subsequent save would drop everything copied before the switch.
  useEffect(() => {
    const outgoing = trainerRef.current
    if (!outgoing) return
    const folded = mergeSessionIntoProgress(
      baseRef.current,
      outgoing.unlockedChars(),
      outgoing.summary().perChar,
      { streak: streakRef.current },
    )
    baseRef.current = folded
    streakRef.current = folded.streak
    void storeRef.current?.save(folded)
    setTrainer(buildTrainer(outgoing.unlockedChars().length, settingsRef.current))
  }, [settings.promptMode, settings.groupSize, buildTrainer, setTrainer])

  useEffect(() => {
    engineRef.current?.setVolume(settings.volume)
  }, [settings.volume])

  const handleAnswered = useCallback(() => {
    const store = storeRef.current
    if (!trainer || !store) return
    const next = mergeSessionIntoProgress(
      baseRef.current,
      trainer.unlockedChars(),
      trainer.summary().perChar,
      { streak: streakRef.current },
    )
    streakRef.current = next.streak
    setStreakCount(next.streak.count)
    void store.save(next)
  }, [trainer])

  const handleSettingsChange = useCallback((next: Settings) => {
    setSettings(next)
    saveSettings(next)
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
      <div className="grid h-full place-items-center">
        <span className="font-mono text-sm text-muted">loading…</span>
      </div>
    )
  }

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
        streak={streakCount}
        history={history}
        onAnswered={handleAnswered}
        onRoundComplete={handleRoundComplete}
        onClearHistory={handleClearHistory}
      />
    </I18nProvider>
  )
}

export default App
