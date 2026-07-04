// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTrainerSession } from './useTrainerSession'
import { createTrainer } from '@/core/trainer'
import type { ToneEngine, PlayHandle } from '@/core/audio/types'
import type { TimingConfig } from '@/core/morse/types'
import type { AnswerResult, Trainer } from '@/core/trainer/types'

const timing: TimingConfig = { charWpm: 20, effectiveWpm: 10, toneHz: 600 }

function makeFakeEngine() {
  const calls = { play: 0, resume: 0, stop: 0 }
  const engine: ToneEngine = {
    resume: () => {
      calls.resume += 1
      return Promise.resolve()
    },
    play: (): PlayHandle => {
      calls.play += 1
      return { done: Promise.resolve(), stop: () => {} }
    },
    stop: () => {
      calls.stop += 1
    },
    setVolume: () => {},
    dispose: () => {},
  }
  return { engine, calls }
}

/**
 * A controllable trainer whose prompt is always `fixedChar`, so a test can press
 * a known-correct (or known-wrong) key without peeking at the hidden prompt.
 * Keeps the state-machine tests independent of trainer/RNG internals.
 */
function makeFakeTrainer(fixedChar = 'K'): Trainer {
  const stats = new Map<string, { attempts: number; correct: number }>()
  let total = 0
  let correct = 0
  let counter = 0
  return {
    unlockedChars: () => [fixedChar, 'M'],
    nextPrompt: () => ({ id: `p${counter++}`, text: fixedChar }),
    submit: (_id, received) => {
      const isCorrect = received.toUpperCase() === fixedChar
      total += 1
      if (isCorrect) correct += 1
      const s = stats.get(fixedChar) ?? { attempts: 0, correct: 0 }
      stats.set(fixedChar, {
        attempts: s.attempts + 1,
        correct: s.correct + (isCorrect ? 1 : 0),
      })
      return {
        correct: isCorrect,
        expected: fixedChar,
        received: received.toUpperCase(),
        unlocked: null,
      }
    },
    summary: () => ({
      total,
      correct,
      accuracy: total ? correct / total : 0,
      effectiveWpm: timing.effectiveWpm,
      perChar: [...stats.entries()].map(([char, s]) => ({
        char,
        attempts: s.attempts,
        correct: s.correct,
        accuracy: s.attempts ? s.correct / s.attempts : 0,
      })),
      unlockedThisSession: [],
    }),
  }
}

function realTrainer(): Trainer {
  return createTrainer({
    timing,
    initialUnlockCount: 2,
    unlockAccuracy: 0.9,
    unlockWindow: 5,
    seed: 1,
  })
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  })
}

interface SetupOptions {
  trainer?: Trainer
  roundLength?: number
  onAnswered?: (r: AnswerResult) => void
  onRoundComplete?: (r: unknown) => void
}

