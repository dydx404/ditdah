/**
 * core/audio — pure scheduling.
 *
 * Converts keying elements (durations in ms) into absolute tone-on windows on
 * the audio clock. This is the deterministic, unit-testable heart of the engine
 * — it holds the timing logic with zero Web Audio dependency, so the part that
 * matters most (when each tone starts and stops) is fully covered by tests.
 */
import type { KeyingElement } from '../morse/types'

/** A tone-on interval in absolute seconds on the audio clock. */
export interface ToneWindow {
  readonly startSec: number
  readonly endSec: number
}

export interface ToneSchedule {
  /** Tone-on windows, in order. Off elements produce no window. */
  readonly windows: readonly ToneWindow[]
  /** Absolute time the whole sequence ends (seconds). */
  readonly endSec: number
}

/**
 * Build an absolute tone schedule from keying elements, starting at `startSec`.
 * `on` elements become windows; `off` elements advance the cursor silently.
 * The cursor advances by every element's duration, so `endSec` reflects any
 * trailing silence even though it emits no window.
 */
export function buildSchedule(
  elements: readonly KeyingElement[],
  startSec: number,
): ToneSchedule {
  const windows: ToneWindow[] = []
  let t = startSec
  for (const el of elements) {
    const durSec = el.ms / 1000
    if (el.on) {
      windows.push({ startSec: t, endSec: t + durSec })
    }
    t += durSec
  }
  return { windows, endSec: t }
}
