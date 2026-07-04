import { describe, expect, it } from 'vitest'
import { mergeSessionIntoProgress } from './progress'
import { CURRENT_SCHEMA_VERSION } from '@/core/storage'
import type { Progress } from '@/core/storage/types'
import type { CharStat } from '@/core/trainer/types'

const stat = (char: string, attempts: number, correct: number): CharStat => ({
  char,
  attempts,
  correct,
  accuracy: attempts ? correct / attempts : 0,
})

describe('mergeSessionIntoProgress', () => {
  it('builds fresh progress from no base', () => {
    const p = mergeSessionIntoProgress(null, ['K', 'M'], [stat('K', 3, 2)])
    expect(p).toEqual<Progress>({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unlocked: ['K', 'M'],
      charStats: { K: { attempts: 3, correct: 2 } },
      streak: { count: 0, lastPracticedISO: null },
    })
  })

  it('adds session counts on top of base lifetime stats', () => {
    const base: Progress = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unlocked: ['K', 'M'],
      charStats: { K: { attempts: 10, correct: 8 }, M: { attempts: 5, correct: 5 } },
      streak: { count: 3, lastPracticedISO: '2026-07-03' },
    }
    const p = mergeSessionIntoProgress(base, ['K', 'M', 'U'], [
      stat('K', 2, 1),
      stat('U', 4, 4),
    ])
    expect(p.charStats).toEqual({
      K: { attempts: 12, correct: 9 }, // 10+2, 8+1
      M: { attempts: 5, correct: 5 }, // untouched this session
      U: { attempts: 4, correct: 4 }, // new
    })
    expect(p.unlocked).toEqual(['K', 'M', 'U'])
    expect(p.streak).toEqual(base.streak) // carried through for now
  })

  it('is idempotent when recomputed from the same base (no double counting)', () => {
    const base: Progress = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unlocked: ['K', 'M'],
      charStats: { K: { attempts: 1, correct: 1 } },
      streak: { count: 0, lastPracticedISO: null },
    }
    const session = [stat('K', 2, 2)]
    const once = mergeSessionIntoProgress(base, ['K', 'M'], session)
    const twice = mergeSessionIntoProgress(base, ['K', 'M'], session)
    expect(twice).toEqual(once) // recompute from base, not from prior result
    expect(once.charStats.K).toEqual({ attempts: 3, correct: 3 })
  })
})
