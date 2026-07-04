# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- **#34 — Strict mode + answer-sounds toggles**
  (`feat/strict-sound-settings`): add default-on settings for the retry gate and
  answer cue voice. Touches `useTrainerSession`; keep branch logic surgical.

## Blocked / waiting

- _(none noted)_

## Next

- **#21 — Scope account and cloud sync v0** is open as `needs-spec`; wait for
  Benson's product/back-end decision before implementing accounts.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- #33 merged as PR #39; main CI + Pages deploy were green after merge.
- Frozen contracts are all implemented; never edit any `core/*/types.ts`.
- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
