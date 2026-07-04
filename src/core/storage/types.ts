/**
 * core/storage — contract.
 *
 * Local-first persistence. v0 is entirely client-side; there is no account and
 * no server. "Your data never leaves your machine" is a feature. The interface
 * is async and storage-agnostic so an optional cloud sync can back it later
 * without touching callers.
 *
 * FROZEN interface. Implementations build against it; changing a signature here
 * is an architecture decision — open an issue first.
 */

/** Lifetime attempts/correct for a single character. */
export interface CharProgress {
  readonly attempts: number
  readonly correct: number
}

/** Consecutive-day streak bookkeeping. */
export interface Streak {
  readonly count: number
  /** ISO date (YYYY-MM-DD) of the last day practiced, or null if never. */
  readonly lastPracticedISO: string | null
}

/** Everything we persist about a learner's progress, versioned for migration. */
export interface Progress {
  readonly schemaVersion: number
  /** Koch characters the learner has unlocked so far, in Koch order. */
  readonly unlocked: readonly string[]
  /** Lifetime stats per character. */
  readonly charStats: Readonly<Record<string, CharProgress>>
  readonly streak: Streak
}

export interface ProgressStore {
  /**
   * Load saved progress, or null if nothing is saved. Implementations must
   * return null (rather than throw) when data is absent, corrupt, or written by
   * an incompatible future schema version — the app then starts fresh.
   */
  load(): Promise<Progress | null>
  /** Persist progress (overwrites any previous). */
  save(progress: Progress): Promise<void>
  /** Wipe all local data (user-initiated reset). */
  clear(): Promise<void>
}

/** Construct a progress store bound to a named store (defaults are fine). */
export type CreateProgressStore = () => ProgressStore
