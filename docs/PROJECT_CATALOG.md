# Каталог проекта uImposition / Project catalog

Последняя структурная сверка: **1 августа 2026**.

Этот документ отвечает на вопрос «где что лежит и куда добавлять новое». Архитектурные зависимости описаны в [`ARCHITECTURE.md`](ARCHITECTURE.md), а последовательность universal solver — в [`../research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`](../research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md).

## 1. Корень репозитория

| Путь | Назначение |
|---|---|
| `index.html` | Стабильный GitHub Pages entrypoint; перенаправляет в актуальное приложение `app/` |
| `app/` | Operator-first рабочее приложение: HTML, CSS, orchestration, responsive/acceptance helpers и PDF actions |
| `README.md` | Публичное назначение, архитектурная точка и ссылки на research/docs |
| `START_HERE.md` | Обязательная первая инструкция новой сессии |
| `AGENTS.md` | Жёсткие правила разработки в репозитории |
| `VERSION.json`, `VERSION.md`, `CHANGELOG.md` | Опубликованный version checkpoint и история; не обновляются каждым feature PR |
| `package.json` | Source/docs/unit gates; runtime сайта не требует build step |
| `decision-profile-demo.html` | Изолированная историческая демонстрация decision profile |
| `m3.css` … `m7-*.css`, `user-*.css` | Historical/technical UI styles; не подключаются корневым entrypoint и удаляются только отдельным dependency-audit PR |

Legacy root shell и удалённый `styles.css` сохранены в ветке:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

## 2. Основные каталоги

| Каталог | Что хранится | Правило |
|---|---|---|
| `app/` | Текущий пользовательский runtime | DOM orchestration не содержит новых solver formulas |
| `src/` | Production ES modules и pure models | Новая математика создаётся без DOM и имеет самостоятельные tests |
| `tests/` | Unit, integration, regression и property tests | Каждый новый pure module получает отдельный test file |
| `data/` | Fixtures, benchmarks и control cases | Fixture не читается solver как готовый answer |
| `research/` | Аудиты, внешние опоры и implementation decisions | Не является production implementation; лицензии проверяются отдельно |
| `docs/` | Канонические, нормативные, milestone и historical documents | Полный индекс — [`README.md`](README.md) |
| `tools/` | Docs, screenshot/PDF, news и release tooling | Tooling не меняет production formulas |
| `news/` | Patchnotes и release images | Только для настоящего version/release gate |
| `archive/development/` | Permanent release evidence | Не переписывать задним числом |
| `.github/workflows/` | Quality, Chromium/PDF, uNews и release automation | Merge только после exact-head gates |

## 3. Текущий runtime `app/`

```text
app/index.html
app/app.css
app/app.js
app/responsive-actions.js
app/acceptance-controls.js
app/txt-import.js
app/operator-review-fixes.js
app/pdf-export.js
```

Ответственность:

- render operator workspace;
- coordinate immutable application state;
- collect form input;
- call pure calculation modules;
- display validated results;
- never recreate geometry/production formulas in DOM code.

## 4. `src/`: input и application state

```text
config.js
sheet-press-presets.js
application-state.js
application-state-persistence.js
local-state-repository.js
product-row.js
product-row-txt.js
simple-product-row-txt.js
product-row-collection.js
application-product-rows.js
operator-workspace-calculation.js
operator-workspace-export.js
```

Назначение:

- versioned project/input/runtime state;
- built-in/local sheet/press presets;
- product rows и validation;
- legacy/simple TXT migration;
- calculation request/response adapter;
- selected-plan export adapter.

## 5. `src/`: текущая geometry и page model

```text
geometry.js
orders.js
orientation.js
front-layout.js
back-layout.js
imposition-validation.js
mixed-format-layout.js
odd-page-uniform-support.js
```

Текущие обязанности:

- sheet trim и press margins;
- uniform fitting 0°/90°;
- sequential page pairs;
- front layout;
- derived mirrored back;
- geometry/page/mirror validation;
- supplied mixed-layout validation;
- odd technical blank adapter.

`mixed-format-layout.js` не является automatic packing solver.

## 6. `src/`: candidate/search foundation

```text
imposition-candidate.js
candidate-generator.js
imposition-distribution.js
paper-minimizer.js
bounded-mixed-form-search.js
feasible-solution-catalog.js
```

Эти модули сохраняются как regression foundation и small-space building blocks.

Новая universal-solver разработка не должна:

- складывать все high-dimensional candidates в память;
- развивать large-order search только увеличением limits;
- смешивать geometry slots и run-length master state.

Draft PR `#85` допустим только после переработки в exhaustive small-space oracle.

## 7. Новые universal-solver модули

Ближайшие файлы:

```text
src/geometric-pattern.js
src/uniform-grid-patterns.js
tests/geometric-pattern.test.js
tests/uniform-grid-patterns.test.js
```

Поздние группы:

