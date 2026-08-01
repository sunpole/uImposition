---
name: uimposition-product-gate
description: Mandatory before any non-trivial uImposition frontend, UX, backend, API, solver, persistence, pricing, import/export, PDF, performance, or product-behaviour change. Prevent implementation until the owner completes a one-question-at-a-time decision interview and explicitly confirms shared understanding.
---

# uImposition Product Gate

Use this skill before implementation whenever a request can change what the operator sees, enters, receives, calculates, stores, exports, pays for, or relies on.

## Read first

1. `AGENTS.md` and its required startup sources.
2. `docs/AGENT_SKILLS.md`.
3. `docs/agents/issue-tracker.md`.
4. `docs/agents/domain.md`.
5. Relevant code, tests, issues, PRs, fixtures and accepted evidence.

GitHub is the source of truth. Resolve factual questions by inspecting the repository and available tools; do not ask the owner for facts that can be discovered.

## Mandatory interview

Apply the installed `grilling` discipline. When the request also affects terminology, contracts or architecture, apply `domain-modeling` as part of the same conversation. If the owner explicitly invokes `grill-with-docs` or `grill-me`, follow that user-invoked flow.

- Walk every relevant branch of the decision tree.
- Resolve upstream decisions before dependent decisions.
- Ask exactly one question per message.
- With every question, provide a recommended answer and a short reason.
- Clearly separate facts, assumptions and owner decisions.
- Include frontend, backend, data, solver, error, mobile, accessibility, performance, migration, compatibility and recovery implications when relevant.
- Do not write production code, change behaviour, migrate data or open an implementation PR during the interview.
- A disposable prototype is allowed only when the owner explicitly approves it as evidence for one named unresolved question.

Do not treat silence, a topic change, or a partial answer as approval.

## Release condition

Implementation remains blocked until the owner explicitly confirms shared understanding. The recommended confirmation is:

> Общее понимание достигнуто. Можно переходить к спецификации и реализации.

After confirmation:

1. Use `to-spec` to publish the agreed behaviour.
2. Use `to-tickets` when the work needs more than one vertical slice.
3. Use `implement`, driving `tdd` at agreed seams.
4. Use `code-review` before commit or merge.
5. Follow the repository's branch, draft PR, exact-head CI and Chromium evidence rules.

## Exceptions

Skip the gate only for a bounded mechanical change, an unambiguous bug fix already specified by tests and accepted evidence, or an explicit owner waiver naming the exact change. If a product decision appears, stop and return to the interview.
