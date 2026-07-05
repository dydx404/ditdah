import { describe, expect, it } from 'vitest'
import { KOCH_ORDER } from '../morse'
import { createTrainer } from './trainer'
import type { Trainer, TrainerConfig } from './types'

const baseConfig = {
  timing: {
    charWpm: 20,
    effectiveWpm: 10,
    toneHz: 600,
  },
  initialUnlockCount: 2,
  unlockAccuracy: 1,
  unlockWindow: 3,
  seed: 42,
} satisfies TrainerConfig

describe('createTrainer', () => {
  it('starts with the configured Koch characters unlocked', () => {
    const trainer = createTrainer(baseConfig)

    expect(trainer.unlockedChars()).toEqual(['K', 'M'])
  })

  it('guards invalid configuration', () => {
    expect(() =>
      createTrainer({ ...baseConfig, initialUnlockCount: 1 }),
    ).toThrow(RangeError)
    expect(() =>
      createTrainer({
        ...baseConfig,
        initialUnlockCount: KOCH_ORDER.length + 1,
      }),
    ).toThrow(RangeError)
    expect(() =>
      createTrainer({ ...baseConfig, unlockWindow: 0 }),
    ).toThrow(RangeError)
    expect(() =>
      createTrainer({ ...baseConfig, unlockAccuracy: 1.5 }),
    ).toThrow(RangeError)
  })

  it('produces prompts within the unlocked set with unique ids', () => {
    const trainer = createTrainer(baseConfig)
    const ids = new Set<string>()

    for (let count = 0; count < 20; count += 1) {
      const prompt = trainer.nextPrompt()

      expect(trainer.unlockedChars()).toContain(prompt.text)
      expect(ids.has(prompt.id)).toBe(false)
      ids.add(prompt.id)
    }
  })

  it('is deterministic for the same seed', () => {
    expect(promptTexts(createTrainer(baseConfig), 20)).toEqual(
      promptTexts(createTrainer(baseConfig), 20),
    )
  })

  it('avoids immediate repeats when more than one character is unlocked', () => {
    const texts = promptTexts(createTrainer(baseConfig), 50)

    for (let index = 1; index < texts.length; index += 1) {
      expect(texts[index]).not.toBe(texts[index - 1])
    }
  })

  it('throws when submitting the wrong id or the same id twice', () => {
    const trainer = createTrainer(baseConfig)
    const prompt = trainer.nextPrompt()

    expect(() => trainer.submit('wrong-id', prompt.text)).toThrow(Error)
    expect(trainer.submit(prompt.id, prompt.text).correct).toBe(true)
    expect(() => trainer.submit(prompt.id, prompt.text)).toThrow(Error)
  })

  it('scores answers case-insensitively', () => {
    const trainer = createTrainer({ ...baseConfig, seed: 1 })
    const prompt = promptUntil(trainer, 'K')

    expect(trainer.submit(prompt.id, 'k')).toEqual({
      correct: true,
      expected: 'K',
      received: 'K',
      unlocked: null,
    })
  })

  it('unlocks the next Koch character after the newest character passes the window', () => {
    const trainer = createTrainer(baseConfig)
    const unlockedResults: string[] = []
    let mAttempts = 0

    while (unlockedResults.length === 0) {
      const prompt = trainer.nextPrompt()
      const result = trainer.submit(prompt.id, prompt.text)

      if (prompt.text === 'M') {
        mAttempts += 1
      }
      if (result.unlocked !== null) {
        unlockedResults.push(result.unlocked)
      }
    }

    expect(mAttempts).toBe(3)
    expect(unlockedResults).toEqual(['U'])
    expect(trainer.unlockedChars()).toEqual(['K', 'M', 'U'])
  })

  it('does not unlock when the newest character fails the window', () => {
    const trainer = createTrainer(baseConfig)

    for (let count = 0; count < 30; count += 1) {
      const prompt = trainer.nextPrompt()
      const result = trainer.submit(prompt.id, '')

      expect(result.unlocked).toBeNull()
    }

    expect(trainer.unlockedChars()).toHaveLength(2)
  })

  it('summarizes session totals and attempted characters in Koch order', () => {
    const trainer = createTrainer(baseConfig)
    const first = trainer.nextPrompt()
    expect(first.text).toBe('M')
    trainer.submit(first.id, first.text)

    const second = trainer.nextPrompt()
    expect(second.text).toBe('K')
    trainer.submit(second.id, 'wrong')

    const third = trainer.nextPrompt()
    expect(third.text).toBe('M')
    trainer.submit(third.id, third.text.toLowerCase())

    expect(trainer.summary()).toEqual({
      total: 3,
      correct: 2,
      accuracy: 2 / 3,
      effectiveWpm: 10,
      perChar: [
        {
          char: 'K',
          attempts: 1,
          correct: 0,
          accuracy: 0,
        },
        {
          char: 'M',
          attempts: 2,
          correct: 2,
          accuracy: 1,
        },
      ],
      unlockedThisSession: [],
    })
  })
})

