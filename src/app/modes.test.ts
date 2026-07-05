import { describe, expect, it } from 'vitest'
import { PRACTICE_MODES, activeModeId } from './modes'

describe('practice modes', () => {
  it('exposes the built modes plus greyed "soon" placeholders', () => {
    const ids = PRACTICE_MODES.map((m) => m.id)
    expect(ids).toContain('learn')
    expect(ids).toContain('groups')
    expect(ids).toContain('free')
    expect(PRACTICE_MODES.filter((m) => m.available).map((m) => m.id)).toEqual([
      'learn',
      'groups',
      'free',
    ])
    // Unavailable modes have no settings to apply (nothing to select yet).
    for (const mode of PRACTICE_MODES) {
      if (!mode.available) expect(mode.apply).toBeUndefined()
    }
  })

  it('maps prompt mode to the active block', () => {
    expect(activeModeId({ promptMode: 'single', charSource: 'koch' })).toBe(
      'learn',
    )
    expect(activeModeId({ promptMode: 'group', charSource: 'koch' })).toBe(
      'groups',
    )
    expect(activeModeId({ promptMode: 'single', charSource: 'custom' })).toBe(
      'free',
    )
  })
})
