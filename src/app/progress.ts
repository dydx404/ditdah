/**
 * Progress merging — pure.
 *
 * Turns "the base progress loaded at session start" + "this session's stats" into
 * the Progress to persist. Lifetime charStats = base + session; because `base`
 * is fixed for the whole session and `sessionPerChar` is cumulative-within-
 * session, recomputing on every answer is idempotent (no double counting).
 */
import { CURRENT_SCHEMA_VERSION } from '@/core/storage'
import type { CharProgress, Progress, Streak } from '@/core/storage/types'
import type { CharStat } from '@/core/trainer/types'

const EMPTY_STREAK: Streak = { count: 0, lastPracticedISO: null }
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 24 * 60 * 60 * 1000

interface MergeProgressOptions {
  readonly practicedAt?: Date
  /**
   * Current streak state. App code may pass the last saved streak here while
   * keeping lifetime charStats anchored to the session-start base.
   */
  readonly streak?: Streak | null
}

interface PracticeDay {
  readonly iso: string
  readonly dayIndex: number
}

export function mergeSessionIntoProgress(
  base: Progress | null,
  unlocked: readonly string[],
  sessionPerChar: readonly CharStat[],
  options: MergeProgressOptions = {},
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

  const previousStreak =
    options.streak === undefined ? base?.streak : options.streak
  const hasScoredAnswer = sessionPerChar.some((s) => s.attempts > 0)

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    unlocked: [...unlocked],
    charStats,
    streak: hasScoredAnswer
      ? nextPracticeStreak(previousStreak, options.practicedAt ?? new Date())
      : previousStreak ?? EMPTY_STREAK,
  }
}

function nextPracticeStreak(
  previous: Streak | null | undefined,
  practicedAt: Date,
): Streak {
  const today = localPracticeDay(practicedAt)
  const previousDay = parsePracticeDay(previous?.lastPracticedISO)
  const previousCount = previous?.count ?? 0

  if (!previousDay || previousCount === 0) {
    return { count: 1, lastPracticedISO: today.iso }
  }

  const dayDelta = today.dayIndex - previousDay.dayIndex
  if (dayDelta === 0) {
    return { count: previousCount, lastPracticedISO: today.iso }
  }

  if (dayDelta === 1) {
    return { count: previousCount + 1, lastPracticedISO: today.iso }
  }

  return { count: 1, lastPracticedISO: today.iso }
}

function localPracticeDay(date: Date): PracticeDay {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const iso = [
    String(year).padStart(4, '0'),
    String(month + 1).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')

  return {
    iso,
    dayIndex: Date.UTC(year, month, day) / MS_PER_DAY,
  }
}

function parsePracticeDay(value: string | null | undefined): PracticeDay | null {
  if (!value) return null

  const match = ISO_DATE_RE.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = Date.UTC(year, month - 1, day)
  const parsed = new Date(utc)

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return {
    iso: value,
    dayIndex: utc / MS_PER_DAY,
  }
}
