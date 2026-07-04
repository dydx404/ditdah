import { useMemo, useState } from 'react'
import { KOCH_ORDER, renderToElements, symbolsFor } from '@/core/morse'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'
import { useT } from '@/i18n'

interface CharacterReferenceProps {
  unlocked: readonly string[]
  timing: TimingConfig
  engine: ToneEngine
  /**
   * Show the visual dit/dah pattern column. Off by default — sound-first. Opt-in
   * via Settings; see `Settings.showPatterns`.
   */
  showPatterns?: boolean
}

const PATTERN_GLYPH = { dit: '·', dah: '–' } as const

function patternFor(char: string): string {
  const symbols = symbolsFor(char)
  return symbols ? symbols.map((s) => PATTERN_GLYPH[s]).join(' ') : ''
}

export function CharacterReference({
  unlocked,
  timing,
  engine,
  showPatterns = false,
}: CharacterReferenceProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked])

  const listenTo = (char: string) => {
    engine.play(renderToElements(char, timing), timing.toneHz)
  }

  return (
    <section className="w-full border-t border-border px-5 py-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="character-reference"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 font-mono text-xs text-muted transition hover:text-text"
      >
        <span>{t('reference.title')}</span>
        <span>{open ? t('reference.hide') : t('reference.show')}</span>
      </button>

      {open && (
        <div
          id="character-reference"
          className="mt-3 max-h-56 overflow-y-auto rounded-md border border-border bg-bg/40"
        >
          <table
            aria-label={t('reference.aria')}
            className="w-full border-collapse font-mono text-xs"
          >
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-normal">
                  #
                </th>
                <th scope="col" className="px-3 py-2 text-left font-normal">
                  {t('reference.colChar')}
                </th>
                <th scope="col" className="px-3 py-2 text-left font-normal">
                  {t('reference.colStatus')}
                </th>
                {showPatterns && (
                  <th scope="col" className="px-3 py-2 text-left font-normal">
                    {t('reference.colPattern')}
                  </th>
                )}
                <th scope="col" className="px-3 py-2 text-right font-normal">
                  {t('reference.colSound')}
                </th>
              </tr>
            </thead>
            <tbody>
              {KOCH_ORDER.map((char, index) => {
                const isUnlocked = unlockedSet.has(char)
                return (
                  <tr key={char} className="border-t border-border/70">
                    <td className="px-3 py-2 tabular-nums text-muted">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 text-text">{char}</td>
                    <td className={isUnlocked ? 'px-3 py-2 text-accent' : 'px-3 py-2 text-muted'}>
                      {isUnlocked ? t('reference.unlocked') : t('reference.upcoming')}
                    </td>
                    {showPatterns && (
                      <td className="px-3 py-2 tracking-wider text-muted">
                        {patternFor(char)}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        aria-label={t('reference.listen', { char })}
                        onClick={() => listenTo(char)}
                        className="rounded border border-border px-2 py-1 text-muted transition hover:text-text"
                      >
                        {t('action.play')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
