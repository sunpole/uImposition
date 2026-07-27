# Codex Work task 01 — audit handoff and publish uImposition 0.7.0-alpha.5

## Repository

https://github.com/sunpole/uImposition

## Mode

Use Planning Mode for the initial repository, architecture and release audit because this is a cross-cutting and release-sensitive task. After the plan is verified, implement the approved release work without broad unrelated refactoring.

## Goal

Take over uImposition development from the repository documentation, verify the actual GitHub state, and publish the already merged M7.5 functionality as a complete `0.7.0-alpha.5` release checkpoint.

Do not begin M7.6 or a new solver until alpha.5 is fully published and independently verified.

## Required starting facts to verify

- repository: `sunpole/uImposition`;
- GitHub is the only source of truth;
- published checkpoint before this task: `0.7.0-alpha.4` / M7.4;
- functional M7.5 baseline after PR `#46`: `009451cce94d5cde05ee72305f30447aa65a646c`;
- documentation handoff merged through PR `#47`, merge commit `75e6155d8bb423fa4f160e31a0fd1b485d9f6dae`;
- current `main` must contain those commits or a later verified commit;
- next required checkpoint: `0.7.0-alpha.5` / M7.5;
- open non-blocking issue `#40` concerns the bad Telegram image for old alpha.2 and must not be mixed into the alpha.5 release unless handled as a separate verified task.

## Read before changing files

Read in this order:

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `docs/CODEX_HANDOFF.md`;
4. `VERSION.json`;
5. `VERSION.md`;
6. `CHANGELOG.md`;
7. `docs/CURRENT_STATE.md`;
8. `docs/REMAINING_WORK.md`;
9. `docs/TECHNICAL_SPECIFICATION_RU.md`;
10. `docs/ARCHITECTURE.md`;
11. `docs/M7_4_WORK_AND_TURN.md`;
12. `docs/M7_5_USER_UNIFORM_PRODUCTION_PLANS.md`;
13. `docs/M7_5_USER_PLAN_SELECTION_EXPORT.md`;
14. `docs/M7_5_OBJECTIVE_PRIORITY_EDITOR.md`;
15. `docs/PRODUCTION_COSTING.md`;
16. `docs/TEST_PLAN.md`;
17. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
18. `docs/VERSIONING.md`;
19. `docs/NEWS_PUBLISHING.md`;
20. recent PRs `#44`, `#45`, `#46`, `#47`;
21. related GitHub Actions artifacts;
22. current branches, tags, Releases and open issues.

If documentation and code disagree, do not silently choose one. Record the discrepancy and correct the authoritative document in the same release cycle.

## Initial audit report

Before implementation, give a concise factual report containing:

1. current `main` SHA;
2. published version and whether code is ahead of VERSION files;
3. actual architecture relevant to M7.5;
4. current test commands and latest verified results;
5. merged M7.5 scope;
6. release artifacts and automation available from alpha.4;
7. unresolved contradictions or blockers;
8. exact list of files expected to change for alpha.5.

After the report, continue the release work in the same session unless a real blocker requires owner input.

## M7.5 functionality that must be represented by alpha.5

### User-driven production plans

- user sheet/product geometry;
- user order lines and page pairs;
- fitting uniform-grid orientations `0°/90°`;
- `paperMinimum` and `dedicatedPairForms` plan families;
- front/back materialization;
- independent validation and production reports;
- zero-underproduction guard;
- sheets/forms/plates/passes/overrun/cost;
- lossless catalog;
- Pareto/recommended/dominated annotations without deleting plans.

### Explicit operator selection and export

- operator chooses any plan;
- recommendation never replaces explicit selection;
- real selected front/back schemes;
- selected production report;
- selected scheme PDF;
- selected report PDF;
- desktop/mobile details view.

### Objective priority editor

- 11 objectives when pricing is ready;
- presets `По умолчанию / Бумага / Стоимость / Формы / Прогоны / Перетираж`;
- accessible up/down controls;
- desktop drag-and-drop;
- immutable hard constraints;
- persistent operator objective preference;
- reranking without regenerating plans, layouts or reports;
- selected plan remains independent of recommendation.

## Non-negotiable invariants

