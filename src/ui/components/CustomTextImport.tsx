import { tokenizeCustomText } from '@/app/promptPools'
import { useT } from '@/i18n'

interface CustomTextImportProps {
  text: string
  activeCount: number
  onTextChange: (text: string) => void
  onApply: (prompts: readonly string[]) => void
  onClear: () => void
}

export function CustomTextImport({
  text,
  activeCount,
  onTextChange,
  onApply,
  onClear,
}: CustomTextImportProps) {
  const t = useT()
  const prompts = tokenizeCustomText(text)

  return (
    <section className="flex flex-col gap-3 border-y border-border py-4">
      <div>
        <h3 className="font-mono text-sm font-semibold text-text">
          {t('customText.title')}
        </h3>
        <p className="mt-1 text-xs text-muted/75">{t('customText.hint')}</p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-mono text-xs text-muted">
          {t('customText.inputLabel')}
        </span>
        <textarea
          aria-label={t('customText.inputLabel')}
          value={text}
          placeholder={t('customText.placeholder')}
          onChange={(event) => onTextChange(event.currentTarget.value)}
          className="min-h-24 resize-y rounded-md border border-border bg-bg p-3 font-mono text-sm text-text outline-none transition placeholder:text-muted/50 focus:border-accent"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted/75">
          {activeCount > 0
            ? t('customText.activeCount', { count: activeCount })
            : t('customText.readyCount', { count: prompts.length })}
        </span>
        <span className="flex gap-2">
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted transition hover:text-text"
            >
              {t('customText.clear')}
            </button>
          )}
          <button
            type="button"
            disabled={prompts.length === 0}
            onClick={() => onApply(prompts)}
            className="rounded-md bg-accent px-2.5 py-1 font-mono text-xs font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
          >
            {t('customText.use')}
          </button>
        </span>
      </div>
    </section>
  )
}
