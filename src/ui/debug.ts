export type DebugAnswerMode = 'normal' | 'always-correct'

export function readDebugAnswerMode(): DebugAnswerMode {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 'normal'

  const debug = new URLSearchParams(window.location.search).get('debug')
  return debug === 'always-correct' ? 'always-correct' : 'normal'
}
