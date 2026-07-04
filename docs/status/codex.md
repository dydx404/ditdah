# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- **#23 — PWA installable + offline** (`feat/pwa`): add Vite PWA generation,
  generated app icons from `public/icon.svg`, and auto-update service worker
  registration.

## Blocked / waiting

- _(none noted)_

## Next

- **#21 — Scope account and cloud sync v0** is open as `needs-spec`; wait for
  Benson's product/back-end decision before implementing accounts.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- Frozen contracts are all implemented; never edit any `core/*/types.ts`.
- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
