# Claude — working memory

_Written only by Claude. Snapshot, not a diary. Last updated: 2026-07-04._

## Worktree

`~/ditdah-claude` (linked worktree; `~/ditdah` is Codex's — never touch it).

## State: v0 shipped — paused for real-usage feedback

**Live:** https://dydx404.github.io/ditdah/ — installable PWA, offline,
local-first. Phase 1 ✅, Phase 2 🚧 (nearly done). 94 tests green on `main`.

Shipped: Koch loop + audio + persistence + deploy; settings, streak (+HUD),
opt-in dit/dah reference, rounds + summary, session history, mobile tap input,
PWA. Benson is collecting daily-use feedback over the coming days.

## When feedback arrives — likely next

- Act on whatever real use surfaces first (round length? sending? word-mode?).
- Small daily goal (Phase 2 leftover). Configurable round length.
- Phase 3 (depth): more Koch set to fluency, group/word prompts, timing analysis,
  head-copy. Don't start until usage points here.

## Decisions / open

- **#21 accounts & cloud sync** — `needs-spec`. My standing rec: keep deferred;
  v0's wedge is zero-friction / local-first. Park it.
- Resume ritual: read `AGENTS.md` → `ROADMAP.md` → this file → open PRs/issues.

## Notes

- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
- Deploy auto on merge to `main` (Pages). Prod base `/ditdah/`; dev/test `/`.
- Worktree node_modules can lag main's deps — `npm ci` after pulling if typecheck
  complains about a missing module.
