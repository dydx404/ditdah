// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import { CharacterPicker } from './CharacterPicker'

describe('CharacterPicker', () => {
  it('toggles characters and applies presets', () => {
    const onChange = vi.fn()
    render(
      <CharacterPicker
        value={['K', 'M']}
        unlockedChars={['K', 'M', 'U']}
        charStats={{
          K: { attempts: 10, correct: 8 },
          M: { attempts: 10, correct: 2 },
        }}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('2 selected for free training.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Toggle A' }))
    expect(onChange).toHaveBeenLastCalledWith(['A', 'K', 'M'])

    fireEvent.click(screen.getByRole('button', { name: 'Numbers' }))
    expect(onChange).toHaveBeenLastCalledWith([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Unlocked' }))
    expect(onChange).toHaveBeenLastCalledWith(['K', 'M', 'U'])

    fireEvent.click(screen.getByRole('button', { name: 'Weak-spots' }))
    expect(onChange).toHaveBeenLastCalledWith(['K', 'M'])
  })

  it('renders Chinese strings under a zh provider', () => {
    render(
      <I18nProvider locale="zh">
        <CharacterPicker
          value={['K', 'M']}
          unlockedChars={['K', 'M']}
          charStats={{}}
          onChange={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('练习字符')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全部字母' })).toBeInTheDocument()
  })
})
