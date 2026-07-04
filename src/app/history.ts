const HISTORY_KEY = 'ditdah:history'
const MAX_HISTORY = 50

export interface RoundRecord {
  readonly at: string
  readonly total: number
  readonly correct: number
  readonly accuracy: number
  readonly effectiveWpm: number
}

export function loadHistory(): RoundRecord[] {
  try {
    const storage = getStorage()
    if (storage === null) {
      return []
    }

    const raw = storage.getItem(HISTORY_KEY)
    if (raw === null) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    return isRoundHistory(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function appendRound(record: RoundRecord): RoundRecord[] {
  const normalized = normalizeRoundRecord(record)
  const current = loadHistory()
  if (normalized === null) {
    return current
  }

  const next = [normalized, ...current].slice(0, MAX_HISTORY)
  try {
    const storage = getStorage()
    if (storage !== null) {
      storage.setItem(HISTORY_KEY, JSON.stringify(next))
    }
  } catch {
    // History is best-effort; the practice loop should continue without storage.
  }

  return next
}

export function clearHistory(): void {
  try {
    const storage = getStorage()
    if (storage !== null) {
      storage.removeItem(HISTORY_KEY)
    }
  } catch {
    // History is best-effort; the practice loop should continue without storage.
  }
}

export function roundsToday(
  history: readonly RoundRecord[],
  now = Date.now(),
): number {
  const today = new Date(now)
  if (Number.isNaN(today.getTime())) {
    return 0
  }

  return history.reduce((total, record) => {
    const at = new Date(record.at)
    return isSameLocalDay(at, today) ? total + 1 : total
  }, 0)
}

function normalizeRoundRecord(record: RoundRecord): RoundRecord | null {
  if (!isRoundRecord(record)) {
    return null
  }

  return {
    at: record.at,
    total: record.total,
    correct: record.correct,
    accuracy: record.accuracy,
    effectiveWpm: record.effectiveWpm,
  }
}

function isRoundHistory(value: unknown): value is RoundRecord[] {
  return Array.isArray(value) && value.every(isRoundRecord)
}

function isRoundRecord(value: unknown): value is RoundRecord {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.at === 'string' &&
    !Number.isNaN(Date.parse(value.at)) &&
    isNonNegativeInteger(value.total) &&
    isNonNegativeInteger(value.correct) &&
    value.correct <= value.total &&
    isRatio(value.accuracy) &&
    isNonNegativeFinite(value.effectiveWpm)
  )
}

function getStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage
    }
  } catch {
    // Continue to the window.localStorage fallback below.
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage !== undefined) {
      return window.localStorage
    }
  } catch {
    // Storage access can throw in restricted browser contexts.
  }

  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isRatio(value: unknown): value is number {
  return isNonNegativeFinite(value) && value <= 1
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    !Number.isNaN(a.getTime()) &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
