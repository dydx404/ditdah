import { describe, it, expect } from 'vitest'
import { buildSchedule } from './schedule'
import type { KeyingElement } from '../morse/types'

// "K" at 20 WPM standard timing: dah(180) gap(60) dit(60) gap(60) dah(180) ms.
const K: KeyingElement[] = [
  { on: true, ms: 180 },
  { on: false, ms: 60 },
  { on: true, ms: 60 },
  { on: false, ms: 60 },
  { on: true, ms: 180 },
]

describe('buildSchedule', () => {
  it('emits one window per on-element, at absolute times from startSec', () => {
    const { windows } = buildSchedule(K, 1)
    expect(windows).toEqual([
      { startSec: 1, endSec: 1.18 },
      { startSec: 1.24, endSec: 1.3 },
      { startSec: 1.36, endSec: 1.54 },
    ])
  })

  it('off elements advance the clock but emit no window', () => {
    const { windows, endSec } = buildSchedule(K, 0)
    expect(windows).toHaveLength(3)
    // total = 180+60+60+60+180 = 540ms
    expect(endSec).toBeCloseTo(0.54, 10)
  })

  it('handles an empty sequence', () => {
    const { windows, endSec } = buildSchedule([], 2)
    expect(windows).toEqual([])
    expect(endSec).toBe(2)
  })

  it('endSec includes trailing silence', () => {
    const els: KeyingElement[] = [
      { on: true, ms: 100 },
      { on: false, ms: 700 }, // e.g. a trailing word gap
    ]
    const { windows, endSec } = buildSchedule(els, 0)
    expect(windows).toEqual([{ startSec: 0, endSec: 0.1 }])
    expect(endSec).toBeCloseTo(0.8, 10)
  })

  it('windows never overlap and are monotonic', () => {
    const { windows } = buildSchedule(K, 0)
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i].startSec).toBeGreaterThanOrEqual(windows[i - 1].endSec)
      expect(windows[i].endSec).toBeGreaterThan(windows[i].startSec)
    }
  })
})
