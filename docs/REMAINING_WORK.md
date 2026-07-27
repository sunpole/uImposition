# uImposition — актуальный остаток до 1.0

Дата актуализации: **27 июля 2026**.

## 1. Текущая точка

- опубликованный checkpoint: `0.7.0-alpha.4` / M7.4;
- текущий `main`: `009451cce94d5cde05ee72305f30447aa65a646c`;
- функциональный M7.5 уже объединён через PR `#44`, `#45`, `#46`;
- M7.5 ещё не получил version/release checkpoint;
- следующий обязательный релиз: `0.7.0-alpha.5`;
- следующий функциональный milestone после release: M7.6;
- полный handoff: `docs/CODEX_HANDOFF.md`.

## 2. Что уже завершено

### M1–M6

- sheet/product geometry;
- trim и press margins;
- page pairs;
- front/back layouts;
- imposition validation;
- production report;
- PDF schemes/report;
- bounded uniform candidate generation;
- paper minimizer;
- доказанный minimum `3305` листов для контрольного набора;
- manual mixed-format fixture validation;
- production regression fixtures.

### M7.1–M7.3

- optimization objectives;
- immutable decision profile;
- lexicographic ranking;
- guarded solution metrics;
- operator pricing;
- production cost model;
- Pareto frontier;
- materially different alternatives;
- RU/EN explanations и component deltas;
- sanitized alternatives runtime/UI.

### M7.4 / `0.7.0-alpha.4`

- separate front/back forms;
- work-and-turn control model;
- horizontal axis;
- symmetric shared form validation;
- strategy modes;
- independent reports;
- forms/plates comparison;
- release checkpoint опубликован.

### M7.5 functional scope — объединён, но не выпущен

PR `#44`:

- user orders → verified production plans;
- fitting `0°/90°`;
- `paperMinimum` и `dedicatedPairForms`;
- lossless catalog;
- dynamic cost.

PR `#45`:

- explicit operator selection;
- real front/back schemes;
- selected production report;
- selected scheme/report PDF;
- mobile details view.

PR `#46`:

- 11 objectives;
- presets;
- arrows и drag-and-drop;
- persistent objective preference;
- reranking without regeneration;
- selected plan independent from recommendation;
- `173/173` tests и full Chromium/PDF evidence.

## 3. Срочно: release checkpoint `0.7.0-alpha.5`

Это первый обязательный этап перед новым функциональным кодом.

### Version audit

- [ ] проверить фактический `main` и последние PR;
- [ ] обновить `VERSION.json`;
- [ ] обновить `VERSION.md`;
- [ ] обновить `CHANGELOG.md`;
- [ ] обновить README;
- [ ] обновить видимую версию сайта;
- [ ] обновить screenshot assertions;
- [ ] обновить status/milestone/nextTarget.

### Release evidence

- [ ] выбрать focused M7.5 scenario;
- [ ] снять реальный Chromium screenshot точного release commit;
- [ ] визуально проверить image;
- [ ] сохранить manifest, capture log и quality log;
- [ ] создать permanent evidence ZIP;
- [ ] посчитать SHA-256 assets;
- [ ] создать release manifest.

### Publication

- [ ] patchnote `news/*.md`;
- [ ] новое release image;
- [ ] короткий uNews/Telegram payload;
- [ ] version PR exact-head checks;
- [ ] publication PR checks;
- [ ] merge version/publication;
- [ ] recovery branch `release/v0.7.0-alpha.5`;
- [ ] immutable tag `v0.7.0-alpha.5`;
- [ ] настоящий GitHub prerelease;
- [ ] image и evidence ZIP как assets;
- [ ] независимая проверка Release card;
- [ ] независимая проверка каждого asset;
- [ ] подтверждение очереди/публикации uNews.

## 4. M7.6 — завершение операторской системы решений

Предлагаемая версия: `0.7.0-alpha.6`.

### Compact comparison table

- [ ] одна строка на каждый допустимый план;
- [ ] lossless `Все` по умолчанию;
- [ ] filters `Pareto / Recommended / Dominated`;
- [ ] режим `Только различия`;
- [ ] sorting по любой метрике;
- [ ] фильтр plan-family;
- [ ] фильтр duplex strategy;
- [ ] выбранный оператором plan выделен отдельно;
- [ ] recommendation не заменяет selection.

