# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- **#71 — Story Mode foundation** on `feat/story-foundation`: typed story
  content, First Contact chapter, and pure story session engine.

## Blocked / waiting

- Nothing currently blocked.

## Next

- After #71, build the Story UI shell as the next slice.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- #55-#60 advanced-mode queue is merged on main through PR #68. Main CI and
  Pages were green after #68.
- #50 cloud sync and #52 charset core are merged on main. #52 Pages deploy hit
  GitHub's transient "try again later" once and passed on rerun.
- UI localization extraction merged as PR #47; local gates, PR CI, main CI, and
  Pages deploy were green. The first Pages deploy attempt hit GitHub's
  transient "try again later" failure and passed on rerun.
- PR #46 added the i18n system; future extraction work should consume it, not
  alter the mechanism.
- #34 merged as PR #40; local gates, PR CI, main CI, and Pages deploy were green.
- #33 merged as PR #39; main CI + Pages deploy were green after merge.
- Frozen contracts are all implemented; never edit any `core/*/types.ts`.
- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
