import { useMemo, useState } from 'react'
import { KOCH_ORDER, renderToElements, symbolsFor } from '@/core/morse'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'

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
        <span>Character reference</span>
        <span>{open ? 'hide' : 'show'}</span>
      </button>

      {open && (
        <div
          id="character-reference"
          className="mt-3 max-h-56 overflow-y-auto rounded-md border border-border bg-bg/40"
        >
          <table
            aria-label="Koch character reference"
            className="w-full border-collapse font-mono text-xs"
          >
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-normal">
                  #
                </th>
                <th scope="col" className="px-3 py-2 text-left font-normal">
                  char
                </th>
                <th scope="col" className="px-3 py-2 text-left font-normal">
                  status
                </th>
                {showPatterns && (
                  <th scope="col" className="px-3 py-2 text-left font-normal">
                    pattern
                  </th>
                )}
                <th scope="col" className="px-3 py-2 text-right font-normal">
                  sound
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
                      {isUnlocked ? 'unlocked' : 'upcoming'}
                    </td>
                    {showPatterns && (
                      <td className="px-3 py-2 tracking-wider text-muted">
                        {patternFor(char)}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        aria-label={`Listen to character ${char}`}
                        onClick={() => listenTo(char)}
                        className="rounded border border-border px-2 py-1 text-muted transition hover:text-text"
                      >
                        play
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