### Columns

- [ ] physical sheets;
- [ ] paper weight;
- [ ] layout forms;
- [ ] color plates;
- [ ] press passes;
- [ ] pair overrun;
- [ ] file overrun;
- [ ] split orders;
- [ ] imposition count;
- [ ] paper cost;
- [ ] form/plate cost;
- [ ] preparation cost;
- [ ] total cost;
- [ ] unit cost;
- [ ] proof/feasible status;
- [ ] orientation/grid;
- [ ] plan-family и duplex strategy.

### Explanation

- [ ] exact component deltas;
- [ ] первая цель, по которой recommendation победила;
- [ ] что лучше и что хуже;
- [ ] равные метрики;
- [ ] technical boundaries.

### Quality

- [ ] pure table model tests;
- [ ] no recalculation on filter/sort;
- [ ] desktop Chromium evidence;
- [ ] mobile Chromium evidence;
- [ ] selected scheme/report/PDF regression;
- [ ] release checkpoint.

## 5. Расширение search space после M7.6

Нельзя выполнять одним гигантским PR. Каждый новый plan-family — отдельный bounded patch с собственной полнотой и validation.

### 5.1 Additional uniform plan-family

- [ ] частично заполненные формы;
- [ ] controlled pair mixing;
- [ ] несколько event run lengths;
- [ ] bounded sequences of forms;
- [ ] explicit search limits;
- [ ] truncation status;
- [ ] deterministic signatures;
- [ ] no duplicate production-equivalent plans;
- [ ] lossless retention of materially different plans.

### 5.2 User-driven work-and-turn

- [ ] eligibility detection;
- [ ] symmetric shared-form candidates;
- [ ] horizontal axis search;
- [ ] separate vs work-and-turn in one user catalog;
- [ ] exact forms/plates/passes/cost;
- [ ] operator machine warning;
- [ ] no automatic compatibility claim;
- [ ] later vertical axis as separate patch.

### 5.3 Search completeness contract

- [ ] describe each bounded search family;
- [ ] expose candidate counts;
- [ ] expose truncation/time limits;
- [ ] distinguish `complete within scope`, `feasible`, `lower bound reached`;
- [ ] never label partial search as global all-options search.

## 6. M8.1 — automatic mixed-format packing

- [ ] different product rectangles on one sheet;
- [ ] sheet/printable boundaries;
- [ ] individual bleed/gap;
- [ ] no overlap;
- [ ] deterministic result;
- [ ] free-area explanation;
- [ ] control fixture `1×A4 + 2×A5 + 8×A6`;
- [ ] compare mixed packing with uniform plans;
- [ ] multiple valid packings retained.

## 7. M8.2 — mixed rotations and cutting

- [ ] `0°` и `90°` на одном sheet;
- [ ] common-cut constraints;
- [ ] separate-cut constraints;
- [ ] grouping identical products;
- [ ] cutting complexity metrics;
- [ ] assembly convenience metrics;
- [ ] optional explicit cutting cost;
- [ ] no hidden heuristic penalty.

## 8. M8.3 — full order-row model

Каждая строка должна иметь собственные:

- [ ] file/name;
- [ ] quantity;
- [ ] pages;
- [ ] width/height;
- [ ] bleed;
- [ ] gap/cutting mode;
- [ ] front colors;
- [ ] back colors;
- [ ] allowed duplex strategy;
- [ ] paper/material profile;
- [ ] note;
- [ ] status/errors.

UI:

- [ ] add/edit;
- [ ] duplicate;
- [ ] delete;
- [ ] reorder;
- [ ] bulk paste/import;
- [ ] one invalid row does not delete valid rows.

## 9. M8.4 — one-sided, odd and folded products

### One-sided and odd pages

- [ ] explicit one-sided job;
- [ ] intentional blank back;
- [ ] correct plates/forms/cost;
- [ ] odd final page;
- [ ] no fake back plate.

### Multi-page imposition

