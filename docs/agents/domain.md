# Domain documentation

uImposition uses a single project context.

## Before exploring or changing the system

Read the sources required by `AGENTS.md`, then read:

- `CONTEXT.md` when it exists;
- relevant decisions under `docs/adr/` when they exist;
- the current milestone/task document;
- the domain documents relevant to the requested area.

Missing `CONTEXT.md` or ADR directories are not blockers. The `domain-modeling`, `grill-with-docs` and `improve-codebase-architecture` skills create or sharpen them only when real terminology or decisions are resolved.

## Vocabulary

Use the project's established terms consistently in issues, specifications, code, tests and documentation. Do not replace precise production terms with convenient synonyms.

When a needed concept is missing from the glossary, first determine whether it is an invented duplicate or a genuine domain gap. Genuine gaps are resolved through `domain-modeling`.

## Decisions

If proposed work contradicts an existing decision or invariant, surface the conflict explicitly. Never silently override production rules, solver boundaries, application-state contracts or release rules.
