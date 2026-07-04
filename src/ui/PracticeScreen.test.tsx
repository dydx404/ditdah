// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PracticeScreen } from './PracticeScreen'
import { createTrainer } from '@/core/trainer'
import type { ToneEngine } from '@/core/audio/types'
import type { TimingConfig } from '@/core/morse/types'
import { DEFAULT_SETTINGS } from '@/app/settings'

const timing: TimingConfig = { charWpm: 20, effectiveWpm: 10, toneHz: 600 }

const fakeEngine: ToneEngine = {
  resume: () => Promise.resolve(),
  play: () => ({ done: Promise.resolve(), stop: () => {} }),
  stop: () => {},
  setVolume: () => {},
  dispose: () => {},
}

describe('PracticeScreen', () => {
  it('mounts and shows the idle start gate with the initial characters', () => {
    const trainer = createTrainer({
      timing,
      initialUnlockCount: 2,
      unlockAccuracy: 0.9,
      unlockWindow: 5,
      seed: 1,
    })
    render(
      <PracticeScreen
        trainer={trainer}
        engine={fakeEngine}
        timing={timing}
        settings={DEFAULT_SETTINGS}
        onSettingsChange={() => {}}
      />,
    )

    expect(
      screen.getByRole('button', { name: /start listening/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /open settings/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /open history/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 / 3')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /character reference/i }),
    ).toHaveAttribute('aria-expanded', 'false')
    // Sound-first: the prompt character is NOT rendered at idle, but the
    // learner's unlocked set (K, M) is shown in the HUD.
    expect(screen.getByText('K')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })
})