```text
src/mixed-strip-patterns.js
src/production-pattern.js
src/pattern-allocation.js
src/exhaustive-run-plan-oracle.js
src/restricted-master.js
src/pattern-pricing.js
src/column-generation.js
src/operator-case-memory.js
src/machine-constraints.js
```

Названия поздних файлов являются целевыми группами и могут уточняться отдельным PR, но слои G/P/R/C/M/E менять нельзя без нового architecture decision.

## 8. Production, metrics и cost

```text
print-specification.js
duplex-strategies.js
work-and-turn-layout.js
production-metrics.js
production-validation.js
production-report.js
production-cost.js
solution-metrics.js
production-solution-metrics.js
paper-solution-metrics.js
```

Инварианты:

- layout forms ≠ color plates;
- physical sheets ≠ press passes;
- underproduction invalid;
- missing price remains unavailable;
- work-and-turn uses explicit shared-form/transform validation.

## 9. Alternatives и operator decision

```text
optimization-objectives.js
decision-profile.js
pareto-alternatives.js
pareto-display-set.js
production-alternative-set.js
alternative-explanations.js
alternatives-runtime.js
alternatives-controller.js
user-uniform-production-plans.js
user-production-plans-runtime.js
user-objective-priority.js
user-production-comparison-table.js
```

Rules:

- source catalog remains lossless inside stated scope;
- filtering/ranking does not regenerate plans;
- recommendation is an annotation;
- explicit operator selection persists independently.

## 10. PDF и renderers

```text
pdf-document-model.js
pdf-binary.js
pdf-scheme-renderer.js
pdf-report-renderer.js
pdf-export-ui.js
scheme-renderer.js
production-report-renderer.js
```

Renderer consumes validated models. PDF structure and rendered output are independently checked by Chromium, `pdfinfo` and Poppler.

## 11. Historical UI modules

```text
src/app.js
src/app-shell-model.js
src/app-shell.js
src/app-shell-bootstrap.js
src/m3-demo.js
src/m7-decision-demo.js
src/pricing-ui.js
src/user-production-plans-ui.js
src/user-objective-priority-ui.js
src/user-production-plan-details-ui.js
src/alternatives-ui.js
```

Эти файлы больше не являются public root entrypoint. Некоторые используются regression tests, demos или historical scenarios. Их удаление разрешено только после:

1. dependency map;
2. replacement or removal of consumers;
3. exact-head source/unit gate;
4. Chromium/PDF regression;
5. confirmation that archive branch contains the removed state.

## 12. Tests и fixtures

### Основные группы tests

- application state/persistence/presets;
- product rows/TXT;
- geometry/orders/front/back;
- candidates/paper minimizer;
- production validation/report/cost;
- work-and-turn;
- alternatives/ranking/selection;
- PDF model/writer/renderers;
- operator workspace;
- bounded search contracts.

### Новая proof ladder

```text
G0 — exact uniform geometry
G1 — mixed strips
P0/P1 — product assignment
R0 — exhaustive small oracle
R1/R2 — restricted master/pricing
R3 — differential validation
benchmark — control case and real operator cases
M — machine constraints
```

### Data

| Файл | Роль |
|---|---|
| `data/control-case.json` | Поздний benchmark входных данных |
| `data/control-layout-m3.json` | Известный operator/oracle layout; production solver не читает его как answer |
| `data/production-regression-cases.json` | Production regression fixtures |
| `data/m7-decision-cases.json` | Decision/ranking fixtures |

## 13. Research records

```text
research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md
research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md
research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md
research/README.md
```

Research определяет:

- какие внешние проекты изучены;
- что реально можно использовать;
- лицензии и риски;
- geometry/master decomposition;
- column-generation direction;
- test and implementation order.

## 14. Automation

| Workflow/tool | Назначение |
|---|---|
| Quality | docs links/catalog, source syntax и Node tests |
| Chromium/PDF | real browser, viewports, downloads, PDF structure и Poppler render |
| uNews validation | patchnote/publication queue |
| release tooling | evidence, hashes, recovery branch, tag и Release |

Pure G0 PR требует Quality. Runtime/export changes требуют Chromium/PDF и visual artifact review.

## 15. Куда добавлять новое

| Материал | Путь |
|---|---|
| Pure geometry model | `src/` + matching `tests/` |
| Production assignment/master/pricing | `src/` + exact/brute-force tests |
| External oracle adapter | `tools/oracles/` или research-only script; не обязательный browser runtime |
| Benchmark input | `data/` |
| Operator-approved case | будущий versioned `data/operator-cases/` после schema PR |
| Canonical architecture rule | `docs/` |
| External investigation | `research/` |
| UI change | `app/`, без solver formulas |
| Release evidence | `archive/development/{version}/` |

## 16. Проверка

```bash
npm run check
```

Перед удалением historical files дополнительно запускать полный Chromium/PDF workflow.
