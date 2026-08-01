# uImposition — актуальная архитектура

Последнее обновление: **1 августа 2026 года**.

Исследовательская основа:

- [`../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](../research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md) — аудит 50 открытых репозиториев;
- [`../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](../research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md) — полное архитектурное решение после аудита.

## 1. Основной принцип

uImposition остаётся статическим browser-first приложением без обязательного сервера:

- GitHub Pages обслуживает HTML/CSS/JavaScript ES modules;
- геометрия, производственные модели, validation, ranking, cost и PDF выполняются локально;
- тяжёлый поиск изолируется в Web Worker только после появления доказанной необходимости;
- внешние solvers применяются как research/CI-oracles, а не как обязательная runtime-зависимость;
- GitHub является единственным источником истины для кода, документации, тестов и release evidence.

Готового открытого аналога всего uImposition не найдено. Открытые проекты хорошо решают отдельные части: PDF imposition, rectangle packing, cutting stock или integer optimization. Поэтому архитектура сознательно составная.

## 2. Два состояния архитектуры

### 2.1. Фактический рабочий pipeline

Текущий `/app/` уже умеет:

- sheet/press presets и произвольные размеры;
- product rows, TXT-import и контрольный заказ;
- uniform fitting 0°/90°;
- paper-minimum и dedicated plans;
- odd pages с техническим blank;
- separate front/back и ограниченный пользовательский work-and-turn;
- lossless catalog, Pareto/ranking и явный выбор оператора;
- production report, cost и PDF выбранного плана;
- полный просмотр всех реально созданных монтажей;
- desktop/mobile Chromium regression.

Эта рабочая система сохраняется и не переписывается одним большим переходом.

### 2.2. Целевая universal-solver архитектура

Новый solver развивается слоями:

```text
N — normalization and compatibility
G — geometric pattern generation
P — print-aware production assignment
R — run-length master optimization
C — case memory and operator evidence
M — machine/operator placement constraints
E — export and independent validation
```

Каждый слой имеет отдельные модели, tests и completeness status.

## 3. Layer N — normalization and compatibility

Вход пользователя преобразуется в каноническую модель:

- source sheet, trim и printable rectangle;
- product rectangles после bleed/gap/cut rules;
- quantity, variant count и pages;
- print pairs;
- simplex/duplex/work-and-turn preference;
- front/back colors;
- pricing;
- machine capabilities;
- rotation and cut policies.

Несовместимые строки делятся на compatibility groups до geometry/search. Название файла не входит в математическое подобие заказа, но сохраняется в production/report/export моделях.

## 4. Layer G — geometric patterns

Geometry не знает тиражей, страниц, лица, оборота и стоимости. Она отвечает только на вопрос: **какие реальные прямоугольные места существуют на printable sheet**.

Минимальный pattern:

```js
{
  id,
  printableWidth,
  printableHeight,
  cutFamily,
  slots: [
    { id, x, y, width, height, rotation, zone }
  ],
  capacity,
  occupiedArea,
  wasteArea,
  coverage
}
```

### G0 — exact uniform grids

- все slots 0°;
- все slots 90°;
- точные floor-формулы;
- margins, bleed и gap;
- deterministic coordinates;
- полнота только внутри pure-grid пространства.

### G1 — exact/bounded mixed strips

Лист делится на горизонтальные или вертикальные полосы. Внутри каждой полосы изделия имеют одну ориентацию. Перебираются допустимые целочисленные размеры полос.

Это обязательный следующий geometry milestone: mixed 0°/90° иногда даёт больше мест, чем обе чистые сетки.

### G2 — heuristic general packing

Pluggable backends:

- MaxRects;
- Skyline;
- Guillotine;
- несколько deterministic сортировок и scoring rules.

Heuristic result никогда не получает статус доказанного глобального максимума без независимого proof.

### G3 — external geometry oracles

`rectpack`, PackingSolver и другие проверенные движки используются в research/CI для differential tests. Перенос стороннего кода разрешён только после отдельной проверки лицензии конкретной версии и файлов.

## 5. Layer P — print-aware production assignment

Production pattern назначает demand units в готовые geometry slots:

```js
{
  geometryPatternId,
  duplexMode,
  turnMode,
  assignments: [
    { slotId, pairId, sideRole, file, frontPage, backPage }
  ],
  positionCountByDemand,
  structuralSignature
}
```

### Simplex

Один занятый slot производит одну копию вида за физический лист.

### Separate front/back

- front является первичной структурой;
- back получается только проверенным transform;
- количество каждого изделия на лице и обороте согласовано;
- для текущего горизонтального переворота через короткую сторону строка `1 2 3 4` даёт оборот `4 3 2 1`;
- blank back page хранится как `null`, а не как вымышленный номер.

### Work-and-turn

Для geometry pattern определяется transform `T(slot)`.

```text
T(T(slot)) = slot
```

- paired orbits содержат лицо и оборот;
- fixed slots зависят от физического turn mode;
- shared plate хранится отдельно от control front/back views;
- нельзя использовать одно правило `floor(capacity / 2)` для любой сетки;
- horizontal reflection, vertical reflection и 180° rotation являются разными технологиями.

Work-and-tumble и perfecting добавляются позже как отдельные transforms и machine capabilities.

## 6. Layer R — integer run-length master

Для production pattern `p` и demand unit `i`:

```text
a[p,i] = число копий i на одном физическом листе pattern p
x[p]   = целое неотрицательное число физических листов
```

Жёсткое ограничение:

