import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './settings'
import {
  trainerConfigForSettings,
  unlockedCharsForProgress,
} from './trainerConfig'
import { COMMON_WORD_POOL } from './promptPools'
import type { Trainer } from '@/core/trainer/types'

describe('trainerConfigForSettings', () => {
  it('omits charset in Koch progression mode', () => {
    const config = trainerConfigForSettings(4, DEFAULT_SETTINGS, 123)

    expect(config.charset).toBeUndefined()
    expect(config.initialUnlockCount).toBe(4)
    expect(config.seed).toBe(123)
  })

  it('passes the custom charset in free-training mode', () => {
    const config = trainerConfigForSettings(
      2,
      {
        ...DEFAULT_SETTINGS,
        charSource: 'custom',
        customCharset: ['A', 'B', '1'],
      },
      456,
    )

    expect(config.charset).toEqual(['A', 'B', '1'])
  })

  it('passes a prompt pool when a pool-driven mode is active', () => {
    const config = trainerConfigForSettings(
      2,
      {
        ...DEFAULT_SETTINGS,
        promptPool: COMMON_WORD_POOL,
      },
      789,
    )

    expect(config.promptPool).toEqual(COMMON_WORD_POOL)
  })
})

describe('unlockedCharsForProgress', () => {
  it('preserves Koch unlock progress while a custom trainer is active', () => {
    const trainer = fakeTrainer(['A', 'B', 'C'])

    expect(
      unlockedCharsForProgress(['K', 'M', 'U'], trainer, {
        charSource: 'custom',
        promptPool: [],
      }),
    ).toEqual(['K', 'M', 'U'])
  })

  it('preserves Koch unlock progress while a prompt-pool trainer is active', () => {
    const trainer = fakeTrainer(['A', 'B', 'C'])

    expect(
      unlockedCharsForProgress(['K', 'M', 'U'], trainer, {
        charSource: 'koch',
        promptPool: ['CQ', '73'],
      }),
    ).toEqual(['K', 'M', 'U'])
  })

  it('uses trainer unlocks in Koch mode', () => {
    const trainer = fakeTrainer(['K', 'M', 'U', 'R'])

    expect(
      unlockedCharsForProgress(['K', 'M'], trainer, {
        charSource: 'koch',
        promptPool: [],
      }),
    ).toEqual(['K', 'M', 'U', 'R'])
  })
})

function fakeTrainer(unlocked: readonly string[]): Trainer {
  return {
    unlockedChars: () => unlocked,
    nextPrompt: () => ({ id: '1', text: unlocked[0] ?? 'K' }),
    submit: () => ({
      correct: true,
      expected: unlocked[0] ?? 'K',
      received: unlocked[0] ?? 'K',
      unlocked: null,
    }),
    summary: () => ({
      total: 0,
      correct: 0,
      accuracy: 0,
      effectiveWpm: 10,
      perChar: [],
      unlockedThisSession: [],
    }),
  }
}
