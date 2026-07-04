/**
 * PracticeScreen — the whole v0 product: the receiving loop.
 * Hear a character → type it → instant feedback → next. Nothing else on screen.
 *
 * Trainer, engine, and timing are injected by the app root so this component is
 * a pure view over the session (and easy to point at the real trainer once #5
 * lands, in place of the dev stub).
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Settings } from '@/app/settings'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'
import type { AnswerResult, Trainer } from '@/core/trainer/types'
import { useTrainerSession } from './useTrainerSession'
import { StatsBar } from './components/StatsBar'
import { ListeningIndicator } from './components/ListeningIndicator'
import { FeedbackReveal } from './components/FeedbackReveal'
import { UnlockToast } from './components/UnlockToast'
import { SettingsPanel } from './SettingsPanel'

interface PracticeScreenProps {
  trainer: Trainer
  engine: ToneEngine
  timing: TimingConfig
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  /** Called after each scored answer (the app persists progress). */
  onAnswered?: (result: AnswerResult) => void
}

export function PracticeScreen({
  trainer,
  engine,
  timing,
  settings,
  onSettingsChange,
  onAnswered,
}: PracticeScreenProps) {
  const session = useTrainerSession({ trainer, engine, timing, onAnswered })
  const { phase, start, replay } = session
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Space/Enter as controls. Space is not a valid answer key, so it's free to
  // mean "start" (idle) and "replay" (listening) without clashing with copying.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        start()
      } else if (phase === 'listening' && e.key === ' ') {
        e.preventDefault()
        replay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, start, replay])

  return (
    <div className="relative flex h-full flex-col">
      <UnlockToast char={session.unlockToast} onDismiss={session.dismissToast} />
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onClose={() => setSettingsOpen(false)}
      />
      <StatsBar
        unlocked={session.unlocked}
        summary={session.summary}
        effectiveWpm={timing.effectiveWpm}
        actions={
          <button
            type="button"
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-md border border-border font-mono text-muted transition hover:text-text"
          >
            ⚙
          </button>
        }
      />

      <main className="grid flex-1 place-items-center px-6">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              className="flex flex-col items-center gap-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-mono text-4xl font-bold tracking-tight">
                dit<span className="text-accent">dah</span>
              </h1>
              <p className="max-w-xs text-muted">
                Copy Morse by ear. You'll start with two characters and unlock
                more as you go.
              </p>
              <button
                type="button"
                onClick={start}
                className="rounded-lg bg-accent px-6 py-3 font-mono font-semibold text-bg transition hover:brightness-110"
              >
                Start listening
              </button>
              <p className="font-mono text-xs text-muted/70">
                press Space · turn your sound on
              </p>
            </motion.div>
          )}

          {phase === 'listening' && (
            <motion.div
              key="listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ListeningIndicator />
            </motion.div>
          )}

          {phase === 'feedback' && session.lastResult && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FeedbackReveal result={session.lastResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="flex items-center justify-center gap-4 px-6 py-4 font-mono text-xs text-muted/70">
        {phase === 'listening' ? (
          <button
            type="button"
            onClick={replay}
            className="rounded border border-border px-3 py-1 text-muted transition hover:text-text"
          >
            replay (Space)
          </button>
        ) : (
          <span>type the letter you hear</span>
        )}
      </footer>
    </div>
  )
}
