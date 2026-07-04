/**
 * TEMPORARY dev stub — delete when #5 (core/trainer) merges.
 *
 * A minimal implementation of the frozen `Trainer` contract so the UI loop can
 * be built and run before the real trainer exists. Behavior is intentionally
 * simple (uniform random over the unlocked set, no-immediate-repeat, unlock the
 * next Koch char after `unlockWindow` correct on the newest char). The UI
 * depends only on the `Trainer` interface, so swapping this for
 * `createTrainer` from `@/core/trainer` is a one-line change in the app root.
 */
import { KOCH_ORDER } from '@/core/morse'
import type {
  AnswerResult,
  CharStat,
  Prompt,
  SessionSummary,
  Trainer,
  TrainerConfig,
} from '@/core/trainer/types'

interface Stat {
  attempts: number
  correct: number
  recent: boolean[]
}

export function createStubTrainer(config: TrainerConfig): Trainer {
  let unlockedCount = config.initialUnlockCount
  const stats = new Map<string, Stat>()
  const unlockedThisSession: string[] = []
  let prevChar: string | null = null
  let active: { id: string; char: string } | null = null
  let counter = 0
  // Tiny LCG so the stub is deterministic-ish; the real trainer uses a proper RNG.
  let seed = config.seed >>> 0

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x100000000
  }
  const unlocked = () => KOCH_ORDER.slice(0, unlockedCount)
  const statFor = (c: string): Stat => {
    let s = stats.get(c)
    if (!s) {
      s = { attempts: 0, correct: 0, recent: [] }
      stats.set(c, s)
    }
    return s
  }

  return {
    unlockedChars: () => unlocked(),

    nextPrompt(): Prompt {
      const pool = unlocked()
      const choices =
        pool.length > 1 ? pool.filter((c) => c !== prevChar) : pool
      const char = choices[Math.floor(rand() * choices.length)]
      prevChar = char
      active = { id: String(++counter), char }
      return { id: active.id, text: char }
    },

    submit(promptId: string, received: string): AnswerResult {
      if (!active || active.id !== promptId) {
        throw new Error('submit called with a stale or unknown prompt id')
      }
      const expected = active.char
      const norm = received.toUpperCase()
      const correct = norm === expected
      const s = statFor(expected)
      s.attempts += 1
      if (correct) s.correct += 1
      s.recent.push(correct)
      if (s.recent.length > config.unlockWindow) s.recent.shift()

      let unlocked: string | null = null
      const newest = KOCH_ORDER[unlockedCount - 1]
      const ns = statFor(newest)
      if (
        unlockedCount < KOCH_ORDER.length &&
        ns.recent.length >= config.unlockWindow &&
        ns.recent.filter(Boolean).length / ns.recent.length >=
          config.unlockAccuracy
      ) {
        unlockedCount += 1
        unlocked = KOCH_ORDER[unlockedCount - 1]
        unlockedThisSession.push(unlocked)
      }

      active = null
      return { correct, expected, received: norm, unlocked }
    },

    summary(): SessionSummary {
      const perChar: CharStat[] = KOCH_ORDER.filter((c) =>
        stats.has(c),
      ).map((c) => {
        const s = statFor(c)
        return {
          char: c,
          attempts: s.attempts,
          correct: s.correct,
          accuracy: s.attempts ? s.correct / s.attempts : 0,
        }
      })
      const total = perChar.reduce((n, c) => n + c.attempts, 0)
      const correct = perChar.reduce((n, c) => n + c.correct, 0)
      return {
        total,
        correct,
        accuracy: total ? correct / total : 0,
        effectiveWpm: config.timing.effectiveWpm,
        perChar,
        unlockedThisSession: [...unlockedThisSession],
      }
    },
  }
}
