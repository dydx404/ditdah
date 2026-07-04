/**
 * SummaryScreen — the end-of-round reward beat.
 * Shows how the round went (accuracy is the headline), celebrates any unlocks,
 * and points at the characters to work on next — then invites another round.
 * Sound-first: weak characters are named by letter, never by dot/dash.
 */
import { motion } from 'motion/react'
import type { RoundSummary } from '../useTrainerSession'
import { useT } from '@/i18n'

interface SummaryScreenProps {
  summary: RoundSummary
  streak?: number
  onAgain: () => void
}

export function SummaryScreen({ summary, streak = 0, onAgain }: SummaryScreenProps) {
  const t = useT()
  const accuracy = Math.round(summary.accuracy * 100)
  // Characters worth revisiting: missed at least once, weakest first.
  const focus = summary.perChar.filter((c) => c.correct < c.attempts).slice(0, 3)

  return (
    <motion.div
      className="flex w-full max-w-sm flex-col items-center gap-6 text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <p className="font-mono text-sm uppercase tracking-widest text-muted">
        {t('summary.roundComplete')}
      </p>

      <div className="flex flex-col items-center">
        <span className="font-mono text-6xl font-bold tabular-nums text-accent">
          {accuracy}%
        </span>
        <span className="font-mono text-xs text-muted">
          {t('summary.accuracy')}
        </span>
      </div>

      <dl className="flex items-center justify-center gap-6 font-mono text-sm">
        <Stat label={t('stats.copied')} value={String(summary.total)} />
        <Stat label={t('stats.correct')} value={String(summary.correct)} />
        <Stat label={t('stats.wpm')} value={String(summary.effectiveWpm)} />
        {streak > 0 && <Stat label="🔥" value={String(streak)} />}
      </dl>

      {summary.unlocked.length > 0 && (
        <p className="font-mono text-sm text-accent">
          {t('summary.unlocked', { chars: summary.unlocked.join(', ') })}
        </p>
      )}

      {focus.length > 0 && (
        <div className="font-mono text-xs text-muted">
          <span className="text-muted/70">{t('summary.keepWorking')}</span>
          {focus.map((c, i) => (
            <span key={c.char}>
              {i > 0 && ' · '}
              <span className="text-text">{c.char}</span>{' '}
              {Math.round(c.accuracy * 100)}%
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAgain}
        className="rounded-lg bg-accent px-6 py-3 font-mono font-semibold text-bg transition hover:brightness-110"
      >
        {t('action.practiceAgain')}
      </button>
      <p className="font-mono text-xs text-muted/70">{t('summary.pressSpace')}</p>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted" aria-hidden={label === '🔥' ? true : undefined}>
        {label}
      </dt>
      <dd className="tabular-nums text-text">{value}</dd>
    </div>
  )
}
