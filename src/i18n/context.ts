/**
 * Locale context + the `useT()` hook (no components here, so fast-refresh stays
 * happy). The provider component lives in provider.tsx.
 */
import { createContext, useContext, useMemo } from 'react'
import { translate, type Locale, type TranslateFn } from './messages'

export const LocaleContext = createContext<Locale>('en')

/** Returns `t(key, params?)` bound to the active locale. */
export function useT(): TranslateFn {
  const locale = useContext(LocaleContext)
  return useMemo<TranslateFn>(
    () => (key, params) => translate(locale, key, params),
    [locale],
  )
}
