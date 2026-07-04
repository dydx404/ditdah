/**
 * Practice modes — the blocks a learner picks between on the home screen.
 *
 * A mode is a named, curated experience: metadata plus the settings it applies
 * when chosen. Modes are the primary navigation; Settings fine-tune within the
 * chosen mode. New practice types (words, callsigns, numbers, …) are added here
 * as they land, so the home screen grows without new plumbing.
 */
import type { Settings } from './settings'

export interface PracticeModeDef {
  readonly id: string
  readonly name: string
  readonly blurb: string
  /** False for planned-but-not-built modes (shown greyed as "soon"). */
  readonly available: boolean
  /** Settings applied when this mode is selected. */
  readonly apply?: Partial<Settings>
}

export const PRACTICE_MODES: readonly PracticeModeDef[] = [
  {
    id: 'learn',
    name: 'Learn',
    blurb: 'Letters by ear, one at a time — the Koch path.',
    available: true,
    apply: { promptMode: 'single' },
  },
  {
    id: 'groups',
    name: 'Copy groups',
    blurb: 'Random runs from your unlocked set.',
    available: true,
    apply: { promptMode: 'group' },
  },
  {
    id: 'words',
    name: 'Words',
    blurb: 'Copy real words.',
    available: false,
  },
  {
    id: 'callsigns',
    name: 'Callsigns',
    blurb: 'Realistic callsign patterns.',
    available: false,
  },
  {
    id: 'numbers',
    name: 'Numbers',
    blurb: 'Digit drills.',
    available: false,
  },
]

/** The mode the current settings correspond to (drives the home-screen highlight). */
export function activeModeId(settings: Pick<Settings, 'promptMode'>): string {
  return settings.promptMode === 'group' ? 'groups' : 'learn'
}
