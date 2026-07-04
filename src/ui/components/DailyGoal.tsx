export const DAILY_GOAL = 3

interface DailyGoalProps {
  completed: number
  goal?: number
}

export function DailyGoal({ completed, goal = DAILY_GOAL }: DailyGoalProps) {
  const safeGoal = Math.max(1, Math.round(goal))
  const safeCompleted = Math.max(0, Math.floor(completed))
  const met = safeCompleted >= safeGoal

  return (
    <div
      className={[
        'flex h-7 items-center gap-1.5 rounded-full border px-2 font-mono text-xs tabular-nums',
        met
          ? 'border-accent bg-accent text-bg'
          : 'border-border bg-surface text-muted',
      ].join(' ')}
      title={`${safeCompleted} / ${safeGoal} today`}
    >
      {met && (
        <span aria-hidden="true" className="font-bold">
          ✓
        </span>
      )}
      <span>
        {safeCompleted} / {safeGoal}
      </span>
      <span className={met ? 'text-bg/80' : 'text-muted/70'}>today</span>
    </div>
  )
}
