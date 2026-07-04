/**
 * Default session configuration for v0.
 *
 * Farnsworth by default: characters keyed at 20 WPM (so each letter is one sound
 * shape) but an effective 10 WPM overall, giving beginners room between
 * characters without slowing the character itself. 600 Hz is a comfortable
 * sidetone.
 */
import type { TimingConfig } from '@/core/morse/types'
import type { TrainerConfig } from '@/core/trainer/types'

export const DEFAULT_TIMING: TimingConfig = {
  charWpm: 20,
  effectiveWpm: 10,
  toneHz: 600,
}

export const DEFAULT_TRAINER: Omit<TrainerConfig, 'seed'> = {
  timing: DEFAULT_TIMING,
  initialUnlockCount: 2, // K, M
  unlockAccuracy: 0.9,
  unlockWindow: 5,
}
