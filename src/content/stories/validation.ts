import { symbolsFor, symbolsForProsign } from '@/core/morse'
import type { Campaign, Chapter, StoryLine } from './types'

export interface StoryContentIssue {
  readonly path: string
  readonly message: string
}

export function validateCampaign(campaign: Campaign): StoryContentIssue[] {
  const issues: StoryContentIssue[] = []
  const chapterIds = new Set<string>()
  const allChapterIds = new Set(campaign.chapters.map((chapter) => chapter.id))

  if (campaign.id.trim().length === 0) {
    issues.push({ path: 'campaign.id', message: 'Campaign id is required' })
  }

  campaign.chapters.forEach((chapter, chapterIndex) => {
    const chapterPath = `chapters[${chapterIndex}]`
    if (chapterIds.has(chapter.id)) {
      issues.push({ path: `${chapterPath}.id`, message: 'Chapter id is duplicated' })
    }
    chapterIds.add(chapter.id)
    if (
      chapter.unlock?.previousChapterId !== undefined &&
      !allChapterIds.has(chapter.unlock.previousChapterId)
    ) {
      issues.push({
        path: `${chapterPath}.unlock.previousChapterId`,
        message: 'Chapter unlock references an unknown chapter',
      })
    }
    if (chapter.unlock?.previousChapterId === chapter.id) {
      issues.push({
        path: `${chapterPath}.unlock.previousChapterId`,
        message: 'Chapter cannot unlock from itself',
      })
    }
    issues.push(...validateChapter(chapter, chapterPath))
  })

  return issues
}

export function validateChapter(
  chapter: Chapter,
  path = 'chapter',
): StoryContentIssue[] {
  const issues: StoryContentIssue[] = []
  const characterIds = new Set(chapter.characters.map((character) => character.id))
  const lineIds = new Set<string>()

  if (chapter.lines.length === 0) {
    issues.push({ path: `${path}.lines`, message: 'Chapter needs at least one line' })
  }

  chapter.lines.forEach((line, lineIndex) => {
    const linePath = `${path}.lines[${lineIndex}]`
    if (lineIds.has(line.id)) {
      issues.push({ path: `${linePath}.id`, message: 'Line id is duplicated' })
    }
    lineIds.add(line.id)

    if (line.speaker !== 'you' && !characterIds.has(line.speaker)) {
      issues.push({ path: `${linePath}.speaker`, message: 'Speaker is unknown' })
    }
    issues.push(...validateLine(line, linePath))
  })

  return issues
}

export function validateLine(
  line: StoryLine,
  path = 'line',
): StoryContentIssue[] {
  const issues: StoryContentIssue[] = []

  if (line.text !== line.text.toUpperCase()) {
    issues.push({ path: `${path}.text`, message: 'Line text must be uppercase' })
  }
  if (!isSupportedStoryText(line.text)) {
    issues.push({
      path: `${path}.text`,
      message: 'Line text contains unsupported Morse characters',
    })
  }
  if (
    line.passAccuracy !== undefined &&
    (line.passAccuracy < 0 || line.passAccuracy > 1)
  ) {
    issues.push({
      path: `${path}.passAccuracy`,
      message: 'Pass accuracy must be between 0 and 1',
    })
  }

  return issues
}

export function isSupportedStoryText(text: string): boolean {
  if (text.trim().length === 0) {
    return false
  }
  // Known prosign tokens (`<SK>`) are valid units; drop them, then any leftover
  // `<`/`>` means an unknown or malformed prosign, which is unsupported.
  const withoutProsigns = text.replace(/<([^>]*)>/g, (match, name: string) =>
    symbolsForProsign(name) !== undefined ? ' ' : match,
  )
  return [...withoutProsigns].every(
    (char) => symbolsFor(char) !== undefined || /\s/.test(char),
  )
}
