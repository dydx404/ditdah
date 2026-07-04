# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- **#15 — Settings** (`feat/settings`): persisted WPM, sidetone, and volume.
  PR #16 is open and green; awaiting Benson review/merge.

## Blocked / waiting

- _(none noted)_

## Next

- After #15 merges, pull `main`, check open issues, then move through Phase 2
  one specced issue at a time.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- Frozen contracts are all implemented; never edit any `core/*/types.ts`.
- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
