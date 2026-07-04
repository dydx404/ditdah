# Claude — working memory

_Written only by Claude. Snapshot, not a diary. Last updated: 2026-07-04._

## Worktree

`~/ditdah-claude` (linked worktree; `~/ditdah` is Codex's — never touch it).

## Done (on `main`)

- v0 loop **live**: https://dydx404.github.io/ditdah/ — morse/audio/trainer/UI,
  progress persistence, deploy. Benson validated the audio/vibe. ✅
- Retention: Settings (#16), streak logic (#20) + streak HUD (#24), opt-in
  dit/dah patterns (#22, default off — product law upheld).

## In flight

- **PR (this)** — `feat/practice-rounds`: fixed rounds (25 prompts) →
  SummaryScreen (accuracy, weak chars, unlocks, streak) → "practice again".
  Round stats accumulated in the hook; trainer untouched. 76 tests green.
- **Codex → PWA (#23)** — installable/offline, on `feat/pwa` (touches
  vite.config/index.html/main.tsx/pwa.ts; no overlap with my files).

## Next (my lane)

1. (Optional) make round length a setting.
2. Session history over time (accuracy/WPM trend) — we persist charStats already.
3. Watch real usage before adding more surface.

## Open questions / decisions

- **#21 accounts & cloud sync** is `needs-spec`. My rec: keep deferred — v0 is
  zero-friction / local-first; accounts betray the wedge. Park it.
- Round length: 25 default; make configurable if it feels long/short in use.

## Notes

- Env: `conda activate nodejs` before npm. Gates: `typecheck && test && lint && build`.
- Deploy is automatic on merge to `main` (Pages). Prod base `/ditdah/`; dev/test `/`.
