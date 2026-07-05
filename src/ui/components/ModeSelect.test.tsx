// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ModeSelect } from './ModeSelect'
import { DEFAULT_SETTINGS } from '@/app/settings'
import { DIGIT_CHARS } from '@/app/charset'
import { CALLSIGN_POOL, COMMON_WORD_POOL, QSO_POOL } from '@/app/promptPools'

describe('ModeSelect', () => {
  it('highlights the active mode and starts on Start', () => {
    const onStart = vi.fn()
    render(
      <ModeSelect
        settings={DEFAULT_SETTINGS}
        onSelectMode={() => {}}
        onOpenStory={() => {}}
        onStart={onStart}
      />,
    )

    // Default (single) => Learn is the active block.
    expect(screen.getByRole('button', { name: /Learn/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: /start listening/i }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('applies a mode when its card is chosen', () => {
    const onSelectMode = vi.fn()
    render(
      <ModeSelect
        settings={DEFAULT_SETTINGS}
        onSelectMode={onSelectMode}
        onOpenStory={() => {}}
        onStart={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Copy groups/ }))
    expect(onSelectMode).toHaveBeenCalledWith({
      promptMode: 'group',
      charSource: 'koch',
      promptPool: [],
    })

    fireEvent.click(screen.getByRole('button', { name: /Free training/ }))
    expect(onSelectMode).toHaveBeenLastCalledWith({
      charSource: 'custom',
      promptPool: [],
    })

    fireEvent.click(screen.getByRole('button', { name: /Numbers/ }))
    expect(onSelectMode).toHaveBeenLastCalledWith({
      charSource: 'custom',
      customCharset: DIGIT_CHARS,
      promptPool: [],
    })

    fireEvent.click(screen.getByRole('button', { name: /Words/ }))
    expect(onSelectMode).toHaveBeenLastCalledWith({
      promptMode: 'single',
      charSource: 'koch',
      promptPool: COMMON_WORD_POOL,
    })

    fireEvent.click(screen.getByRole('button', { name: /Callsigns/ }))
    expect(onSelectMode).toHaveBeenLastCalledWith({
      promptMode: 'single',
      charSource: 'koch',
      promptPool: CALLSIGN_POOL,
    })

    fireEvent.click(screen.getByRole('button', { name: /QSO/ }))
    expect(onSelectMode).toHaveBeenLastCalledWith({
      promptMode: 'single',
      charSource: 'koch',
      promptPool: QSO_POOL,
    })
  })

  it('does not mark built modes as soon', () => {
    render(
      <ModeSelect
        settings={DEFAULT_SETTINGS}
        onSelectMode={() => {}}
        onOpenStory={() => {}}
        onStart={() => {}}
      />,
    )
    expect(screen.queryByText(/soon/i)).not.toBeInTheDocument()
  })

  it('opens Story Mode from the mode grid', () => {
    const onOpenStory = vi.fn()
    render(
      <ModeSelect
        settings={DEFAULT_SETTINGS}
        onSelectMode={() => {}}
        onOpenStory={onOpenStory}
        onStart={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Story/ }))

    expect(onOpenStory).toHaveBeenCalledOnce()
  })
})
