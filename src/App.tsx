/*
 * App root / composition.
 * Creates the long-lived engine + trainer once and hands them to the practice
 * screen. This is the single place that chooses the trainer implementation.
 */
import { useRef } from 'react'
import type { ToneEngine } from '@/core/audio/types'
import { WebAudioToneEngine } from '@/core/audio'
import type { Trainer } from '@/core/trainer/types'
import { createTrainer } from '@/core/trainer'
import { PracticeScreen } from '@/ui/PracticeScreen'
import { DEFAULT_TIMING, DEFAULT_TRAINER } from '@/app/config'

function App() {
  // One engine and one trainer for the app's lifetime.
  const engineRef = useRef<ToneEngine | null>(null)
  const trainerRef = useRef<Trainer | null>(null)
  if (!engineRef.current) engineRef.current = new WebAudioToneEngine()
  if (!trainerRef.current) {
    trainerRef.current = createTrainer({
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
