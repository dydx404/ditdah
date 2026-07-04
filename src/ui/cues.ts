/**
 * UI answer cues — short, non-Morse audio feedback on submit.
 *
 * These are deliberately NOT sidetone: they live in different pitch registers
 * (well above / below a typical 500–700 Hz sidetone) so the ear never confuses
 * a cue with a character. We reuse the frozen ToneEngine — a cue is just a tiny
 * KeyingElement sequence — so there's a single AudioContext and no extra Web
 * Audio plumbing.
 *
 *   correct → a quick high "di-dit" (reward)
 *   wrong   → one low, blunt tone (buzz)
 */
import type { KeyingElement } from '@/core/morse/types'
import type { ToneEngine, PlayHandle } from '@/core/audio/types'

export type Cue = 'correct' | 'wrong'

/** Well above sidetone — bright and clearly "not a character." */
const CORRECT_HZ = 880
/** Well below sidetone — blunt and clearly "not a character." */
const WRONG_HZ = 180

const CUE_ELEMENTS: Record<Cue, readonly KeyingElement[]> = {
  correct: [
    { on: true, ms: 55 },
    { on: false, ms: 45 },
    { on: true, ms: 70 },
  ],
  wrong: [{ on: true, ms: 220 }],
}

const CUE_HZ: Record<Cue, number> = {
  correct: CORRECT_HZ,
  wrong: WRONG_HZ,
}

/** Play an answer cue through the shared tone engine. Interrupts any playback. */
export function playCue(engine: ToneEngine, cue: Cue): PlayHandle {
  return engine.play(CUE_ELEMENTS[cue], CUE_HZ[cue])
}
