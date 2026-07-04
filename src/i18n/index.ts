export type { MessageKey, Messages } from './en'
export {
  translate,
  detectLocale,
  isLocale,
  LOCALES,
  type Locale,
  type TranslateFn,
  type TranslateParams,
} from './messages'
export { useT } from './context'
export { I18nProvider } from './provider'
