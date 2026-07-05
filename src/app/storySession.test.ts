import { describe, expect, it } from 'vitest'
import { STORY_CAMPAIGN } from '@/content/stories'
import {
  createStorySession,
  displayStoryText,
  scoreStoryText,
  storyLinePlayableText,
} from './storySession'

const chapter = STORY_CAMPAIGN.chapters[0]

describe('story session', () => {
  it('scores copy text per position', () => {
    expect(scoreStoryText('CQ CQ', 'CQ XQ')).toMatchObject({
      correct: false,
      expected: 'CQ CQ',
      received: 'CQ XQ',
      accuracy: 0.8,
    })
  })

  it('scores a prosign send line by its typed letters', () => {
    // Content authors the prosign as `<SK>`; the operator types "SK".
    expect(scoreStoryText('73 <SK>', '73 SK')).toMatchObject({
      correct: true,
      expected: '73 SK',
      received: '73 SK',
    })
    expect(displayStoryText('73 <SK>')).toBe('73 SK')
  })

  it('starts on the first line and advances narration', () => {
    const session = createStorySession(chapter)

    expect(session.state().phase).toBe('narration')
    expect(storyLinePlayableText(session.state().activeLine!)).toBe(
      'FIRST CONTACT',
    )

    const state = session.advanceNarration()

    expect(state.phase).toBe('copy')
    expect(state.activeLine?.id).toBe('cq')
    expect(state.transcript).toHaveLength(1)
  })

  it('passes a copy line and advances', () => {
    const session = createStorySession(chapter)
    session.advanceNarration()

    const state = session.submitCopy('CQ CQ DE W1AW')

    expect(state.phase).toBe('send')
    expect(state.activeLine?.id).toBe('answer-cq')
    expect(state.transcript.at(-1)).toMatchObject({
      received: 'CQ CQ DE W1AW',
      accuracy: 1,
      assisted: false,
    })
  })

  it('retries a missed copy line before entering assist', () => {
    const session = createStorySession(chapter)
    session.advanceNarration()

    const retry = session.submitCopy('CQ')
    expect(retry.phase).toBe('retry')
    expect(retry.missCount).toBe(1)

    const assist = session.submitCopy('DE')
    expect(assist.phase).toBe('assist')
    expect(assist.missCount).toBe(2)
  })

  it('assist echo advances only after the revealed line is echoed', () => {
    const session = createStorySession(chapter)
    session.advanceNarration()
    session.submitCopy('CQ')
    session.submitCopy('DE')

    expect(session.submitAssist('NOPE').phase).toBe('assist')

    const state = session.submitAssist('CQ CQ DE W1AW')
    expect(state.phase).toBe('send')
    expect(state.transcript.at(-1)).toMatchObject({
      assisted: true,
      received: 'CQ CQ DE W1AW',
    })
  })

  it('send lines require an exact echo before advancing', () => {
    const session = createStorySession(chapter)
    session.advanceNarration()
    session.submitCopy('CQ CQ DE W1AW')

    expect(session.submitSend('W1AW').phase).toBe('send')

    const state = session.submitSend('W1AW DE G4ABC K')
    expect(state.phase).toBe('copy')
    expect(state.activeLine?.id).toBe('rst')
  })

  it('completes the chapter with a summary', () => {
    const session = createStorySession(chapter)

    session.advanceNarration()
    session.submitCopy('CQ CQ DE W1AW')
    session.submitSend('W1AW DE G4ABC K')
    session.submitCopy('G4ABC DE W1AW RST 599')
    session.submitSend('W1AW DE G4ABC RST 579')
    session.submitCopy('NAME MAYA')
    session.submitSend('NAME BEN')
    session.submitCopy('QTH BOSTON')
    session.submitCopy('TU 73')
    const state = session.submitSend('73 SK')

    expect(state.phase).toBe('complete')
    expect(state.activeLine).toBeNull()
    expect(state.summary).toMatchObject({
      total: 58,
      correct: 58,
      accuracy: 1,
      assistedLines: 0,
    })
  })
})
