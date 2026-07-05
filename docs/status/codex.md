# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- Nothing in flight.

## Blocked / waiting

- Nothing currently blocked.

## Next

- Continue Story Mode one slice at a time: more chapters, better mission feel,
  or a deliberate synced progress schema issue if Benson wants cross-device
  story state.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- #91 guidebook merged as PR #92: added `docs/guidebook/README.md`, linked it
  from README, and kept the material sound-first with external resource links.
- Story Mode foundation, UI shell, local progress, chapter unlocks, three
  chapters, completion actions, and locked-chapter hints are merged through
  PR #88. Main CI passed; Pages needed a manual workflow_dispatch after two
  transient "Deployment failed, try again later" rerun failures and then passed.
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
