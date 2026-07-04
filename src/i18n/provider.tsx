import type { ReactNode } from 'react'
import { LocaleContext } from './context'
import type { Locale } from './messages'

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}
