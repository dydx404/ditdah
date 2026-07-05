import type { MorseSymbol } from './types'

const dit = 'dit'
const dah = 'dah'

const MORSE_TABLE = {
  A: [dit, dah],
  B: [dah, dit, dit, dit],
  C: [dah, dit, dah, dit],
  D: [dah, dit, dit],
  E: [dit],
  F: [dit, dit, dah, dit],
  G: [dah, dah, dit],
  H: [dit, dit, dit, dit],
  I: [dit, dit],
  J: [dit, dah, dah, dah],
  K: [dah, dit, dah],
  L: [dit, dah, dit, dit],
  M: [dah, dah],
  N: [dah, dit],
  O: [dah, dah, dah],
  P: [dit, dah, dah, dit],
  Q: [dah, dah, dit, dah],
  R: [dit, dah, dit],
  S: [dit, dit, dit],
  T: [dah],
  U: [dit, dit, dah],
  V: [dit, dit, dit, dah],
  W: [dit, dah, dah],
  X: [dah, dit, dit, dah],
  Y: [dah, dit, dah, dah],
  Z: [dah, dah, dit, dit],
  '0': [dah, dah, dah, dah, dah],
  '1': [dit, dah, dah, dah, dah],
  '2': [dit, dit, dah, dah, dah],
  '3': [dit, dit, dit, dah, dah],
  '4': [dit, dit, dit, dit, dah],
  '5': [dit, dit, dit, dit, dit],
  '6': [dah, dit, dit, dit, dit],
  '7': [dah, dah, dit, dit, dit],
  '8': [dah, dah, dah, dit, dit],
  '9': [dah, dah, dah, dah, dit],
  '.': [dit, dah, dit, dah, dit, dah],
  ',': [dah, dah, dit, dit, dah, dah],
  '?': [dit, dit, dah, dah, dit, dit],
  '/': [dah, dit, dit, dah, dit],
  '=': [dah, dit, dit, dit, dah],
  '+': [dit, dah, dit, dah, dit],
  '-': [dah, dit, dit, dit, dit, dah],
} as const satisfies Record<string, readonly MorseSymbol[]>

/**
 * Prosigns are two (or more) letters keyed as ONE symbol — no inter-character
 * gap between the parts. Written with an overbar in books; here we author them
 * in text as bracket tokens like `<SK>`. Getting these run together (not "S K")
 * is what separates a real CW tool from a toy, so the renderer treats a known
 * prosign token as a single unit. Values are the concatenated element streams.
 */
const PROSIGN_TABLE = {
  AR: [dit, dah, dit, dah, dit], // end of message (+)
  AS: [dit, dah, dit, dit, dit], // wait / stand by
  BT: [dah, dit, dit, dit, dah], // new section / break (=)
  KA: [dah, dit, dah, dit, dah], // attention / start of message
  KN: [dah, dit, dah, dah, dit], // go ahead, named station only
  SK: [dit, dit, dit, dah, dit, dah], // end of contact (VA)
} as const satisfies Record<string, readonly MorseSymbol[]>

export const KOCH_ORDER = [
  'K',
  'M',
  'U',
  'R',
  'E',
  'S',
  'N',
  'A',
  'P',
  'T',
  'L',
  'W',
  'I',
  '.',
  'J',
  'Z',
  '=',
  'F',
  'O',
  'Y',
  ',',
  'V',
  'G',
  '5',
  '/',
  'Q',
  '9',
  '2',
  'H',
  '3',
  '8',
  'B',
  '?',
  '4',
  '7',
  'C',
  '1',
  'D',
  '6',
  '0',
  'X',
] as const

export function symbolsFor(char: string): readonly MorseSymbol[] | undefined {
  if (char.length !== 1) {
    return undefined
  }

  const normalized = char.toUpperCase()
  return hasMorseEntry(normalized) ? MORSE_TABLE[normalized] : undefined
}

function hasMorseEntry(char: string): char is keyof typeof MORSE_TABLE {
  return Object.hasOwn(MORSE_TABLE, char)
}

/** Known prosign names (uppercase, without brackets), e.g. 'SK', 'AR'. */
export const PROSIGN_NAMES: readonly string[] = Object.keys(PROSIGN_TABLE)

/**
 * The run-together symbol sequence for a prosign name (case-insensitive),
 * or undefined if it is not a known prosign. Example: 'SK' -> the six elements
 * keyed with no inter-character gaps.
 */
export function symbolsForProsign(
  name: string,
): readonly MorseSymbol[] | undefined {
  const normalized = name.toUpperCase()
  return hasProsignEntry(normalized) ? PROSIGN_TABLE[normalized] : undefined
}

function hasProsignEntry(name: string): name is keyof typeof PROSIGN_TABLE {
  return Object.hasOwn(PROSIGN_TABLE, name)
}
