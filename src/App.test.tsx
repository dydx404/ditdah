// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { CURRENT_SCHEMA_VERSION } from '@/core/storage'
import type { Progress } from '@/core/storage/types'

class MemoryStorage implements Storage {
  private m = new Map<string, string>()
  get length() {
    return this.m.size
  }
  clear() {
    this.m.clear()
  }
  getItem(k: string) {
    return this.m.get(k) ?? null
  }
  key(i: number) {
    return [...this.m.keys()].at(i) ?? null
  }
  removeItem(k: string) {
    this.m.delete(k)
  }
  setItem(k: string, v: string) {
    this.m.set(k, v)
  }
}

describe('App persistence', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', new MemoryStorage())
  })

  it('boots to the start screen (fresh: only K and M)', async () => {
    render(<App />)
    expect(
      await screen.findByRole('button', { name: /start listening/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('K')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    // No further characters unlocked on a fresh start.
    expect(screen.queryByText('U')).not.toBeInTheDocument()
  })

  it('restores unlocked characters from saved progress', async () => {
    const saved: Progress = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      unlocked: ['K', 'M', 'U', 'R'],
      charStats: { K: { attempts: 20, correct: 19 } },
      streak: { count: 2, lastPracticedISO: '2026-07-03' },
    }
    localStorage.setItem('ditdah:progress', JSON.stringify(saved))

    render(<App />)
    await screen.findByRole('button', { name: /start listening/i })

    for (const c of ['K', 'M', 'U', 'R']) {
      expect(screen.getByText(c)).toBeInTheDocument()
    }
    // The saved 2-day streak surfaces in the HUD.
    expect(screen.getByTitle('2-day streak')).toBeInTheDocument()
  })

  it('does not show a streak when there is none', async () => {
    render(<App />)
    await screen.findByRole('button', { name: /start listening/i })
    expect(screen.queryByTitle(/day streak/)).not.toBeInTheDocument()
  })
})
