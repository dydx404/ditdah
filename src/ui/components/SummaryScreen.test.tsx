// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SummaryScreen } from './SummaryScreen'
import type { RoundSummary } from '../useTrainerSession'
import { I18nProvider } from '@/i18n'

const summary: RoundSummary = {
  total: 10,
  correct: 8,
  accuracy: 0.8,
  effectiveWpm: 10,
  perChar: [
    { char: 'K', attempts: 5, correct: 3, accuracy: 0.6 }, // missed some
    { char: 'M', attempts: 5, correct: 5, accuracy: 1 }, // perfect
  ],
  unlocked: ['U'],
}

describe('SummaryScreen', () => {
  it('shows accuracy, unlocks, and focus chars, and fires onAgain', () => {
    const onAgain = vi.fn()
    render(<SummaryScreen summary={summary} streak={3} onAgain={onAgain} />)

    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText(/unlocked U/)).toBeInTheDocument()
    // K was missed → shown in "keep working on"; M was perfect → not listed.
    expect(screen.getByText('K')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /practice again/i }))
    expect(onAgain).toHaveBeenCalledOnce()
  })

  it('omits the focus list when everything was correct', () => {
    render(
      <SummaryScreen
        summary={{
          total: 5,
          correct: 5,
          accuracy: 1,
          effectiveWpm: 10,
          perChar: [{ char: 'K', attempts: 5, correct: 5, accuracy: 1 }],
          unlocked: [],
        }}
        onAgain={() => {}}
      />,
    )
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.queryByText(/keep working on/)).not.toBeInTheDocument()
  })

  it('renders Chinese copy under a zh provider', () => {
    render(
      <I18nProvider locale="zh">
        <SummaryScreen summary={summary} onAgain={() => {}} />
      </I18nProvider>,
    )

    expect(screen.getByText('本轮完成')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '再练一轮' })).toBeInTheDocument()
  })
})
