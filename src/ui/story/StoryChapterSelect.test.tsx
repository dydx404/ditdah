// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { STORY_CAMPAIGN } from '@/content/stories'
import { StoryChapterSelect } from './StoryChapterSelect'

describe('StoryChapterSelect', () => {
  it('renders the first story chapter and can start it', () => {
    const onStartChapter = vi.fn()
    render(
      <StoryChapterSelect
        campaign={STORY_CAMPAIGN}
        onBack={() => {}}
        onStartChapter={onStartChapter}
      />,
    )

    expect(screen.getByText('Story Mode')).toBeInTheDocument()
    expect(screen.getByText('First Contact')).toBeInTheDocument()
    expect(screen.getByText('Storm Watch')).toBeInTheDocument()
    expect(screen.getByText('Harbor Relay')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^First Contact/ }))

    expect(onStartChapter).toHaveBeenCalledWith(STORY_CAMPAIGN.chapters[0])
  })

  it('locks the follow-up chapter until First Contact is complete', () => {
    const onStartChapter = vi.fn()
    render(
      <StoryChapterSelect
        campaign={STORY_CAMPAIGN}
        onBack={() => {}}
        onStartChapter={onStartChapter}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /^Storm Watch/ }))

    expect(screen.getByRole('button', { name: /^Storm Watch/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Harbor Relay/ })).toBeDisabled()
    expect(screen.getByText('Complete First Contact')).toBeInTheDocument()
    expect(screen.getByText('Complete Storm Watch')).toBeInTheDocument()
    expect(onStartChapter).not.toHaveBeenCalled()
  })

  it('unlocks each follow-up chapter after its previous chapter is complete', () => {
    const onStartChapter = vi.fn()
    const { rerender } = render(
      <StoryChapterSelect
        campaign={STORY_CAMPAIGN}
        progress={[
          {
            chapterId: 'first-contact',
            completedAt: '2026-07-05T10:00:00.000Z',
            bestAccuracy: 0.92,
            assistedLines: 1,
            playCount: 2,
          },
        ]}
        onBack={() => {}}
        onStartChapter={onStartChapter}
      />,
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Best 92%')).toBeInTheDocument()
    expect(screen.getByText('2 plays')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Storm Watch/ }))
    expect(onStartChapter).toHaveBeenCalledWith(STORY_CAMPAIGN.chapters[1])
    expect(screen.getByRole('button', { name: /^Harbor Relay/ })).toBeDisabled()
    expect(screen.queryByText('Complete First Contact')).not.toBeInTheDocument()
    expect(screen.getByText('Complete Storm Watch')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^First Contact/ }))
    expect(onStartChapter).toHaveBeenLastCalledWith(STORY_CAMPAIGN.chapters[0])

    rerender(
      <StoryChapterSelect
        campaign={STORY_CAMPAIGN}
        progress={[
          {
            chapterId: 'first-contact',
            completedAt: '2026-07-05T10:00:00.000Z',
            bestAccuracy: 0.92,
            assistedLines: 1,
            playCount: 2,
          },
          {
            chapterId: 'storm-watch',
            completedAt: '2026-07-05T11:00:00.000Z',
            bestAccuracy: 0.88,
            assistedLines: 0,
            playCount: 1,
          },
        ]}
        onBack={() => {}}
        onStartChapter={onStartChapter}
      />,
    )

    expect(screen.queryByText('Complete Storm Watch')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Harbor Relay/ }))
    expect(onStartChapter).toHaveBeenLastCalledWith(STORY_CAMPAIGN.chapters[2])
  })
})
