import type { Chapter, StoryLine } from '@/content/stories'

const DEFAULT_PASS_ACCURACY = 1
const DEFAULT_ASSIST_AFTER_MISSES = 2

export type StoryPhase =
  | 'narration'
  | 'copy'
  | 'retry'
  | 'assist'
  | 'send'
  | 'complete'

export interface StoryCharResult {
  readonly expected: string
  readonly received: string
  readonly correct: boolean
}

export interface StoryAttemptResult {
  readonly correct: boolean
  readonly expected: string
  readonly received: string
  readonly accuracy: number
  readonly perChar: readonly StoryCharResult[]
}

export interface StoryTranscriptEntry {
  readonly line: StoryLine
  readonly received: string
  readonly accuracy: number | null
  readonly assisted: boolean
}

export interface StoryChapterSummary {
  /** Positions copied by ear on incoming copy lines. */
  readonly total: number
  readonly correct: number
  readonly accuracy: number
  readonly assistedLines: number
}

export interface StorySessionState {
  readonly chapterId: string
  readonly lineIndex: number
  readonly phase: StoryPhase
  readonly activeLine: StoryLine | null
  readonly transcript: readonly StoryTranscriptEntry[]
  readonly lastAttempt: StoryAttemptResult | null
  readonly missCount: number
  readonly summary: StoryChapterSummary | null
}

export interface StorySession {
  state(): StorySessionState
  advanceNarration(): StorySessionState
  submitCopy(received: string): StorySessionState
  submitAssist(received: string): StorySessionState
  submitSend(received: string): StorySessionState
}

export interface StorySessionOptions {
  readonly assistAfterMisses?: number
}

export function createStorySession(
  chapter: Chapter,
  options: StorySessionOptions = {},
): StorySession {
  const assistAfterMisses =
    options.assistAfterMisses ?? DEFAULT_ASSIST_AFTER_MISSES
  const transcript: StoryTranscriptEntry[] = []
  let lineIndex = 0
  let phase = phaseForLine(chapter.lines[lineIndex])
  let lastAttempt: StoryAttemptResult | null = null
  let missCount = 0
  let total = 0
  let correct = 0
  let assistedLines = 0
  let summary: StoryChapterSummary | null = null

  const state = (): StorySessionState => ({
    chapterId: chapter.id,
    lineIndex,
    phase,
    activeLine: chapter.lines[lineIndex] ?? null,
    transcript: [...transcript],
    lastAttempt,
    missCount,
    summary,
  })

  const advanceNarration = (): StorySessionState => {
    const line = activeLineOrThrow()
    if (phase !== 'narration' || line.mode !== 'narration') {
      throw new Error('active story line is not narration')
    }

    transcript.push({
      line,
      received: '',
      accuracy: null,
      assisted: false,
    })
    advanceLine()
    return state()
  }

  const submitCopy = (received: string): StorySessionState => {
    const line = activeLineOrThrow()
    if ((phase !== 'copy' && phase !== 'retry') || line.mode !== 'copy') {
      throw new Error('active story line is not accepting copy')
    }

    const result = scoreStoryText(line.text, received)
    lastAttempt = result
    total += result.perChar.length
    correct += result.perChar.filter((char) => char.correct).length

    if (result.accuracy >= passAccuracy(line)) {
      transcript.push({
        line,
        received: result.received,
        accuracy: result.accuracy,
        assisted: false,
      })
      advanceLine()
      return state()
    }

    missCount += 1
    phase = missCount >= assistAfterMisses ? 'assist' : 'retry'
    return state()
  }

  const submitAssist = (received: string): StorySessionState => {
    const line = activeLineOrThrow()
    if (phase !== 'assist') {
      throw new Error('active story line is not in assist')
    }

    const normalized = normalizeStoryInput(received)
    lastAttempt = scoreStoryText(line.text, normalized)
    if (normalized !== line.text) {
      return state()
    }

    assistedLines += 1
    transcript.push({
      line,
      received: normalized,
      accuracy: lastAttempt.accuracy,
      assisted: true,
    })
    advanceLine()
    return state()
  }

  const submitSend = (received: string): StorySessionState => {
    const line = activeLineOrThrow()
    if (phase !== 'send' || line.mode !== 'send') {
      throw new Error('active story line is not accepting send')
    }

    const result = scoreStoryText(line.text, received)
    lastAttempt = result
    if (!result.correct) {
      return state()
    }

    transcript.push({
      line,
      received: result.received,
      accuracy: result.accuracy,
      assisted: false,
    })
    advanceLine()
    return state()
  }

  return {
    state,
    advanceNarration,
    submitCopy,
    submitAssist,
    submitSend,
  }

  function activeLineOrThrow(): StoryLine {
    const line = chapter.lines[lineIndex]
    if (line === undefined) {
      throw new Error('story chapter is complete')
    }
    return line
  }

  function advanceLine(): void {
    lineIndex += 1
    lastAttempt = null
    missCount = 0
    const nextLine = chapter.lines[lineIndex]
    if (nextLine === undefined) {
      phase = 'complete'
      summary = {
        total,
        correct,
        accuracy: total === 0 ? 0 : correct / total,
        assistedLines,
      }
      return
    }
    phase = phaseForLine(nextLine)
  }
}

export function scoreStoryText(
  expected: string,
  received: string,
): StoryAttemptResult {
  const normalizedExpected = normalizeStoryInput(expected)
  const normalizedReceived = normalizeStoryInput(received)
  const perChar: StoryCharResult[] = []

  for (let i = 0; i < normalizedExpected.length; i += 1) {
    const expectedChar = normalizedExpected[i]
    const receivedChar = normalizedReceived[i] ?? ''
    perChar.push({
      expected: expectedChar,
      received: receivedChar,
      correct: expectedChar === receivedChar,
    })
  }

  return {
    correct: normalizedReceived === normalizedExpected,
    expected: normalizedExpected,
    received: normalizedReceived,
    accuracy:
      perChar.length === 0
        ? 0
        : perChar.filter((char) => char.correct).length / perChar.length,
    perChar,
  }
}

export function normalizeStoryInput(text: string): string {
  // Prosigns are authored as `<SK>` but typed as their plain letters ("SK"),
  // so scoring compares on the bracket-free form.
  return text.replace(/[<>]/g, '').toUpperCase().trim()
}

/** Text as shown to the reader: prosign brackets removed (e.g. `73 <SK>` -> `73 SK`). */
export function displayStoryText(text: string): string {
  return text.replace(/[<>]/g, '')
}

export function storyLinePlayableText(line: StoryLine): string | null {
  return line.mode === 'copy' || line.mode === 'narration' ? line.text : null
}

function phaseForLine(line: StoryLine | undefined): StoryPhase {
  if (line === undefined) return 'complete'
  return line.mode
}

function passAccuracy(line: StoryLine): number {
  return line.passAccuracy ?? DEFAULT_PASS_ACCURACY
}
