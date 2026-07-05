// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '@/i18n'
import { CustomTextImport } from './CustomTextImport'

describe('CustomTextImport', () => {
  it('parses pasted text and applies supported prompts', () => {
    const onApply = vi.fn()
    render(
      <CustomTextImport
        text="hello @@@ 73"
        activeCount={0}
        onTextChange={() => {}}
        onApply={onApply}
        onClear={() => {}}
      />,
    )

    expect(screen.getByText('2 prompts ready')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use text' }))

    expect(onApply).toHaveBeenCalledWith(['HELLO', '73'])
  })

  it('renders Chinese strings under a zh provider', () => {
    render(
      <I18nProvider locale="zh">
        <CustomTextImport
          text="cq 73"
          activeCount={2}
          onTextChange={() => {}}
          onApply={() => {}}
          onClear={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('自定义文本')).toBeInTheDocument()
    expect(screen.getByText('正在使用 2 个题目')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '清除文本' })).toBeInTheDocument()
  })
})
