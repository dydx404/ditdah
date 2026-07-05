import { describe, expect, it } from 'vitest'
import { STORY_CAMPAIGN, validateCampaign } from '.'

describe('story content', () => {
  it('ships one First Contact chapter with supported CW text', () => {
    const chapter = STORY_CAMPAIGN.chapters[0]

    expect(STORY_CAMPAIGN.chapters).toHaveLength(1)
    expect(chapter.id).toBe('first-contact')
    expect(chapter.lines.length).toBeGreaterThanOrEqual(8)
    expect(chapter.lines.length).toBeLessThanOrEqual(12)
    expect(chapter.lines.some((line) => line.mode === 'copy')).toBe(true)
    expect(chapter.lines.some((line) => line.mode === 'send')).toBe(true)
    expect(validateCampaign(STORY_CAMPAIGN)).toEqual([])
  })
})