```text
sum(a[p,i] × x[p]) >= quantity[i]
```

Недопечатка всегда запрещена.

Основные метрики:

- physical sheets;
- imposition count;
- layout forms;
- color plates;
- sheet passes;
- pair/file overrun;
- split orders;
- setup/preparation cost;
- estimated total cost.

## 7. Почему основной large-order solver использует column generation

Число допустимых production patterns растёт экспоненциально. Поэтому большой заказ нельзя решать предварительным созданием и хранением всех возможных монтажей.

### Restricted master problem

Начальный набор колонок содержит:

- dedicated patterns;
- paper-minimum construction;
- несколько geometry/assignment heuristics;
- подтверждённые operator cases только как warm starts;
- точные малые patterns из exhaustive oracle.

### Pricing problem

Master возвращает оценки спроса. Pricing subproblem ищет новый геометрически и полиграфически допустимый pattern, способный улучшить master.

Цикл:

```text
restricted master
→ pricing subproblem
→ новая полезная колонка
→ повторный master
→ integer solve
```

Остановка сопровождается bounds, gap, time/state budgets и `complete/truncated` status.

### Роль draft PR #85

Код PR #85 не является главным large-order solver. Его допустимая роль после переработки:

- exhaustive small-space oracle;
- exact candidate count;
- deterministic structural signatures;
- brute-force fixtures;
- differential reference для pricing subproblem.

Недопустимо масштабировать большие задачи только увеличением `maxCandidates` или числа разных пар на монтаже.

## 8. Layer C — case memory

Данные делятся по назначению:

```text
tests/fixtures/       маленькие доказательные случаи
data/benchmarks/      большие контрольные задачи
data/operator-cases/  подтверждённые технологом планы
data/examples/        примеры для UI
```

Подтверждённый case:

1. может дать warm start;
2. заново проходит geometry/production validation;
3. сравнивается с новым поиском;
4. не подставляется как готовый ответ без проверки.

Похожие cases определяются по geometry, pages/duplex/colors, нормализованным отношениям тиражей, material/cut/machine profile. Имена файлов не определяют математическую структуру.

## 9. Layer M — machine/operator constraints

Поздний слой задаёт характеристики slots и изделий:

- top/bottom/left/right/center zones;
- defect areas;
- quality classes;
- ink coverage и solid fills;
- color compatibility;
- preferred/forbidden zones;
- adjacency/separation rules.

Ограничения бывают:

- hard — назначение запрещено;
- soft — допустимо со штрафом;
- operator-only — требуется предупреждение и человеческий выбор.

Machine constraints не смешиваются с базовой geometry до доказанной корректности G/P/R.

## 10. Layer E — export and validation

Единый выбранный production plan является источником для:

- screen preview;
- all-impositions view;
- schemes PDF;
- production report PDF;
- cost report;
- operator case.

UI и PDF не имеют права самостоятельно перестраивать back, assignments или run lengths.

## 11. Decision layer

Catalog остаётся lossless:

- Pareto/recommended/dominated — аннотации;
- recommendation не удаляет варианты;
- operator selection независим от recommendation;
- reranking не регенерирует планы;
- одинаковые метрики не объединяют конструктивно разные layouts.

Приоритеты остаются лексикографическими или явно заданными профилем пользователя.

## 12. Текущая source map

### Вход, geometry и pairs

```text
src/config.js
src/geometry.js
src/orders.js
src/orientation.js
src/product-row.js
src/application-product-rows.js
```

### Front/back, candidates и validation

```text
src/front-layout.js
src/back-layout.js
src/imposition-validation.js
src/imposition-candidate.js
src/candidate-generator.js
src/mixed-format-layout.js
src/bounded-mixed-form-search.js
```

`mixed-format-layout.js` валидирует supplied placement и не является automatic packer.

### Production, cost и decision

```text
src/production-metrics.js
src/production-validation.js
src/production-report.js
src/production-cost.js
src/production-solution-metrics.js
src/feasible-solution-catalog.js
src/optimization-objectives.js
src/pareto-alternatives.js
src/user-uniform-production-plans.js
```

### Presentation и export

```text
app/
src/*-ui.js
src/pdf-document-model.js
src/pdf-scheme-renderer.js
src/pdf-report-renderer.js
```

## 13. Search-completeness vocabulary

Допустимые статусы:

- `complete within declared space`;
- `proven lower bound reached`;
- `feasible`;
- `heuristic`;
- `truncated/incomplete`;
- `not searched`;
- `not supported`.

Эти статусы нельзя смешивать. `Not searched` не означает `impossible`.

## 14. Dependency rules

- domain/search/validation/PDF models не используют DOM;
- back никогда не строится независимо от verified front/shared structure;
- renderer не содержит production formulas;
- pricing отсутствует, пока inputs не заполнены, и не превращается в ноль;
- hard validation failure блокирует recommendation и export;
- external solver result обязан пройти внутренние validators;
- runtime dependencies не добавляются только ради research convenience;
- heavy search изолируется, но final validation остаётся pure и reusable.

## 15. Non-negotiable invariants

- no underproduction;
- no hidden overlap;
- no fake blank page numbers;
- no independent back generation;
- no hidden pricing defaults;
- no loss of feasible alternatives inside declared scope;
- no silent search truncation;
- no global optimum claim without proof;
- no operator-case substitution without recalculation;
- no renderer-owned production logic;
- no machine compatibility claim from geometry alone;
- no release claim without exact evidence and immutable recovery checkpoint.