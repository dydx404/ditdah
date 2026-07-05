import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CUSTOM_CHARSET,
  DIGIT_CHARS,
  LETTER_CHARS,
  PUNCTUATION_CHARS,
  normalizeCustomCharset,
  weakSpotCharset,
} from './charset'

describe('charset helpers', () => {
  it('normalizes custom charset values to supported uppercase characters', () => {
    expect(normalizeCustomCharset(['m', 'A', 'm', '~', '5', '-'])).toEqual([
      'A',
      'M',
      '5',
      '-',
    ])
  })

  it('falls back to all letters when the custom charset is empty or invalid', () => {
    expect(normalizeCustomCharset([])).toEqual(DEFAULT_CUSTOM_CHARSET)
    expect(normalizeCustomCharset(['~', ' '])).toEqual(DEFAULT_CUSTOM_CHARSET)
    expect(normalizeCustomCharset('KM')).toEqual(DEFAULT_CUSTOM_CHARSET)
  })

  it('defines the picker presets without unsupported characters', () => {
    expect(LETTER_CHARS).toHaveLength(26)
    expect(DIGIT_CHARS).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
    expect(PUNCTUATION_CHARS).toEqual(['.', ',', '?', '/', '=', '+', '-'])
  })

  it('selects the lowest-accuracy characters as weak spots', () => {
    expect(
      weakSpotCharset({
        K: { attempts: 10, correct: 9 },
        M: { attempts: 5, correct: 1 },
        U: { attempts: 8, correct: 2 },
        '~': { attempts: 100, correct: 0 },
      }),
    ).toEqual(['M', 'U', 'K'])
  })
})
