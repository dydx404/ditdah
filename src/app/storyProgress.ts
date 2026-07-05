const STORY_PROGRESS_KEY = 'ditdah:storyProgress'
const STORY_PROGRESS_VERSION = 1

export interface StoryChapterProgress {
  readonly chapterId: string
  readonly completedAt: string
  readonly bestAccuracy: number
  readonly assistedLines: number
  readonly playCount: number
}

export interface StoryProgress {
  readonly version: typeof STORY_PROGRESS_VERSION
  readonly chapters: readonly StoryChapterProgress[]
}

export interface StoryCompletion {
  readonly chapterId: string
  readonly accuracy: number
  readonly assistedLines: number
  readonly completedAt?: string
}

export const EMPTY_STORY_PROGRESS: StoryProgress = {
  version: STORY_PROGRESS_VERSION,
  chapters: [],
}

export function loadStoryProgress(): StoryProgress {
  try {
    const storage = getStorage()
    if (storage === null) {
      return EMPTY_STORY_PROGRESS
    }

    const raw = storage.getItem(STORY_PROGRESS_KEY)
    if (raw === null) {
      return EMPTY_STORY_PROGRESS
    }

    const parsed: unknown = JSON.parse(raw)
    return isStoryProgress(parsed) ? normalizeStoryProgress(parsed) : EMPTY_STORY_PROGRESS
  } catch {
    return EMPTY_STORY_PROGRESS
  }
}

export function saveStoryProgress(progress: StoryProgress): void {
  try {
    const storage = getStorage()
    if (storage !== null) {
      storage.setItem(STORY_PROGRESS_KEY, JSON.stringify(normalizeStoryProgress(progress)))
    }
  } catch {
    // Story progress is best-effort; practice should continue without storage.
  }
}

export function recordStoryCompletion(
  progress: StoryProgress,
  completion: StoryCompletion,
): StoryProgress {
  const normalized = normalizeCompletion(completion)
  if (normalized === null) {
    return progress
  }

  const existing = progress.chapters.find(
    (chapter) => chapter.chapterId === normalized.chapterId,
  )
  const nextChapter =
    existing === undefined
      ? {
          chapterId: normalized.chapterId,
          completedAt: normalized.completedAt,
          bestAccuracy: normalized.accuracy,
          assistedLines: normalized.assistedLines,
          playCount: 1,
        }
      : mergeChapterProgress(existing, normalized)

  const chapters =
    existing === undefined
      ? [...progress.chapters, nextChapter]
      : progress.chapters.map((chapter) =>
          chapter.chapterId === normalized.chapterId ? nextChapter : chapter,
        )

  return {
    version: STORY_PROGRESS_VERSION,
    chapters,
  }
}

function mergeChapterProgress(
  current: StoryChapterProgress,
  completion: Required<StoryCompletion>,
): StoryChapterProgress {
  const improvesAccuracy = completion.accuracy > current.bestAccuracy
  const tiesWithLessAssist =
    completion.accuracy === current.bestAccuracy &&
    completion.assistedLines < current.assistedLines

  return {
    chapterId: current.chapterId,
    completedAt: completion.completedAt,
    bestAccuracy:
      improvesAccuracy || tiesWithLessAssist
        ? completion.accuracy
        : current.bestAccuracy,
    assistedLines:
      improvesAccuracy || tiesWithLessAssist
        ? completion.assistedLines
        : current.assistedLines,
    playCount: current.playCount + 1,
  }
}

function normalizeStoryProgress(progress: StoryProgress): StoryProgress {
  return {
    version: STORY_PROGRESS_VERSION,
    chapters: progress.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      completedAt: chapter.completedAt,
      bestAccuracy: chapter.bestAccuracy,
      assistedLines: chapter.assistedLines,
      playCount: chapter.playCount,
    })),
  }
}

function normalizeCompletion(
  completion: StoryCompletion,
): Required<StoryCompletion> | null {
  const completedAt = completion.completedAt ?? new Date().toISOString()
  if (
    !isNonEmptyString(completion.chapterId) ||
    !isRatio(completion.accuracy) ||
    !isNonNegativeInteger(completion.assistedLines) ||
    Number.isNaN(Date.parse(completedAt))
  ) {
    return null
  }

  return {
    chapterId: completion.chapterId,
    accuracy: completion.accuracy,
    assistedLines: completion.assistedLines,
    completedAt,
  }
}

function isStoryProgress(value: unknown): value is StoryProgress {
  if (!isRecord(value) || value.version !== STORY_PROGRESS_VERSION) {
    return false
  }
  if (!Array.isArray(value.chapters) || !value.chapters.every(isChapterProgress)) {
    return false
  }

  const ids = new Set(value.chapters.map((chapter) => chapter.chapterId))
  return ids.size === value.chapters.length
}

function isChapterProgress(value: unknown): value is StoryChapterProgress {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonEmptyString(value.chapterId) &&
    typeof value.completedAt === 'string' &&
    !Number.isNaN(Date.parse(value.completedAt)) &&
    isRatio(value.bestAccuracy) &&
    isNonNegativeInteger(value.assistedLines) &&
    isPositiveInteger(value.playCount)
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0
}

function isRatio(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}
