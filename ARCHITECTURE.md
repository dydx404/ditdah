# Architecture

This document is the shared mental model for ditdah. It explains _why_ the code
is shaped the way it is so that any contributor — human or AI — can make changes
that fit. Read it before adding a module.

## The product, in one sentence

Turn complete beginners into confident CW operators through a fast, beautiful,
sound-first practice loop — starting with **receiving** (copying by ear).

## Two decisions that shape everything

1. **Receiving before sending.** Copying (hear → type) needs zero hardware, is
   where beginners spend their first months, and lets us give perfect instant
   feedback. Sending (keying with a real paddle) is the long-term wow-factor and
   moat, but it's a harder feedback problem and needs hardware. v0 is receiving
   only.

2. **Sound-first, always.** We teach with the **Koch method** (full-speed
   characters, introduced one at a time) and **Farnsworth timing** (stretched
   gaps so the overall pace is slow while each character stays crisp). The UI
   must **never** present a character as visual dots/dashes — that builds a
   translation habit that hard-caps learners around 10 WPM. This is a product
   law, enforced in code review, not a preference.

## Layering

The core is framework-agnostic and pure; the UI is a thin, replaceable shell.
Dependencies point downward only — `core/*` never imports from `ui/`.

```
App.tsx        Composition root: creates engine + trainer + stores, loads saved
               state, and wires callbacks. The only place that knows about all
               the pieces at once.
  ↓
app/           Browser-bound glue (not pure core): settings, progress-merge +
               streak, session history. localStorage-backed, best-effort.
ui/            React components + the useTrainerSession loop machine. Driven by
               core + app; holds the "game feel," no domain rules.
  ↓ imports
core/
  trainer/     Session logic: Koch progression, prompts, scoring. Pure.
  morse/       Character table, Koch order, timing math. Pure.
  audio/       Web Audio scheduler / sidetone engine. The load-bearing wall.
  storage/     Local-first persistence. Async, versioned schema.
```

- **`core/morse`** — pure functions and data. Text + `TimingConfig` →
  `KeyingElement[]` (a back-to-back on/off sequence). No DOM, no audio.
- **`core/audio`** — consumes `KeyingElement[]` and schedules precise sidetone
  on the Web Audio clock (`AudioContext.currentTime`), with click-free ramps.
  **Never** `setTimeout` for timing: dits are ~60ms and rhythm _is_ the skill.
- **`core/trainer`** — deterministic session state given a seeded RNG. Produces
  prompts, scores answers, tracks per-character accuracy, decides unlocks. It's
  a per-answer scorer; round/session structure lives in the UI, not here.
- **`core/storage`** — progress persistence behind an async interface so an
  optional cloud sync can back it later without touching callers. v0 is 100%
  local (localStorage).
- **`app/`** — the browser glue that isn't pure enough for `core/` but isn't a
  component: `settings`, `progress` (base+session merge & streak day-logic),
  `history` (rolling round log). Each is small, localStorage-backed, tested.
- **`ui/`** — components plus `useTrainerSession`, the loop state machine
  (`idle → listening → feedback → … → summary`). A round is N prompts; the hook
  accumulates round stats and exposes `onRoundComplete` for history. Renders
  state and forwards input (keyboard + on-screen keypad); holds no domain rules.

Why this split: the `core/*` layers are pure, unit-testable, and outlive the UI.
They're also cleanly separable, which is what lets multiple contributors (and
multiple AI agents) work in parallel without colliding — see
[docs/AGENTS.md](./docs/AGENTS.md).

## Contracts first

Each `core/*` module exposes a frozen `types.ts` that is the contract between
modules. Implementations are built against it. Changing a signature in a frozen
`types.ts` is an architecture decision — open an issue before doing it. All four
core contracts — `morse`, `audio`, `trainer`, `storage` — are frozen.

## Timing model (core/morse)

Standard PARIS timing at `charWpm`:

- 1 dit = `1200 / charWpm` ms; 1 dah = 3 dits.
- Intra-character gap = 1 dit; inter-character gap = 3 dits; word gap = 7 dits.

Farnsworth: characters are keyed at `charWpm`, but the inter-character and word
gaps are **stretched** so the overall rate equals the slower `effectiveWpm`.
When `charWpm === effectiveWpm`, timing reduces to standard PARIS.

## Non-goals for v0 (deliberately deferred)

Accounts/back-end, leaderboards, multiplayer, sending analysis, AI coach, QSO
simulation, campaigns, hardware adapters. Each is downstream of one question:
_does the core receiving loop make someone come back tomorrow?_ We earn those by
nailing the loop first.

## Deploy

Static front-end. Deployable free on GitHub Pages / Cloudflare Pages. Local-first
means no server to run for v0. A PWA wrapper (installable, offline) is a planned,
near-free upgrade.
