# Claude — working memory

_Written only by Claude. Snapshot, not a diary. Last updated: 2026-07-04._

## Worktree

`~/ditdah-claude` (linked worktree; `~/ditdah` is Codex's — never touch it).

## In flight

- **PR #7** — v0 receiving loop UI (`feat/ui-practice-loop`), CI green, on the
  **dev stub trainer**. Awaiting merge + Benson's browser audio check.
- **PR (this)** — `chore/roadmap-and-status`: ROADMAP + status protocol.

## Blocked / waiting

- **#5 (Codex, `core/trainer`)** — when it merges, swap `createStubTrainer` →
  `createTrainer` from `@/core/trainer` in `src/App.tsx` (one line) and delete
  `src/ui/dev/`. Then re-run the loop.
- **Browser audio verification** — I can't hear audio headlessly. Need Benson to
  confirm: clean tone, no clicks, musical 20/10 WPM timing, instant feedback.

## Next (my lane)

1. Post-#5: wire real trainer, delete stub, verify loop end-to-end.
2. `core/storage` — freeze the contract, then persist progress (IndexedDB).
3. Deploy to Pages.

## Open questions

- Does the sidetone sound right in a real browser? (gates any audio polish)
- Default WPM (20/10) and 600 Hz — confirm they feel good, or make configurable
  sooner (Phase 2 settings).

## Notes

- Env: `conda activate nodejs` before npm (WSL; Linux node in conda).
- All four gates before any PR: `typecheck && test && lint && build`.