- never accept underproduction;
- never build back independently from front;
- never convert missing money to zero;
- never mix layout forms with color plates;
- never remove feasible alternatives from catalog data;
- filters and sorting change only the view;
- never replace operator selection with recommendation;
- never call a feasible plan a proven minimum without lower-bound proof;
- never claim global completeness outside the explicit bounded search scope;
- never present a manual fixture as an automatic solver;
- do not claim machine compatibility from geometry alone;
- do not expose secrets or private data in screenshots, logs or news;
- do not move published tags.

## Release implementation

Create dedicated release-prep/publication branches and PRs according to the existing repository process. Do not push the entire milestone directly to `main`.

### Version synchronization

Update every required version source to `0.7.0-alpha.5`:

- `VERSION.json`;
- `VERSION.md`;
- `CHANGELOG.md`;
- `README.md`;
- `START_HERE.md`;
- visible version in `index.html`;
- `package.json`;
- screenshot scenario version assertions;
- release manifest and archive metadata;
- status, milestone and next target.

The next target after release should be M7.6, not a vague future milestone.

### Focused release evidence

Select a real focused scenario that best demonstrates M7.5 as a working user tool. The preferred evidence should show:

- a user-entered order;
- multiple retained plans;
- explicit operator selection;
- changed objective priority;
- recommendation different from selection if this remains visually clear;
- `reused plans > 0` and `regenerated plans = 0`;
- mobile or desktop readability.

Use the exact release commit in real Chromium. Do not reuse an older image. Visually inspect the final focused PNG/JPEG.

### Permanent evidence

Create a permanent archive under:

```text
archive/development/0.7.0-alpha.5/
```

Include or reference:

- release manifest;
- exact release commit;
- focused screenshot;
- screenshot manifest;
- capture log;
- quality log;
- relevant PDF/download verification;
- SHA-256 hashes;
- evidence ZIP metadata.

### News and Telegram

Create a new `news/*.md` patchnote and new real release image.

The patchnote must explain in normal operator language that alpha.5 is no longer limited to a preloaded control report: user input now creates verified production plans, every feasible plan inside the current bounded scope remains available, the operator can choose any plan, export its schemes/report, and reorder priorities without recalculating geometry.

Prepare the short uNews/Telegram payload in the existing repository format. Real Telegram publication must remain owned by uNews/GitHub Actions.

Do not reuse or modify the old alpha.2 Telegram post as part of this release.

### GitHub release checkpoint

After exact-head checks and publication merge:

1. identify the exact `releaseCommit`;
2. create recovery branch `release/v0.7.0-alpha.5`;
3. create immutable tag `v0.7.0-alpha.5` on the same commit;
4. create a real GitHub prerelease;
5. attach the focused image and permanent evidence ZIP;
6. independently open the Release card;
7. independently verify each asset, names, sizes and hashes;
8. verify the uNews publication state or queue result;
9. do not claim success from manifest/tag alone.

## Required checks

Run the existing exact-head workflows, including:

- source checks;
- all Node tests;
- Chromium screenshot scenarios;
- selected-plan PDF downloads;
- `pdfinfo` and Poppler verification;
- release-news/uNews validation.

Download and inspect the artifacts. A green workflow status alone is not enough.

For user-visible evidence, visually inspect the focused screenshot and state what was checked.

## Scope boundary to preserve in release text

The current user catalog is complete only inside:

```text
one shared product format
× uniform grid
× fitting rotation 0°/90°
× paperMinimum/dedicatedPairForms
× separate front/back forms
× one shared duplex color specification
× complete front/back page pairs
```

Alpha.5 must not claim:

- all possible real-world impositions;
- general automatic work-and-turn search;
- automatic mixed-format packing;
- mixed rotations on one sheet;
- individual geometry/colors for every row;
- one-sided/odd-page production;
- signature/folding imposition;
- profit/loss calculation;
- project persistence;
- machine compatibility.

## Completion report

At the end provide:

1. starting and final `main` SHAs;
2. version and exact release commit;
3. changed files;
4. PR numbers and merge commits;
5. exact test counts;
6. workflow run IDs;
7. artifact IDs and digests;
8. focused screenshot name and what was visually verified;
9. recovery branch;
10. immutable tag;
11. GitHub prerelease URL/status and attached assets;
12. patchnote and uNews/Telegram status;
13. remaining limitations;
14. confirmation that M7.6 has not been mixed into this release.

## Stop condition

This task is complete only when `0.7.0-alpha.5` is a verified GitHub prerelease with immutable recovery references, permanent evidence, release news and uNews state. After that, provide the proposed first M7.6 patch, but do not silently begin a large new solver in the alpha.5 release branches.
