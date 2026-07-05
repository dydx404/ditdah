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
import { normalizeSettings } from '@/app/settings'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'
import type { AnswerResult, Trainer } from '@/core/trainer/types'
import type { CharProgress } from '@/core/storage/types'
import { useTrainerSession } from './useTrainerSession'
import { StatsBar } from './components/StatsBar'
import { ListeningIndicator } from './components/ListeningIndicator'
import { ModeSelect } from './components/ModeSelect'
import { BufferSlots } from './components/BufferSlots'
import { FeedbackReveal } from './components/FeedbackReveal'
import { GroupFeedback } from './components/GroupFeedback'
import { SummaryScreen } from './components/SummaryScreen'
import { AnswerKeypad } from './components/AnswerKeypad'
import { UnlockToast } from './components/UnlockToast'
import { CharacterReference } from './components/CharacterReference'
import { SettingsPanel } from './SettingsPanel'
import type { AccountState } from './AccountSection'
import { HistoryPanel } from './HistoryPanel'
import { roundsToday, type RoundRecord } from '@/app/history'
import type { RoundSummary } from './useTrainerSession'
import { useT } from '@/i18n'
import { readDebugAnswerMode } from './debug'
import { STORY_CAMPAIGN, type Chapter } from '@/content/stories'
import { StoryChapterSelect } from './story/StoryChapterSelect'
import { StoryScreen } from './story/StoryScreen'
import {
  EMPTY_STORY_PROGRESS,
  type StoryProgress,
} from '@/app/storyProgress'
import type { StoryChapterSummary } from '@/app/storySession'

interface PracticeScreenProps {
  trainer: Trainer
  engine: ToneEngine
  timing: TimingConfig
  settings: Settings
  onSettingsChange: (settings: Settings) => void
  roundLength: number
  gateOnMiss: boolean
  answerSounds: boolean
  /** Cloud account + sync controls (undefined = sync UI hidden). */
  account?: AccountState
  /** Lifetime-ish stats for custom charset presets. */
  charStats?: Readonly<Record<string, CharProgress>>
  /** Koch-progress characters used by the custom picker "Unlocked" preset. */
  unlockedPresetChars?: readonly string[]
  /** Current daily streak (consecutive days practiced). */
  streak?: number
  /** Recent completed rounds, newest first. */
  history?: readonly RoundRecord[]
  /** Called after each scored answer (the app persists progress). */
  onAnswered?: (result: AnswerResult) => void
  /** Called once when a round finishes (the app persists history). */
  onRoundComplete?: (summary: RoundSummary) => void
  onClearHistory?: () => void
  /** Local Story Mode progress, intentionally separate from frozen core storage. */
  storyProgress?: StoryProgress
  /** Called once when a story chapter completes. */
  onStoryComplete?: (chapterId: string, summary: StoryChapterSummary) => void
}

