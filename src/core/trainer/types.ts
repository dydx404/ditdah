/**
 * core/trainer — contract.
 *
 * Session logic for receiving practice: Koch progression, prompt generation,
 * scoring, and per-character accuracy. Pure and deterministic given a seed — no
 * audio, no DOM, no storage. The UI drives it and asks core/audio to play the
 * prompts it produces; the trainer itself never touches audio.
 *
 * v0 scope: each prompt is a SINGLE character drawn from the unlocked Koch set.
 * (Group/word prompts are a deliberate later addition — see ARCHITECTURE.md.)
 *
 * FROZEN interface. Implementations build against it; changing a signature here
 * is an architecture decision — open an issue first.
 */
import type { TimingConfig } from '../morse/types'

export interface TrainerConfig {
  /** Playback timing for prompts (passed to core/morse when rendering audio). */
  readonly timing: TimingConfig
  /**
   * How many Koch characters are unlocked at the start. Must be >= 2 (the first
   * meaningful copy drill needs at least two sounds to distinguish), e.g. 2
   * unlocks K and M.
   */
  readonly initialUnlockCount: number
  /**
   * Per-character accuracy in [0,1] required to unlock the next Koch character.
   * Evaluated over the most recent `unlockWindow` attempts of the newest char.
   */
  readonly unlockAccuracy: number
  /**
   * Number of most-recent attempts of the newest unlocked character to evaluate
   * for an unlock. The newest char must have at least this many attempts before
   * it can gate an unlock.
   */
  readonly unlockWindow: number
  /** RNG seed. The same seed yields the same prompt sequence (deterministic). */
  readonly seed: number
}

export interface Prompt {
  /** Opaque id; `submit` must be called with the id of the active prompt. */
  readonly id: string
  /** The single character the user must copy by ear (uppercase). */
  readonly text: string
}

export interface AnswerResult {
  readonly correct: boolean
  /** The prompt's character (uppercase). */
  readonly expected: string
  /** What the user entered, normalized to uppercase. */
  readonly received: string
  /** A Koch character unlocked as a result of this answer, or null. */
  readonly unlocked: string | null
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
  /** correct / total, or 0 when total === 0. */
  readonly accuracy: number
  /** The effective copying speed the session ran at, in WPM (from timing). */
  readonly effectiveWpm: number
  /** Per-character stats, one entry per character attempted this session. */
  readonly perChar: readonly CharStat[]
  /** Characters unlocked during this session, in unlock order. */
  readonly unlockedThisSession: readonly string[]
}

export interface Trainer {
  /** The currently unlocked Koch characters, in Koch order. */
  unlockedChars(): readonly string[]
  /**
   * Produce the next prompt. Deterministic given the seed and history. Avoids
   * repeating the immediately-previous character when more than one is unlocked.
   */
  nextPrompt(): Prompt
  /**
   * Score an answer for the active prompt. `received` is compared
   * case-insensitively to the prompt character. Updates stats and may unlock the
   * next Koch character. Throws if `promptId` is not the active prompt's id.
   */
  submit(promptId: string, received: string): AnswerResult
  /** A snapshot summary of the session so far. */
  summary(): SessionSummary
}

/** Construct a trainer. Pure: same config ⇒ same behavior. */
export type CreateTrainer = (config: TrainerConfig) => Trainer
