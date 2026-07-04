// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { HistoryPanel } from './HistoryPanel'
import type { RoundRecord } from '@/app/history'
import { I18nProvider } from '@/i18n'

const history: RoundRecord[] = [
  {
    at: '2026-07-04T12:30:00.000Z',
    total: 25,
    correct: 22,
    accuracy: 0.88,
    effectiveWpm: 16,
  },
  {
    at: '2026-07-03T12:30:00.000Z',
    total: 25,
    correct: 18,
    accuracy: 0.72,
    effectiveWpm: 14,
  },
]

describe('HistoryPanel', () => {
  it('renders recent rounds with accuracy and WPM', () => {
    render(
      <HistoryPanel
        open
        history={history}
        onClose={() => {}}
        onClear={() => {}}
      />,
    )

    expect(screen.getByRole('complementary', { name: /history/i })).toBeInTheDocument()
    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()

    const rows = screen.getAllByRole('listitem')
    expect(within(rows[0]).getByText('16')).toBeInTheDocument()
    expect(within(rows[1]).getByText('14')).toBeInTheDocument()
    expect(screen.getByLabelText('Accuracy 88%')).toBeInTheDocument()
  })

  it('renders an empty state and closes', () => {
    const onClose = vi.fn()

    render(<HistoryPanel open history={[]} onClose={onClose} />)

    expect(screen.getByText(/finish a round/i)).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /close history/i })[1])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('can request clearing saved history', () => {
    const onClear = vi.fn()

    render(
      <HistoryPanel
        open
        history={history}
        onClose={() => {}}
        onClear={onClear}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /clear history/i }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('renders Chinese panel copy under a zh provider', () => {
    render(
      <I18nProvider locale="zh">
        <HistoryPanel open history={[]} onClose={() => {}} />
      </I18nProvider>,
    )

    expect(
      screen.getByRole('complementary', { name: '历史记录' }),
    ).toBeInTheDocument()
    expect(screen.getByText('完成一轮后会开始记录历史')).toBeInTheDocument()
  })
})
