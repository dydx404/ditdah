# Claude — working memory

_Written only by Claude. Snapshot, not a diary. Last updated: 2026-07-04._

## Worktree

`~/ditdah-claude` (linked worktree; `~/ditdah` is Codex's — never touch it).

## Done (this session)

- Real v0 loop is live on `main`: morse (#2) + audio (#3) + trainer (#6) + loop
  UI (#7) + stub→real swap (#9). Benson validated the audio/vibe. ✅
- Storage contract frozen (#10). All four core contracts now frozen.

## In flight

- **PR (this)** — `feat/deploy-gh-pages`: Vite `base: /ditdah/` (prod only) +
  Pages Actions workflow. Build emits `/ditdah/` paths; gates green.

## Blocked / waiting

- **#11 (Codex, `core/storage`)** — localStorage persistence. When it merges I
  wire it into the app (below).
- **Benson action:** after deploy PR merges, enable Pages once
  (Settings → Pages → Source: **GitHub Actions**).

## Next (my lane)

1. Wire storage into the app once #11 lands: load Progress on open, save on each
   answer/unlock, **rehydrate the trainer via `initialUnlockCount =
   progress.unlocked.length`** (no trainer-contract change needed). Persist
   charStats + streak too.
2. Mobile: on-screen tap input (answer buttons) so it's usable on a phone.
3. Phase 2: settings (WPM/tone/volume), session history, streak UI.

## Open questions

- Default WPM (20/10) + 600 Hz — keep, or expose settings sooner?

## Notes

- Env: `conda activate nodejs` before npm (WSL; Linux node in conda).
- Gates before any PR: `typecheck && test && lint && build`.
- Deploy: prod base is `/ditdah/`; dev/test stay at `/`.
