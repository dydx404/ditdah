// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ModeSelect } from './ModeSelect'
import { DEFAULT_SETTINGS } from '@/app/settings'

describe('ModeSelect', () => {
  it('highlights the active mode and starts on Start', () => {
    const onStart = vi.fn()
    render(
      <ModeSelect
        settings={DEFAULT_SETTINGS}
        onSelectMode={() => {}}
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
        onStart={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Copy groups/ }))
    expect(onSelectMode).toHaveBeenCalledWith({
      promptMode: 'group',
      charSource: 'koch',
    })

    fireEvent.click(screen.getByRole('button', { name: /Free training/ }))
    expect(onSelectMode).toHaveBeenLastCalledWith({ charSource: 'custom' })
  })

  it('disables unbuilt modes', () => {
    render(
      <ModeSelect
        settings={DEFAULT_SETTINGS}
        onSelectMode={() => {}}
        onStart={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /Words/ })).toBeDisabled()
  })
})
