# План тестирования / Test Plan

Последнее обновление: **1 августа 2026 года**.

Исследовательская основа:

- [`../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md);
- [`../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md).

## 1. Главная цель

Тесты должны доказывать не только отсутствие ошибок выполнения, но и производственную корректность:

- геометрия действительно помещается;
- прямоугольники не пересекаются;
- лицо и оборот связаны правильным transform;
- недопечатка равна нулю;
- формы, пластины, прогоны и деньги пересчитаны независимо;
- результат отмечен честным proof/completeness status;
- подтверждённый человеком case не подставляется без повторной проверки.

## 2. Уровни тестирования

1. pure unit tests;
2. mathematical fixtures с точным ожидаемым результатом;
3. property tests;
4. randomized small cases против brute-force oracle;
5. differential tests против независимых внешних solvers;
6. integration: geometry → assignment → runs → report;
7. повторная materialization front/back/shared plate;
8. независимая production validation;
9. real Chromium desktop/mobile;
10. browser downloads;
11. structural PDF verification;
12. `pdfinfo` и полный Poppler render;
13. ручной просмотр доказательных PNG/PDF;
14. documentation link/catalog validation.

## 3. Организация тестовых данных

```text
tests/fixtures/       маленькие детерминированные случаи
tests/properties/     property/random generators
tests/oracles/        brute-force и differential harness
data/benchmarks/      большие контрольные задачи
data/operator-cases/  подтверждённые технологом решения
data/examples/        пользовательские примеры
```

Один input может использоваться в нескольких ролях, но production solver не читает ожидаемый answer из benchmark/operator fixture.

## 4. Geometry ladder

### G001 — один квадрат

- printable area точно кратна квадрату;
- expected rows, columns, capacity и coordinates;
- rotation не создаёт нового структурно отличающегося результата.

### G002 — pure 0° лучше 90°

- rectangular product;
- exact capacity 0° больше;
- 90° сохраняется как допустимый, если помещается;
- recommendation не удаляет второй pattern.

### G003 — pure 90° лучше 0°

- зеркальный сценарий G002;
- проверка rotation metadata и стрелки.

### G004 — mixed strips лучше обеих pure grids

- fixture, где combination 0°/90° даёт строго больше slots;
- точные strip boundaries;
- no overlap;
- occupied/waste area;
- pure-grid solver не имеет права объявлять global maximum.

### G005 — trim, margins, bleed и gap

- beforeTrim → afterTrim;
- `afterTrim` не уменьшается повторно;
- press margins применяются после trim;
- увеличение bleed/gap не увеличивает capacity;
- coordinates учитывают реальные расстояния.

### G006 — произвольный прямоугольник

- нестандартный квадратный, узкий и широкий product;
- 0°/90°;
- fractional millimeters;
- boundary-touch допустим, выход за boundary запрещён.

### G007 — geometry property tests

Для случайных малых inputs:

- увеличение printable sheet не уменьшает найденную pure-grid capacity;
- увеличение product/gap не увеличивает pure-grid capacity;
- все slots внутри printable area;
- нет overlap;
- rotation дважды возвращает исходные размеры;
- structural signature детерминирована.

### G008 — differential geometry oracle

Малые случаи сравниваются с:

- независимым brute-force grid/strip oracle;
- `rectpack`/PackingSolver research runner;
- несколькими MaxRects/Skyline/Guillotine implementations.

External result не принимается автоматически: сравниваются placements, capacity и status.

## 5. Production-assignment ladder

### P001 — simplex, один вид

```text
sheets = ceil(quantity / capacity)
underproduction = 0
```

Проверяются produced quantity и overrun.

### P002 — separate duplex mirror

- одинаковое количество позиций каждой пары на front/back;
- для строки `1 2 3 4` оборот `4 3 2 1`;
- строки не меняются местами;
- `→` превращается в `←`;
- два layout forms и два passes на physical sheet.

### P003 — нечётное число страниц

- 1, 3 и 5 страниц;
- final `backPage = null`;
- технический blank не превращается в номер страницы;
- полностью пустой оборот монтажа не создаёт лишнюю печатную сторону;
- mixed complete/incomplete pairs сохраняют реальные обороты.

### P004 — work-and-turn на чётной симметричной сетке

- transform является involution;
- нет fixed slots;
- одна shared layout form;
- два passes;
- control front/back отображают готовое изделие;
- PDF shared plate содержит одну печатную форму на монтаж.

### P005 — work-and-turn на нечётной сетке

Отдельные tests для:

- horizontal reflection;
- vertical reflection;
- 180° rotation.

Проверяются paired orbits и fixed slots. Нельзя универсально ожидать только один пустой slot для любой технологии.

### P006 — два одинаковых simplex-вида

`capacity = 16`, allocation `8 + 8`, одинаковые тиражи.

Проверяются:

- run length;
- one mixed pattern;
- dedicated alternatives;
- paper/forms trade-off.

### P007 — два разных тиража

Полный перебор allocations:

```text
1+15, 2+14, ... 15+1
```

Для каждого allocation:

```text
run = max(ceil(q1 / c1), ceil(q2 / c2))
```

Сохраняются Pareto-distinct plans.

### P008 — четыре одинаковых вида

- expected balanced allocation `4+4+4+4` для capacity 16;
- другие допустимые allocations не теряются до Pareto/ranking;
- no metric-only structural deduplication.

### P009 — четыре разных тиража

- exact compositions небольшой capacity;
- dedicated, one-mixed и multi-mixed alternatives;
- zero underproduction;
- independent overrun calculation.

### P010 — от 1 до capacity видов

