import type { Campaign, Chapter } from '@/content/stories'
import type { StoryChapterProgress } from '@/app/storyProgress'
import { useT } from '@/i18n'

interface StoryChapterSelectProps {
  campaign: Campaign
  progress?: readonly StoryChapterProgress[]
  onBack: () => void
  onStartChapter: (chapter: Chapter) => void
}

export function StoryChapterSelect({
  campaign,
  progress = [],
  onBack,
  onStartChapter,
}: StoryChapterSelectProps) {
  const t = useT()

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {t('story.chapterSelect.eyebrow')}
          </p>
          <h2 className="mt-2 font-mono text-3xl font-bold text-text">
            {campaign.title}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-muted">
            {t('story.chapterSelect.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border px-3 py-2 font-mono text-sm text-muted transition hover:text-text"
        >
          {t('action.back')}
        </button>
      </div>

      <div className="grid gap-3">
        {campaign.chapters.map((chapter, index) => {
          const locked = index > 0
          const chapterProgress = progress.find(
            (record) => record.chapterId === chapter.id,
          )
          return (
            <button
              key={chapter.id}
              type="button"
              disabled={locked}
              onClick={() => onStartChapter(chapter)}
              className={[
                'flex items-start justify-between gap-4 rounded-lg border p-4 text-left transition',
                locked
                  ? 'cursor-not-allowed border-border/60 opacity-50'
                  : chapterProgress
                    ? 'border-accent/50 bg-accent/5 hover:border-accent/80'
                  : 'border-border hover:border-accent/70',
              ].join(' ')}
            >
              <span>
                <span className="font-mono text-lg font-semibold text-text">
                  {chapter.title}
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {chapter.setting}
                </span>
                <span className="mt-2 block text-sm text-muted/80">
                  {chapter.blurb}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="rounded-full border border-border px-2 py-1 font-mono text-xs text-muted">
                  {locked
                    ? t('story.chapter.locked')
                    : chapterProgress
                      ? t('story.chapter.completed')
                      : t('story.chapter.start')}
                </span>
                {chapterProgress && (
                  <>
                    <span className="font-mono text-xs text-accent">
                      {t('story.chapter.best', {
                        percent: Math.round(chapterProgress.bestAccuracy * 100),
                      })}
                    </span>
                    <span className="font-mono text-xs text-muted/80">
                      {t('story.chapter.plays', {
                        count: chapterProgress.playCount,
                      })}
                    </span>
                  </>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
