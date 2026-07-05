import { describe, expect, it } from 'vitest'
import {
  CALLSIGN_POOL,
  COMMON_WORD_POOL,
  generateCallsignPool,
  normalizePromptPool,
  samePromptPool,
} from './promptPools'
import { symbolsFor } from '@/core/morse'

describe('prompt pools', () => {
  it('bundles a few hundred common uppercase words', () => {
    expect(COMMON_WORD_POOL.length).toBeGreaterThanOrEqual(200)
    expect(new Set(COMMON_WORD_POOL).size).toBe(COMMON_WORD_POOL.length)
    expect(COMMON_WORD_POOL.every((word) => word === word.toUpperCase())).toBe(
      true,
    )
    expect(
      COMMON_WORD_POOL.every((word) =>
        [...word].every((char) => symbolsFor(char) !== undefined),
      ),
    ).toBe(true)
  })

  it('generates realistic callsign prompts', () => {
    expect(CALLSIGN_POOL.length).toBeGreaterThanOrEqual(200)
    expect(CALLSIGN_POOL).toContain('W1AW')
    expect(CALLSIGN_POOL).toContain('G4ABC')
    expect(CALLSIGN_POOL).toContain('VK2XYZ')
    expect(
      CALLSIGN_POOL.every((call) =>
        /^[A-Z]{1,3}[0-9][A-Z]{2,3}$/.test(call),
      ),
    ).toBe(true)
    expect(generateCallsignPool(12)).toHaveLength(12)
  })

  it('normalizes prompt pools and drops unsupported entries', () => {
    expect(normalizePromptPool([' cq ', 'CQ', '73', '~', 'A@'])).toEqual([
      'CQ',
      '73',
    ])
  })

  it('compares prompt pools by ordered content', () => {
    expect(samePromptPool(['CQ', '73'], ['CQ', '73'])).toBe(true)
    expect(samePromptPool(['73', 'CQ'], ['CQ', '73'])).toBe(false)
  })
})
