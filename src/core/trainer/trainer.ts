import { KOCH_ORDER, symbolsFor } from '../morse'
import { createRng } from './rng'
import type {
  CharResult,
  CharStat,
  Prompt,
  SessionSummary,
  Trainer,
  TrainerConfig,
} from './types'

interface MutableCharStat {
  attempts: number
  correct: number
}

export function createTrainer(config: TrainerConfig): Trainer {
  validateConfig(config)

  const promptMode = config.promptMode ?? 'single'
  const groupSize = config.groupSize ?? 5
  const freeCharset = normalizeCharset(config.charset)
  const rng = createRng(config.seed)
  const stats = new Map<string, MutableCharStat>()
  const resultHistory = new Map<string, boolean[]>()
  const unlockedThisSession: string[] = []
  let unlockedCount = config.initialUnlockCount
  let activePrompt: Prompt | undefined
  let previousChar: string | undefined
  let nextPromptId = 1

  return {
    unlockedChars() {
      return unlockedChars()
    },

    nextPrompt() {
      const text =
        promptMode === 'group'
          ? chooseGroup(unlockedChars(), groupSize, rng)
          : choosePromptChar(unlockedChars(), previousChar, rng)
      const prompt = {
        id: String(nextPromptId),
        text,
      }

      nextPromptId += 1
      activePrompt = prompt
      previousChar = text[text.length - 1]

      return prompt
    },

    submit(promptId, received) {
      if (activePrompt === undefined || activePrompt.id !== promptId) {
        throw new Error('promptId is not the active prompt id')
      }

      const prompt = activePrompt
      const normalizedReceived = received.toUpperCase()
      activePrompt = undefined

      // Single character: score the one attempt, classic result shape.
      if (prompt.text.length <= 1) {
        const correct = normalizedReceived === prompt.text
        recordAttempt(prompt.text, correct, stats, resultHistory)
        return {
          correct,
          expected: prompt.text,
          received: normalizedReceived,
          unlocked: maybeUnlockNext(),
        }
      }

      // Group: each position is one attempt for that character, so per-char
      // stats and the unlock window keep working. Whole prompt is correct only
      // when every position matches.
      const perChar: CharResult[] = []
      for (let i = 0; i < prompt.text.length; i += 1) {
        const expected = prompt.text[i]
        const got = normalizedReceived[i] ?? ''
        const positionCorrect = got === expected
        recordAttempt(expected, positionCorrect, stats, resultHistory)
        perChar.push({ expected, received: got, correct: positionCorrect })
      }

      return {
        correct: normalizedReceived === prompt.text,
        expected: prompt.text,
        received: normalizedReceived,
        unlocked: maybeUnlockNext(),
        perChar,
      }
    },

    summary() {
      return summarize(config, stats, unlockedThisSession)
    },
  }

  function unlockedChars(): readonly string[] {
    if (freeCharset.length > 0) {
      return freeCharset
    }

    return KOCH_ORDER.slice(0, unlockedCount)
  }

  function maybeUnlockNext(): string | null {
    if (freeCharset.length > 0) {
      return null
    }

    const newest = KOCH_ORDER[unlockedCount - 1]
    const newestHistory = resultHistory.get(newest) ?? []

    if (
      newestHistory.length < config.unlockWindow ||
      unlockedCount >= KOCH_ORDER.length
    ) {
      return null
    }

    const recentResults = newestHistory.slice(-config.unlockWindow)
    const recentCorrect = recentResults.filter(Boolean).length
    const recentAccuracy = recentCorrect / config.unlockWindow

    if (recentAccuracy < config.unlockAccuracy) {
      return null
    }

    const unlocked = KOCH_ORDER[unlockedCount]
    unlockedCount += 1
    unlockedThisSession.push(unlocked)

    return unlocked
  }
}