- [ ] decide 1.0 boundary for 8/16/32 pages;
- [ ] either implement signature/folding imposition;
- [ ] or explicitly limit stable to sequential pairs;
- [ ] page-order validation after folding;
- [ ] orientation/turn validation.

## 10. M8.5 — project persistence and portability

- [ ] versioned project schema;
- [ ] auto-save latest state;
- [ ] `localStorage`;
- [ ] export JSON;
- [ ] import JSON;
- [ ] validation and migration;
- [ ] pricing profile;
- [ ] objective preference;
- [ ] selected plan reference;
- [ ] safe recovery from corrupted/incompatible file;
- [ ] clear/reset workflow.

## 11. M8.6 — profitability model

Сейчас есть cost, но нет revenue/profit.

- [ ] sale price or order revenue;
- [ ] profit/loss;
- [ ] margin percent;
- [ ] minimum margin threshold;
- [ ] cost of cutting;
- [ ] folding/binding/finishing costs;
- [ ] transport/other explicit components;
- [ ] unprofitable status;
- [ ] unprofitable plans remain visible;
- [ ] no hidden business coefficient;
- [ ] exact explanation of loss.

## 12. M8.7 — heavy search worker

- [ ] Web Worker or equivalent isolated search;
- [ ] progress events;
- [ ] cancel;
- [ ] time budget;
- [ ] memory/candidate budget;
- [ ] partial results marked incomplete;
- [ ] deterministic resume/retry if feasible;
- [ ] UI remains responsive;
- [ ] safe error recovery;
- [ ] no private data upload.

## 13. M8.8 — compactness, accessibility and parity

- [ ] super-compact mobile mode;
- [ ] dense desktop operator mode;
- [ ] collapsible sections;
- [ ] keyboard navigation;
- [ ] visible focus;
- [ ] screen-reader labels;
- [ ] color-independent states;
- [ ] large touch targets;
- [ ] RU/EN feature parity;
- [ ] no horizontal overflow except local dense tables;
- [ ] performance on large catalogs.

## 14. Beta matrix

### B1 — production combinations

- [ ] all current sheet presets;
- [ ] arbitrary sheet sizes;
- [ ] A4/A5/A6 and custom products;
- [ ] grammage/price variations;
- [ ] bleed `0/2/5`;
- [ ] common/separate cut;
- [ ] separate/work-and-turn;
- [ ] one-sided/duplex;
- [ ] odd/multipage;
- [ ] equal and very different quantities;
- [ ] zero/max margins and trim;
- [ ] real anonymized work orders.

### B2 — technology boundaries

- [ ] machine profiles or explicit operator-only checks;
- [ ] gripper/side-lay rules;
- [ ] work-and-turn compatibility warnings;
- [ ] folding boundary;
- [ ] printable geometry edge cases.

### B3 — stability

- [ ] stress tests;
- [ ] browser matrix;
- [ ] GitHub Pages verification;
- [ ] project migrations;
- [ ] worker failure recovery;
- [ ] performance budgets.

## 15. RC and stable

### RC1

- [ ] feature freeze;
- [ ] full geometry/production/cost audit;
- [ ] security/workflow/secret audit;
- [ ] user guide;
- [ ] real examples;
- [ ] clean public page;
- [ ] final evidence package.

### 1.0.0

- [ ] only RC blockers;
- [ ] recovery branch;
- [ ] immutable tag;
- [ ] GitHub Release;
- [ ] final uNews/Telegram post;
- [ ] archive policy;
- [ ] next-version policy.

## 16. Known non-blocking debt

- [ ] issue `#40`: replace bad image of Telegram message `@uNewsLog/76` for `0.7.0-alpha.2` using uNews `edit:media`;
- [ ] do not delete/repost the Telegram message;
- [ ] verify final media visually and update uNews state.

## 17. Principles that must survive every milestone

- user chooses; software recommends;
- all feasible variants inside stated scope remain available;
- filters never delete catalog data;
- underproduction is forbidden;
- back is derived from front;
- pricing is explicit;
- missing money is not zero;
- layout forms and color plates stay separate;
- paper minimum is not global business optimum;
- manual fixtures are not automatic solvers;
- truncated search is visibly truncated;
- every published patch gets full release evidence and immutable recovery checkpoint.
