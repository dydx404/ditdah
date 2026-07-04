/**
 * GroupFeedback — per-position result for a group prompt.
 *
 * Reveals the group (after the answer, never before) with each position green
 * if copied right, red if wrong, and shows what was typed on a miss. Letters
 * only — never dots/dashes.
 */
import type { AnswerResult } from '@/core/trainer/types'

interface GroupFeedbackProps {
  result: AnswerResult
}

export function GroupFeedback({ result }: GroupFeedbackProps) {
  const perChar = result.perChar ?? []
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-2">
        {perChar.map((c, i) => (
          <div
            key={i}
            className={[
              'grid h-14 w-11 place-items-center rounded-lg border font-mono text-2xl font-bold',
              c.correct
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-error/40 bg-error/10 text-error',
            ].join(' ')}
          >
            {c.expected}
          </div>
        ))}
      </div>
      {result.correct ? (
        <p className="font-mono text-sm text-accent">✓ clean copy</p>
      ) : (
        <p className="font-mono text-sm text-muted">
          you typed{' '}
          <span className="text-error">{result.received || '—'}</span>
        </p>
      )}
    </div>
  )
}
