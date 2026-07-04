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
import { SummaryScreen } from './components/SummaryScreen'
import { AnswerKeypad } from './components/AnswerKeypad'
import { UnlockToast } from './components/UnlockToast'
import { CharacterReference } from './components/CharacterReference'
import { SettingsPanel } from './SettingsPanel'
import { HistoryPanel } from './HistoryPanel'
import { roundsToday, type RoundRecord } from '@/app/history'
import type { RoundSummary } from './useTrainerSession'

interface PracticeScreenProps {
  trainer: Trainer
  engine: ToneEngine
  timing: TimingConfig
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  roundLength: number
  /** Current daily streak (consecutive days practiced). */
  streak?: number
  /** Recent completed rounds, newest first. */
  history?: readonly RoundRecord[]
  /** Called after each scored answer (the app persists progress). */
  onAnswered?: (result: AnswerResult) => void
  /** Called once when a round finishes (the app persists history). */
  onRoundComplete?: (summary: RoundSummary) => void
  onClearHistory?: () => void
}

export function PracticeScreen({
  trainer,
  engine,
  timing,
  settings,
  onSettingsChange,
  roundLength,
  streak,
  history = [],
  onAnswered,
  onRoundComplete,
  onClearHistory,
}: PracticeScreenProps) {
  const session = useTrainerSession({
    trainer,
    engine,
    timing,
    roundLength,
    onAnswered,
    onRoundComplete,
  })
  const { phase, start, replay, again } = session
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Space/Enter as controls. Space is not a valid answer key, so it's free to
  // mean "start" (idle), "replay" (listening), and "again" (summary) without
  // clashing with copying.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        start()
      } else if ((phase === 'listening' || phase === 'retry') && e.key === ' ') {
        e.preventDefault()
        replay()
      } else if (phase === 'summary' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        again()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, start, replay, again])

  return (
    <div className="relative flex h-full flex-col">
      <UnlockToast char={session.unlockToast} onDismiss={session.dismissToast} />
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onClose={() => setSettingsOpen(false)}
      />
      <HistoryPanel
        open={historyOpen}
        history={history}
        onClose={() => setHistoryOpen(false)}
        onClear={onClearHistory}
      />
      <StatsBar
        unlocked={session.unlocked}
        summary={session.summary}
        effectiveWpm={timing.effectiveWpm}
        streak={streak}
        roundsToday={roundsToday(history)}
        actions={
          <>
            <button
              type="button"
              aria-label="Open history"
              onClick={() => setHistoryOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted transition hover:text-text"
            >
              <HistoryIcon />
            </button>
            <button
              type="button"
              aria-label="Open settings"
              onClick={() => setSettingsOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-md border border-border font-mono text-muted transition hover:text-text"
            >
              ⚙
            </button>
          </>
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

          {phase === 'retry' && session.lastResult && (
            <motion.div
              key="retry"
              className="flex flex-col items-center gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FeedbackReveal result={session.lastResult} />
              <p className="font-mono text-sm text-accent">
                type <span className="font-bold">{session.reveal}</span> to
                continue
              </p>
            </motion.div>
          )}

          {phase === 'summary' && session.roundSummary && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SummaryScreen
                summary={session.roundSummary}
                streak={streak}
                onAgain={again}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="flex flex-col">
        {(phase === 'listening' || phase === 'feedback' || phase === 'retry') && (
          <div className="px-5 pb-3">
            <AnswerKeypad
              chars={session.unlocked}
              onAnswer={phase === 'retry' ? session.retryAnswer : session.answer}
              disabled={phase === 'feedback'}
            />
          </div>
        )}
        <CharacterReference
          unlocked={session.unlocked}
          timing={timing}
          engine={engine}
          showPatterns={settings.showPatterns}
        />
        <div className="flex h-12 items-center justify-center gap-4 px-6 font-mono text-xs text-muted/70">
          {(phase === 'listening' || phase === 'retry') && (
            <button
              type="button"
              onClick={replay}
              className="rounded border border-border px-3 py-1 text-muted transition hover:text-text"
            >
              replay (Space)
            </button>
          )}
          {phase === 'retry' && <span>echo it to continue</span>}
        </div>
      </footer>
    </div>
  )
}

function HistoryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h6" />
      <path d="M16 16l2 2 3-4" />
    </svg>
  )
}
