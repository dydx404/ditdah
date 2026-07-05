// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://ditdah.test"}
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EMPTY_STORY_PROGRESS,
  loadStoryProgress,
  recordStoryCompletion,
  saveStoryProgress,
  type StoryProgress,
} from './storyProgress'

const STORY_PROGRESS_KEY = 'ditdah:storyProgress'

describe('story progress persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('loads empty progress when nothing is saved', () => {
    expect(loadStoryProgress()).toEqual(EMPTY_STORY_PROGRESS)
  })

  it('loads empty progress for corrupt or incompatible data', () => {
    storage().setItem(STORY_PROGRESS_KEY, 'not json')
    expect(loadStoryProgress()).toEqual(EMPTY_STORY_PROGRESS)

    storage().setItem(
      STORY_PROGRESS_KEY,
      JSON.stringify({ version: 2, chapters: [] }),
    )
    expect(loadStoryProgress()).toEqual(EMPTY_STORY_PROGRESS)
  })

  it('loads empty progress for structurally invalid data', () => {
    storage().setItem(
      STORY_PROGRESS_KEY,
      JSON.stringify({
        version: 1,
        chapters: [
          chapterProgress({
            bestAccuracy: 1.2,
          }),
        ],
      }),
    )

    expect(loadStoryProgress()).toEqual(EMPTY_STORY_PROGRESS)
  })

  it('round-trips valid progress', () => {
    const progress: StoryProgress = {
      version: 1,
      chapters: [chapterProgress()],
    }

    saveStoryProgress(progress)

    expect(loadStoryProgress()).toEqual(progress)
  })

  it('records first completion and increments replays while preserving best accuracy', () => {
    const first = recordStoryCompletion(EMPTY_STORY_PROGRESS, {
      chapterId: 'first-contact',
      accuracy: 0.82,
      assistedLines: 1,
      completedAt: '2026-07-05T10:00:00.000Z',
    })

    const replay = recordStoryCompletion(first, {
      chapterId: 'first-contact',
      accuracy: 0.75,
      assistedLines: 0,
      completedAt: '2026-07-05T11:00:00.000Z',
    })

    expect(replay.chapters).toEqual([
      {
        chapterId: 'first-contact',
        completedAt: '2026-07-05T11:00:00.000Z',
        bestAccuracy: 0.82,
        assistedLines: 1,
        playCount: 2,
      },
    ])
  })

  it('updates assisted lines when a replay ties accuracy with less help', () => {
    const first = recordStoryCompletion(EMPTY_STORY_PROGRESS, {
      chapterId: 'first-contact',
      accuracy: 1,
      assistedLines: 1,
      completedAt: '2026-07-05T10:00:00.000Z',
    })

    const replay = recordStoryCompletion(first, {
      chapterId: 'first-contact',
      accuracy: 1,
      assistedLines: 0,
      completedAt: '2026-07-05T11:00:00.000Z',
    })

    expect(replay.chapters[0]).toMatchObject({
      bestAccuracy: 1,
      assistedLines: 0,
      playCount: 2,
    })
  })

  it('treats blocked and missing storage as best-effort', () => {
    vi.stubGlobal('localStorage', new ThrowingStorage())

    expect(loadStoryProgress()).toEqual(EMPTY_STORY_PROGRESS)
    expect(() => saveStoryProgress(EMPTY_STORY_PROGRESS)).not.toThrow()

    vi.stubGlobal('localStorage', undefined)

    expect(loadStoryProgress()).toEqual(EMPTY_STORY_PROGRESS)
    expect(() => saveStoryProgress(EMPTY_STORY_PROGRESS)).not.toThrow()
  })
})

function chapterProgress(
  overrides: Partial<StoryProgress['chapters'][number]> = {},
): StoryProgress['chapters'][number] {
  return {
    chapterId: 'first-contact',
    completedAt: '2026-07-05T10:00:00.000Z',
    bestAccuracy: 0.95,
    assistedLines: 0,
    playCount: 1,
    ...overrides,
  }
}

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

  override setItem(): void {
    throw new Error('blocked')
  }
}
