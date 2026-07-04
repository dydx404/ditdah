// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://ditdah.test"}
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProgressStore, CURRENT_SCHEMA_VERSION } from './store'
import type { Progress } from './types'

const STORAGE_KEY = 'ditdah:progress'

const sampleProgress = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  unlocked: ['K', 'M', 'U'],
  charStats: {
    K: { attempts: 10, correct: 9 },
    M: { attempts: 8, correct: 7 },
    U: { attempts: 3, correct: 3 },
  },
  streak: {
    count: 4,
    lastPracticedISO: '2026-07-04',
  },
} satisfies Progress

describe('createProgressStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('round-trips a full progress object', async () => {
    const store = createProgressStore()

    await store.save(sampleProgress)

    await expect(store.load()).resolves.toEqual(sampleProgress)
  })

  it('returns null when nothing is saved', async () => {
    const store = createProgressStore()

    await expect(store.load()).resolves.toBeNull()
  })

  it('returns null on corrupt stored data', async () => {
    storage().setItem(STORAGE_KEY, 'not json')
    const store = createProgressStore()

    await expect(store.load()).resolves.toBeNull()
  })

  it('returns null for an incompatible schema version', async () => {
    storage().setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...sampleProgress,
        schemaVersion: CURRENT_SCHEMA_VERSION + 1,
      }),
    )
    const store = createProgressStore()

    await expect(store.load()).resolves.toBeNull()
  })

  it('returns null for a structurally invalid object', async () => {
    const { unlocked: _unlocked, ...invalidProgress } = sampleProgress
    storage().setItem(STORAGE_KEY, JSON.stringify(invalidProgress))
    const store = createProgressStore()

    await expect(store.load()).resolves.toBeNull()
  })

  it('overwrites a previous value and clears saved progress', async () => {
    const store = createProgressStore()
    const updatedProgress = {
      ...sampleProgress,
      unlocked: ['K', 'M'],
      streak: {
        count: 5,
        lastPracticedISO: '2026-07-05',
      },
    } satisfies Progress

    await store.save(sampleProgress)
    await store.save(updatedProgress)
    await expect(store.load()).resolves.toEqual(updatedProgress)

    await store.clear()
    await expect(store.load()).resolves.toBeNull()
  })

  it('treats blocked storage as best-effort', async () => {
    const store = createProgressStore()
    vi.stubGlobal('localStorage', new ThrowingStorage())

    await expect(store.load()).resolves.toBeNull()
    await expect(store.save(sampleProgress)).resolves.toBeUndefined()
    await expect(store.clear()).resolves.toBeUndefined()
  })

  it('treats missing storage as best-effort', async () => {
    const store = createProgressStore()
    vi.stubGlobal('localStorage', undefined)

    await expect(store.load()).resolves.toBeNull()
    await expect(store.save(sampleProgress)).resolves.toBeUndefined()
    await expect(store.clear()).resolves.toBeUndefined()
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
