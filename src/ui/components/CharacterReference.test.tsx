// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { CharacterReference } from './CharacterReference'
import { renderToElements } from '@/core/morse'
import type { ToneEngine, PlayHandle } from '@/core/audio/types'
import type { TimingConfig } from '@/core/morse/types'

const timing: TimingConfig = { charWpm: 20, effectiveWpm: 10, toneHz: 600 }

describe('CharacterReference', () => {
  it('is collapsed by default and expands to Koch-order unlock status', () => {
    render(
      <CharacterReference
        unlocked={['K', 'M']}
        timing={timing}
        engine={fakeEngine().engine}
      />,
    )

    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /character reference/i }))

    const table = screen.getByRole('table', {
      name: /koch character reference/i,
    })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(42)
    expect(within(rows[1]).getByText('K')).toBeInTheDocument()
    expect(within(rows[1]).getByText('unlocked')).toBeInTheDocument()
    expect(within(rows[3]).getByText('U')).toBeInTheDocument()
    expect(within(rows[3]).getByText('upcoming')).toBeInTheDocument()
  })

  it('plays a selected character with current timing and tone', () => {
    const { engine, calls } = fakeEngine()
    render(
      <CharacterReference unlocked={['K']} timing={timing} engine={engine} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /character reference/i }))
    fireEvent.click(screen.getByRole('button', { name: /listen to character k/i }))

    expect(calls.play).toEqual([
      {
        elements: renderToElements('K', timing),
        toneHz: 600,
      },
    ])
  })

  it('hides dit/dah patterns by default (sound-first)', () => {
    render(
      <CharacterReference
        unlocked={['K']}
        timing={timing}
        engine={fakeEngine().engine}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /character reference/i }))

    expect(
      screen.queryByRole('columnheader', { name: /pattern/i }),
    ).not.toBeInTheDocument()
    // K is dah-dit-dah; its glyphs must not appear when patterns are off.
    expect(screen.queryByText('– · –')).not.toBeInTheDocument()
  })

  it('shows dit/dah patterns when opted in', () => {
    render(
      <CharacterReference
        unlocked={['K']}
        timing={timing}
        engine={fakeEngine().engine}
        showPatterns
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /character reference/i }))

    expect(
      screen.getByRole('columnheader', { name: /pattern/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('– · –')).toBeInTheDocument() // K = dah dit dah
  })
})

function fakeEngine() {
  const calls: {
    play: Array<{
      elements: ReturnType<typeof renderToElements>
      toneHz: number
    }>
  } = { play: [] }
  const engine: ToneEngine = {
    resume: () => Promise.resolve(),
    play: (elements, toneHz): PlayHandle => {
      calls.play.push({ elements, toneHz })
      return { done: Promise.resolve(), stop: () => {} }
    },
    cue: () => Promise.resolve(),
    stop: () => {},
    setVolume: () => {},
    dispose: () => {},
  }

  return { engine, calls }
}
