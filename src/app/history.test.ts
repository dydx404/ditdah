// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://ditdah.test"}
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  appendRound,
  clearHistory,
  loadHistory,
  type RoundRecord,
} from './history'

const HISTORY_KEY = 'ditdah:history'

const record = (n: number): RoundRecord => ({
  at: new Date(Date.UTC(2026, 6, 4, 12, n)).toISOString(),
  total: 25,
  correct: 20 + (n % 5),
  accuracy: (20 + (n % 5)) / 25,
  effectiveWpm: 12 + (n % 4),
})

describe('session history persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('loads an empty list when nothing is saved', () => {
    expect(loadHistory()).toEqual([])
  })

  it('loads an empty list when saved data is corrupt', () => {
    storage().setItem(HISTORY_KEY, 'not json')

    expect(loadHistory()).toEqual([])
  })

  it('round-trips appended rounds newest first', () => {
    const first = record(1)
    const second = record(2)

    expect(appendRound(first)).toEqual([first])
    expect(appendRound(second)).toEqual([second, first])
    expect(loadHistory()).toEqual([second, first])
  })

  it('keeps only the most recent 50 rounds', () => {
    for (let i = 0; i < 55; i += 1) {
      appendRound(record(i))
    }

    const history = loadHistory()
    expect(history).toHaveLength(50)
    expect(history[0]).toEqual(record(54))
    expect(history.at(-1)).toEqual(record(5))
  })

  it('loads an empty list for structurally invalid stored data', () => {
    storage().setItem(
      HISTORY_KEY,
      JSON.stringify([
        record(1),
        {
          ...record(2),
          accuracy: 1.2,
        },
      ]),
    )

    expect(loadHistory()).toEqual([])
  })

  it('clears saved history', () => {
    appendRound(record(1))

    clearHistory()

    expect(loadHistory()).toEqual([])
  })

  it('treats blocked storage as best-effort', () => {
    vi.stubGlobal('localStorage', new ThrowingStorage())

    expect(loadHistory()).toEqual([])
    expect(() => appendRound(record(1))).not.toThrow()
    expect(() => clearHistory()).not.toThrow()
  })

  it('treats missing storage as best-effort', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(loadHistory()).toEqual([])
    expect(appendRound(record(1))).toEqual([record(1)])
    expect(() => clearHistory()).not.toThrow()
  })
})

function storage(): Storage {
  return localStorage
}

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>()

  get length(): number {
    return this.items.size
  }

  clear(): void {
    this.items.clear()
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.items.keys()).at(index) ?? null
  }

  removeItem(key: string): void {
    this.items.delete(key)
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value)
  }
}

class ThrowingStorage extends MemoryStorage {
  override getItem(): string | null {
    throw new Error('blocked')
  }

  override removeItem(): void {
    throw new Error('blocked')
  }

  override setItem(): void {
    throw new Error('blocked')
  }
}
