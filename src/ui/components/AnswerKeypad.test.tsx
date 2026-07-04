// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AnswerKeypad } from './AnswerKeypad'

describe('AnswerKeypad', () => {
  it('renders a button per character and answers on tap', () => {
    const onAnswer = vi.fn()
    render(<AnswerKeypad chars={['K', 'M']} onAnswer={onAnswer} />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Answer K' }))
    expect(onAnswer).toHaveBeenCalledWith('K')
  })

  it('does not answer while disabled', () => {
    const onAnswer = vi.fn()
    render(<AnswerKeypad chars={['K']} onAnswer={onAnswer} disabled />)

    fireEvent.click(screen.getByRole('button', { name: 'Answer K' }))
    expect(onAnswer).not.toHaveBeenCalled()
  })
})
