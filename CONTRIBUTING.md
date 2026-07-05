# Contributing to ditdah

Thanks for wanting to help build ditdah. This project is designed to be **easy to join**:
the code is modular and contracts-first, so you can own a piece without colliding with
anyone else. This guide gets you productive fast.

## The one hard rule (read this first)

**The UI never teaches a character as visual dots and dashes.** You hear a character, you
type it — the goal is instant *sound* recognition. A dot/dash chart builds a translation
habit that permanently caps a learner around 10 WPM.

- Feedback shows **letters and numbers**, never `·` / `–` as a teaching aid.
- The one sanctioned exception is the collapsible dit/dah reference, which is **opt-in and
  off by default**.

PRs that break this rule won't be merged. Everything else is negotiable.

## Setup

```bash
git clone https://github.com/dydx404/ditdah.git
cd ditdah
npm install
npm run dev        # http://localhost:5173
```

Node 20+ recommended. That's it — no backend or API keys needed to run locally (cloud
sync is optional and already configured with a public, RLS-protected key).

## Every PR must pass the gates

```bash
npm run typecheck && npm test && npm run lint && npm run build
```

CI runs the same four on every push. Green gates are the bar for merge.

## Where to plug in

Each module has a clear job. Pick one:

| You want to… | Work in |
|---|---|
| Add/tweak Morse timing or the character table | `src/core/morse` |
| Touch the tone engine or cue sounds | `src/core/audio` |
| Change prompt generation, scoring, or unlock logic | `src/core/trainer` |
| Add a practice mode or prompt content | `src/app/modes.ts`, `src/app/promptPools.ts` |
| **Write a Story chapter** (pure content!) | `src/content/` |
| Build UI / screens | `src/ui` |
| Add or improve a translation | `src/i18n` |
| Persistence / settings / sync | `src/app/*`, `src/core/storage` |

**Contracts-first:** each `core/*` module exposes a frozen `types.ts`. Implementations are
built against it. Changing a signature in a frozen `types.ts` is an architecture decision —
**open an issue first**. Adding an *optional* field is usually fine.

### Especially welcome

- **Story chapters** — write a scripted QSO/scenario as data; no engine code required.
- **Word lists & prompt pools** — more words, better callsign patterns, Q-code sets.
- **Translations** — a new locale is one new file in `src/i18n`.
- **`good first issue`** — [browse the label](https://github.com/dydx404/ditdah/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## Pull request conventions

- **One focused change per PR.** Small PRs get reviewed and merged faster.
- **Branch** off `main` (e.g. `feat/callsign-pool`, `fix/streak-rollover`).
- **Reference the issue** it addresses (`Closes #NN`).
- **Add tests** for logic (we use Vitest). Pure functions in `core/*` should be unit-tested.
- **Match the surrounding code** — TypeScript strict, the existing naming and comment style.
- **User-facing strings are i18n keys** — add them to `src/i18n/en.ts` and translate in
  `src/i18n/zh.ts` (missing keys fall back to English).

## Design & workflow docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — how the layers fit and *why*.
- [ROADMAP.md](./ROADMAP.md) — what's planned and in flight.
- [docs/AGENTS.md](./docs/AGENTS.md) — the human + AI working agreement (worktree isolation,
  single-writer status files). Useful even if you're only human. 🙂

## Questions

Open an issue or a draft PR — early feedback is cheap and welcome. Happy copying. **73!**
