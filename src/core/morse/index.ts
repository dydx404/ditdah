import { KOCH_ORDER, symbolsFor } from './table'
import { ditMs, renderToElements } from './timing'
import type { MorseApi } from './types'

export {
  KOCH_ORDER,
  PROSIGN_NAMES,
  symbolsFor,
  symbolsForProsign,
} from './table'
export { ditMs, renderToElements } from './timing'
export type { KeyingElement, MorseApi, MorseSymbol, TimingConfig } from './types'

const api: MorseApi = {
  KOCH_ORDER,
  symbolsFor,
  ditMs,
  renderToElements,
}

void api
