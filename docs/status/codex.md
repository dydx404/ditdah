# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- **#19 — Daily streak day-logic** (`feat/streak`): app-layer progress merge
  updates `Progress.streak` on scored answers without changing frozen contracts.
  PR #20 is open; local gates passed.

## Blocked / waiting

- _(none noted)_

## Next

- PR #18 (sound-first character reference) has merged to `main`.
- **#21 — Scope account and cloud sync v0** is open as `needs-spec`; wait for
  Benson's product/back-end decision before implementing accounts.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- Frozen contracts are all implemented; never edit any `core/*/types.ts`.
- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
