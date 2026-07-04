/**
 * core/trainer — contract (DRAFT).
 *
 * Session logic for receiving practice: Koch progression, prompt generation,
 * scoring, and per-character accuracy. Pure and deterministic given a seeded
 * RNG — no audio, no DOM, no storage. The UI drives it; core/audio plays the
 * prompts it produces.
 *
 * Marked DRAFT (not frozen) because its exact shape will firm up once the
 * morse + audio cores land and we wire the first K/M loop. core/morse and
 * core/audio are the frozen contracts to build against right now.
 */
import type { TimingConfig } from '../morse/types'

export interface TrainerConfig {
  readonly timing: TimingConfig
  /** Per-character accuracy required to unlock the next Koch character. */
  readonly unlockAccuracy: number
  /** Minimum recent attempts on a character before it can gate an unlock. */
  readonly minAttemptsToUnlock: number
}

export interface Prompt {
  readonly id: string
  /** The character(s) the user must copy by ear. */
  readonly text: string
}

export interface AnswerResult {
  readonly correct: boolean
  readonly expected: string
  readonly received: string
}

export interface CharStat {
  readonly char: string
  readonly attempts: number
  readonly correct: number
  /** correct / attempts, or 0 when attempts === 0. */
  readonly accuracy: number
}

export interface SessionSummary {
  readonly total: number
  readonly correct: number
  readonly accuracy: number
  /** Estimated effective copying speed for the session, in WPM. */
  readonly effectiveWpm: number
  readonly perChar: readonly CharStat[]
  /** A character newly unlocked this session, or null. */
  readonly unlockedNew: string | null
}

export interface Trainer {
  unlockedChars(): readonly string[]
  nextPrompt(): Prompt
  submit(promptId: string, received: string): AnswerResult
  summary(): SessionSummary
}
