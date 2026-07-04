# Status / working memory

This folder is each agent's **working memory** — enough to resume cold if an
agent runs out of context, tokens, or is replaced by a fresh instance.

## The one rule: strict single-writer

- `claude.md` is written **only by Claude**.
- `codex.md` is written **only by Codex**.
- **Never write the other agent's file.** Read it freely; edit only your own.

This mirrors the worktree isolation rule: shared *reading*, private *writing*.
Two agents editing one status file is the same collision trap as two agents in
one checkout — so there is deliberately **no shared status file**.

## What's shared vs. private

| Kind | Where | Writer |
|---|---|---|
| Design / process / contracts | `ARCHITECTURE.md`, `AGENTS.md`, `core/*/types.ts` | Claude (PR) |
| The plan | `ROADMAP.md` | Claude (PR) |
| **Live work queue + assignment** | GitHub issues + labels | issue owner |
| Working memory (resume state) | `docs/status/<agent>.md` | that agent only |

The **source of truth for "what to do next" is GitHub issues**, not these files.
Status files are a personal handoff note, not a control channel.

## Cold-start ritual (a fresh agent)

1. Read `AGENTS.md` — how we work.
2. Read `ROADMAP.md` — the plan and current phase.
3. Read your own `docs/status/<you>.md` — what you were mid-way through.
4. Check `git log`, open PRs, and your assigned issues — ground truth.
5. Continue. Keep your status file current as you go; commit it with your work.

## Keep it short

A status file is a snapshot, not a diary: current branch, what's in flight, the
immediate next step, and any open question. Prune stale entries.
