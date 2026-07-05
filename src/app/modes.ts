/**
 * Practice modes — the blocks a learner picks between on the home screen.
 *
 * A mode is a named, curated experience: metadata plus the settings it applies
 * when chosen. Modes are the primary navigation; Settings fine-tune within the
 * chosen mode. New practice types (words, callsigns, numbers, …) are added here
 * as they land, so the home screen grows without new plumbing.
 */
import { DIGIT_CHARS } from './charset'
import {
  CALLSIGN_POOL,
  COMMON_WORD_POOL,
  QSO_POOL,
  samePromptPool,
} from './promptPools'
import type { Settings } from './settings'
import type { MessageKey } from '@/i18n'

export interface PracticeModeDef {
  readonly id: string
  /** i18n keys, resolved at render so mode names/blurbs localize. */
  readonly nameKey: MessageKey
  readonly blurbKey: MessageKey
  /** False for planned-but-not-built modes (shown greyed as "soon"). */
  readonly available: boolean
  /** Settings applied when this mode is selected. */
  readonly apply?: Partial<Settings>
}

export const PRACTICE_MODES: readonly PracticeModeDef[] = [
  {
    id: 'learn',
    nameKey: 'mode.learn.name',
    blurbKey: 'mode.learn.blurb',
    available: true,
    apply: { promptMode: 'single', charSource: 'koch', promptPool: [] },
  },
  {
    id: 'groups',
    nameKey: 'mode.groups.name',
    blurbKey: 'mode.groups.blurb',
    available: true,
    apply: { promptMode: 'group', charSource: 'koch', promptPool: [] },
  },
  {
    id: 'free',
    nameKey: 'mode.free.name',
    blurbKey: 'mode.free.blurb',
    available: true,
    apply: { charSource: 'custom', promptPool: [] },
  },
  {
    id: 'words',
    nameKey: 'mode.words.name',
    blurbKey: 'mode.words.blurb',
    available: true,
    apply: {
      promptMode: 'single',
      charSource: 'koch',
      promptPool: COMMON_WORD_POOL,
    },
  },
  {
    id: 'callsigns',
    nameKey: 'mode.callsigns.name',
    blurbKey: 'mode.callsigns.blurb',
    available: true,
    apply: {
      promptMode: 'single',
      charSource: 'koch',
      promptPool: CALLSIGN_POOL,
    },
  },
  {
    id: 'qso',
    nameKey: 'mode.qso.name',
    blurbKey: 'mode.qso.blurb',
    available: true,
    apply: {
      promptMode: 'single',
      charSource: 'koch',
      promptPool: QSO_POOL,
    },
  },
  {
    id: 'numbers',
    nameKey: 'mode.numbers.name',
    blurbKey: 'mode.numbers.blurb',
    available: true,
    apply: { charSource: 'custom', customCharset: DIGIT_CHARS, promptPool: [] },
  },
]

/** The mode the current settings correspond to (drives the home-screen highlight). */
export function activeModeId(
  settings: Pick<
    Settings,
    'promptMode' | 'charSource' | 'customCharset' | 'promptPool'
  >,
): string {
  if (settings.promptPool.length > 0) {
    if (samePromptPool(settings.promptPool, COMMON_WORD_POOL)) return 'words'
    if (samePromptPool(settings.promptPool, CALLSIGN_POOL)) return 'callsigns'
    if (samePromptPool(settings.promptPool, QSO_POOL)) return 'qso'
    return 'free'
  }

  if (settings.charSource === 'custom') {
    return sameCharset(settings.customCharset, DIGIT_CHARS) ? 'numbers' : 'free'
  }
  return settings.promptMode === 'group' ? 'groups' : 'learn'
}

function sameCharset(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((char, index) => char === b[index])
}
