import { KOCH_ORDER } from '../morse'
import { createRng } from './rng'
import type {
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
      const char = choosePromptChar(unlockedChars(), previousChar, rng)
      const prompt = {
        id: String(nextPromptId),
        text: char,
      }

      nextPromptId += 1
      activePrompt = prompt
      previousChar = char

      return prompt
    },

    submit(promptId, received) {
      if (activePrompt === undefined || activePrompt.id !== promptId) {
        throw new Error('promptId is not the active prompt id')
      }

      const prompt = activePrompt
      const normalizedReceived = received.toUpperCase()
      const correct = normalizedReceived === prompt.text

      recordAttempt(prompt.text, correct, stats, resultHistory)
      const unlocked = maybeUnlockNext()
      activePrompt = undefined

      return {
        correct,
        expected: prompt.text,
        received: normalizedReceived,
        unlocked,
      }
    },

    summary() {
      return summarize(config, stats, unlockedThisSession)
    },
  }

  function unlockedChars(): readonly string[] {
    return KOCH_ORDER.slice(0, unlockedCount)
  }

  function maybeUnlockNext(): string | null {
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

  for (const char of KOCH_ORDER) {
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
