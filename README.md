# ditdah

**The modern platform for learning and enjoying Morse Code (CW).**

Most Morse software still feels like it's from the early 2000s: listen, then type
on a keyboard. ditdah is the opposite bet — a fast, beautiful, sound-first way to
actually _become_ a CW operator, in the spirit of Monkeytype, Duolingo, and osu!.

> Learn Morse the way operators actually copy it — **by sound**, never from a
> chart of dots and dashes.

## Status

Early. We're building the core of v0: a single **receiving-practice loop** —
hear a character, type what you heard, get instant feedback — using the Koch
method with Farnsworth timing. Everything runs in the browser, local-first, no
account required.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the design and [docs/AGENTS.md](./docs/AGENTS.md)
for how contributors (human and AI) work in this repo.

## Product principles

1. Fun before features
2. Beautiful, fast UI
3. Instant feedback / game feel
4. Learning science that works (Koch + Farnsworth, sound-first)
5. Local-first and open

**Hard rule:** the UI never teaches characters as visual dots and dashes. The
goal is instant sound recognition; a visual crutch caps learners around 10 WPM
forever.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (Vitest)
npm run typecheck  # tsc, no emit
npm run build      # production build
```

## Tech

React 19 · TypeScript · Vite · Tailwind v4 · Motion · Vitest. Web Audio API for
sample-accurate CW sidetone.

## License

MIT — see [LICENSE](./LICENSE).
