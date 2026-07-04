/**
 * useTrainerSession — the receiving-loop state machine.
 *
 * Rounds (Monkeytype-style): a round is `roundLength` prompts, then a summary,
 * then "practice again". The loop within a round:
 *   idle → (start, needs a user gesture to unlock audio)
 *        → listening (tone plays; the character is NOT shown — sound-first)
 *        → feedback (correct: cue + green flash, then auto-advance)
 *        → retry (strict miss: buzz + reveal + replay; user echoes to continue)
 *        → summary (after the last prompt) → (again) → listening → …
 *
 * Strict mode defaults to "force continue only when passed": a miss doesn't
 * auto-advance. It's scored once (the first attempt), then the learner must type
 * the character back to move on. The retype is a reinforcement rep, not
 * re-scored — otherwise accuracy and unlocks would be trivially gamed. If the
 * gate is off, a miss is still scored once, then revealed/replayed and advanced.
 *
 * Group mode: when a prompt is more than one character, the learner types into
 * a buffer (backspace to fix) and it submits on Enter or automatically once the
 * buffer fills. Each position is scored by the trainer; feedback shows the group
 * per position. The echo-gate is single-character only — a missed group reveals
 * and advances (retyping five characters to "pass" would be punishing).
 *
 * Round stats are accumulated here from each AnswerResult, so the trainer stays
 * a pure per-answer scorer. Trainer and ToneEngine are injected for testability.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { renderToElements } from '@/core/morse'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'
import { playCue, type Cue } from './cues'
import type {
  AnswerResult,
  CharStat,
  Prompt,
  SessionSummary,
  Trainer,
} from '@/core/trainer/types'

export type Phase = 'idle' | 'listening' | 'feedback' | 'retry' | 'summary'

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
  /** How long to hold feedback on a miss when gateOnMiss is false. */
  wrongHoldMs?: number
  /** If true, a miss requires typing the revealed character before continuing. */
  gateOnMiss?: boolean
  /** If true, play short correct/wrong UI cues after answers. */
  sounds?: boolean
  /** Called after each scored answer — the app persists progress here. */
  onAnswered?: (result: AnswerResult) => void
  /** Called once when a round finishes — the app can log it to history. */
  onRoundComplete?: (summary: RoundSummary) => void
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
  /** Characters in the active prompt (1 for single mode, >1 for a group). */
  promptLength: number
  /** What the learner has typed so far this prompt (group mode). */
  buffer: string
  /** Begin the first round (needs the user gesture that unlocks audio). */
  start: () => void
  /** Start another round after a summary. */
  again: () => void
  /** Submit a single-character answer (used by on-screen tap input). */
  answer: (key: string) => void
  /** Echo the revealed character during the `retry` gate (tap input path). */
  retryAnswer: (key: string) => void
  /** Append a character to the group buffer (tap input path). */
  typeChar: (key: string) => void
  /** Delete the last character from the group buffer. */
  backspace: () => void
  /** Submit the group buffer as it stands. */
  submitGroup: () => void
  replay: () => void
  dismissToast: () => void
}

