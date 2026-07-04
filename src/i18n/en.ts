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
  'app.loading': 'loading…',
  'mode.aria': 'Practice modes',
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
  'action.openHistory': 'Open history',
  'action.openSettings': 'Open settings',
  'action.closeHistory': 'Close history',
  'action.deleteLast': 'Delete last character',
  'action.submit': 'Submit',
  'action.replaySpace': 'replay (Space)',
  'action.practiceAgain': 'Practice again',
  'action.clearHistory': 'Clear history',
  'action.play': 'play',

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

  // HUD / practice loop
  'stats.characters': 'Your characters',
  'stats.acc': 'acc',
  'stats.copied': 'copied',
  'stats.correct': 'correct',
  'stats.wpm': 'wpm',
  'stats.streakTitle': '{count}-day streak',
  'stats.dayStreak': ' day streak',
  'daily.today': 'today',
  'daily.title': '{completed} / {goal} today',
  'practice.copyGroupHint': 'copy the group · Enter to submit',
  'practice.typeToContinue': 'type {char} to continue',
  'practice.echoToContinue': 'echo it to continue',
  'practice.listeningHint': 'listen — then type what you heard',

  // Feedback
  'feedback.nice': '✓ nice',
  'feedback.cleanCopy': '✓ clean copy',
  'feedback.youTypedExpected': 'you typed {got} — that was {expected}',
  'feedback.youTyped': 'you typed {got}',

  // Group input
  'buffer.aria': 'Your copy so far',
  'keypad.aria': 'Answer keypad',
  'keypad.answer': 'Answer {char}',

  // Summary
  'summary.roundComplete': 'round complete',
  'summary.accuracy': 'accuracy',
  'summary.unlocked': '🔓 unlocked {chars}',
  'summary.keepWorking': 'keep working on ',
  'summary.pressSpace': 'press Space',

  // History
  'history.title': 'History',
  'history.subtitle': 'Recent rounds stay on this device',
  'history.empty': 'Finish a round to start your history',
  'history.accuracy': 'Accuracy {percent}%',
  'history.unknownTime': 'unknown time',

  // Character reference
  'reference.title': 'Character reference',
  'reference.show': 'show',
  'reference.hide': 'hide',
  'reference.aria': 'Koch character reference',
  'reference.colChar': 'char',
  'reference.colStatus': 'status',
  'reference.colPattern': 'pattern',
  'reference.colSound': 'sound',
  'reference.unlocked': 'unlocked',
  'reference.upcoming': 'upcoming',
  'reference.listen': 'Listen to character {char}',
} as const

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, string>
