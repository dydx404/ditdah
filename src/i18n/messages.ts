/**
 * Pure translation core (no React) — safe to import anywhere, including the
 * settings layer. The React binding (provider + hook) lives in context.tsx.
 */
import { en, type MessageKey } from './en'
import { zh } from './zh'

export type Locale = 'en' | 'zh'

/** Selectable locales, labelled in their own script (endonyms). */
export const LOCALES: readonly { id: Locale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' },
]

const CATALOGS: Record<Locale, Partial<Record<MessageKey, string>>> = { en, zh }

export type TranslateParams = Record<string, string | number>
export type TranslateFn = (key: MessageKey, params?: TranslateParams) => string

/** Look up a key in `locale`, falling back to English, then interpolate {vars}. */
export function translate(
  locale: Locale,
  key: MessageKey,
  params?: TranslateParams,
): string {
  let text = CATALOGS[locale]?.[key] ?? en[key]
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(`{${name}}`, String(value))
    }
  }
  return text
}

/** Best-effort locale from the browser; defaults to English. */
export function detectLocale(): Locale {
  if (
    typeof navigator !== 'undefined' &&
    navigator.language?.toLowerCase().startsWith('zh')
  ) {
    return 'zh'
  }
  return 'en'
}

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh'
}
