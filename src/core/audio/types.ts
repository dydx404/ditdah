/**
 * core/audio — contract.
 *
 * The load-bearing wall. Turns a sequence of KeyingElements into precisely
 * timed sidetone using the Web Audio API clock (NOT setTimeout — jitter of
 * tens of ms is unacceptable when a dit is ~60ms and rhythm IS the skill).
 *
 * Tones must ramp in/out (a few ms) to avoid clicks. All scheduling is done
 * ahead of time against AudioContext.currentTime.
 *
 * FROZEN interface. Implementation (engine.ts) is built against it.
 */
import type { KeyingElement } from '../morse/types'

export interface PlayHandle {
  /** Resolves when the whole sequence has finished playing. */
  readonly done: Promise<void>
  /** Stop immediately, ramping the tone down to avoid a click. */
  stop(): void
}

/** One note of a UI cue: a frequency held for a duration. */
export interface CueNote {
  readonly hz: number
  /** Duration in milliseconds. Always > 0. */
  readonly ms: number
}

export interface ToneEngine {
  /**
   * Ensure the underlying AudioContext is running. Must be called from within
   * a user gesture (browsers suspend audio until then). Idempotent.
   */
  resume(): Promise<void>

  /**
   * Schedule and play a sequence of keying elements starting now.
   * Calling play() while something is already playing stops the previous one.
   */
  play(elements: readonly KeyingElement[], toneHz: number): PlayHandle

  /**
   * Play a short non-CW UI cue: notes played back-to-back, each a frequency
   * held for a duration (e.g. a two-tone "ding-dong" on a correct answer).
   *
   * Unlike play(), this is *not* sidetone and does not follow CW timing — it's
   * answer feedback, so it may use a different timbre and its own transient
   * voice. It runs independently of play() (a later play() does not cut it off,
   * and it does not interrupt current playback). The promise resolves when the
   * cue has finished sounding.
   */
  cue(notes: readonly CueNote[]): Promise<void>

  /** Stop any current playback. */
  stop(): void

  /** Master output gain, 0..1. */
  setVolume(v: number): void

  /** Release audio resources. */
  dispose(): void
}
