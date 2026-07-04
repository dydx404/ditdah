# Working agreement (humans + AI agents)

This repo is built by a small team: **Benson** (owner, integrator, final say),
**Claude** (architect / tech lead / reviewer), and **Codex** (implementer).
Both AI agents read this file to stay aligned — we coordinate _through the
repo_, not through a chat channel. Keep it current; it is the source of truth
for process.

## Roles

- **Benson** — owns `main`. Merges PRs, arbitrates disagreements, owns product
  and taste decisions. The only one who deploys.
- **Claude** — decomposes work into specced issues, defines and freezes the
  contracts (`core/*/types.ts`), builds high-judgment pieces (the `core/audio`
  engine, UX/feel), and reviews PRs.
- **Codex** — implements well-specified issues (especially the pure, testable
  `core/*` modules), one issue per PR.

## The loop

```
issue (spec + acceptance criteria)  →  branch  →  PR  →  CI green  →  review  →  Benson merges
```

- **One issue = one branch = one PR.** Keep PRs small enough to review quickly.
- Only work issues labelled `ready` (they have acceptance criteria). If a spec
  is unclear, comment on the issue — do not guess and build the wrong thing.
- Trivial changes (typo, config) can skip the issue and go straight to a small
  PR.

### Labels

- `agent:codex` / `agent:claude` — who owns the issue. Don't pick up the other
  agent's issue without reassigning.
- `needs-spec` → `ready` → `in-progress` — issue lifecycle.
- `blocked` — waiting on something; say what in a comment.

## Rules that prevent collisions

1. **Stay in your module.** A PR touches the files its issue names and nothing
   else. Don't reformat, rename, or "improve" code outside your scope — it
   creates merge conflicts with the other agent's in-flight work.
2. **Contracts are frozen.** Do not change a `core/*/types.ts` marked frozen
   (`morse`, `audio`, `trainer`, `storage`). If the contract is wrong, open an
   issue and tag Claude — the fix is a deliberate decision, not an edit.
3. **Build against the interface, not the implementation.** Import types from
   `types.ts`. Don't reach into another module's internals.
4. **One agent per working directory.** Two agents must NEVER share a checkout —
   a `git checkout` in a shared tree switches the branch out from under the other
   and untracked files leak across branches. See "Working directories" below.

## Working directories (isolation)

Each agent works in its **own** directory backed by the same repo, via
`git worktree`:

- **`~/ditdah`** is **Codex's** primary checkout.
- **Claude** works in linked worktrees, e.g. `~/ditdah-claude`, created with
  `git worktree add`. One repo, one `.git`, isolated working trees — zero
  collisions.

Start-of-task ritual (both agents, in your own directory):

```bash
git fetch origin
git checkout main && git pull        # get the latest merged contracts
git checkout -b <type>/<feature>     # your branch for this issue
```

Never run `git checkout <branch>` in a directory another agent is using.

## Shared knowledge & working memory

So an agent can resume cold (out of tokens/context, or a fresh instance),
resumable state lives on disk — split by **write-ownership**, because two agents
writing one file collide just like two agents in one checkout.

- **Shared knowledge** (read by all, one deliberate writer, changed via PR):
  `ARCHITECTURE.md` + `AGENTS.md` + `core/*/types.ts` (Claude), and `ROADMAP.md`
  (Claude, the plan).
- **Live work queue + task assignment:** GitHub issues + labels — the source of
  truth for "what's next", not any status file.
- **Working memory** (strict single-writer): `docs/status/<agent>.md`. Claude
  writes only `claude.md`; Codex writes only `codex.md`. **Never** edit the other
  agent's file, and there is **no shared status file**.

Cold-start ritual: read `AGENTS.md` → `ROADMAP.md` → your own
`docs/status/<you>.md` → `git log` + open PRs/issues, then continue. Keep your
status file short and current, and commit it alongside your work. Full protocol:
[`docs/status/README.md`](status/README.md).

## Coding conventions

- **TypeScript, strict.** No `any`. `noUnusedLocals`/`noUnusedParameters` are on.
- **Small files, small functions.** Prefer many focused modules over big ones.
- **`core/*` is pure.** No DOM, no `window`, no React, no I/O in `core/morse`
  and `core/trainer`. `core/audio` is the exception (it owns the Web Audio API).
- **Audio timing uses the Web Audio clock**, never `setTimeout`/`setInterval`.
- **Imports:** use the `@/` alias for `src` (e.g. `import { ... } from '@/core/morse/types'`).
- **No visual dots/dashes in the UI as a teaching device.** Product law. Naming
  sounds `dit`/`dah` in code is fine; rendering `.` / `-` for the learner is not.
- **Format:** match the existing style (2-space indent, single quotes, no
  semicolons — Prettier defaults as configured). Run `npm run lint`.

## Testing

- **Every `core/*` module ships with unit tests** (`*.test.ts` beside the code).
- Tests run in the `node` environment by default (pure logic). A component test
  opts into jsdom with `// @vitest-environment jsdom` at the top of the file.
- Coverage is collected on `src/core/**`. Aim to cover the timing edge cases,
  not to chase a number.

## Definition of done (for an issue)

- [ ] Implements the acceptance criteria in the issue.
- [ ] `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` all pass.
- [ ] New logic has tests.
- [ ] PR description links the issue (`Closes #N`) and notes any deviation from
      the spec.

## Environment note

Native Node 20+ required (repo built on Node 26 / npm 11). On the owner's WSL box
the Linux `node` lives in a conda env — activate it before `npm`:
`conda activate nodejs`. This is machine-specific; CI uses a standard Node setup.

## Git

- Branch names: `feat/morse-timing`, `fix/gap-rounding`, `chore/ci`, etc.
- Write clear commit subjects in the imperative ("Add Farnsworth gap math").
- Do not add AI co-author trailers unless asked; the human owns the logical work.
