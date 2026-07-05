import { KOCH_ORDER } from '@/core/morse'
import type { Trainer, TrainerConfig } from '@/core/trainer/types'
import { DEFAULT_TRAINER } from './config'
import type { Settings } from './settings'

export function trainerConfigForSettings(
  unlockedCount: number,
  settings: Settings,
  seed: number,
): TrainerConfig {
  return {
    ...DEFAULT_TRAINER,
    timing: {
      charWpm: settings.charWpm,
      effectiveWpm: settings.effectiveWpm,
      toneHz: settings.toneHz,
    },
    initialUnlockCount: Math.max(
      DEFAULT_TRAINER.initialUnlockCount,
      unlockedCount,
    ),
    promptMode: settings.promptMode,
    groupSize: settings.groupSize,
    seed,
    ...(settings.charSource === 'custom'
      ? { charset: settings.customCharset }
      : {}),
  }
}

export function unlockedCharsForProgress(
  baseUnlocked: readonly string[] | undefined,
  trainer: Trainer | null,
  settings: Pick<Settings, 'charSource'>,
): readonly string[] {
  const fallback = baseUnlocked?.length
    ? baseUnlocked
    : KOCH_ORDER.slice(0, DEFAULT_TRAINER.initialUnlockCount)

  return settings.charSource === 'custom'
    ? fallback
    : (trainer?.unlockedChars() ?? fallback)
}
