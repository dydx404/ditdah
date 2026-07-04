/**
 * core/morse — contract.
 *
 * Pure, framework-agnostic Morse domain: the character table, the Koch
 * learning order, and the timing math that turns text into a schedulable
 * sequence of key-down / key-up elements.
 *
 * This file is a FROZEN interface. Implementations (table.ts, timing.ts) are
 * built against it; changing a signature here is an architecture decision, not
 * a casual edit — open an issue first.
 */

/** The two atomic Morse sounds. Named by sound, never rendered as "." / "-". */
export type MorseSymbol = 'dit' | 'dah'

/**
 * One on/off keying element with a duration in milliseconds.
 * A rendered message is an ordered list of these; the audio engine schedules
 * them back-to-back. `on: true` is a tone (key-down); `on: false` is silence.
 */
export interface KeyingElement {
  readonly on: boolean
  /** Duration in milliseconds. Always > 0. */
  readonly ms: number
}

/**
 * Timing parameters for rendering Morse.
 *
 * Farnsworth timing is core to how ditdah teaches: characters are *keyed* at
 * `charWpm` (fast enough that each letter is heard as one sound shape) while
 * the gaps between characters/words are stretched so the *overall* pace equals
 * the slower `effectiveWpm`. This is why beginners must never learn from a
 * dot/dash chart — the goal is instant sound recognition, not decoding.
 *
 * Invariants (implementations must enforce or document):
 *   - charWpm >= effectiveWpm > 0
 *   - when charWpm === effectiveWpm, timing reduces to standard (PARIS) timing
 */
export interface TimingConfig {
  /** Character speed in WPM: the speed each character is keyed at. */
  readonly charWpm: number
  /** Overall/effective speed in WPM (<= charWpm) via stretched gaps. */
  readonly effectiveWpm: number
  /** Sidetone frequency in Hz (typical CW sidetone is 500–700). */
  readonly toneHz: number
}

/** The public surface of core/morse. Implemented across table.ts + timing.ts. */
export interface MorseApi {
  /** Canonical Koch teaching order (characters introduced one at a time). */
  readonly KOCH_ORDER: readonly string[]

  /**
   * The symbol sequence for a character, or undefined if unsupported.
   * Case-insensitive for letters. Example: 'K' -> ['dah','dit','dah'].
   */
  symbolsFor(char: string): readonly MorseSymbol[] | undefined

  /** Duration of one dit in ms at the given character speed (1200 / charWpm). */
  ditMs(charWpm: number): number

  /**
   * Render text into a flat, back-to-back sequence of keying elements using
   * Farnsworth timing. Whitespace becomes word gaps; unsupported characters
   * are skipped (implementation documents the exact policy). The sequence
   * begins with a tone element (no leading silence) and ends on a tone.
   */
  renderToElements(text: string, timing: TimingConfig): readonly KeyingElement[]
}
