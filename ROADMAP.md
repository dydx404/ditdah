# Roadmap

The ordered plan. Owned by Claude, changed via PR. The **live** state of any
single item is its GitHub issue/PR — this file is the narrative overview, not the
task tracker. One question gates every phase: _does the core loop make someone
come back tomorrow?_ We don't build a phase until the previous one earns it.

Status keys: ✅ done · 🚧 in progress · ⏳ next · 💭 later

## Phase 0 — Foundation ✅

Scaffold, toolchain, and the parallel-agent workflow.

- ✅ Vite + React + TS + Tailwind + Vitest, CI (lint/typecheck/test/build)
- ✅ `core/morse` — table, Koch order, Farnsworth timing (#2)
- ✅ `core/audio` — Web Audio sidetone engine + pure scheduler (#3)
- ✅ Frozen contracts; `AGENTS.md` working agreement; worktree isolation (#4)

## Phase 1 — The receiving loop (MVP) ✅

The entire v0 product: hear a character → type it → instant feedback. Koch +
Farnsworth, sound-first. **Goal: a loop Benson opens every day.**

- ✅ `core/trainer` — Koch progression, prompts, scoring, unlocks (#5)
- ✅ Practice loop UI — `PracticeScreen` + state machine (#7)
- ✅ Swap dev stub → real `core/trainer`; delete `ui/dev` (#9)
- ✅ Sound-first collapsible character reference (#17, #22)
- ✅ **Browser audio verification** — clean tone, musical timing (Benson ✓)
- ✅ `core/storage` + progress persistence (localStorage v0) (#10, #11, #14)
- ✅ Deploy (GitHub Pages) so it's reachable on any device (#12)

**Exit criteria (in progress):** Benson uses it daily for a week; a true
beginner can unlock several characters unaided.

## Phase 2 — Retention 🚧

Reasons to come back tomorrow.

- ✅ Daily streak — day-logic (#19, #20) + HUD (#24)
- ✅ Round-based sessions + end-of-round summary (#25)
- ✅ Session history (accuracy / WPM over time) (#28, #29)
- ✅ Settings: character/effective WPM, sidetone frequency, volume (#15, #16)
- ✅ Mobile on-screen tap input (#27)
- ✅ PWA (installable, offline) (#23)
- ✅ Small daily goal (#32)
- ✅ Configurable round length (#33)
- ✅ Strict mode + answer-sounds toggles (#34)

## Phase 3 — Depth 💭

From "copies letters" to "copies text."

- 💭 Full Koch set to fluency; per-character weakness targeting
- 💭 Group / word / callsign prompts (extend the trainer beyond single chars)
- 💭 Live timing analysis (character/word-spacing accuracy)
- 💭 Monkeytype-style free practice; import TXT/Markdown/EPUB
- 💭 Head-copy drills (no typing)

## Phase 4 — Delight & community 💭

Earned only after the loop is genuinely sticky.

- 💭 Achievements, leaderboards
- 💭 **Sending** (paddle/straight key) + real-time rhythm analysis — the moat
- 💭 ESP32-S3 key adapter (hardware comes _after_ the web product)
- 💭 Historical campaigns (WWII, maritime), contest sim, AI QSO partner
- 💭 Multiplayer / friend battles / real online CW

## Explicitly not now

Accounts/back-end, anything social, sending analysis, hardware — all deferred
until the receiving loop retains. See ARCHITECTURE.md "Non-goals for v0".
