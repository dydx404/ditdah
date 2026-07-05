import { symbolsFor, symbolsForProsign } from './table'
import type { KeyingElement, MorseSymbol, TimingConfig } from './types'

const INTRA_CHARACTER_UNITS = 1
const INTER_CHARACTER_UNITS = 3
const WORD_GAP_UNITS = 7

type PendingGap = 'character' | 'word'

export function ditMs(charWpm: number): number {
  return 1200 / charWpm
}

export function renderToElements(
  text: string,
  timing: TimingConfig,
): readonly KeyingElement[] {
  const unitMs = ditMs(timing.charWpm)
  const spacingUnitMs = farnsworthSpacingUnitMs(timing)
  const elements: KeyingElement[] = []
  let pendingGap: PendingGap | undefined
  let index = 0

  while (index < text.length) {
    const char = text[index]

    if (isWhitespace(char)) {
      if (elements.length > 0) {
        pendingGap = 'word'
      }
      index += 1
      continue
    }

    // A prosign token like `<SK>` keys its letters run together as one symbol.
    if (char === '<') {
      const close = text.indexOf('>', index + 1)
      if (close !== -1) {
        const symbols = symbolsForProsign(text.slice(index + 1, close))
        index = close + 1
        if (symbols !== undefined) {
          pushGap(elements, pendingGap, spacingUnitMs)
          appendSymbols(elements, symbols, unitMs)
          pendingGap = 'character'
        }
        continue
      }
      // No closing '>': treat '<' as an unsupported character and move on.
      index += 1
      continue
    }

    const symbols = symbolsFor(char)
    index += 1
    if (symbols === undefined) {
      continue
    }

    pushGap(elements, pendingGap, spacingUnitMs)
    appendSymbols(elements, symbols, unitMs)
    pendingGap = 'character'
  }

  return elements
}

function pushGap(
  elements: KeyingElement[],
  pendingGap: PendingGap | undefined,
  spacingUnitMs: number,
): void {
  if (elements.length > 0 && pendingGap !== undefined) {
    elements.push({
      on: false,
      ms:
        pendingGap === 'word'
          ? WORD_GAP_UNITS * spacingUnitMs
          : INTER_CHARACTER_UNITS * spacingUnitMs,
    })
  }
}

function appendSymbols(
  elements: KeyingElement[],
  symbols: readonly MorseSymbol[],
  unitMs: number,
): void {
  for (const [index, symbol] of symbols.entries()) {
    if (index > 0) {
      elements.push({
        on: false,
        ms: INTRA_CHARACTER_UNITS * unitMs,
      })
    }

    elements.push({
      on: true,
      ms: symbol === 'dit' ? unitMs : 3 * unitMs,
    })
  }
}

function farnsworthSpacingUnitMs(timing: TimingConfig): number {
  assertPositiveWpm(timing.charWpm, 'charWpm')
  assertPositiveWpm(timing.effectiveWpm, 'effectiveWpm')

  const unitMs = ditMs(timing.charWpm)
  if (timing.effectiveWpm >= timing.charWpm) {
    return unitMs
  }

  return (60000 / timing.effectiveWpm - 37200 / timing.charWpm) / 19
}

function assertPositiveWpm(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be greater than 0`)
  }
}

function isWhitespace(char: string): boolean {
  return /\s/u.test(char)
}
