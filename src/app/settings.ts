import { DEFAULT_TIMING } from './config'

const SETTINGS_KEY = 'ditdah:settings'

export interface Settings {
  readonly charWpm: number
  readonly effectiveWpm: number
  readonly toneHz: number
  readonly volume: number
  readonly roundLength: number
  /**
   * Show visual dit/dah patterns in the character reference. Default OFF: the
   * sound-first default never puts a dot/dash chart in front of the learner
   * (that builds the translation habit). Opt-in for those who want a reference.
   */
  readonly showPatterns: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_TIMING,
  volume: 0.7,
  roundLength: 25,
  showPatterns: false,
}

export function loadSettings(): Settings {
  try {
    const storage = getStorage()
    if (storage === null) {
      return DEFAULT_SETTINGS
    }

    const raw = storage.getItem(SETTINGS_KEY)
    if (raw === null) {
      return DEFAULT_SETTINGS
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) {
      return DEFAULT_SETTINGS
    }

    return normalizeSettings(parsed)
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    const storage = getStorage()
    if (storage === null) {
      return
    }

    storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)))
  } catch {
    // Settings are nice-to-have; the practice loop should still run without storage.
  }
}

export function normalizeSettings(value: Partial<Settings>): Settings {
  const charWpm = clampInteger(
    numberOrDefault(value.charWpm, DEFAULT_SETTINGS.charWpm),
    10,
    40,
  )
  const effectiveWpm = clampInteger(
    numberOrDefault(value.effectiveWpm, DEFAULT_SETTINGS.effectiveWpm),
    5,
    charWpm,
  )

  return {
    charWpm,
    effectiveWpm,
    toneHz: clampNumber(
      numberOrDefault(value.toneHz, DEFAULT_SETTINGS.toneHz),
      400,
      1000,
    ),
    volume: clampNumber(
      numberOrDefault(value.volume, DEFAULT_SETTINGS.volume),
      0,
      1,
    ),
    roundLength: clampInteger(
      numberOrDefault(value.roundLength, DEFAULT_SETTINGS.roundLength),
      5,
      100,
    ),
    showPatterns: value.showPatterns === true,
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

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clampInteger(value: number, min: number, max: number): number {
  return clampNumber(Math.round(value), min, max)
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