describe('createTrainer — group mode', () => {
  const groupConfig = {
    ...baseConfig,
    promptMode: 'group',
    groupSize: 5,
  } satisfies TrainerConfig

  it('defaults to single-character prompts (backward compatible)', () => {
    const trainer = createTrainer(baseConfig)
    expect(trainer.nextPrompt().text).toHaveLength(1)
  })

  it('produces groups of groupSize from the unlocked set only', () => {
    const trainer = createTrainer(groupConfig)
    for (const text of promptTexts(trainer, 20)) {
      expect(text).toHaveLength(5)
      expect([...text].every((c) => c === 'K' || c === 'M')).toBe(true)
    }
  })

  it('validates groupSize', () => {
    expect(() =>
      createTrainer({ ...groupConfig, groupSize: 0 }),
    ).toThrow(RangeError)
  })

  it('scores each position, with per-char breakdown and whole-group correct', () => {
    const trainer = createTrainer(groupConfig)
    const prompt = trainer.nextPrompt() // e.g. "KMKMK"
    const wrong = swapFirst(prompt.text) // one position off

    const result = trainer.submit(prompt.id, wrong)

    expect(result.correct).toBe(false) // not every position matched
    expect(result.perChar).toHaveLength(5)
    expect(result.perChar?.filter((c) => c.correct)).toHaveLength(4)
    expect(result.perChar?.[0].correct).toBe(false)
  })

  it('counts every position as an attempt for its character', () => {
    const trainer = createTrainer(groupConfig)
    const prompt = trainer.nextPrompt()
    trainer.submit(prompt.id, prompt.text) // all correct

    const totalAttempts = trainer
      .summary()
      .perChar.reduce((n, c) => n + c.attempts, 0)
    expect(totalAttempts).toBe(5)
  })

  it('marks missing trailing characters as incorrect', () => {
    const trainer = createTrainer(groupConfig)
    const prompt = trainer.nextPrompt()

    const result = trainer.submit(prompt.id, prompt.text.slice(0, 2))

    expect(result.correct).toBe(false)
    expect(result.perChar?.slice(2).every((c) => !c.correct && c.received === '')).toBe(
      true,
    )
  })
})

describe('createTrainer — free training charset', () => {
  it('normalizes charset by uppercasing, deduping, filtering, and Koch-ordering', () => {
    const trainer = createTrainer({
      ...baseConfig,
      charset: ['s', 'K', 'M', 's', '~', ' ', 'E'],
    })

    expect(trainer.unlockedChars()).toEqual(['K', 'M', 'E', 'S'])
  })

  it('draws single-character prompts only from the configured charset', () => {
    const trainer = createTrainer({
      ...baseConfig,
      charset: ['E', 'T', '5'],
    })
    const allowed = new Set(trainer.unlockedChars())

    for (const text of promptTexts(trainer, 40)) {
      expect(allowed.has(text)).toBe(true)
    }
  })

  it('does not unlock additional Koch characters in charset mode', () => {
    const trainer = createTrainer({
      ...baseConfig,
      charset: ['M'],
    })

    for (let count = 0; count < 10; count += 1) {
      const prompt = trainer.nextPrompt()
      const result = trainer.submit(prompt.id, prompt.text)

      expect(result.unlocked).toBeNull()
      expect(trainer.unlockedChars()).toEqual(['M'])
    }

    expect(trainer.summary().unlockedThisSession).toEqual([])
  })

  it('produces group prompts from the configured charset', () => {
    const trainer = createTrainer({
      ...baseConfig,
      promptMode: 'group',
      groupSize: 6,
      charset: ['E', 'T'],
    })
    const prompt = trainer.nextPrompt()

    expect(prompt.text).toHaveLength(6)
    expect([...prompt.text].every((char) => char === 'E' || char === 'T')).toBe(
      true,
    )

    const result = trainer.submit(prompt.id, prompt.text)
    expect(result.correct).toBe(true)
    expect(result.unlocked).toBeNull()
    expect(result.perChar).toHaveLength(6)
  })

  it('keeps Koch behavior when charset is empty or unsupported-only', () => {
    expect(promptTexts(createTrainer({ ...baseConfig, charset: [] }), 20)).toEqual(
      promptTexts(createTrainer(baseConfig), 20),
    )
    expect(
      promptTexts(createTrainer({ ...baseConfig, charset: ['~', ' '] }), 20),
    ).toEqual(promptTexts(createTrainer(baseConfig), 20))
  })
})

