// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { readDebugAnswerMode } from './debug'

describe('readDebugAnswerMode', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('defaults to normal mode', () => {
    expect(readDebugAnswerMode()).toBe('normal')
  })

  it('reads the hidden always-correct URL flag in dev', () => {
    window.history.replaceState({}, '', '/?debug=always-correct')

    expect(readDebugAnswerMode()).toBe('always-correct')
  })
})
