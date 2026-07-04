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

  /** Stop any current playback. */
  stop(): void

  /** Master output gain, 0..1. */
  setVolume(v: number): void

  /** Release audio resources. */
  dispose(): void
}
