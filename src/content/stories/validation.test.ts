import { describe, expect, it } from 'vitest'
import { isSupportedStoryText, STORY_CAMPAIGN, validateCampaign } from '.'

describe('story content', () => {
  it('ships a three-chapter campaign with supported CW text', () => {
    const [first, second, third] = STORY_CAMPAIGN.chapters

    expect(STORY_CAMPAIGN.chapters).toHaveLength(3)
    expect(first.id).toBe('first-contact')
    expect(second.id).toBe('storm-watch')
    expect(third.id).toBe('harbor-relay')
    expect(second.unlock?.previousChapterId).toBe('first-contact')
    expect(third.unlock?.previousChapterId).toBe('storm-watch')
    for (const chapter of STORY_CAMPAIGN.chapters) {
      expect(chapter.lines.length).toBeGreaterThanOrEqual(8)
      expect(chapter.lines.length).toBeLessThanOrEqual(12)
      expect(chapter.lines.some((line) => line.mode === 'copy')).toBe(true)
      expect(chapter.lines.some((line) => line.mode === 'send')).toBe(true)
    }
    expect(validateCampaign(STORY_CAMPAIGN)).toEqual([])
  })

  it('accepts known prosign tokens but rejects unknown or malformed ones', () => {
    expect(isSupportedStoryText('73 <SK>')).toBe(true)
    expect(isSupportedStoryText('<AR>')).toBe(true)
    expect(isSupportedStoryText('<XY>')).toBe(false)
    expect(isSupportedStoryText('73 <SK')).toBe(false)
  })

  it('flags unlock references to unknown chapters', () => {
    expect(
      validateCampaign({
        id: 'bad',
        title: 'Bad',
        chapters: [
          {
            ...STORY_CAMPAIGN.chapters[0],
            unlock: { previousChapterId: 'missing' },
          },
        ],
      }),
    ).toContainEqual({
      path: 'chapters[0].unlock.previousChapterId',
      message: 'Chapter unlock references an unknown chapter',
    })
  })
})
