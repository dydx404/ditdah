import { describe, expect, it } from 'vitest'
import { mergeSessionIntoProgress } from './progress'
import { CURRENT_SCHEMA_VERSION } from '@/core/storage'
import type { Progress, Streak } from '@/core/storage/types'
import type { CharStat } from '@/core/trainer/types'

const stat = (char: string, attempts: number, correct: number): CharStat => ({
  char,
  attempts,
  correct,
  accuracy: attempts ? correct / attempts : 0,
})

const practicedOn = (day: number) => new Date(2026, 6, day, 12, 0, 0)

const baseWithStreak = (streak: Streak): Progress => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  unlocked: ['K', 'M'],
  charStats: { K: { attempts: 10, correct: 8 } },
  streak,
})

describe('mergeSessionIntoProgress', () => {
  it('builds fresh progress from no base', () => {
    const p = mergeSessionIntoProgress(null, ['K', 'M'], [stat('K', 3, 2)], {
      practicedAt: practicedOn(4),
    })
    expect(p).toEqual<Progress>({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unlocked: ['K', 'M'],
      charStats: { K: { attempts: 3, correct: 2 } },
      streak: { count: 1, lastPracticedISO: '2026-07-04' },
    })
  })

  it('adds session counts on top of base lifetime stats', () => {
    const base: Progress = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unlocked: ['K', 'M'],
      charStats: { K: { attempts: 10, correct: 8 }, M: { attempts: 5, correct: 5 } },
      streak: { count: 3, lastPracticedISO: '2026-07-03' },
    }
    const p = mergeSessionIntoProgress(
      base,
      ['K', 'M', 'U'],
      [stat('K', 2, 1), stat('U', 4, 4)],
      { practicedAt: practicedOn(4) },
    )
    expect(p.charStats).toEqual({
      K: { attempts: 12, correct: 9 }, // 10+2, 8+1
      M: { attempts: 5, correct: 5 }, // untouched this session
      U: { attempts: 4, correct: 4 }, // new
    })
    expect(p.unlocked).toEqual(['K', 'M', 'U'])
    expect(p.streak).toEqual({ count: 4, lastPracticedISO: '2026-07-04' })
  })

  it('is idempotent when recomputed from the same base (no double counting)', () => {
    const base: Progress = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unlocked: ['K', 'M'],
      charStats: { K: { attempts: 1, correct: 1 } },
      streak: { count: 0, lastPracticedISO: null },
    }
    const session = [stat('K', 2, 2)]
    const once = mergeSessionIntoProgress(base, ['K', 'M'], session, {
      practicedAt: practicedOn(4),
    })
    const twice = mergeSessionIntoProgress(base, ['K', 'M'], session, {
      practicedAt: practicedOn(4),
    })
    expect(twice).toEqual(once) // recompute from base, not from prior result
    expect(once.charStats.K).toEqual({ attempts: 3, correct: 3 })
  })

  it('keeps streak count unchanged for multiple answers on the same local day', () => {
    const p = mergeSessionIntoProgress(
      baseWithStreak({ count: 5, lastPracticedISO: '2026-07-04' }),
      ['K', 'M'],
      [stat('K', 1, 1)],
      { practicedAt: practicedOn(4) },
    )

    expect(p.streak).toEqual({ count: 5, lastPracticedISO: '2026-07-04' })
  })

  it('increments streak count on the next consecutive local day', () => {
    const p = mergeSessionIntoProgress(
      baseWithStreak({ count: 5, lastPracticedISO: '2026-07-04' }),
      ['K', 'M'],
      [stat('K', 1, 1)],
      { practicedAt: practicedOn(5) },
    )

    expect(p.streak).toEqual({ count: 6, lastPracticedISO: '2026-07-05' })
  })

  it('resets streak count after a gap of at least two local days', () => {
    const p = mergeSessionIntoProgress(
      baseWithStreak({ count: 5, lastPracticedISO: '2026-07-03' }),
      ['K', 'M'],
      [stat('K', 1, 1)],
      { practicedAt: practicedOn(5) },
    )

    expect(p.streak).toEqual({ count: 1, lastPracticedISO: '2026-07-05' })
  })

  it.each([
    ['future', '2026-07-06'],
    ['corrupt', 'tomorrow'],
    ['empty', ''],
    ['missing', null],
  ] satisfies ReadonlyArray<readonly [string, string | null]>)(
    'handles %s prior streak dates safely',
    (_label, lastPracticedISO) => {
      const p = mergeSessionIntoProgress(
        baseWithStreak({ count: 5, lastPracticedISO }),
        ['K', 'M'],
        [stat('K', 1, 1)],
        { practicedAt: practicedOn(5) },
      )

      expect(p.streak).toEqual({ count: 1, lastPracticedISO: '2026-07-05' })
    },
  )

  it('does not start a streak when no answer has been scored', () => {
    const p = mergeSessionIntoProgress(null, ['K', 'M'], [], {
      practicedAt: practicedOn(4),
    })

    expect(p.streak).toEqual({ count: 0, lastPracticedISO: null })
  })
})
