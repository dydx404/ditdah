# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- _(none noted)_

## Blocked / waiting

- **#21 — Scope account and cloud sync v0** is open as `needs-spec`; wait for
  Benson's product/back-end decision before implementing accounts.
- No open ready issues remain. For Phase 3 work, open a short specced issue and
  wait for Benson's thumbs-up before coding.

## Next

- Shape the next retention/depth issue once Benson confirms priority.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- UI localization extraction merged as PR #47; local gates, PR CI, main CI, and
  Pages deploy were green. The first Pages deploy attempt hit GitHub's
  transient "try again later" failure and passed on rerun.
- PR #46 added the i18n system; future extraction work should consume it, not
  alter the mechanism.
- #34 merged as PR #40; local gates, PR CI, main CI, and Pages deploy were green.
- #33 merged as PR #39; main CI + Pages deploy were green after merge.
- Frozen contracts are all implemented; never edit any `core/*/types.ts`.
- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
