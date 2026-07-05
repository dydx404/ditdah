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

    fireEvent.click(screen.getByRole('button', { name: /First Contact/ }))

    expect(onStartChapter).toHaveBeenCalledWith(STORY_CAMPAIGN.chapters[0])
  })

  it('shows completed chapter progress', () => {
    render(
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
        onStartChapter={() => {}}
      />,
    )

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Best 92%')).toBeInTheDocument()
    expect(screen.getByText('2 plays')).toBeInTheDocument()
  })
})
