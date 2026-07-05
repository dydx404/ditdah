import { DEFAULT_TIMING } from './config'
import {
  DEFAULT_CUSTOM_CHARSET,
  normalizeCustomCharset,
  type CharSource,
} from './charset'
import { normalizePromptPool } from './promptPools'
import { detectLocale, isLocale, type Locale } from '@/i18n/messages'

const SETTINGS_KEY = 'ditdah:settings'

export interface Settings {
  readonly charWpm: number
  readonly effectiveWpm: number
  readonly toneHz: number
  readonly volume: number
  readonly roundLength: number
  /** UI language. */
  readonly locale: Locale
  /**
   * `'single'` (default) plays one character per prompt. `'group'` plays a short
   * run of characters to copy at once — the step up to copying text.
   */
  readonly promptMode: 'single' | 'group'
  /** Characters per prompt in group mode (2–7). */
  readonly groupSize: number
  /** Koch progression or an explicit learner-selected character set. */
  readonly charSource: CharSource
  /** Explicit character set for free training mode. */
  readonly customCharset: readonly string[]
  /** Explicit prompt strings for pool-driven modes such as words. */
  readonly promptPool: readonly string[]
  /** Keep a missed prompt gated until the learner echoes it correctly. */
  readonly strictGate: boolean
  /** Play short correct/wrong UI answer cues. */
  readonly answerSounds: boolean
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
  locale: 'en',
  promptMode: 'single',
  groupSize: 5,
  charSource: 'koch',
  customCharset: DEFAULT_CUSTOM_CHARSET,
  promptPool: [],
  strictGate: true,
  answerSounds: true,
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
      // First run: seed the UI language from the browser.
      return { ...DEFAULT_SETTINGS, locale: detectLocale() }
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
    locale: isLocale(value.locale) ? value.locale : DEFAULT_SETTINGS.locale,
    promptMode: value.promptMode === 'group' ? 'group' : 'single',
    groupSize: clampInteger(
      numberOrDefault(value.groupSize, DEFAULT_SETTINGS.groupSize),
      2,
      7,
    ),
    charSource: value.charSource === 'custom' ? 'custom' : 'koch',
    customCharset: normalizeCustomCharset(value.customCharset),
    promptPool: normalizePromptPool(value.promptPool),
    strictGate: value.strictGate !== false,
    answerSounds: value.answerSounds !== false,
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
