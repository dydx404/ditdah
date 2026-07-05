/**
 * ModeSelect — the home screen. Pick a mode block, then start.
 *
 * Selecting a card applies that mode's settings (highlighting it); Start begins
 * a round in the active mode. Sound-first is untouched — modes are about *what*
 * you copy, never a dot/dash chart.
 */
import type { Settings } from '@/app/settings'
import { PRACTICE_MODES, activeModeId } from '@/app/modes'
import { useT } from '@/i18n'

interface ModeSelectProps {
  settings: Settings
  onSelectMode: (apply: Partial<Settings>) => void
  onOpenStory: () => void
  onStart: () => void
}

export function ModeSelect({
  settings,
  onSelectMode,
  onOpenStory,
  onStart,
}: ModeSelectProps) {
  const t = useT()
  const active = activeModeId(settings)

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <h1 className="font-mono text-4xl font-bold tracking-tight">
        dit<span className="text-accent">dah</span>
      </h1>
      <p className="max-w-xs text-muted">{t('mode.intro')}</p>

      <div
        className="grid w-full grid-cols-2 gap-3"
        role="group"
        aria-label={t('mode.aria')}
      >
        {PRACTICE_MODES.map((mode) => {
          const isActive = mode.id === active
          return (
            <button
              key={mode.id}
              type="button"
              disabled={!mode.available}
              aria-pressed={isActive}
              onClick={() => mode.apply && onSelectMode(mode.apply)}
              className={[
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition',
                mode.available
                  ? isActive
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/60'
                  : 'cursor-not-allowed border-border/60 opacity-45',
              ].join(' ')}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-text">
                  {t(mode.nameKey)}
                </span>
                {isActive && <span className="text-accent" aria-hidden="true">✓</span>}
                {!mode.available && (
                  <span className="rounded-full border border-border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-muted">
                    {t('action.soon')}
                  </span>
                )}
              </span>
              <span className="text-xs text-muted">{t(mode.blurbKey)}</span>
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={false}
          onClick={onOpenStory}
          className="flex flex-col items-start gap-1 rounded-xl border border-border p-3 text-left transition hover:border-accent/60"
        >
          <span className="flex w-full items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-text">
              {t('mode.story.name')}
            </span>
          </span>
          <span className="text-xs text-muted">{t('mode.story.blurb')}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="rounded-lg bg-accent px-6 py-3 font-mono font-semibold text-bg transition hover:brightness-110"
      >
        {t('action.start')}
      </button>
      <p className="font-mono text-xs text-muted/70">{t('home.hint')}</p>
    </div>
  )
}
