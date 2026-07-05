# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- **#58 — Callsigns mode** on `feat/callsigns-mode`: generated callsign prompt
  pool wired through the Callsigns mode card.

## Blocked / waiting

- #59–#60 are queued after Callsigns lands.

## Next

- After #58, implement #59 Custom text, then #60 QSO.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

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
