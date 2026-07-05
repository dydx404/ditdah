import { KOCH_ORDER, symbolsFor } from '@/core/morse'
import type { CharProgress } from '@/core/storage/types'

export type CharSource = 'koch' | 'custom'

export const LETTER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
export const DIGIT_CHARS = '0123456789'.split('')
export const PUNCTUATION_CHARS = ['.', ',', '?', '/', '=', '+', '-'] as const
export const SUPPORTED_CHARS = [
  ...LETTER_CHARS,
  ...DIGIT_CHARS,
  ...PUNCTUATION_CHARS,
] as const
export const DEFAULT_CUSTOM_CHARSET = LETTER_CHARS

const SUPPORTED = new Set<string>(SUPPORTED_CHARS)
const WEAK_SPOT_LIMIT = 8

export function normalizeCustomCharset(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_CUSTOM_CHARSET]
  }

  const seen = new Set<string>()
  const chars: string[] = []
  for (const raw of value) {
    if (typeof raw !== 'string') continue
    const char = raw.toUpperCase()
    if (char.length !== 1 || !SUPPORTED.has(char) || symbolsFor(char) === undefined) {
      continue
    }
    if (seen.has(char)) continue

    seen.add(char)
    chars.push(char)
  }

  return chars.length > 0 ? sortByPickerOrder(chars) : [...DEFAULT_CUSTOM_CHARSET]
}

export function sortByPickerOrder(chars: readonly string[]): string[] {
  return [...chars].sort((a, b) => pickerOrder(a) - pickerOrder(b))
}

export function weakSpotCharset(
  charStats: Readonly<Record<string, CharProgress>>,
): string[] {
  return Object.entries(charStats)
    .map(([char, stat]) => ({ char: char.toUpperCase(), stat }))
    .filter(({ char, stat }) => isSupportedChar(char) && stat.attempts > 0)
    .map(({ char, stat }) => ({
      char,
      accuracy: stat.correct / stat.attempts,
      attempts: stat.attempts,
    }))
    .sort(
      (a, b) =>
        a.accuracy - b.accuracy ||
        b.attempts - a.attempts ||
        kochOrder(a.char) - kochOrder(b.char),
    )
    .slice(0, WEAK_SPOT_LIMIT)
    .map((s) => s.char)
}

export function isSupportedChar(char: string): boolean {
  return char.length === 1 && SUPPORTED.has(char.toUpperCase())
}

function pickerOrder(char: string): number {
  const index = SUPPORTED_CHARS.indexOf(char as (typeof SUPPORTED_CHARS)[number])
  return index === -1 ? SUPPORTED_CHARS.length : index
}

function kochOrder(char: string): number {
  const index = KOCH_ORDER.indexOf(char as (typeof KOCH_ORDER)[number])
  return index === -1 ? KOCH_ORDER.length : index
}