describe('createTrainer — prompt pool', () => {
  it('draws whole prompts from the pool and avoids immediate repeats', () => {
    const trainer = createTrainer({
      ...baseConfig,
      promptPool: ['cq', '73', 'rst'],
    })
    const texts = promptTexts(trainer, 50)

    expect(new Set(texts)).toEqual(new Set(['CQ', '73', 'RST']))
    for (let index = 1; index < texts.length; index += 1) {
      expect(texts[index]).not.toBe(texts[index - 1])
    }
  })

  it('scores prompt-pool entries per position', () => {
    const trainer = createTrainer({
      ...baseConfig,
      promptPool: ['KM'],
    })
    const prompt = trainer.nextPrompt()

    const result = trainer.submit(prompt.id, 'KX')

    expect(result).toMatchObject({
      correct: false,
      expected: 'KM',
      received: 'KX',
      unlocked: null,
      perChar: [
        { expected: 'K', received: 'K', correct: true },
        { expected: 'M', received: 'X', correct: false },
      ],
    })
    expect(trainer.summary().perChar).toEqual([
      { char: 'K', attempts: 1, correct: 1, accuracy: 1 },
      { char: 'M', attempts: 1, correct: 0, accuracy: 0 },
    ])
  })

  it('does not unlock Koch characters in prompt-pool mode', () => {
    const trainer = createTrainer({
      ...baseConfig,
      promptPool: ['M'],
    })

    for (let count = 0; count < 10; count += 1) {
      const prompt = trainer.nextPrompt()
      const result = trainer.submit(prompt.id, prompt.text)

      expect(result.unlocked).toBeNull()
      expect(result.perChar).toEqual([
        { expected: 'M', received: 'M', correct: true },
      ])
    }

    expect(trainer.unlockedChars()).toEqual(['M'])
    expect(trainer.summary().unlockedThisSession).toEqual([])
  })

  it('returns distinct prompt-pool characters in Koch order for the keypad', () => {
    const trainer = createTrainer({
      ...baseConfig,
      promptPool: ['A5', 'SK', 'A'],
    })

    expect(trainer.unlockedChars()).toEqual(['K', 'S', 'A', '5'])
  })

  it('lets promptPool take precedence over charset and group generation', () => {
    const trainer = createTrainer({
      ...baseConfig,
      promptMode: 'group',
      groupSize: 6,
      charset: ['E'],
      promptPool: ['KM'],
    })

    expect(trainer.nextPrompt().text).toBe('KM')
  })

  it('keeps existing behavior when promptPool is absent, empty, or invalid', () => {
    expect(promptTexts(createTrainer({ ...baseConfig, promptPool: [] }), 20)).toEqual(
      promptTexts(createTrainer(baseConfig), 20),
    )
    expect(
      promptTexts(createTrainer({ ...baseConfig, promptPool: ['~', ' '] }), 20),
    ).toEqual(promptTexts(createTrainer(baseConfig), 20))
  })
})

/** Flip the first character to the other unlocked one (K<->M). */
function swapFirst(text: string): string {
  const other = text[0] === 'K' ? 'M' : 'K'
  return other + text.slice(1)
}

function promptTexts(trainer: Trainer, count: number): string[] {
  return Array.from({ length: count }, () => trainer.nextPrompt().text)
}

function promptUntil(trainer: Trainer, text: string) {
  for (let count = 0; count < 20; count += 1) {
    const prompt = trainer.nextPrompt()
    if (prompt.text === text) {
      return prompt
    }
  }

  throw new Error(`Expected prompt ${text}`)
}
