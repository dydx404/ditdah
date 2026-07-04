# ditdah

**The modern platform for learning and enjoying Morse Code (CW).**

Most Morse software still feels like it's from the early 2000s: listen, then type
on a keyboard. ditdah is the opposite bet — a fast, beautiful, sound-first way to
actually _become_ a CW operator, in the spirit of Monkeytype, Duolingo, and osu!.

> Learn Morse the way operators actually copy it — **by sound**, never from a
> chart of dots and dashes.

**▶ Live: https://dydx404.github.io/ditdah/** — installable (PWA), works offline,
local-first, no account.

## What it does (v0)

A single **receiving-practice loop**, done well:

- **Copy by ear** — hear a character, type (or tap) what you heard, get instant
  feedback. The character is never shown while you decode.
- **Koch method + Farnsworth timing** — you start with two characters and unlock
  more as your accuracy holds; each character is keyed at full speed with
  stretched gaps so beginners have room without slowing the character.
- **Rounds + summary** — practice in rounds; each ends with accuracy, effective
  WPM, characters unlocked, and the letters to focus on next.
- **Sticks with you** — daily streak, progress + session history persisted
  locally, so a refresh never resets you.
- **Yours to tune** — settings for character/overall WPM, sidetone, volume, and
  an _opt-in_ (default off) dit/dah reference for those who want it.
- **Anywhere** — keyboard on desktop, on-screen keypad on mobile; installable and
  offline as a PWA.

## Use it

Open **https://dydx404.github.io/ditdah/**, turn your sound on, press **Start
listening**, and type the letter you hear. On a phone: open in the browser →
"Add to Home Screen" to install it, then tap the character buttons to answer.

## Product principles

1. Fun before features
2. Beautiful, fast UI
3. Instant feedback / game feel
4. Learning science that works (Koch + Farnsworth, sound-first)
5. Local-first and open

**Hard rule:** the UI never teaches characters as visual dots and dashes by
default. The goal is instant sound recognition; a visual crutch caps learners
around 10 WPM forever.

See [ROADMAP.md](./ROADMAP.md) for the plan, [ARCHITECTURE.md](./ARCHITECTURE.md)
for the design, and [docs/AGENTS.md](./docs/AGENTS.md) for how contributors
(human and AI) work in this repo.

## Develop

```bash
npm install
npm run dev        # local dev server (http://localhost:5173)
npm test           # unit tests (Vitest)
npm run typecheck  # tsc, no emit
npm run lint       # oxlint
npm run build      # production build
```

Push to `main` auto-deploys to GitHub Pages.

## Tech

React 19 · TypeScript · Vite · Tailwind v4 · Motion · Vitest · vite-plugin-pwa.
Web Audio API for sample-accurate CW sidetone; local-first persistence
(localStorage).

## License

MIT — see [LICENSE](./LICENSE).
