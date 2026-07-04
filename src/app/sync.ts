/**
 * Cloud-sync core — backend-agnostic. The pure merge that reconciles a local
 * Progress with a remote one (e.g. on sign-in, or when two devices diverge),
 * plus the client interface a concrete backend (Supabase, …) implements.
 *
 * Merge rules are chosen to be monotonic and safe under repeated application, so
 * we never lose an unlock and never corrupt the attempts ≥ correct invariant:
 *   - unlocked  → union, kept in Koch order
 *   - charStats → per character, keep whichever side has more attempts
 *                 (tie: more correct). Avoids double-counting cumulative totals.
 *   - streak    → the side with the later practice date wins (tie: higher count)
 *
 * Full delta/CRDT sync is intentionally out of scope: a single learner rarely
 * practices two devices at the same moment, so last-write-wins plus this
 * one-time reconciliation on link is enough for v1.
 */
import { KOCH_ORDER } from '@/core/morse'
import type { CharProgress, Progress, Streak } from '@/core/storage/types'

export interface SyncClient {
  /** The signed-in user's remote progress, or null if none is stored / signed out. */
  pull(): Promise<Progress | null>
  /** Overwrite the signed-in user's remote progress with this snapshot. */
  push(progress: Progress): Promise<void>
}

/** Reconcile two progress snapshots. Either may be null (nothing saved yet). */
export function mergeProgress(
  a: Progress | null,
  b: Progress | null,
): Progress | null {
  if (!a) return b
  if (!b) return a
  return {
    schemaVersion: Math.max(a.schemaVersion, b.schemaVersion),
    unlocked: mergeUnlocked(a.unlocked, b.unlocked),
    charStats: mergeCharStats(a.charStats, b.charStats),
    streak: mergeStreak(a.streak, b.streak),
  }
}

function kochIndex(char: string): number {
  const i = (KOCH_ORDER as readonly string[]).indexOf(char)
  return i === -1 ? KOCH_ORDER.length : i
}

function mergeUnlocked(
  a: readonly string[],
  b: readonly string[],
): readonly string[] {
  return [...new Set([...a, ...b])].sort(
    (x, y) => kochIndex(x) - kochIndex(y) || x.localeCompare(y),
  )
}

/** Keep the record with more attempts (tie: more correct) — never sum. */
function mergeCharStats(
  a: Readonly<Record<string, CharProgress>>,
  b: Readonly<Record<string, CharProgress>>,
): Record<string, CharProgress> {
  const out: Record<string, CharProgress> = {}
  for (const char of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const av = a[char]
    const bv = b[char]
    if (!av) {
      out[char] = bv
    } else if (!bv) {
      out[char] = av
    } else {
      const bWins =
        bv.attempts > av.attempts ||
        (bv.attempts === av.attempts && bv.correct > av.correct)
      out[char] = bWins ? bv : av
    }
  }
  return out
}

/** The later practice date wins its whole streak; on the same date, higher count. */
function mergeStreak(a: Streak, b: Streak): Streak {
  if (a.lastPracticedISO === null) return b
  if (b.lastPracticedISO === null) return a
  if (a.lastPracticedISO > b.lastPracticedISO) return a
  if (b.lastPracticedISO > a.lastPracticedISO) return b
  return a.count >= b.count ? a : b
}
