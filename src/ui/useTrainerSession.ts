/**
 * useTrainerSession — the receiving-loop state machine.
 *
 * Orchestrates trainer + audio into the core loop:
 *   idle → (start, needs a user gesture to unlock audio)
 *        → listening (tone plays; the character is NOT shown — sound-first)
 *        → feedback (reveal on miss, replay the correct sound) → listening → …
 *
 * Trainer and ToneEngine are injected so the loop logic is unit-testable with a
 * fake engine and fake timers. UI timing (feedback holds) uses setTimeout — that
 * is fine; only *audio* timing must stay on the Web Audio clock (in core/audio).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { renderToElements } from '@/core/morse'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'
import type { AnswerResult, Prompt, SessionSummary, Trainer } from '@/core/trainer/types'

export type Phase = 'idle' | 'listening' | 'feedback'

/** Keys we treat as an answer (letters, digits, and supported punctuation). */
const VALID_KEY = /^[a-z0-9.,?/=+-]$/i

export interface UseTrainerSessionOptions {
  trainer: Trainer
  engine: ToneEngine
  timing: TimingConfig
  /** How long to hold feedback on a correct answer before the next prompt. */
  correctHoldMs?: number
  /** How long to hold feedback on a miss (longer — the learner studies it). */
  wrongHoldMs?: number
  /** Called after each scored answer — the app persists progress here. */
  onAnswered?: (result: AnswerResult) => void
}

export interface SessionView {
  phase: Phase
  unlocked: readonly string[]
  lastResult: AnswerResult | null
  /** The character to reveal during feedback (only set on a miss), else null. */
  reveal: string | null
  summary: SessionSummary
  /** A just-unlocked character to celebrate, until dismissed. */
  unlockToast: string | null
  start: () => void
  replay: () => void
  dismissToast: () => void
}

export function useTrainerSession(opts: UseTrainerSessionOptions): SessionView {
  const { trainer, engine, timing, onAnswered } = opts
  const correctHoldMs = opts.correctHoldMs ?? 450
  const wrongHoldMs = opts.wrongHoldMs ?? 1300

  const [phase, setPhase] = useState<Phase>('idle')
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [reveal, setReveal] = useState<string | null>(null)
  const [unlockToast, setUnlockToast] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary>(() => trainer.summary())

  const promptRef = useRef<Prompt | null>(null) // active prompt for submit()
  const textRef = useRef<string | null>(null) // current char, for replay
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playTone = useCallback(
    (text: string) => {
      engine.play(renderToElements(text, timing), timing.toneHz)
    },
    [engine, timing],
  )

  const playNext = useCallback(() => {
    const prompt = trainer.nextPrompt()
    promptRef.current = prompt
    textRef.current = prompt.text
    setReveal(null)
    setLastResult(null)
    setPhase('listening')
    playTone(prompt.text)
  }, [trainer, playTone])

  const start = useCallback(() => {
    void engine.resume().then(() => {
      setSummary(trainer.summary())
      playNext()
    })
  }, [engine, trainer, playNext])

  const replay = useCallback(() => {
    if (textRef.current) playTone(textRef.current)
  }, [playTone])

  const handleAnswer = useCallback(
    (key: string) => {
      const prompt = promptRef.current
      if (!prompt) return
      promptRef.current = null // guard against a fast double keypress

      const result = trainer.submit(prompt.id, key)
      setLastResult(result)
      setSummary(trainer.summary())
      setPhase('feedback')
      if (!result.correct) {
        setReveal(result.expected)
        playTone(result.expected) // let them hear the correct sound
      }
      if (result.unlocked) setUnlockToast(result.unlocked)
      onAnswered?.(result) // app persists progress

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(
        playNext,
        result.correct ? correctHoldMs : wrongHoldMs,
      )
    },
    [trainer, playTone, playNext, correctHoldMs, wrongHoldMs, onAnswered],
  )

  // Capture answers only while listening — no typing ahead during feedback.
  useEffect(() => {
    if (phase !== 'listening') return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!VALID_KEY.test(e.key)) return
      e.preventDefault()
      handleAnswer(e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleAnswer])

  // Stop audio and clear timers on unmount.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      engine.stop()
    },
    [engine],
  )

  const dismissToast = useCallback(() => setUnlockToast(null), [])

  return {
    phase,
    unlocked: trainer.unlockedChars(),
    lastResult,
    reveal,
    summary,
    unlockToast,
    start,
    replay,
    dismissToast,
  }
}
