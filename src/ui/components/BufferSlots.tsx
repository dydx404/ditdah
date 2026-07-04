/**
 * BufferSlots — the in-progress copy for a group prompt.
 *
 * Shows one slot per character with what the learner has typed so far and a
 * caret on the next slot. It never shows the prompt itself — only your own
 * keystrokes — so it stays sound-first: you still decode the group by ear.
 */
import { useT } from '@/i18n'

interface BufferSlotsProps {
  length: number
  value: string
}

export function BufferSlots({ length, value }: BufferSlotsProps) {
  const t = useT()
  const active = value.length
  return (
    <div
      className="flex items-center justify-center gap-2"
      aria-label={t('buffer.aria')}
    >
      {Array.from({ length }, (_, i) => {
        const ch = value[i] ?? ''
        const isActive = i === active
        return (
          <div
            key={i}
            className={[
              'grid h-14 w-11 place-items-center rounded-lg border font-mono text-2xl transition-colors',
              ch
                ? 'border-accent/50 text-text'
                : isActive
                  ? 'border-accent text-muted'
                  : 'border-border text-muted/30',
            ].join(' ')}
          >
            {ch || (isActive ? '_' : '')}
          </div>
        )
      })}
    </div>
  )
}
