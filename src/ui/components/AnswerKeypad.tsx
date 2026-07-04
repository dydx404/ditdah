/**
 * AnswerKeypad — tap targets for the unlocked characters.
 *
 * Makes the loop playable without a physical keyboard (phones, tablets). It
 * shows the *set* of unlocked characters — never which one is playing — so it
 * stays sound-first: you still have to decode by ear, then tap. On desktop the
 * keyboard still works; this is complementary.
 */
import { useT } from '@/i18n'

interface AnswerKeypadProps {
  chars: readonly string[]
  onAnswer: (char: string) => void
  /** Disabled during feedback so you can't tap ahead. */
  disabled?: boolean
}

export function AnswerKeypad({ chars, onAnswer, disabled = false }: AnswerKeypadProps) {
  const t = useT()
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label={t('keypad.aria')}
    >
      {chars.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={t('keypad.answer', { char: c })}
          disabled={disabled}
          onClick={() => onAnswer(c)}
          className="h-12 min-w-12 rounded-lg border border-border bg-surface px-3 font-mono text-lg text-text transition hover:border-accent hover:text-accent disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text"
        >
          {c}
        </button>
      ))}
    </div>
  )
}
