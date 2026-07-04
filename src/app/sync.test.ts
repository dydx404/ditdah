import { describe, expect, it } from 'vitest'
import { mergeProgress } from './sync'
import type { Progress } from '@/core/storage/types'

function progress(over: Partial<Progress> = {}): Progress {
  return {
    schemaVersion: 1,
    unlocked: ['K', 'M'],
    charStats: {},
    streak: { count: 0, lastPracticedISO: null },
    ...over,
  }
}

describe('mergeProgress', () => {
  it('returns the other side when one is null', () => {
    const p = progress()
    expect(mergeProgress(null, p)).toBe(p)
    expect(mergeProgress(p, null)).toBe(p)
    expect(mergeProgress(null, null)).toBeNull()
  })

  it('unions unlocked characters in Koch order', () => {
    const a = progress({ unlocked: ['K', 'M', 'R'] })
    const b = progress({ unlocked: ['K', 'M', 'S', 'U'] })
    // Koch order is K M U R S … so the union is re-sorted into that order,
    // not the input order — the point of merging by Koch index.
    expect(mergeProgress(a, b)?.unlocked).toEqual(['K', 'M', 'U', 'R', 'S'])
  })

  it('keeps the char record with more attempts, never summing', () => {
    const a = progress({ charStats: { K: { attempts: 100, correct: 90 } } })
    const b = progress({ charStats: { K: { attempts: 50, correct: 48 } } })
    expect(mergeProgress(a, b)?.charStats.K).toEqual({ attempts: 100, correct: 90 })
  })

  it('carries char stats present on only one side', () => {
    const a = progress({ charStats: { K: { attempts: 5, correct: 4 } } })
    const b = progress({ charStats: { M: { attempts: 3, correct: 3 } } })
    const merged = mergeProgress(a, b)?.charStats
    expect(merged).toEqual({
      K: { attempts: 5, correct: 4 },
      M: { attempts: 3, correct: 3 },
    })
  })

  it('takes the streak with the later practice date', () => {
    const older = progress({ streak: { count: 9, lastPracticedISO: '2026-07-01' } })
    const newer = progress({ streak: { count: 2, lastPracticedISO: '2026-07-04' } })
    expect(mergeProgress(older, newer)?.streak.count).toBe(2)
    expect(mergeProgress(newer, older)?.streak.count).toBe(2)
  })

  it('on the same date keeps the higher streak count; null date loses', () => {
    const a = progress({ streak: { count: 3, lastPracticedISO: '2026-07-04' } })
    const b = progress({ streak: { count: 7, lastPracticedISO: '2026-07-04' } })
    expect(mergeProgress(a, b)?.streak.count).toBe(7)

    const never = progress({ streak: { count: 0, lastPracticedISO: null } })
    expect(mergeProgress(never, a)?.streak.count).toBe(3)
  })

  it('takes the higher schema version', () => {
    const a = progress({ schemaVersion: 1 })
    const b = progress({ schemaVersion: 2 })
    expect(mergeProgress(a, b)?.schemaVersion).toBe(2)
  })
})
