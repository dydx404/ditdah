/**
 * useTrainerSession — the receiving-loop state machine.
 *
 * Rounds (Monkeytype-style): a round is `roundLength` prompts, then a summary,
 * then "practice again". The loop within a round:
 *   idle → (start, needs a user gesture to unlock audio)
 *        → listening (tone plays; the character is NOT shown — sound-first)
 *        → feedback (reveal on miss, replay the correct sound) → listening → …
 *        → summary (after the last prompt) → (again) → listening → …
 *
 * Round stats are accumulated here from each AnswerResult, so the trainer stays
 * a pure per-answer scorer. Trainer and ToneEngine are injected for testability.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { renderToElements } from '@/core/morse'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'
import type {
  AnswerResult,
  CharStat,
  Prompt,
  SessionSummary,
  Trainer,
} from '@/core/trainer/types'

export type Phase = 'idle' | 'listening' | 'feedback' | 'summary'

/** Keys we treat as an answer (letters, digits, and supported punctuation). */
const VALID_KEY = /^[a-z0-9.,?/=+-]$/i

const DEFAULT_ROUND_LENGTH = 25

/** The result of one completed round. */
export interface RoundSummary {
  readonly total: number
  readonly correct: number
  readonly accuracy: number
  readonly effectiveWpm: number
  /** Per-character stats for this round, weakest first. */
  readonly perChar: readonly CharStat[]
  /** Characters unlocked during this round, in order. */
  readonly unlocked: readonly string[]
}

export interface UseTrainerSessionOptions {
  trainer: Trainer
  engine: ToneEngine
  timing: TimingConfig
  /** Prompts per round (default 25). */
  roundLength?: number
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
  /** The completed round's summary, shown in the `summary` phase. */
  roundSummary: RoundSummary | null
  /** A just-unlocked character to celebrate, until dismissed. */
  unlockToast: string | null
  /** Begin the first round (needs the user gesture that unlocks audio). */
  start: () => void
  /** Start another round after a summary. */
  again: () => void
  replay: () => void
  dismissToast: () => void
}

export function useTrainerSession(opts: UseTrainerSessionOptions): SessionView {
  const { trainer, engine, timing, onAnswered } = opts
  const roundLength = opts.roundLength ?? DEFAULT_ROUND_LENGTH
  const correctHoldMs = opts.correctHoldMs ?? 450
  const wrongHoldMs = opts.wrongHoldMs ?? 1300

  const [phase, setPhase] = useState<Phase>('idle')
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [reveal, setReveal] = useState<string | null>(null)
  const [unlockToast, setUnlockToast] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary>(() => trainer.summary())
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null)

  const promptRef = useRef<Prompt | null>(null) // active prompt for submit()
  const textRef = useRef<string | null>(null) // current char, for replay
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Round-local accumulation (reset each round).
  const roundStatsRef = useRef(new Map<string, { attempts: number; correct: number }>())
  const roundCountRef = useRef(0)
  const roundUnlocksRef = useRef<string[]>([])

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

  const finishRound = useCallback(() => {
    const perChar: CharStat[] = [...roundStatsRef.current.entries()]
      .map(([char, s]) => ({
        char,
        attempts: s.attempts,
        correct: s.correct,
        accuracy: s.attempts ? s.correct / s.attempts : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    const total = perChar.reduce((n, c) => n + c.attempts, 0)
    const correct = perChar.reduce((n, c) => n + c.correct, 0)
    setRoundSummary({
      total,
      correct,
      accuracy: total ? correct / total : 0,
      effectiveWpm: timing.effectiveWpm,
      perChar,
      unlocked: [...roundUnlocksRef.current],
    })
    setPhase('summary')
  }, [timing.effectiveWpm])

  const advance = useCallback(() => {
    if (roundCountRef.current >= roundLength) finishRound()
    else playNext()
  }, [roundLength, finishRound, playNext])

  const beginRound = useCallback(() => {
    roundStatsRef.current = new Map()
    roundCountRef.current = 0
    roundUnlocksRef.current = []
    setRoundSummary(null)
    playNext()
  }, [playNext])

  const start = useCallback(() => {
    void engine.resume().then(() => {
      setSummary(trainer.summary())
      beginRound()
    })
  }, [engine, trainer, beginRound])

  const again = useCallback(() => {
    beginRound()
  }, [beginRound])

  const replay = useCallback(() => {
    if (textRef.current) playTone(textRef.current)
  }, [playTone])

  const handleAnswer = useCallback(
    (key: string) => {
      const prompt = promptRef.current
      if (!prompt) return
      promptRef.current = null // guard against a fast double keypress

      const result = trainer.submit(prompt.id, key)

      // Accumulate this round's stats.
      const rs = roundStatsRef.current
      const prev = rs.get(result.expected) ?? { attempts: 0, correct: 0 }
      rs.set(result.expected, {
        attempts: prev.attempts + 1,
        correct: prev.correct + (result.correct ? 1 : 0),
      })
      roundCountRef.current += 1
      if (result.unlocked) roundUnlocksRef.current.push(result.unlocked)

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
        advance,
        result.correct ? correctHoldMs : wrongHoldMs,
      )
    },
    [trainer, playTone, advance, correctHoldMs, wrongHoldMs, onAnswered],
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
    roundSummary,
    unlockToast,
    start,
    again,
    replay,
    dismissToast,
  }
}
