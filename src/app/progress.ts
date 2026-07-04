/**
 * Progress merging — pure.
 *
 * Turns "the base progress loaded at session start" + "this session's stats" into
 * the Progress to persist. Lifetime charStats = base + session; because `base`
 * is fixed for the whole session and `sessionPerChar` is cumulative-within-
 * session, recomputing on every answer is idempotent (no double counting).
 *
 * Streak day-logic is deliberately deferred to Phase 2; for now the streak is
 * carried through unchanged (default when there's no base).
 */
import { CURRENT_SCHEMA_VERSION } from '@/core/storage'
import type { CharProgress, Progress, Streak } from '@/core/storage/types'
import type { CharStat } from '@/core/trainer/types'

const EMPTY_STREAK: Streak = { count: 0, lastPracticedISO: null }

export function mergeSessionIntoProgress(
  base: Progress | null,
  unlocked: readonly string[],
  sessionPerChar: readonly CharStat[],
): Progress {
  const charStats: Record<string, CharProgress> = {}

  if (base) {
    for (const [char, stat] of Object.entries(base.charStats)) {
      charStats[char] = { attempts: stat.attempts, correct: stat.correct }
    }
  }

  for (const s of sessionPerChar) {
    const prev = charStats[s.char] ?? { attempts: 0, correct: 0 }
    charStats[s.char] = {
      attempts: prev.attempts + s.attempts,
      correct: prev.correct + s.correct,
    }
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    unlocked: [...unlocked],
    charStats,
    streak: base?.streak ?? EMPTY_STREAK,
  }
}
