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

describe('renderToElements prosigns', () => {
  const timing: TimingConfig = { charWpm: 20, effectiveWpm: 20, toneHz: 600 }

  it('keys a prosign run together with only intra-character gaps', () => {
    const elements = renderToElements('<SK>', timing)

    // SK = ...-.- : six tones, and every gap inside must be a 1-unit (60ms)
    // intra-character gap — never the 3-unit inter-character gap of "S K".
    expect(elements.filter((element) => element.on)).toHaveLength(6)
    expect(offDurations(elements).every((ms) => ms === 60)).toBe(true)
  })

  it('is not the same as sending the two letters separately', () => {
    expect(renderToElements('<SK>', timing)).not.toEqual(
      renderToElements('SK', timing),
    )
    // "S K" has a 3-unit inter-character gap; the prosign does not.
    expect(offDurations(renderToElements('SK', timing))).toContain(180)
    expect(offDurations(renderToElements('<SK>', timing))).not.toContain(180)
  })

  it('separates a prosign from neighbours with a normal inter-character gap', () => {
    const elements = renderToElements('K<SK>', timing)
    // gap after K's three elements, before the prosign, is the 3-unit gap.
    expect(elements[5]).toEqual({ on: false, ms: 180 })
  })

  it('skips unknown or malformed prosign tokens as if absent', () => {
    expect(renderToElements('K<XY>M', timing)).toEqual(
      renderToElements('KM', timing),
    )
    // A stray '<' with no closing '>' is skipped; the letters after it still key.
    expect(renderToElements('K<SK', timing)).toEqual(
      renderToElements('KSK', timing),
    )
  })
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
