/*
 * App root / composition.
 * Wires the long-lived engine + persisted trainer into the practice screen.
 *
 * Persistence: load saved Progress, start the trainer at the saved unlock level
 * (via initialUnlockCount — no trainer-contract change), and save after every
 * answer. `baseRef` is the progress at session start; lifetime stats = base +
 * this session (recomputed each save, so it never double-counts).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToneEngine } from '@/core/audio/types'
import { WebAudioToneEngine } from '@/core/audio'
import type { Trainer } from '@/core/trainer/types'
import { createTrainer } from '@/core/trainer'
import { createProgressStore } from '@/core/storage'
import type { Progress, ProgressStore } from '@/core/storage/types'
import { PracticeScreen } from '@/ui/PracticeScreen'
import { mergeSessionIntoProgress } from '@/app/progress'
import { DEFAULT_TIMING, DEFAULT_TRAINER } from '@/app/config'

function App() {
  const engineRef = useRef<ToneEngine | null>(null)
  if (!engineRef.current) engineRef.current = new WebAudioToneEngine()

  const storeRef = useRef<ProgressStore | null>(null)
  if (!storeRef.current) storeRef.current = createProgressStore()

  // Progress loaded at session start; fixed for the whole session.
  const baseRef = useRef<Progress | null>(null)
  const [trainer, setTrainer] = useState<Trainer | null>(null)

  useEffect(() => {
    let cancelled = false
    void storeRef.current?.load().then((base) => {
      if (cancelled) return
      baseRef.current = base
      const initialUnlockCount = Math.max(
        DEFAULT_TRAINER.initialUnlockCount,
        base?.unlocked.length ?? 0,
      )
      setTrainer(
        createTrainer({
          ...DEFAULT_TRAINER,
          initialUnlockCount,
          seed: Math.floor(Math.random() * 0xffffffff),
        }),
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleAnswered = useCallback(() => {
    const store = storeRef.current
    if (!trainer || !store) return
    const next = mergeSessionIntoProgress(
      baseRef.current,
      trainer.unlockedChars(),
      trainer.summary().perChar,
    )
    void store.save(next)
  }, [trainer])

  if (!trainer) {
    return (
      <div className="grid h-full place-items-center">
        <span className="font-mono text-sm text-muted">loading…</span>
      </div>
    )
  }

  return (
    <PracticeScreen
      trainer={trainer}
      engine={engineRef.current}
      timing={DEFAULT_TIMING}
      onAnswered={handleAnswered}
    />
  )
}

export default App