Малые exhaustive fixtures с одинаковыми и разными quantities.

## 6. Run-length/master ladder

### R001 — dedicated против одного mixed pattern

Один вариант выигрывает по paper, другой по forms. Оба остаются в lossless catalog.

### R002 — два mixed patterns с разными runs

- integer run lengths;
- combined demand coverage;
- no underproduction;
- manual recalculation каждого вклада.

### R003 — три и четыре patterns

- paper-first winner;
- forms-first winner;
- passes-first winner;
- overrun-first winner;
- operator selection independent from recommendation.

### R004 — pricing changes recommendation

Планы не регенерируются при изменении только прайса, когда production structure неизменна. Меняется cost/ranking, но не selected plan без действия пользователя.

### R005 — random small master против brute force

Для небольших capacity, видов, patterns и run bounds:

- полный перебор является oracle;
- bounded solver не пропускает Pareto solutions внутри заявленного пространства;
- returned plan signatures совпадают или объяснимо являются structural equivalents.

### R006 — column generation против full small catalog

На малой задаче:

1. построить полный catalog;
2. решить full master;
3. запустить restricted master + pricing;
4. сравнить optimum и Pareto-relevant plans;
5. проверить deterministic sequence of columns.

### R007 — bounds и truncation

- time limit;
- candidate/state limit;
- cancellation;
- complete within declared space;
- feasible but unproven;
- lower bound reached;
- no global claim after truncation.

### R008 — invalid external answer

External oracle result с overlap, underproduction или неправильным back обязан быть отклонён внутренними validators.

## 7. Case-memory tests

### C001 — exact approved case

- exact input signature;
- saved plan используется как warm start;
- current validators выполняются заново;
- current pricing пересчитывается;
- новый лучший plan может заменить recommendation, но не молча переписать operator selection.

### C002 — structural analog

Другие имена файлов, но те же geometry/pages/colors/quantity ratios.

- найден похожий case;
- assignments remapped;
- run lengths пересчитаны;
- результат не считается готовым без search/validation.

### C003 — похожие, но не равные quantities

- warm-start pattern допустим;
- overrun изменяется;
- старые metrics не копируются;
- search ищет улучшения.

## 8. Machine-constraint tests

Добавляются после стабильных G/P/R.

### M001 — forbidden defect zone

Ни один occupied slot не пересекает defect.

### M002 — soft quality zone

Вариант остаётся допустимым, но получает явный penalty/explanation.

### M003 — ink coverage preference

Low-coverage products предпочитаются в заданной зоне, но hard geometry не меняется.

### M004 — operator-only rule

Программа показывает предупреждение и не выдаёт автоматическую совместимость.

## 9. Текущие обязательные regressions

### Sheet и geometry

- `620 × 450` с trim 2 мм → `616 × 446`;
- printable area после press margins;
- A6 landscape/portrait 0°/90°;
- supplied mixed fixture `1×A4 + 2×A5 + 8×A6` только как validation, не automatic packing proof.

### Pages и duplex

- 2/3/4/5 pages;
- mirror columns, preserve rows;
- arrow flip;
- technical blank;
- work-and-turn shared plate;
- `4+1` и `1+4` color plates.

### Production

- position count × run length;
- pair/file overrun;
- physical sheets;
- side-layout forms;
- color plates;
- passes;
- zero underproduction;
- pricing unavailable is not zero.

### Control case

`data/control-case.json` остаётся поздним benchmark:

- 20 files;
- 35 print pairs;
- paper-minimum construction: 3305 sheets;
- historical human plan: 4 impositions / 8 layout forms / 3395 sheets;
- no production code may read `data/control-layout-m3.json` as its answer;
- solver must find the known plan or a validated better trade-off, with honest proof status.

## 10. PDF and Chromium

- selected plan is the only source of scheme/report PDFs;
- separate duplex exports front/back pages in production order;
- work-and-turn exports shared plate, not two fake forms;
- page counts are asserted;
- PDF starts with `%PDF-`, has EOF and valid Page objects;
- browser download names are checked;
- `pdfinfo` reads every document;
- Poppler renders every page;
- focused PNG/PDF evidence is manually opened;
- mobile widths 320/360/390/768 have no page-level horizontal overflow;
- full form lists may use explicit local scrolling without widening the page.

## 11. Documentation tests

- `npm run check:docs` validates local links;
- every Markdown file under `docs/` remains catalogued in `docs/README.md`;
- research records may live under `research/` and must be indexed by `research/README.md`;
- current architecture, algorithm, test plan and remaining work must agree;
- historical milestone records are not rewritten to hide old facts.

## 12. License and oracle controls

- external project version/commit is recorded in the differential harness;
- third-party output may be stored as fixture data only when license permits;
- GPL/AGPL code is not copied into production without a separate license decision;
- metadata/README license conflicts block code reuse;
- independent oracle failure does not silently change production output.

## 13. Release gate

Before release:

- exact-head Quality green;
- exact-head Chromium/PDF green;
- relevant fixtures and stress tests green;
- no hidden truncation;
- user-facing scope text matches actual search;
- focused evidence manually reviewed;
- recovery branch, immutable tag and GitHub Release verified;
- root cutover requires explicit owner acceptance.

## English summary

The test strategy is a proof ladder. Geometry starts with exact pure grids and mixed strips, then differential packing oracles. Print assignment verifies simplex, mirrored duplex, technical blanks, and work-and-turn transforms. Small integer problems are checked against full brute force, while column generation is checked against the complete small catalog. Large operator cases are benchmarks and warm starts, never hardcoded answers. Every external or saved plan is rematerialized and independently validated before ranking or export.