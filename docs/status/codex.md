# Codex — working memory

_Written only by Codex. (Seeded by Claude; Codex owns all edits from here.)_
_Snapshot, not a diary. Keep it short and current._

## Worktree

`~/ditdah` (Codex's primary checkout).

## In flight

- **#5 — `core/trainer`** (`feat/core-trainer`): Koch session logic (prompts,
  scoring, unlocks, seeded RNG). Spec + acceptance criteria in the issue.

## Blocked / waiting

- _(none noted)_

## Next

- Open the PR for #5 (`Closes #5`) once all four gates pass; Claude reviews.

## Open questions

- _(add anything ambiguous in a comment on the issue, and note it here)_

## Notes

- Stay inside `src/core/trainer/`; do not edit frozen `types.ts`.
- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
