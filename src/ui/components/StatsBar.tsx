/**
 * StatsBar — the slim HUD above the practice zone.
 * Shows the letters you're working on and the two numbers that matter
 * (accuracy + how many you've copied). Deliberately quiet; the loop is the star.
 */
import type { ReactNode } from 'react'
import type { SessionSummary } from '@/core/trainer/types'
import { DailyGoal } from './DailyGoal'
import { useT } from '@/i18n'

interface StatsBarProps {
  unlocked: readonly string[]
  summary: SessionSummary
  effectiveWpm?: number
  /** Current daily streak (consecutive days practiced). Shown when > 0. */
  streak?: number
  /** Completed rounds today, derived from local session history. */
  roundsToday?: number
  actions?: ReactNode
}

export function StatsBar({
  unlocked,
  summary,
  effectiveWpm = summary.effectiveWpm,
  streak = 0,
  roundsToday = 0,
  actions,
}: StatsBarProps) {
  const t = useT()
  const accuracy = Math.round(summary.accuracy * 100)
  return (
    <header className="flex w-full items-center justify-between gap-4 px-5 py-4">
      <div
        className="flex flex-wrap items-center gap-1.5"
        aria-label={t('stats.characters')}
      >
        {unlocked.map((c) => (
          <span
            key={c}
            className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface font-mono text-sm text-text"
          >
            {c}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <dl className="flex items-center gap-5 font-mono text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">{t('stats.acc')}</dt>
            <dd className="tabular-nums text-text">
              {summary.total ? `${accuracy}%` : '—'}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">{t('stats.copied')}</dt>
            <dd className="tabular-nums text-text">{summary.total}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">{t('stats.wpm')}</dt>
            <dd className="tabular-nums text-text">{effectiveWpm}</dd>
          </div>
          {streak > 0 && (
            <div
              className="flex items-baseline gap-1.5"
              title={t('stats.streakTitle', { count: streak })}
            >
              <dt className="text-muted" aria-hidden="true">
                🔥
              </dt>
              <dd className="tabular-nums text-accent">
                {streak}
                <span className="sr-only">{t('stats.dayStreak')}</span>
              </dd>
            </div>
          )}
          <DailyGoal completed={roundsToday} />
        </dl>
        {actions}
      </div>
    </header>
  )
}
