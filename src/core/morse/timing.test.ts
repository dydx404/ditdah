import { describe, expect, it } from 'vitest'
import { ditMs, renderToElements } from './timing'
import type { KeyingElement, TimingConfig } from './types'

describe('ditMs', () => {
  it('returns the standard dit duration at character speed', () => {
    expect(ditMs(20)).toBe(60)
  })
})

describe('renderToElements', () => {
  it('renders a single character at standard timing', () => {
    expect(
      renderToElements('K', {
        charWpm: 20,
        effectiveWpm: 20,
        toneHz: 600,
      }),
    ).toEqual([
      { on: true, ms: 180 },
      { on: false, ms: 60 },
      { on: true, ms: 60 },
      { on: false, ms: 60 },
      { on: true, ms: 180 },
    ])
  })

  it('starts and ends on tone and emits only positive durations', () => {
    const elements = renderToElements('  K ~ M  ', {
      charWpm: 20,
      effectiveWpm: 20,
      toneHz: 600,
    })

    expect(elements.at(0)?.on).toBe(true)
    expect(elements.at(-1)?.on).toBe(true)
    expect(elements.every((element) => element.ms > 0)).toBe(true)
  })

  it('skips unsupported characters as if absent', () => {
    const timing = {
      charWpm: 20,
      effectiveWpm: 20,
      toneHz: 600,
    }

    expect(renderToElements('K~M', timing)).toEqual(
      renderToElements('KM', timing),
    )
    expect(renderToElements('K ~ M', timing)).toEqual(
      renderToElements('K M', timing),
    )
  })

  it('stretches inter-character gaps while keeping intra-character gaps fixed', () => {
    const elements = renderToElements('KM', {
      charWpm: 20,
      effectiveWpm: 10,
      toneHz: 600,
    })

    expect(elements[1]).toEqual({ on: false, ms: 60 })
    expect(elements[5]).toMatchObject({ on: false })
    expect(elements[5]?.ms).toBeCloseTo(653.68, 2)
  })

  it('collapses whitespace runs into one word gap without leading or trailing silence', () => {
    const elements = renderToElements(' \tK  \n~ M\r ', {
      charWpm: 20,
      effectiveWpm: 20,
      toneHz: 600,
    })

    expect(offDurations(elements)).toEqual([60, 60, 420, 60])
    expect(elements.at(0)?.on).toBe(true)
    expect(elements.at(-1)?.on).toBe(true)
  })

  it.each([
    { charWpm: 20, effectiveWpm: 20, toneHz: 600 },
    { charWpm: 20, effectiveWpm: 10, toneHz: 600 },
    { charWpm: 25, effectiveWpm: 15, toneHz: 600 },
  ])(
    'keeps PARIS plus trailing word gap at the effective WPM for $charWpm/$effectiveWpm',
    (timing) => {
      const elements = renderToElements('PARIS', timing)
      const totalMs = totalDuration(elements) + trailingWordGapMs(timing)

      expect(totalMs).toBeCloseTo(60000 / timing.effectiveWpm, 8)
    },
  )
})

function totalDuration(elements: readonly KeyingElement[]): number {
  return elements.reduce((total, element) => total + element.ms, 0)
}

function offDurations(elements: readonly KeyingElement[]): number[] {
  return elements
    .filter((element) => !element.on)
    .map((element) => Math.round(element.ms))
}

function trailingWordGapMs(timing: TimingConfig): number {
  if (timing.effectiveWpm >= timing.charWpm) {
    return 7 * ditMs(timing.charWpm)
  }

  return (
    7 * ((60000 / timing.effectiveWpm - 37200 / timing.charWpm) / 19)
  )
}
