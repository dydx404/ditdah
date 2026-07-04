/*
 * App root / composition.
 * Creates the long-lived engine + trainer once and hands them to the practice
 * screen. This is the single place that chooses the trainer implementation —
 * swap `createStubTrainer` for `createTrainer` from '@/core/trainer' when #5
 * merges, and delete src/ui/dev.
 */
import { useRef } from 'react'
import type { ToneEngine } from '@/core/audio/types'
import { WebAudioToneEngine } from '@/core/audio'
import type { Trainer } from '@/core/trainer/types'
import { PracticeScreen } from '@/ui/PracticeScreen'
import { createStubTrainer } from '@/ui/dev/stubTrainer'
import { DEFAULT_TIMING, DEFAULT_TRAINER } from '@/app/config'

function App() {
  // One engine and one trainer for the app's lifetime.
  const engineRef = useRef<ToneEngine | null>(null)
  const trainerRef = useRef<Trainer | null>(null)
  if (!engineRef.current) engineRef.current = new WebAudioToneEngine()
  if (!trainerRef.current) {
    trainerRef.current = createStubTrainer({
      ...DEFAULT_TRAINER,
      seed: Math.floor(Math.random() * 0xffffffff),
    })
  }

  return (
    <PracticeScreen
      trainer={trainerRef.current}
      engine={engineRef.current}
      timing={DEFAULT_TIMING}
    />
  )
}

export default App
