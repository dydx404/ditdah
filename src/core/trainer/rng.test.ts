import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    expect(firstOutputs(42, 20)).toEqual(firstOutputs(42, 20))
  })

  it('differs for different seeds', () => {
    expect(firstOutputs(42, 20)).not.toEqual(firstOutputs(43, 20))
  })

  it('returns values in [0, 1)', () => {
    for (const value of firstOutputs(42, 100)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

function firstOutputs(seed: number, count: number): number[] {
  const rng = createRng(seed)

  return Array.from({ length: count }, () => rng())
}
