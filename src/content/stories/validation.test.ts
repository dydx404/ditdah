import { describe, expect, it } from 'vitest'
import { STORY_CAMPAIGN, validateCampaign } from '.'

describe('story content', () => {
  it('ships First Contact and a locked follow-up chapter with supported CW text', () => {
    const [first, second] = STORY_CAMPAIGN.chapters

    expect(STORY_CAMPAIGN.chapters).toHaveLength(2)
    expect(first.id).toBe('first-contact')
    expect(second.id).toBe('storm-watch')
    expect(second.unlock?.previousChapterId).toBe('first-contact')
    for (const chapter of STORY_CAMPAIGN.chapters) {
      expect(chapter.lines.length).toBeGreaterThanOrEqual(8)
      expect(chapter.lines.length).toBeLessThanOrEqual(12)
      expect(chapter.lines.some((line) => line.mode === 'copy')).toBe(true)
      expect(chapter.lines.some((line) => line.mode === 'send')).toBe(true)
    }
    expect(validateCampaign(STORY_CAMPAIGN)).toEqual([])
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