function normalizeCharset(charset: readonly string[] | undefined): readonly string[] {
  if (charset === undefined || charset.length === 0) {
    return []
  }

  const seen = new Set<string>()
  const chars: string[] = []
  for (const raw of charset) {
    const char = raw.toUpperCase()
    if (char.length !== 1 || symbolsFor(char) === undefined || seen.has(char)) {
      continue
    }

    seen.add(char)
    chars.push(char)
  }

  return sortByKochOrder(chars)
}

function validateConfig(config: TrainerConfig): void {
  if (
    !Number.isInteger(config.initialUnlockCount) ||
    config.initialUnlockCount < 2 ||
    config.initialUnlockCount > KOCH_ORDER.length
  ) {
    throw new RangeError('initialUnlockCount must be an integer in range')
  }

  if (!Number.isInteger(config.unlockWindow) || config.unlockWindow < 1) {
    throw new RangeError('unlockWindow must be an integer greater than 0')
  }

  if (
    !Number.isFinite(config.unlockAccuracy) ||
    config.unlockAccuracy < 0 ||
    config.unlockAccuracy > 1
  ) {
    throw new RangeError('unlockAccuracy must be in range')
  }

  if (config.promptMode === 'group') {
    const size = config.groupSize ?? 5
    if (!Number.isInteger(size) || size < 1) {
      throw new RangeError('groupSize must be an integer greater than 0')
    }
  }
}

/**
 * Build a group of `size` characters drawn from the unlocked set. Repeats
 * within a group are allowed (real CW groups have them), but a trivially
 * all-identical group is broken up when more than one character is available.
 */
function chooseGroup(
  unlockedChars: readonly string[],
  size: number,
  rng: () => number,
): string {
  const chars: string[] = []
  for (let i = 0; i < size; i += 1) {
    chars.push(unlockedChars[Math.floor(rng() * unlockedChars.length)])
  }

  if (unlockedChars.length > 1 && chars.every((char) => char === chars[0])) {
    const others = unlockedChars.filter((char) => char !== chars[0])
    const pos = Math.floor(rng() * size)
    chars[pos] = others[Math.floor(rng() * others.length)]
  }

  return chars.join('')
}

function choosePromptChar(
  unlockedChars: readonly string[],
  previousChar: string | undefined,
  rng: () => number,
): string {
  const candidates =
    unlockedChars.length > 1 && previousChar !== undefined
      ? unlockedChars.filter((char) => char !== previousChar)
      : unlockedChars
  const index = Math.floor(rng() * candidates.length)

  return candidates[index]
}

function recordAttempt(
  char: string,
  correct: boolean,
  stats: Map<string, MutableCharStat>,
  resultHistory: Map<string, boolean[]>,
): void {
  const stat = stats.get(char) ?? { attempts: 0, correct: 0 }
  stat.attempts += 1
  stat.correct += correct ? 1 : 0
  stats.set(char, stat)

  const history = resultHistory.get(char) ?? []
  history.push(correct)
  resultHistory.set(char, history)
}

function summarize(
  config: TrainerConfig,
  stats: ReadonlyMap<string, MutableCharStat>,
  unlockedThisSession: readonly string[],
): SessionSummary {
  let total = 0
  let correct = 0
  const perChar: CharStat[] = []

  for (const char of sortByKochOrder([...stats.keys()])) {
    const stat = stats.get(char)
    if (stat === undefined || stat.attempts === 0) {
      continue
    }

    total += stat.attempts
    correct += stat.correct
    perChar.push({
      char,
      attempts: stat.attempts,
      correct: stat.correct,
      accuracy: stat.correct / stat.attempts,
    })
  }

  return {
    total,
    correct,
    accuracy: total === 0 ? 0 : correct / total,
    effectiveWpm: config.timing.effectiveWpm,
    perChar,
    unlockedThisSession: [...unlockedThisSession],
  }
}

function sortByKochOrder(chars: readonly string[]): string[] {
  return [...chars].sort((a, b) => charOrder(a) - charOrder(b))
}

function charOrder(char: string): number {
  const index = KOCH_ORDER.indexOf(char as (typeof KOCH_ORDER)[number])
  return index === -1 ? KOCH_ORDER.length : index
}
