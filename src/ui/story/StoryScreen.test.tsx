// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { STORY_CAMPAIGN } from '@/content/stories'
import type { ToneEngine } from '@/core/audio/types'
import type { TimingConfig } from '@/core/morse/types'
import { StoryScreen } from './StoryScreen'

const timing: TimingConfig = { charWpm: 20, effectiveWpm: 10, toneHz: 600 }
const engine: ToneEngine = {
  resume: () => Promise.resolve(),
  play: () => ({ done: Promise.resolve(), stop: () => {} }),
  cue: () => Promise.resolve(),
  stop: () => {},
  setVolume: () => {},
  dispose: () => {},
}

describe('StoryScreen', () => {
  it('hides copy text until after the learner submits', async () => {
    render(
      <StoryScreen
        chapter={STORY_CAMPAIGN.chapters[0]}
        engine={engine}
        timing={timing}
        onExit={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.queryByText('CQ CQ DE W1AW')).not.toBeInTheDocument()
    expect(screen.getByText('Copy by ear. The message appears after you try.')).toBeInTheDocument()

    await typeKeys('CQ CQ DE W1AW')

    expect(screen.getByText('CQ CQ DE W1AW')).toBeInTheDocument()
    expect(screen.getByText('You answer and invite Maya to continue.')).toBeInTheDocument()
  })

  it('requires type-to-send before advancing', async () => {
    render(
      <StoryScreen
        chapter={STORY_CAMPAIGN.chapters[0]}
        engine={engine}
        timing={timing}
        onExit={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await typeKeys('CQ CQ DE W1AW')

    expect(screen.getByText('W1AW DE G4ABC K')).toBeInTheDocument()

    await typeKeys('W1AW')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    expect(screen.getByText('W1AW DE G4ABC K')).toBeInTheDocument()

    await typeKeys(' DE G4ABC K')

    expect(screen.queryByText('Maya sends your signal report.')).not.toBeInTheDocument()
  })
})

async function typeKeys(text: string) {
  for (const key of text) {
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }))
    })
  }
}
