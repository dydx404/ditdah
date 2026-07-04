import { describe, expect, it } from 'vitest'
import { KOCH_ORDER, symbolsFor } from './table'

describe('symbolsFor', () => {
  it('looks up letters case-insensitively', () => {
    expect(symbolsFor('k')).toEqual(['dah', 'dit', 'dah'])
    expect(symbolsFor('K')).toEqual(['dah', 'dit', 'dah'])
  })

  it('looks up digits', () => {
    expect(symbolsFor('5')).toEqual(['dit', 'dit', 'dit', 'dit', 'dit'])
    expect(symbolsFor('0')).toEqual(['dah', 'dah', 'dah', 'dah', 'dah'])
  })

  it('does not treat spaces or unsupported characters as table entries', () => {
    expect(symbolsFor(' ')).toBeUndefined()
    expect(symbolsFor('~')).toBeUndefined()
  })
})

describe('KOCH_ORDER', () => {
  it('matches the expected shape and is covered by the table', () => {
    expect(KOCH_ORDER).toHaveLength(41)
    expect(new Set(KOCH_ORDER)).toHaveProperty('size', 41)

    for (const char of KOCH_ORDER) {
      expect(char).toBe(char.toUpperCase())
      expect(symbolsFor(char)).toBeDefined()
    }
  })
})
