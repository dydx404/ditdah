/**
 * StatsBar — the slim HUD above the practice zone.
 * Shows the letters you're working on and the two numbers that matter
 * (accuracy + how many you've copied). Deliberately quiet; the loop is the star.
 */
import type { ReactNode } from 'react'
import type { SessionSummary } from '@/core/trainer/types'

interface StatsBarProps {
  unlocked: readonly string[]
  summary: SessionSummary
  effectiveWpm?: number
  actions?: ReactNode
}

export function StatsBar({
  unlocked,
  summary,
  effectiveWpm = summary.effectiveWpm,
  actions,
}: StatsBarProps) {
  const accuracy = Math.round(summary.accuracy * 100)
  return (
    <header className="flex w-full items-center justify-between gap-4 px-5 py-4">
      <div className="flex flex-wrap items-center gap-1.5" aria-label="Your characters">
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
            <dt className="text-muted">acc</dt>
            <dd className="tabular-nums text-text">
              {summary.total ? `${accuracy}%` : '—'}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">copied</dt>
            <dd className="tabular-nums text-text">{summary.total}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">wpm</dt>
            <dd className="tabular-nums text-text">{effectiveWpm}</dd>
          </div>
        </dl>
        {actions}
      </div>
    </header>
  )
}
