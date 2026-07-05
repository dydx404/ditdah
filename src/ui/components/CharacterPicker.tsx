import {
  DIGIT_CHARS,
  LETTER_CHARS,
  PUNCTUATION_CHARS,
  SUPPORTED_CHARS,
  normalizeCustomCharset,
  sortByPickerOrder,
  weakSpotCharset,
} from '@/app/charset'
import type { CharProgress } from '@/core/storage/types'
import { useT } from '@/i18n'

interface CharacterPickerProps {
  value: readonly string[]
  unlockedChars: readonly string[]
  charStats: Readonly<Record<string, CharProgress>>
  onChange: (chars: readonly string[]) => void
}

export function CharacterPicker({
  value,
  unlockedChars,
  charStats,
  onChange,
}: CharacterPickerProps) {
  const t = useT()
  const selected = new Set(normalizeCustomCharset(value))
  const weakSpots = weakSpotCharset(charStats)

  const apply = (chars: readonly string[]) => {
    onChange(normalizeCustomCharset(chars))
  }

  const toggle = (char: string) => {
    const next = new Set(selected)
    if (next.has(char)) next.delete(char)
    else next.add(char)
    if (next.size === 0) return
    onChange(sortByPickerOrder([...next]))
  }

  return (
    <section className="flex flex-col gap-3 border-y border-border py-4">
      <div>
        <h3 className="font-mono text-sm font-semibold text-text">
          {t('charset.title')}
        </h3>
        <p className="mt-1 text-xs text-muted/75">
          {t('charset.hint', { count: selected.size })}
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t('charset.presets')}
      >
        <PresetButton label={t('charset.allLetters')} onClick={() => apply(LETTER_CHARS)} />
        <PresetButton label={t('charset.numbers')} onClick={() => apply(DIGIT_CHARS)} />
        <PresetButton
          label={t('charset.punctuation')}
          onClick={() => apply(PUNCTUATION_CHARS)}
        />
        <PresetButton
          label={t('charset.unlocked')}
          onClick={() => apply(unlockedChars)}
        />
        <PresetButton
          label={t('charset.weakSpots')}
          disabled={weakSpots.length === 0}
          onClick={() => apply(weakSpots)}
        />
      </div>

      <div
        className="grid grid-cols-9 gap-1.5"
        role="group"
        aria-label={t('charset.grid')}
      >
        {SUPPORTED_CHARS.map((char) => (
          <button
            key={char}
            type="button"
            aria-label={t('charset.toggleChar', { char })}
            aria-pressed={selected.has(char)}
            onClick={() => toggle(char)}
            className={[
              'grid h-8 min-w-8 place-items-center rounded-md border font-mono text-sm transition',
              selected.has(char)
                ? 'border-accent bg-accent/10 text-text'
                : 'border-border text-muted hover:text-text',
            ].join(' ')}
          >
            {char}
          </button>
        ))}
      </div>
    </section>
  )
}

interface PresetButtonProps {
  label: string
  disabled?: boolean
  onClick: () => void
}

function PresetButton({ label, disabled = false, onClick }: PresetButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted transition hover:text-text disabled:opacity-40"
    >
      {label}
    </button>
  )
}
