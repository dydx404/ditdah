import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { renderToElements, symbolsFor } from '@/core/morse'
import type { TimingConfig } from '@/core/morse/types'
import type { ToneEngine } from '@/core/audio/types'
import type { Chapter } from '@/content/stories'
import {
  createStorySession,
  displayStoryText,
  normalizeStoryInput,
  storyLinePlayableText,
  type StorySession,
  type StorySessionState,
  type StoryChapterSummary,
  type StoryTranscriptEntry,
} from '@/app/storySession'
import { BufferSlots } from '@/ui/components/BufferSlots'
import { AnswerKeypad } from '@/ui/components/AnswerKeypad'
import { useT } from '@/i18n'

const VALID_STORY_KEY = /^[a-z0-9.,?/=+-]$/i

interface StoryScreenProps {
  chapter: Chapter
  engine: ToneEngine
  timing: TimingConfig
  onExit: () => void
  onComplete?: (chapterId: string, summary: StoryChapterSummary) => void
  onNextChapter?: () => void
}

export function StoryScreen({
  chapter,
  engine,
  timing,
  onExit,
  onComplete,
  onNextChapter,
}: StoryScreenProps) {
  const t = useT()
  const sessionRef = useRef<StorySession | null>(null)
  const completionReportedRef = useRef(false)
  if (sessionRef.current === null) {
    sessionRef.current = createStorySession(chapter)
  }
  const session = sessionRef.current
  const [state, setState] = useState<StorySessionState>(() => session.state())
  const [buffer, setBuffer] = useState('')
  const activeLine = state.activeLine
  const expectedLength = activeLine
    ? normalizeStoryInput(activeLine.text).length
    : 0
  const canType =
    state.phase === 'copy' ||
    state.phase === 'retry' ||
    state.phase === 'assist' ||
    state.phase === 'send'
  const canSubmit = canType && buffer.length > 0
  const chapterChars = useMemo(() => charsForChapter(chapter), [chapter])
  const acceptsSpace = activeLine?.text.includes(' ') ?? false

  const playLine = useCallback(
    (text: string) => {
      void engine.resume().then(() => {
        engine.play(renderToElements(text, lineTiming(activeLine, timing)), timing.toneHz)
      })
    },
    [activeLine, engine, timing],
  )

  const replay = useCallback(() => {
    const text = activeLine ? storyLinePlayableText(activeLine) : null
    if (text) playLine(text)
  }, [activeLine, playLine])

  useEffect(() => {
    const text = activeLine ? storyLinePlayableText(activeLine) : null
    if (text && (state.phase === 'copy' || state.phase === 'narration')) {
      playLine(text)
    }
  }, [activeLine, playLine, state.phase])

  const commitState = useCallback(
    (next: StorySessionState, clearBuffer = true) => {
      setState(next)
      if (clearBuffer) setBuffer('')
      if (
        next.phase === 'complete' &&
        next.summary &&
        !completionReportedRef.current
      ) {
        completionReportedRef.current = true
        onComplete?.(chapter.id, next.summary)
      }
    },
    [chapter.id, onComplete],
  )

  const submit = useCallback(() => {
    if (!activeLine || !canSubmit) return

    if (state.phase === 'copy' || state.phase === 'retry') {
      commitState(session.submitCopy(buffer))
    } else if (state.phase === 'assist') {
      const next = session.submitAssist(buffer)
      commitState(next, next.phase !== 'assist')
    } else if (state.phase === 'send') {
      const next = session.submitSend(buffer)
      commitState(next, next.phase !== 'send')
    }
  }, [activeLine, buffer, canSubmit, commitState, session, state.phase])

  const appendChar = useCallback(
    (char: string) => {
      if (!canType || buffer.length >= expectedLength) return
      const next = (buffer + char).toUpperCase()
      setBuffer(next)
      if (next.length >= expectedLength) {
        if (state.phase === 'copy' || state.phase === 'retry') {
          commitState(session.submitCopy(next))
        } else if (state.phase === 'assist') {
          const submitted = session.submitAssist(next)
          commitState(submitted, submitted.phase !== 'assist')
        } else if (state.phase === 'send') {
          const submitted = session.submitSend(next)
          commitState(submitted, submitted.phase !== 'send')
        }
      }
    },
    [buffer, canType, commitState, expectedLength, session, state.phase],
  )

  const backspace = useCallback(() => {
    setBuffer((current) => current.slice(0, -1))
  }, [])

  const advanceNarration = () => {
    commitState(session.advanceNarration())
  }

  useEffect(() => {
    if (!canType) return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Enter') {
        event.preventDefault()
        submit()
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        backspace()
      } else if (VALID_STORY_KEY.test(event.key) || (acceptsSpace && event.key === ' ')) {
        event.preventDefault()
        appendChar(event.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [acceptsSpace, appendChar, backspace, canType, submit])

  return (
    <div className="flex h-full w-full max-w-3xl flex-col gap-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {t('story.title')}
          </p>
          <h2 className="mt-1 font-mono text-2xl font-bold text-text">
            {chapter.title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t('story.progress', {
              current: Math.min(state.lineIndex + 1, chapter.lines.length),
              total: chapter.lines.length,
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-md border border-border px-3 py-2 font-mono text-sm text-muted transition hover:text-text"
        >
          {t('action.exit')}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-surface/40 p-3">
        {state.transcript.map((entry) => (
          <TranscriptBubble
            key={entry.line.id}
            chapter={chapter}
            entry={entry}
          />
        ))}
        {activeLine && state.phase !== 'complete' && (
          <CurrentLine
            chapter={chapter}
            phase={state.phase}
            lineId={activeLine.id}
            speaker={speakerLabel(chapter, activeLine.speaker, t('story.you'))}
            text={displayStoryText(activeLine.text)}
            subtitle={activeLine.subtitle}
            lastAccuracy={state.lastAttempt?.accuracy ?? null}
          />
        )}
      </div>

      {state.phase === 'complete' && state.summary && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-accent">
            {t('story.complete')}
          </p>
          <p className="mt-2 font-mono text-4xl font-bold text-text">
            {Math.round(state.summary.accuracy * 100)}%
          </p>
          <p className="text-sm text-muted">
            {t('story.summary', {
              correct: state.summary.correct,
              total: state.summary.total,
              assisted: state.summary.assistedLines,
            })}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={onExit}
              className="rounded-lg border border-border px-4 py-2 font-mono text-sm text-muted transition hover:text-text"
            >
              {t('story.backToChapters')}
            </button>
            {onNextChapter && (
              <button
                type="button"
                onClick={onNextChapter}
                className="rounded-lg bg-accent px-4 py-2 font-mono text-sm font-semibold text-bg transition hover:brightness-110"
              >
                {t('story.nextChapter')}
              </button>
            )}
          </div>
        </div>
      )}

      {activeLine && state.phase === 'narration' && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={advanceNarration}
            className="rounded-lg bg-accent px-5 py-2.5 font-mono font-semibold text-bg transition hover:brightness-110"
          >
            {t('action.continue')}
          </button>
        </div>
      )}

      {canType && activeLine && (
        <div className="flex flex-col items-center gap-3">
          <BufferSlots length={expectedLength} value={buffer} />
          <AnswerKeypad chars={chapterChars} onAnswer={appendChar} />
          <div className="flex flex-wrap items-center justify-center gap-2">
            {acceptsSpace && (
              <button
                type="button"
                aria-label={t('action.space')}
                onClick={() => appendChar(' ')}
                className="h-10 rounded-lg border border-border px-4 font-mono text-sm text-muted transition hover:text-text"
              >
                {t('action.space')}
              </button>
            )}
            <button
              type="button"
              aria-label={t('action.deleteLast')}
              onClick={backspace}
              disabled={buffer.length === 0}
              className="h-10 rounded-lg border border-border px-4 font-mono text-sm text-muted transition hover:text-text disabled:opacity-40"
            >
              ⌫
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="h-10 rounded-lg bg-accent px-5 font-mono text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
            >
              {t('action.submit')}
            </button>
            <button
              type="button"
              onClick={replay}
              disabled={state.phase === 'send'}
              className="h-10 rounded-lg border border-border px-4 font-mono text-sm text-muted transition hover:text-text disabled:opacity-40"
            >
              {t('action.replay')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TranscriptBubble({
  chapter,
  entry,
}: {
  chapter: Chapter
  entry: StoryTranscriptEntry
}) {
  const t = useT()
  const speaker = speakerLabel(chapter, entry.line.speaker, t('story.you'))
  return (
    <div className="rounded-lg border border-border bg-bg/60 p-3">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        {speaker}
      </p>
      <p className="mt-1 font-mono text-lg text-text">
        {displayStoryText(entry.line.text)}
      </p>
      {entry.line.subtitle && (
        <p className="mt-1 text-sm text-muted">{entry.line.subtitle}</p>
      )}
    </div>
  )
}

function CurrentLine({
  chapter,
  phase,
  lineId,
  speaker,
  text,
  subtitle,
  lastAccuracy,
}: {
  chapter: Chapter
  phase: StorySessionState['phase']
  lineId: string
  speaker: string
  text: string
  subtitle: string | undefined
  lastAccuracy: number | null
}) {
  const t = useT()
  const hidden = phase === 'copy' || phase === 'retry'
  const label =
    phase === 'send'
      ? t('story.send')
      : phase === 'assist'
        ? t('story.assist')
        : phase === 'retry'
          ? t('story.retry')
          : phase === 'narration'
            ? t('story.narration')
            : t('story.incoming')

  return (
    <div
      className="rounded-lg border border-accent/50 bg-accent/10 p-3"
      data-line-id={lineId}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {label}
      </p>
      <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">
        {speaker}
      </p>
      {hidden ? (
        <>
          <p className="mt-2 text-sm text-muted">{t('story.hiddenCopy')}</p>
          {lastAccuracy !== null && (
            <p className="mt-1 font-mono text-xs text-muted">
              {t('story.lastAccuracy', {
                percent: Math.round(lastAccuracy * 100),
              })}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 font-mono text-lg text-text">{text}</p>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </>
      )}
      {phase === 'send' && (
        <p className="mt-2 text-xs text-muted/75">{t('story.sendHint')}</p>
      )}
      {phase === 'assist' && (
        <p className="mt-2 text-xs text-muted/75">{t('story.assistHint')}</p>
      )}
      <span className="sr-only">{chapter.id}</span>
    </div>
  )
}

function speakerLabel(
  chapter: Chapter,
  speakerId: string,
  youLabel: string,
): string {
  if (speakerId === 'you') return youLabel
  const speaker = chapter.characters.find((character) => character.id === speakerId)
  if (speaker === undefined) return speakerId
  return speaker.callsign ? `${speaker.name} / ${speaker.callsign}` : speaker.name
}

function charsForChapter(chapter: Chapter): string[] {
  const seen = new Set<string>()
  const chars: string[] = []
  for (const line of chapter.lines) {
    for (const raw of line.text) {
      const char = raw.toUpperCase()
      if (symbolsFor(char) === undefined || seen.has(char)) continue
      seen.add(char)
      chars.push(char)
    }
  }
  return chars
}

function lineTiming(
  line: { timing?: Partial<Pick<TimingConfig, 'charWpm' | 'effectiveWpm'>> } | null,
  timing: TimingConfig,
): TimingConfig {
  return {
    ...timing,
    ...line?.timing,
  }
}
