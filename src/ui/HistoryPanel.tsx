import type { RoundRecord } from '@/app/history'
import { useT } from '@/i18n'

interface HistoryPanelProps {
  open: boolean
  history: readonly RoundRecord[]
  onClose: () => void
  onClear?: () => void
}

export function HistoryPanel({
  open,
  history,
  onClose,
  onClear,
}: HistoryPanelProps) {
  const t = useT()

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-30">
      <button
        type="button"
        aria-label={t('action.closeHistory')}
        className="absolute inset-0 h-full w-full cursor-default bg-bg/70"
        onClick={onClose}
      />
      <aside
        aria-label={t('history.title')}
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface p-5 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-mono text-lg font-semibold text-text">
              {t('history.title')}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t('history.subtitle')}
            </p>
          </div>
          <button
            type="button"
            aria-label={t('action.closeHistory')}
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md border border-border font-mono text-muted transition hover:text-text"
          >
            x
          </button>
        </div>

        {history.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center">
            <p className="max-w-48 text-sm text-muted">
              {t('history.empty')}
            </p>
          </div>
        ) : (
          <>
            <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {history.map((record) => (
                <li
                  key={record.at}
                  className="rounded-md border border-border bg-bg/40 p-3"
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <time
                      dateTime={record.at}
                      className="font-mono text-xs text-muted"
                    >
                      {formatRoundTime(record.at, t('history.unknownTime'))}
                    </time>
                    <span className="font-mono text-xs tabular-nums text-accent">
                      {Math.round(record.accuracy * 100)}%
                    </span>
                  </div>
                  <div
                    className="mb-3 h-1.5 overflow-hidden rounded-full bg-border"
                    aria-label={t('history.accuracy', {
                      percent: Math.round(record.accuracy * 100),
                    })}
                  >
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.round(record.accuracy * 100)}%` }}
                    />
                  </div>
                  <dl className="grid grid-cols-3 gap-3 font-mono text-xs">
                    <RoundStat label={t('stats.copied')} value={String(record.total)} />
                    <RoundStat
                      label={t('stats.correct')}
                      value={String(record.correct)}
                    />
                    <RoundStat label={t('stats.wpm')} value={String(record.effectiveWpm)} />
                  </dl>
                </li>
              ))}
            </ol>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="mt-5 rounded-md border border-border px-3 py-2 font-mono text-sm text-muted transition hover:text-text"
              >
                {t('action.clearHistory')}
              </button>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

function RoundStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums text-text">{value}</dd>
    </div>
  )
}

function formatRoundTime(iso: string, unknownTime: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return unknownTime
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
