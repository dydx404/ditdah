/**
 * core/audio — public surface.
 *
 * `WebAudioToneEngine` is the real (browser) implementation of the frozen
 * `ToneEngine` contract. Import the type from here too so callers depend on the
 * interface, not the class.
 */
export type { ToneEngine, PlayHandle } from './types'
export type { ToneWindow, ToneSchedule } from './schedule'
export { buildSchedule } from './schedule'
export { WebAudioToneEngine } from './engine'