describe('useTrainerSession', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const setup = (opts: SetupOptions = {}) => {
    const { engine, calls } = makeFakeEngine()
    const trainer = opts.trainer ?? realTrainer()
    const view = renderHook(() =>
      useTrainerSession({
        trainer,
        engine,
        timing,
        roundLength: opts.roundLength,
        correctHoldMs: 100,
        onAnswered: opts.onAnswered,
        onRoundComplete: opts.onRoundComplete as never,
      }),
    )
    return { engine, calls, trainer, view }
  }

  it('starts idle, then plays a tone on start', async () => {
    const { calls, view } = setup()
    expect(view.result.current.phase).toBe('idle')

    await act(async () => {
      view.result.current.start()
    })

    expect(calls.resume).toBe(1)
    expect(view.result.current.phase).toBe('listening')
    expect(calls.play).toBe(1) // played the first prompt
  })

  it('a correct answer moves to feedback, scores, then auto-advances', async () => {
    const { calls, view } = setup({ trainer: makeFakeTrainer('K') })
    await act(async () => view.result.current.start())

    const playsBefore = calls.play
    press('K') // the fake trainer's prompt is always K

    expect(view.result.current.phase).toBe('feedback')
    expect(view.result.current.lastResult?.correct).toBe(true)
    expect(view.result.current.summary.total).toBe(1)

    // hold elapses -> next prompt plays, back to listening
    act(() => vi.advanceTimersByTime(120))
    expect(view.result.current.phase).toBe('listening')
    expect(calls.play).toBeGreaterThan(playsBefore)
  })

  it('fires onAnswered once per scored answer (the persistence seam)', async () => {
    const results: AnswerResult[] = []
    const { view } = setup({
      trainer: makeFakeTrainer('K'),
      onAnswered: (r) => results.push(r),
    })
    await act(async () => view.result.current.start())

    press('K')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ expected: 'K', correct: true })

    act(() => vi.advanceTimersByTime(120)) // advance to next prompt
    press('K')
    expect(results).toHaveLength(2)
  })

  it('does not accept a second answer during the correct-answer flash', async () => {
    const { view } = setup({ trainer: makeFakeTrainer('K') })
    await act(async () => view.result.current.start())

    press('K')
    expect(view.result.current.phase).toBe('feedback')
    expect(view.result.current.summary.total).toBe(1)
    press('K') // ignored: no key capture during feedback
    expect(view.result.current.summary.total).toBe(1)
  })

  it('replay re-plays the current character without scoring', async () => {
    const { calls, view } = setup()
    await act(async () => view.result.current.start())

    const before = calls.play
    act(() => view.result.current.replay())
    expect(calls.play).toBe(before + 1)
    expect(view.result.current.summary.total).toBe(0) // replay is not an answer
  })

  it('reveals the correct character on a miss', async () => {
    const { view } = setup()
    await act(async () => view.result.current.start())

    // Answer with a key that cannot be the prompt (prompt is K or M).
    press('.')
    const r = view.result.current.lastResult
    expect(r?.correct).toBe(false)
    expect(view.result.current.reveal).toBe(r?.expected)
  })

  it('gates on a miss: never auto-advances until the char is echoed', async () => {
    const { view } = setup({ roundLength: 5 })
    await act(async () => view.result.current.start())

    press('.') // wrong
    expect(view.result.current.phase).toBe('retry')

    // A miss must NOT auto-advance, however long we wait.
    act(() => vi.advanceTimersByTime(5000))
    expect(view.result.current.phase).toBe('retry')

    const expected = view.result.current.reveal as string
    const wrongEcho = expected === 'K' ? 'M' : 'K'
    press(wrongEcho) // still not the character -> keeps gating
    expect(view.result.current.phase).toBe('retry')

    press(expected) // correct echo -> success flash -> advance
    expect(view.result.current.phase).toBe('feedback')
    act(() => vi.advanceTimersByTime(200))
    expect(view.result.current.phase).toBe('listening')
  })

  it('a missed prompt is scored once; the echo is not re-scored', async () => {
    const results: AnswerResult[] = []
    const { view } = setup({ roundLength: 1, onAnswered: (r) => results.push(r) })
    await act(async () => view.result.current.start())

    press('.') // miss -> retry (this is the score)
    expect(view.result.current.summary.total).toBe(1)
    expect(results).toHaveLength(1)

    const expected = view.result.current.reveal as string
    press(expected) // echo -> not scored, not another onAnswered
    expect(view.result.current.summary.total).toBe(1)
    expect(results).toHaveLength(1)

    act(() => vi.advanceTimersByTime(200)) // last prompt of round -> summary
    expect(view.result.current.phase).toBe('summary')
    expect(view.result.current.roundSummary?.total).toBe(1)
  })

  it('ends the round after roundLength prompts and shows a summary', async () => {
    const { view } = setup({ trainer: makeFakeTrainer('K'), roundLength: 2 })
    await act(async () => view.result.current.start())

    press('K') // answer 1
    act(() => vi.advanceTimersByTime(120)) // -> next prompt
    expect(view.result.current.phase).toBe('listening')

    press('K') // answer 2 (last of the round)
    act(() => vi.advanceTimersByTime(120)) // -> summary, not another prompt

    expect(view.result.current.phase).toBe('summary')
    const s = view.result.current.roundSummary
    expect(s?.total).toBe(2)
    expect(s?.perChar.reduce((n, c) => n + c.attempts, 0)).toBe(2)
  })

  it('starts a fresh round on again()', async () => {
    const { view } = setup({ trainer: makeFakeTrainer('K'), roundLength: 1 })
    await act(async () => view.result.current.start())

    press('K')
    act(() => vi.advanceTimersByTime(120))
    expect(view.result.current.phase).toBe('summary')

    act(() => view.result.current.again())
    expect(view.result.current.phase).toBe('listening')
    expect(view.result.current.roundSummary).toBeNull()
  })

  it('answer() scores like a keypress (tap input path)', async () => {
    const { view } = setup({ trainer: makeFakeTrainer('K') })
    await act(async () => view.result.current.start())

    act(() => view.result.current.answer('K'))
    expect(view.result.current.phase).toBe('feedback')
    expect(view.result.current.summary.total).toBe(1)
  })

  it('retryAnswer() echoes to clear the gate (tap input path)', async () => {
    const { view } = setup({ trainer: makeFakeTrainer('K') })
    await act(async () => view.result.current.start())

    act(() => view.result.current.answer('.')) // miss -> retry
    expect(view.result.current.phase).toBe('retry')

    act(() => view.result.current.retryAnswer('K')) // echo the revealed char
    expect(view.result.current.phase).toBe('feedback')
  })

  it('fires onRoundComplete once with the round summary', async () => {
    const onRoundComplete = vi.fn()
    const { view } = setup({
      trainer: makeFakeTrainer('K'),
      roundLength: 1,
      onRoundComplete,
    })

    await act(async () => view.result.current.start())
    act(() => view.result.current.answer('K'))
    act(() => vi.advanceTimersByTime(120))

    expect(onRoundComplete).toHaveBeenCalledOnce()
    expect(onRoundComplete.mock.calls[0][0]).toMatchObject({ total: 1 })
  })
})