export function useTrainerSession(opts: UseTrainerSessionOptions): SessionView {
  const { trainer, engine, timing, onAnswered, onRoundComplete } = opts
  const roundLength = opts.roundLength ?? DEFAULT_ROUND_LENGTH
  const correctHoldMs = opts.correctHoldMs ?? 450
  const wrongHoldMs = opts.wrongHoldMs ?? 1200
  const gateOnMiss = opts.gateOnMiss ?? true
  const sounds = opts.sounds ?? true

  const [phase, setPhase] = useState<Phase>('idle')
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [reveal, setReveal] = useState<string | null>(null)
  const [unlockToast, setUnlockToast] = useState<string | null>(null)
  const [summary, setSummary] = useState<SessionSummary>(() => trainer.summary())
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null)
  const [promptLength, setPromptLength] = useState(1)
  const [buffer, setBuffer] = useState('')

  const promptRef = useRef<Prompt | null>(null) // active prompt for submit()
  const textRef = useRef<string | null>(null) // current text, for replay
  const retryCharRef = useRef<string | null>(null) // char to echo during retry
  const bufferRef = useRef('') // group buffer, mirrored to state for render
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setBuf = useCallback((next: string) => {
    bufferRef.current = next
    setBuffer(next)
  }, [])

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

  const cue = useCallback(
    (kind: Cue) => (sounds ? playCue(engine, kind) : { done: Promise.resolve() }),
    [engine, sounds],
  )

  const playNext = useCallback(() => {
    const prompt = trainer.nextPrompt()
    promptRef.current = prompt
    textRef.current = prompt.text
    setPromptLength(prompt.text.length)
    setBuf('')
    setReveal(null)
    setLastResult(null)
    setPhase('listening')
    playTone(prompt.text)
  }, [trainer, playTone, setBuf])

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
    const roundResult: RoundSummary = {
      total,
      correct,
      accuracy: total ? correct / total : 0,
      effectiveWpm: timing.effectiveWpm,
      perChar,
      unlocked: [...roundUnlocksRef.current],
    }
    setRoundSummary(roundResult)
    setPhase('summary')
    onRoundComplete?.(roundResult)
  }, [timing.effectiveWpm, onRoundComplete])

  const advance = useCallback(() => {
    if (roundCountRef.current >= roundLength) finishRound()
    else playNext()
  }, [roundLength, finishRound, playNext])

  const beginRound = useCallback(() => {
    roundStatsRef.current = new Map()
    roundCountRef.current = 0
    roundUnlocksRef.current = []
    retryCharRef.current = null
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

      // Accumulate this round's stats. A group scores one attempt per position
      // (result.perChar); a single answer is one attempt for its character.
      const rs = roundStatsRef.current
      const tally = result.perChar ?? [
        { expected: result.expected, correct: result.correct },
      ]
      for (const c of tally) {
        const prev = rs.get(c.expected) ?? { attempts: 0, correct: 0 }
        rs.set(c.expected, {
          attempts: prev.attempts + 1,
          correct: prev.correct + (c.correct ? 1 : 0),
        })
      }
      roundCountRef.current += 1 // one prompt (single char or whole group)
      if (result.unlocked) roundUnlocksRef.current.push(result.unlocked)

      setLastResult(result)
      setSummary(trainer.summary())
      if (result.unlocked) setUnlockToast(result.unlocked)
      onAnswered?.(result) // app persists progress (first attempt is the score)

      // The echo-gate is single-character only; a missed group just reveals.
      const isGroup = result.perChar !== undefined

      if (result.correct) {
        setReveal(null)
        setPhase('feedback')
        cue('correct')
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(advance, correctHoldMs)
      } else {
        const expected = result.expected
        setReveal(expected)
        if (gateOnMiss && !isGroup) {
          // Gate: cue, reveal the answer, replay it, and wait for the echo.
          retryCharRef.current = expected
          setPhase('retry')
          cue('wrong').done.then(() => {
            if (retryCharRef.current === expected) playTone(expected)
          })
        } else {
          retryCharRef.current = null
          setPhase('feedback')
          cue('wrong').done.then(() => playTone(expected))
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(advance, wrongHoldMs)
        }
      }
    },
    [
      trainer,
      playTone,
      advance,
      correctHoldMs,
      wrongHoldMs,
      gateOnMiss,
      cue,
      onAnswered,
    ],
  )

  // The `retry` gate: the char is revealed, so this retype is a reinforcement
  // rep, not a scored answer. Only a correct echo advances; a wrong key buzzes.
  const handleRetry = useCallback(
    (key: string) => {
      const expected = retryCharRef.current
      if (!expected) return
      if (key.toUpperCase() !== expected) {
        cue('wrong')
        return
      }
      retryCharRef.current = null
      // Display-only success flash (not fed to the trainer or onAnswered).
      setLastResult({ correct: true, expected, received: expected, unlocked: null })
      setReveal(null)
      setPhase('feedback')
      cue('correct')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(advance, correctHoldMs)
    },
    [advance, correctHoldMs, cue],
  )

  // Group input: append into the buffer; auto-submit once it's full.
  const typeChar = useCallback(
    (key: string) => {
      const prompt = promptRef.current
      if (!prompt || bufferRef.current.length >= prompt.text.length) return
      const next = bufferRef.current + key.toUpperCase()
      setBuf(next)
      if (next.length >= prompt.text.length) handleAnswer(next)
    },
    [handleAnswer, setBuf],
  )

  const backspace = useCallback(() => {
    setBuf(bufferRef.current.slice(0, -1))
  }, [setBuf])

  const submitGroup = useCallback(() => {
    if (bufferRef.current.length > 0) handleAnswer(bufferRef.current)
  }, [handleAnswer])

  // Capture keys while listening (answer/type) or retrying (echo). Never during
  // the feedback flash — no typing ahead into the next prompt.
  useEffect(() => {
    if (phase !== 'listening' && phase !== 'retry') return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const isGroup = (promptRef.current?.text.length ?? 1) > 1

      if (phase === 'retry') {
        if (!VALID_KEY.test(e.key)) return
        e.preventDefault()
        handleRetry(e.key)
        return
      }
      // listening
      if (!isGroup) {
        if (!VALID_KEY.test(e.key)) return
        e.preventDefault()
        handleAnswer(e.key)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        submitGroup()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        backspace()
      } else if (VALID_KEY.test(e.key)) {
        e.preventDefault()
        typeChar(e.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleAnswer, handleRetry, typeChar, backspace, submitGroup])

  // The trainer instance is swapped when prompt mode/size changes (App recreates
  // it). Reset to idle so a stale in-flight prompt can't submit to a new trainer.
  const knownTrainer = useRef(trainer)
  useEffect(() => {
    if (trainer === knownTrainer.current) return
    knownTrainer.current = trainer
    if (timerRef.current) clearTimeout(timerRef.current)
    engine.stop()
    promptRef.current = null
    retryCharRef.current = null
    setBuf('')
    setReveal(null)
    setLastResult(null)
    setRoundSummary(null)
    setSummary(trainer.summary())
    setPhase('idle')
  }, [trainer, engine, setBuf])

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
    promptLength,
    buffer,
    start,
    again,
    answer: handleAnswer,
    retryAnswer: handleRetry,
    typeChar,
    backspace,
    submitGroup,
    replay,
    dismissToast,
  }
}
