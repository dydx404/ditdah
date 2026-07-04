// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DAILY_GOAL, DailyGoal } from './DailyGoal'

describe('DailyGoal', () => {
  it('renders the default daily goal progress', () => {
    render(<DailyGoal completed={2} />)

    expect(screen.getByText(`2 / ${DAILY_GOAL}`)).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
  })

  it('shows a met state once the daily goal is reached', () => {
    render(<DailyGoal completed={3} />)

    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByTitle('3 / 3 today')).toBeInTheDocument()
  })
})
