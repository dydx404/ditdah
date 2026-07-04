/**
 * AccountSection — sign-in + sync status inside Settings. Purely props-driven
 * (the App owns Supabase), so it stays decoupled and testable.
 */
import { useState } from 'react'
import { useT } from '@/i18n'

export interface AccountState {
  /** Signed-in user, or null when anonymous. */
  user: { email: string | null } | null
  /** A sync is in flight. */
  syncing: boolean
  /** Send a magic-link sign-in email. Rejects on failure. */
  onSignIn: (email: string) => Promise<void>
  onSignOut: () => void
}

export function AccountSection({ user, syncing, onSignIn, onSignOut }: AccountState) {
  const t = useT()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const send = async () => {
    if (!email.trim()) return
    setStatus('sending')
    try {
      await onSignIn(email.trim())
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <span className="font-mono text-sm text-muted">{t('account.title')}</span>

      {user ? (
        <>
          <p className="text-sm text-text">
            {t('account.signedInAs', { email: user.email ?? '' })}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-muted/70">
              {syncing ? t('account.syncing') : t('account.synced')}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-md border border-border px-3 py-1 font-mono text-xs text-muted transition hover:text-text"
            >
              {t('account.signOut')}
            </button>
          </div>
        </>
      ) : status === 'sent' ? (
        <p className="text-sm text-accent">{t('account.linkSent')}</p>
      ) : (
        <>
          <p className="text-xs text-muted/70">{t('account.blurb')}</p>
          <div className="flex gap-2">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-label={t('account.title')}
              placeholder={t('account.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && void send()}
              className="min-w-0 flex-1 rounded-md border border-border bg-bg px-3 py-1.5 font-mono text-sm text-text outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={status === 'sending' || !email.trim()}
              className="whitespace-nowrap rounded-md bg-accent px-3 py-1.5 font-mono text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-40"
            >
              {t('account.sendLink')}
            </button>
          </div>
          {status === 'error' && (
            <p className="text-xs text-error">{t('account.error')}</p>
          )}
        </>
      )}
    </div>
  )
}
