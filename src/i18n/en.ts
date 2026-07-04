/**
 * English message catalog — the source of truth. Every user-facing string has a
 * key here; other locales are partial and fall back to English per key, so a
 * missing translation degrades to English rather than breaking.
 *
 * Keys are grouped by area with dotted names. Add a key here first, then
 * translate it in the other catalogs.
 */
export const en = {
  // Home / mode select
  'mode.intro':
    'Pick a mode, then copy Morse by ear. You start with two characters and unlock more as you go.',
  'mode.learn.name': 'Learn',
  'mode.learn.blurb': 'Letters by ear, one at a time — the Koch path.',
  'mode.groups.name': 'Copy groups',
  'mode.groups.blurb': 'Random runs from your unlocked set.',
  'mode.words.name': 'Words',
  'mode.words.blurb': 'Copy real words.',
  'mode.callsigns.name': 'Callsigns',
  'mode.callsigns.blurb': 'Realistic callsign patterns.',
  'mode.numbers.name': 'Numbers',
  'mode.numbers.blurb': 'Digit drills.',
  'home.hint': 'press Space · turn your sound on',

  // Actions
  'action.start': 'Start listening',
  'action.soon': 'soon',
  'action.close': 'Close settings',

  // Settings
  'settings.title': 'Settings',
  'settings.subtitle': 'Tune the sound, keep the rhythm.',
  'settings.language': 'Language',
  'settings.charSpeed': 'Character speed',
  'settings.overallSpeed': 'Overall speed',
  'settings.sidetone': 'Sidetone',
  'settings.volume': 'Volume',
  'settings.roundLength': 'Round length',
  'settings.groupSize': 'Group size',
  'settings.strict': 'Strict mode (type misses back to continue)',
  'settings.strictHint':
    'On by default: missed characters must be echoed once before moving on.',
  'settings.sounds': 'Answer sounds',
  'settings.soundsHint': 'Play short correct and wrong cues after each answer.',
  'settings.patterns': 'Show dit/dah patterns',
  'settings.patternsHint':
    'Off by default — learning by ear is the point. Turn on for a visual reference.',

  // Units
  'unit.wpm': 'WPM',
  'unit.hz': 'Hz',
  'unit.prompts': 'prompts',
  'unit.chars': 'chars',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