export function PracticeScreen({
  trainer,
  engine,
  timing,
  settings,
  onSettingsChange,
  roundLength,
  gateOnMiss,
  answerSounds,
  account,
  charStats = {},
  unlockedPresetChars,
  streak,
  history = [],
  onAnswered,
  onRoundComplete,
  onClearHistory,
  storyProgress = EMPTY_STORY_PROGRESS,
  onStoryComplete,
}: PracticeScreenProps) {
  const t = useT()
  const debugAnswerMode = readDebugAnswerMode()
  const promptPoolHasSpaces = settings.promptPool.some((prompt) =>
    prompt.includes(' '),
  )
  const session = useTrainerSession({
    trainer,
    engine,
    timing,
    roundLength,
    gateOnMiss,
    sounds: answerSounds,
    debugAnswerMode,
    allowSpaceInGroups: promptPoolHasSpaces,
    onAnswered,
    onRoundComplete,
  })
  const { phase, start, replay, again } = session
  const isGroup = session.promptLength > 1
  const canSubmitGroup =
    session.buffer.length > 0 || debugAnswerMode === 'always-correct'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [storyView, setStoryView] = useState<'home' | 'chapters' | 'playing'>(
    'home',
  )
  const [storyChapter, setStoryChapter] = useState<Chapter | null>(null)
  const storyChapterIndex = storyChapter
    ? STORY_CAMPAIGN.chapters.findIndex((chapter) => chapter.id === storyChapter.id)
    : -1
  const nextStoryChapter =
    storyChapterIndex >= 0 ? STORY_CAMPAIGN.chapters[storyChapterIndex + 1] : undefined

  // Space/Enter as controls. Pool prompts with word gaps opt into using Space
  // as group input; otherwise Space stays a replay/start shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (storyView !== 'home') return
      if (phase === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        start()
      } else if (
        (phase === 'listening' || phase === 'retry') &&
        e.key === ' ' &&
        !(isGroup && promptPoolHasSpaces)
      ) {
        e.preventDefault()
        replay()
      } else if (phase === 'summary' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        again()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, start, replay, again, isGroup, promptPoolHasSpaces, storyView])

  return (
    <div className="relative flex h-full flex-col">
      <UnlockToast char={session.unlockToast} onDismiss={session.dismissToast} />
      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onClose={() => setSettingsOpen(false)}
        account={account}
        unlockedChars={unlockedPresetChars ?? session.unlocked}
        charStats={charStats}
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
              aria-label={t('action.openHistory')}
              onClick={() => setHistoryOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted transition hover:text-text"
            >
              <HistoryIcon />
            </button>
            <button
              type="button"
              aria-label={t('action.openSettings')}
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
          {phase === 'idle' && storyView === 'home' && (
            <motion.div
              key="idle"
              className="flex w-full flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ModeSelect
                settings={settings}
                onSelectMode={(apply) => {
                  setStoryView('home')
                  onSettingsChange(normalizeSettings({ ...settings, ...apply }))
                }}
                onOpenStory={() => setStoryView('chapters')}
                onStart={start}
              />
            </motion.div>
          )}

          {phase === 'idle' && storyView === 'chapters' && (
            <motion.div
              key="story-chapters"
              className="flex w-full flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StoryChapterSelect
                campaign={STORY_CAMPAIGN}
                progress={storyProgress.chapters}
                onBack={() => setStoryView('home')}
                onStartChapter={(chapter) => {
                  setStoryChapter(chapter)
                  setStoryView('playing')
                }}
              />
            </motion.div>
          )}

          {phase === 'idle' && storyView === 'playing' && storyChapter && (
            <motion.div
              key={`story-playing-${storyChapter.id}`}
              className="flex h-full w-full flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StoryScreen
                chapter={storyChapter}
                engine={engine}
                timing={timing}
                onExit={() => setStoryView('chapters')}
                onComplete={onStoryComplete}
                onNextChapter={
                  nextStoryChapter
                    ? () => setStoryChapter(nextStoryChapter)
                    : undefined
                }
              />
            </motion.div>
          )}

          {phase === 'listening' && (
            <motion.div
              key="listening"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isGroup ? (
                <>
                  <BufferSlots length={session.promptLength} value={session.buffer} />
                  <p className="font-mono text-xs text-muted/70">
                    {t('practice.copyGroupHint')}
                  </p>
                </>
              ) : (
                <ListeningIndicator />
              )}
            </motion.div>
          )}

          {phase === 'feedback' && session.lastResult && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {session.lastResult.perChar ? (
                <GroupFeedback result={session.lastResult} />
              ) : (
                <FeedbackReveal result={session.lastResult} />
              )}
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
                {t('practice.typeToContinue', { char: session.reveal ?? '' })}
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

      {storyView === 'home' && (
        <footer className="flex flex-col">
          {(phase === 'listening' || phase === 'feedback' || phase === 'retry') && (
            <div className="flex flex-col items-center gap-2 px-5 pb-3">
              <AnswerKeypad
                chars={session.unlocked}
                onAnswer={
                  isGroup
                    ? session.typeChar
                    : phase === 'retry'
                      ? session.retryAnswer
                      : session.answer
                }
                disabled={phase === 'feedback'}
              />
              {isGroup && phase === 'listening' && (
                <div className="flex items-center gap-2">
                  {promptPoolHasSpaces && (
                    <button
                      type="button"
                      aria-label={t('action.space')}
                      onClick={() => session.typeChar(' ')}
                      className="h-10 rounded-lg border border-border px-4 font-mono text-sm text-muted transition hover:text-text"
                    >
                      {t('action.space')}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={t('action.deleteLast')}
                    onClick={session.backspace}
                    disabled={session.buffer.length === 0}
                    className="h-10 rounded-lg border border-border px-4 font-mono text-sm text-muted transition hover:text-text disabled:opacity-40"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={session.submitGroup}
                    disabled={!canSubmitGroup}
                    className="h-10 rounded-lg bg-accent px-5 font-mono text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
                  >
                    {t('action.submit')}
                  </button>
                </div>
              )}
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
                {isGroup && promptPoolHasSpaces
                  ? t('action.replay')
                  : t('action.replaySpace')}
              </button>
            )}
            {phase === 'retry' && <span>{t('practice.echoToContinue')}</span>}
          </div>
        </footer>
      )}
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
