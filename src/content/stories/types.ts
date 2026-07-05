import type { TimingConfig } from '@/core/morse/types'

export type StoryLineMode = 'copy' | 'narration' | 'send'

export interface Campaign {
  readonly id: string
  readonly title: string
  readonly chapters: readonly Chapter[]
}

export interface Chapter {
  readonly id: string
  readonly title: string
  readonly setting: string
  readonly blurb: string
  readonly characters: readonly StoryCharacter[]
  readonly lines: readonly StoryLine[]
  readonly unlock?: ChapterUnlock
}

export interface ChapterUnlock {
  readonly previousChapterId?: string
}

export interface StoryCharacter {
  readonly id: string
  readonly name: string
  readonly callsign?: string
  readonly avatar: string
  readonly locale?: string
}

export interface StoryLine {
  readonly id: string
  readonly speaker: string | 'you'
  /** CW content. Must be uppercase and use supported Morse chars/spaces. */
  readonly text: string
  /** Plain-language gloss shown only after the line is copied/revealed. */
  readonly subtitle?: string
  readonly timing?: Partial<Pick<TimingConfig, 'charWpm' | 'effectiveWpm'>>
  readonly mode: StoryLineMode
  readonly passAccuracy?: number
}
