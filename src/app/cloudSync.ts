/**
 * Cloud auth + the Supabase-backed SyncClient. Thin glue over the client;
 * the interesting logic (merging snapshots) is the pure mergeProgress in sync.ts.
 */
import type { Progress } from '@/core/storage/types'
import type { SyncClient } from './sync'
import { supabase } from './supabase'

const TABLE = 'progress'

export interface AuthUser {
  readonly id: string
  readonly email: string | null
}

/** Send a passwordless magic-link sign-in email. */
export async function signInWithEmail(
  email: string,
  redirectTo: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

/** Subscribe to sign-in/out; fires with the current user (or null). Returns an unsubscribe. */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user
    cb(u ? { id: u.id, email: u.email ?? null } : null)
  })
  return () => data.subscription.unsubscribe()
}

/** A SyncClient backed by the signed-in user's row (no-ops when signed out). */
export function createSupabaseSyncClient(): SyncClient {
  return {
    async pull() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) return null
      const { data, error } = await supabase
        .from(TABLE)
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return (data?.data as Progress | undefined) ?? null
    },
    async push(progress) {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) return
      const { error } = await supabase.from(TABLE).upsert({
        user_id: user.id,
        data: progress,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
  }
}
