# Agent Skills for uImposition

uImposition vendors the complete non-deprecated skill set from `mattpocock/skills` as a pinned Git submodule.

- Upstream: `mattpocock/skills`
- Pinned commit: `2ab958093e83e0ec752e6c1c5932da465bf23e0c`
- Vendor path: `.agent-vendor/mattpocock-skills`
- License: MIT, retained in the vendored repository
- Updates are manual and reviewed; nothing changes automatically.

The installation follows the upstream repository's own discovery rule: install every directory containing `SKILL.md`, except directories under `deprecated/`. This includes supported engineering/productivity skills and upstream `misc`, `personal` and `in-progress` skills.

## Install on a machine

First initialise the pinned source:

```bash
git submodule update --init --recursive
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-agent-skills.ps1
```

### macOS / Linux / Git Bash

```bash
bash scripts/install-agent-skills.sh
```

By default, the installers copy the skills to both user discovery locations:

- `~/.agents/skills` — Codex and Agent Skills-compatible agents;
- `~/.claude/skills` — Claude Code.

Restart the agent after installation so its skill index is rebuilt.

For an isolated project-local installation:

```bash
bash scripts/install-agent-skills.sh --root "$PWD"
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-agent-skills.ps1 -Root (Get-Location)
```

Project-local generated directories are ignored by Git. The pinned source, configuration and installers remain versioned.

## Collision safety

The installer records the names it manages in `.matt-pocock-skills-uimposition` inside each destination. It replaces only previously managed skill directories.

If an unrelated skill already uses the same name, installation stops. `--force` / `-Force` may be used only after intentionally deciding to replace that skill.

## Mandatory product clarification gate

Before writing implementation code for any non-trivial change to:

- frontend structure, UX, UI or responsive behaviour;
- backend, API or integration contracts;
- solver, imposition logic, production formulas or recommendation rules;
- application state, persistence, schemas or migrations;
- pricing, import/export, PDF or reporting behaviour;
- performance, cancellation, concurrency or long-running calculations;
- public terminology or operator workflow;

run `grill-with-docs` (preferred for engineering/product work) or `grill-me` (for a pure decision/design session).

The session must obey these rules:

1. Inspect GitHub, code, tests and documentation for factual answers instead of asking the owner.
2. Ask the owner only for decisions.
3. Ask exactly one question at a time.
4. Give a recommended answer with every question.
5. Resolve dependencies and edge cases branch by branch.
6. Do not write production code, migrate data or alter behaviour during the interview.
7. Continue until both the agent and owner believe the decision tree is resolved.
8. Implementation starts only after the owner explicitly confirms shared understanding.

Recommended confirmation phrase:

> Общее понимание достигнуто. Можно переходить к спецификации и реализации.

Until that confirmation, prototypes may be created only when the owner explicitly agrees that they are disposable evidence for answering a named design question.

## Delivery flow after confirmation

For substantial work:

```text
grill-with-docs
→ to-spec
→ to-tickets (when more than one vertical slice is needed)
→ implement
   → tdd at agreed seams
   → code-review before commit/merge
```

Use additional skills when the task fits:

- `diagnosing-bugs` — reproduce and isolate defects before fixing;
- `prototype` — disposable runnable evidence for an unresolved design question;
- `research` — primary-source investigation captured in the repository;
- `domain-modeling` — shared terminology and ADR decisions;
- `improve-codebase-architecture` — architecture review and deep-module opportunities;
- `wayfinder` — work too large for one agent session;
- `triage` — issue state transitions;
- `handoff` — compact continuation document;
- `resolving-merge-conflicts` — resolve by intent, never by blind side selection.

## Allowed gate exceptions

The interview can be skipped only when one of these is clearly true:

- spelling, formatting or link correction with no semantic change;
- generated-file refresh with an already approved source and process;
- dependency pin or infrastructure maintenance with no product decision;
- bug fix whose expected behaviour is already explicit in tests, specification and accepted evidence;
- the owner explicitly waives the gate for a named, bounded change.

If an apparently technical fix introduces a product choice, stop and return to the gate.

## Per-repository configuration

- Issue tracker: `docs/agents/issue-tracker.md`
- Triage vocabulary: `docs/agents/triage-labels.md`
- Domain documentation layout: `docs/agents/domain.md`
- Project-specific automatic gate: `agent-skills/uimposition-product-gate/SKILL.md`

## Updating the upstream set

Do not track upstream `main` automatically.

1. Review upstream changes and license.
2. Move the submodule to the intended immutable commit.
3. Update the expected commit in both installers and this document.
4. Run the installer into a temporary root.
5. Run `node scripts/check-agent-skills.mjs`.
6. Review the complete diff in a dedicated PR.
7. Merge only after exact-head checks pass.
