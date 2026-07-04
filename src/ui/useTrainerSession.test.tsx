// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useTrainerSession } from './useTrainerSession'
import { createTrainer } from '@/core/trainer'
import type { ToneEngine, PlayHandle } from '@/core/audio/types'
import type { TimingConfig } from '@/core/morse/types'

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

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  })
}

describe('useTrainerSession', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const setup = (onAnswered?: (r: unknown) => void, roundLength?: number) => {
    const { engine, calls } = makeFakeEngine()
    const trainer = createTrainer({
      timing,
      initialUnlockCount: 2,
      unlockAccuracy: 0.9,
      unlockWindow: 5,
      seed: 1,
    })
    const view = renderHook(() =>
      useTrainerSession({
        trainer,
        engine,
        timing,
        roundLength,
        correctHoldMs: 100,
        wrongHoldMs: 100,
        onAnswered: onAnswered as never,
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

  it('answering moves to feedback, scores, then auto-advances to the next prompt', async () => {
    const { calls, view } = setup()
    await act(async () => view.result.current.start())

    const playsBefore = calls.play
    press('K') // whatever the prompt was, this is a valid answer key

    expect(view.result.current.phase).toBe('feedback')
    expect(view.result.current.lastResult).not.toBeNull()
    expect(view.result.current.summary.total).toBe(1)

    // hold elapses -> next prompt plays, back to listening
    act(() => vi.advanceTimersByTime(120))
    expect(view.result.current.phase).toBe('listening')
    expect(calls.play).toBeGreaterThan(playsBefore)
  })

  it('fires onAnswered once per scored answer (the persistence seam)', async () => {
    const results: unknown[] = []
    const { view } = setup((r) => results.push(r))
    await act(async () => view.result.current.start())

    press('K')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ expected: expect.any(String) })

    act(() => vi.advanceTimersByTime(120)) // advance to next prompt
    press('M')
    expect(results).toHaveLength(2)
  })

  it('does not accept a second answer during feedback (no typing ahead)', async () => {
    const { view } = setup()
    await act(async () => view.result.current.start())

    press('K')
    expect(view.result.current.summary.total).toBe(1)
    press('M') // ignored: listener is detached during feedback
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

  it('ends the round after roundLength prompts and shows a summary', async () => {
    const { view } = setup(undefined, 2) // 2-prompt round
    await act(async () => view.result.current.start())

    press('K') // answer 1
    act(() => vi.advanceTimersByTime(120)) // -> next prompt
    expect(view.result.current.phase).toBe('listening')

    press('M') // answer 2 (last of the round)
    act(() => vi.advanceTimersByTime(120)) // -> summary, not another prompt

    expect(view.result.current.phase).toBe('summary')
    const s = view.result.current.roundSummary
    expect(s?.total).toBe(2)
    expect(s?.perChar.reduce((n, c) => n + c.attempts, 0)).toBe(2)
  })

  it('starts a fresh round on again()', async () => {
    const { view } = setup(undefined, 1) // 1-prompt round
    await act(async () => view.result.current.start())

    press('K')
    act(() => vi.advanceTimersByTime(120))
    expect(view.result.current.phase).toBe('summary')

    act(() => view.result.current.again())
    expect(view.result.current.phase).toBe('listening')
    expect(view.result.current.roundSummary).toBeNull()
  })
})
