// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { STORY_CAMPAIGN, type Chapter } from '@/content/stories'
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

  it('reports completion once when the chapter finishes', async () => {
    const onComplete = vi.fn()
    render(
      <StoryScreen
        chapter={singleCopyChapter}
        engine={engine}
        timing={timing}
        onExit={() => {}}
        onComplete={onComplete}
      />,
    )

    await typeKeys('K')

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onComplete).toHaveBeenCalledWith('single-copy', {
      total: 1,
      correct: 1,
      accuracy: 1,
      assistedLines: 0,
    })
  })

  it('shows completion actions when a next chapter exists', async () => {
    const onExit = vi.fn()
    const onNextChapter = vi.fn()
    render(
      <StoryScreen
        chapter={singleCopyChapter}
        engine={engine}
        timing={timing}
        onExit={onExit}
        onNextChapter={onNextChapter}
      />,
    )

    await typeKeys('K')

    fireEvent.click(screen.getByRole('button', { name: 'Back to chapters' }))
    expect(onExit).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByRole('button', { name: 'Next chapter' }))
    expect(onNextChapter).toHaveBeenCalledOnce()
  })

  it('omits the next action on the final chapter', async () => {
    render(
      <StoryScreen
        chapter={singleCopyChapter}
        engine={engine}
        timing={timing}
        onExit={() => {}}
      />,
    )

    await typeKeys('K')

    expect(
      screen.getByRole('button', { name: 'Back to chapters' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Next chapter' }),
    ).not.toBeInTheDocument()
  })
})

const singleCopyChapter: Chapter = {
  id: 'single-copy',
  title: 'Single Copy',
  setting: 'Test bench',
  blurb: 'A one-line chapter.',
  characters: [
    {
      id: 'maya',
      name: 'Maya',
      callsign: 'W1AW',
      avatar: 'M',
    },
  ],
  lines: [
    {
      id: 'copy-k',
      speaker: 'maya',
      text: 'K',
      mode: 'copy',
    },
  ],
}

async function typeKeys(text: string) {
  for (const key of text) {
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key }))
    })
  }
}
