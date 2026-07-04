import type { Progress, ProgressStore } from './types'

export const CURRENT_SCHEMA_VERSION = 1

const STORAGE_KEY = 'ditdah:progress'

export function createProgressStore(): ProgressStore {
  return {
    async load() {
      try {
        const storage = getStorage()
        if (storage === null) {
          return null
        }

        const raw = storage.getItem(STORAGE_KEY)
        if (raw === null) {
          return null
        }

        const parsed: unknown = JSON.parse(raw)
        return isProgress(parsed) ? parsed : null
      } catch {
        return null
      }
    },

    async save(progress) {
      try {
        const storage = getStorage()
        if (storage === null) {
          return
        }

        storage.setItem(STORAGE_KEY, JSON.stringify(progress))
      } catch {
        // Storage can be unavailable or blocked; v0 treats persistence as best-effort.
      }
    },

    async clear() {
      try {
        const storage = getStorage()
        if (storage === null) {
          return
        }

        storage.removeItem(STORAGE_KEY)
      } catch {
        // Storage can be unavailable or blocked; v0 treats persistence as best-effort.
      }
    },
  }
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

function isProgress(value: unknown): value is Progress {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.schemaVersion === CURRENT_SCHEMA_VERSION &&
    isStringArray(value.unlocked) &&
    isCharStats(value.charStats) &&
    isStreak(value.streak)
  )
}

function isCharStats(value: unknown): value is Progress['charStats'] {
  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every(
    (entry) =>
      isRecord(entry) &&
      isNonNegativeInteger(entry.attempts) &&
      isNonNegativeInteger(entry.correct),
  )
}

function isStreak(value: unknown): value is Progress['streak'] {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.count) &&
    (typeof value.lastPracticedISO === 'string' ||
      value.lastPracticedISO === null)
  )
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}
