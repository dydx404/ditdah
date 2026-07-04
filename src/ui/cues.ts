/**
 * UI answer cues — short, non-Morse audio feedback on submit.
 *
 * Two-note shapes, played through the engine's `cue()` voice — a warm plucked
 * mallet/bell tone (fast attack, natural decay) pitched away from the sidetone,
 * so cues sound instrument-y (Duolingo-ish) rather than like a beep:
 *
 *   correct → a bright descending "ding-dong" (a bell/doorbell reward)
 *   wrong   → a low descending "uh-oh"
 */
import type { CueNote, ToneEngine } from '@/core/audio/types'

export type Cue = 'correct' | 'wrong'

/** A cheerful bell: G5 → C5, a descending fourth. */
const CORRECT_NOTES: readonly CueNote[] = [
  { hz: 784, ms: 130 }, // "ding"
  { hz: 523, ms: 210 }, // "dong"
]

/** A blunt low "uh-oh": G3 → D3, clearly negative and well below sidetone. */
const WRONG_NOTES: readonly CueNote[] = [
  { hz: 196, ms: 110 },
  { hz: 147, ms: 240 },
]

const CUE_NOTES: Record<Cue, readonly CueNote[]> = {
  correct: CORRECT_NOTES,
  wrong: WRONG_NOTES,
}

/**
 * Play an answer cue. Returns a handle whose `done` resolves when it finishes,
 * so callers can chain (e.g. replay the character after the "wrong" buzz).
 */
export function playCue(engine: ToneEngine, cue: Cue): { done: Promise<void> } {
  return { done: engine.cue(CUE_NOTES[cue]) }
}
