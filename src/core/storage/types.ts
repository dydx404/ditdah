/**
 * core/storage — contract (DRAFT).
 *
 * Local-first persistence. v0 is entirely client-side (IndexedDB); there is no
 * account and no server. "Your data never leaves your machine" is a feature.
 * The interface is storage-agnostic so an optional cloud sync can back it later
 * without touching callers.
 *
 * Marked DRAFT until the trainer's persisted shape settles.
 */

/** Everything we persist about a learner's progress, versioned for migration. */
export interface Progress {
  readonly schemaVersion: number
  /** Koch characters the learner has unlocked so far. */
  readonly unlocked: readonly string[]
  /** Lifetime attempts/correct per character. */
  readonly charStats: Readonly<Record<string, { attempts: number; correct: number }>>
  /** Consecutive-day streak bookkeeping. */
  readonly streak: { readonly count: number; readonly lastPracticedISO: string | null }
}

export interface ProgressStore {
  load(): Promise<Progress | null>
  save(progress: Progress): Promise<void>
  /** Wipe all local data (user-initiated reset). */
  clear(): Promise<void>
}
