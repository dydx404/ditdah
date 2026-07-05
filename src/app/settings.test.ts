// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://ditdah.test"}
import { createElement, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  DEFAULT_SETTINGS,
  loadSettings,
  normalizeSettings,
  saveSettings,
  type Settings,
} from './settings'
import { DEFAULT_CUSTOM_CHARSET } from './charset'
import { SettingsPanel } from '@/ui/SettingsPanel'
import { COMMON_WORD_POOL } from './promptPools'

const SETTINGS_KEY = 'ditdah:settings'

describe('settings persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('loads defaults when nothing is saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('loads defaults when saved data is corrupt', () => {
    storage().setItem(SETTINGS_KEY, 'not json')

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('round-trips saved settings', () => {
    const settings = {
      charWpm: 28,
      effectiveWpm: 18,
      toneHz: 720,
      volume: 0.45,
      roundLength: 40,
      locale: 'zh',
      promptMode: 'group',
      groupSize: 4,
      charSource: 'custom',
      customCharset: ['A', 'B', '1'],
      promptPool: ['CQ', '73'],
      customText: 'hello world',
      strictGate: false,
      answerSounds: false,
      showPatterns: true,
    } satisfies Settings

    saveSettings(settings)

    expect(loadSettings()).toEqual(settings)
  })

  it('clamps out-of-range values on load and defaults showPatterns off', () => {
    storage().setItem(
      SETTINGS_KEY,
      JSON.stringify({
        charWpm: 100,
        effectiveWpm: 0,
        toneHz: 1200,
        volume: -1,
        roundLength: 0,
      }),
    )

    expect(loadSettings()).toEqual({
      charWpm: 40,
      effectiveWpm: 5,
      toneHz: 1000,
      volume: 0,
      roundLength: 5,
      locale: 'en',
      promptMode: 'single',
      groupSize: 5,
      charSource: 'koch',
      customCharset: DEFAULT_CUSTOM_CHARSET,
      promptPool: [],
      customText: '',
      strictGate: true,
      answerSounds: true,
      showPatterns: false,
    })
  })

  it('defaults and clamps round length', () => {
    expect(normalizeSettings({}).roundLength).toBe(25)
    expect(normalizeSettings({ roundLength: Number.NaN }).roundLength).toBe(25)
    expect(normalizeSettings({ roundLength: 0 }).roundLength).toBe(5)
    expect(normalizeSettings({ roundLength: 106 }).roundLength).toBe(100)
    expect(normalizeSettings({ roundLength: 27 }).roundLength).toBe(27)
  })

  it('defaults to single mode and clamps group size', () => {
    expect(normalizeSettings({}).promptMode).toBe('single')
    expect(normalizeSettings({ promptMode: 'bogus' as never }).promptMode).toBe(
      'single',
    )
    expect(normalizeSettings({ promptMode: 'group' }).promptMode).toBe('group')
    expect(normalizeSettings({ groupSize: 99 }).groupSize).toBe(7)
    expect(normalizeSettings({ groupSize: 1 }).groupSize).toBe(2)
    expect(normalizeSettings({}).groupSize).toBe(5)
  })

  it('defaults to Koch source and validates custom charsets', () => {
    expect(normalizeSettings({}).charSource).toBe('koch')
    expect(normalizeSettings({}).customCharset).toEqual(DEFAULT_CUSTOM_CHARSET)
    expect(
      normalizeSettings({
        charSource: 'custom',
        customCharset: ['m', 'A', 'm', '~', '5'],
      }),
    ).toMatchObject({
      charSource: 'custom',
      customCharset: ['A', 'M', '5'],
    })
    expect(
      normalizeSettings({
        charSource: 'custom',
        customCharset: [],
      }).customCharset,
    ).toEqual(DEFAULT_CUSTOM_CHARSET)
  })

  it('defaults and validates prompt pools', () => {
    expect(normalizeSettings({}).promptPool).toEqual([])
    expect(
      normalizeSettings({
        promptPool: [' cq ', 'CQ', '73', '~'],
      }).promptPool,
    ).toEqual(['CQ', '73'])
    expect(
      normalizeSettings({
        promptPool: COMMON_WORD_POOL,
      }).promptPool,
    ).toEqual(COMMON_WORD_POOL)
  })

  it('defaults and preserves custom text', () => {
    expect(normalizeSettings({}).customText).toBe('')
    expect(normalizeSettings({ customText: 'hello world' }).customText).toBe(
      'hello world',
    )
    expect(normalizeSettings({ customText: 42 as never }).customText).toBe('')
  })

  it('defaults showPatterns off and coerces non-booleans to false', () => {
    expect(DEFAULT_SETTINGS.showPatterns).toBe(false)
    expect(normalizeSettings({ showPatterns: 'yes' as never }).showPatterns).toBe(
      false,
    )
    expect(normalizeSettings({ showPatterns: true }).showPatterns).toBe(true)
  })

  it('defaults answer behavior on and preserves explicit opt-outs', () => {
    expect(DEFAULT_SETTINGS.strictGate).toBe(true)
    expect(DEFAULT_SETTINGS.answerSounds).toBe(true)
    expect(normalizeSettings({}).strictGate).toBe(true)
    expect(normalizeSettings({}).answerSounds).toBe(true)
    expect(normalizeSettings({ strictGate: false }).strictGate).toBe(false)
    expect(normalizeSettings({ answerSounds: false }).answerSounds).toBe(false)
    expect(normalizeSettings({ strictGate: 'no' as never }).strictGate).toBe(true)
    expect(normalizeSettings({ answerSounds: 'no' as never }).answerSounds).toBe(
      true,
    )
  })

  it('clamps effective speed when character speed is lowered', () => {
    expect(
      normalizeSettings({
        ...DEFAULT_SETTINGS,
        charWpm: 12,
        effectiveWpm: 30,
      }),
    ).toMatchObject({
      charWpm: 12,
      effectiveWpm: 12,
    })
  })
})

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('renders and persists a control change', () => {
    render(createElement(SettingsHarness))

    expect(screen.getByRole('complementary', { name: /settings/i })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Character speed'), {
      target: { value: '30' },
    })

    expect(loadSettings().charWpm).toBe(30)

    fireEvent.change(screen.getByLabelText('Round length'), {
      target: { value: '50' },
    })

    expect(loadSettings().roundLength).toBe(50)

    fireEvent.click(
      screen.getByLabelText('Strict mode (type misses back to continue)'),
    )
    fireEvent.click(screen.getByLabelText('Answer sounds'))

    expect(loadSettings().strictGate).toBe(false)
    expect(loadSettings().answerSounds).toBe(false)
  })

  it('renders the character picker in custom mode', () => {
    render(createElement(SettingsHarness, { custom: true }))

    expect(screen.getByText('Training characters')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Toggle A' }))
    expect(loadSettings().customCharset).toContain('A')
  })

  it('activates and clears a custom text prompt pool', () => {
    render(createElement(SettingsHarness, { custom: true }))

    fireEvent.change(screen.getByLabelText('Practice text'), {
      target: { value: 'hello world @@@ 73' },
    })

    expect(loadSettings().customText).toBe('hello world @@@ 73')
    expect(screen.getByText('3 prompts ready')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use text' }))

    expect(loadSettings().promptPool).toEqual(['HELLO', 'WORLD', '73'])
    expect(screen.getByText('3 prompts active')).toBeInTheDocument()
    expect(screen.queryByText('Training characters')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear text' }))

    expect(loadSettings().promptPool).toEqual([])
    expect(loadSettings().customText).toBe('hello world @@@ 73')
    expect(screen.getByText('Training characters')).toBeInTheDocument()
  })
})

function SettingsHarness({ custom = false }: { custom?: boolean }) {
  const [settings, setSettings] = useState(
    normalizeSettings({
      ...DEFAULT_SETTINGS,
      charSource: custom ? 'custom' : 'koch',
      customCharset: ['K', 'M'],
    }),
  )

  return createElement(SettingsPanel, {
    open: true,
    settings,
    onClose: () => {},
    onSettingsChange: (next: Settings) => {
      setSettings(next)
      saveSettings(next)
    },
    unlockedChars: ['K', 'M', 'U'],
    charStats: { K: { attempts: 4, correct: 2 } },
  })
}

function storage(): Storage {
  return localStorage
}

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>()

  get length(): number {
    return this.items.size
  }

  clear(): void {
    this.items.clear()
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.items.keys()).at(index) ?? null
  }

  removeItem(key: string): void {
    this.items.delete(key)
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value)
  }
}
