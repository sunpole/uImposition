# Справочник конфигурации / Configuration Reference

## Основной принцип / Core principle

Все изменяемые производственные, экспортные и поисковые параметры находятся в `src/config.js` или в явных входных данных. Расчётные, PDF- и оптимизационные модули не содержат скрытых производственных значений.

All editable production, export, and search parameters live in `src/config.js` or explicit input data. Calculation, PDF, and optimisation modules contain no hidden production constants.

## Действующие группы / Active groups

| Группа | Назначение / Purpose |
|---|---|
| `app` | название, язык, единицы / name, language, units |
| `sheetPresets` | размеры после зачистки / post-trim sizes |
| `productPresets` | A4, A5, A6 / finished sizes |
| `productRows` | defaults реального вида продукции / real product-row defaults |
| `defaults` | первый запуск legacy UI / legacy initial state |
| `limits` | допустимые диапазоны / allowed ranges |
| `storage` | versioned browser storage keys |
| `demo` | контрольный заказ и монтажи / control input |
| `pdf` | страницы, рендер, качество и имена PDF / PDF pages, rendering, quality, names |
| `pricing` | валюта, required/optional price inputs и defaults |
| `optimizer` | границы пространства поиска / search-space boundaries |
| `i18n` | подписи интерфейса / interface labels |

## Геометрия и производство / Geometry and production

```text
post-trim = source sheet − sheet trim
printable = post-trim − press margins
occupied item = finished size + bleed
positions = rows × columns
produced pair = Σ(position count × imposition run)
underproduction = max(0, required − produced)
overrun = max(0, produced − required)
physical sheets = Σ(imposition run)
layout forms = front forms + back forms
press passes = 2 × physical sheets
```

`afterTrim` не уменьшается повторно. Недопечатка блокирует производственную готовность.

## Operator-first sheet/press storage

```text
CONFIG.storage.applicationStateKey    = "uImposition.project.v1"
CONFIG.storage.sheetPressPresetsKey   = "uImposition.sheetPressPresets.v1"
CONFIG.storage.projectKey             = "uImposition.m2.project"  // legacy recovery
```

Новые ключи принадлежат versioned R2 state. Старый `projectKey` не переиспользуется молча и сохраняется для явной migration/recovery.

## Product row defaults

```text
CONFIG.productRows.defaults.finishedWidthMm      = 105
CONFIG.productRows.defaults.finishedHeightMm     = 148
CONFIG.productRows.defaults.quantityPerVariant   = null
CONFIG.productRows.defaults.variantCount         = 1
CONFIG.productRows.defaults.pages                = 2
CONFIG.productRows.defaults.printMode            = "duplex"
CONFIG.productRows.defaults.frontColors          = 4
CONFIG.productRows.defaults.backColors           = 4
CONFIG.productRows.defaults.duplexPreference     = "auto"
CONFIG.productRows.defaults.bleedMode            = "uniform"
CONFIG.productRows.defaults.bleedUniformMm       = 0
CONFIG.productRows.defaults.cutMode              = "commonCut"
CONFIG.productRows.defaults.gapMm                = 0
CONFIG.productRows.defaults.rotationPolicy       = "auto"
```

Эти значения создают новый черновик будущего UI. `quantityPerVariant = null` намеренно требует явного тиража оператора.

`productRows.defaults` не является набором скрытых производственных решений. Он только задаёт начальные значения поля формы; validation и solver получают явный normalized product row.

## Product row limits

```text
CONFIG.limits.maxProductVariants              = 1000
CONFIG.limits.maxTotalProductQuantity          = 100000000
CONFIG.limits.maxColorUnits                    = 12
CONFIG.limits.maxProductNameLength             = 160
CONFIG.limits.maxProductSourceFileNameLength   = 240
CONFIG.limits.maxProductNotesLength            = 2000
```

Дополнительно переиспользуются:

```text
min/maxProductDimensionMm
min/maxBleedMm
min/maxGapMm
maxPagesPerFile
maxQuantity
maxOrders
```

Длинные operator draft strings не обрезаются. Модель возвращает field-level issue с фактической длиной и limit.

## Product row compatibility boundary

Общая product-row schema может хранить:

- simplex и duplex;
- odd/even pages;
- auto/forced rotation;
- auto/separate/work-and-turn preference;
- разные finished sizes и print specification между строками.

Текущий user uniform pipeline принимает только явно совместимое подмножество:

```text
duplex
× complete even page pairs
× auto rotation
× no generalized work-and-turn request
× one shared finished geometry
× one shared color/bleed/cut specification
```

Это разделение является validation contract, а не скрытым изменением solver.

## Контрольные источники / Control sources

- `data/control-case.json`: лист, изделие, 20 заказов, режим оборота и ожидаемые итоги;
- `data/control-layout-m3.json`: четыре явных лица и ручные тиражи;
- `data/production-regression-cases.json`: ориентации A6, mixed-format и разнотиражные A5-кейсы;
- обороты всегда выводятся из лиц;
- производственный отчёт выводится из проверенных схем.

Ручные тиражи `1500`, `1100`, `450`, `345` не являются скрытыми defaults или результатом оптимизатора.

## M5: PDF-конфигурация / M5 PDF configuration

```text
CONFIG.pdf.defaultPageMode          = "a4"
CONFIG.pdf.supportedPageModes       = ["a4", "sheetProportional", "custom"]
CONFIG.pdf.a4                       = 210 × 297 mm
CONFIG.pdf.defaultMarginMm          = 10
CONFIG.pdf.preserveAspectRatio      = true
CONFIG.pdf.safeNameDigits           = 2
CONFIG.pdf.renderDpi                = 180
CONFIG.pdf.jpegQuality              = 0.92
CONFIG.pdf.proportionalLongSideMm   = 297
CONFIG.pdf.schemeDocumentFileName   = "uImposition-schemes.pdf"
CONFIG.pdf.reportDocumentFileName   = "uImposition-production-report.pdf"
```

### Режимы страниц схем / Scheme page modes

- `a4`: фиксированные `210 × 297 мм`;
- `sheetProportional`: длинная сторона `297 мм`, отношение сторон берётся из фактического листа;
- `custom`: пользователь задаёт ширину и высоту;
- во всех режимах схема вписывается через `contain` без искажения.

### PDF отчёта / Report PDF

Производственный отчёт всегда создаётся отдельным A4-документом. Он не добавляется девятой страницей в основной PDF схем.

## M6: пространство кандидатов / M6 candidate space

```text
CONFIG.optimizer.candidateGeneration.minDistinctPairs = 1
CONFIG.optimizer.candidateGeneration.maxDistinctPairs = 2
CONFIG.optimizer.candidateGeneration.maxCandidates    = 10000
CONFIG.optimizer.candidateGeneration.idPrefix         = "AUTO"
```

Первый доказуемый набор M6 включает все полные кандидаты с одной или двумя различными печатными парами.

Для `35` пар и вместимости `16`:

```text
single-pair candidates = C(35, 1) × C(15, 0) = 35
two-pair candidates    = C(35, 2) × C(15, 1) = 8925
total                   = 8960
```

Лимит `10000` выше полного размера `8960`, поэтому контрольный набор не усечён. Если другой вход превышает лимит, генератор возвращает `truncated: true` и не имеет права утверждать полноту пространства.

## M6: доказательство бумажного минимума

```text
required pair quantity = 52870
capacity                = 16
paper lower bound       = ceil(52870 / 16) = 3305
constructed paper       = 3305
```

Совпадение допустимой конструкции с универсальной нижней границей позволяет поставить статус `provenGlobalMinimum` для физической бумаги. Этот статус не переносится автоматически на формы или другие цели.

## 4+4: явные входные данные

Цветность передаётся явно:

```json
{ "front": 4, "back": 4 }
```

`src/print-specification.js` разделяет:

```text
one 4+4 imposition:
layout forms = 2
color plates = 8

three 4+4 impositions:
layout forms = 6
color plates = 24
```

Поле `productionReport.totals.forms` пока означает layout-формы сторон. Цветовые пластины не подменяют это поле и считаются отдельной метрикой.

## Производственные regression inputs

### A6 32 страницы

- landscape: `148 × 105`, лучший поворот `0°`, `4×4`;
- portrait: `105 × 148`, лучший поворот `90°`, `4×4`;
- количество страниц: `32`;
- пары: `16` последовательных пар;
- контрольный тираж: `1000`;
- цветность: `4+4`.

Эти данные проверяют геометрию и текущую последовательную модель пар. Они не означают сигнатурную пагинацию для фальцовки.

### Mixed-format duplex

Заданные прямоугольники внутри `608 × 431`:

- `1×A4 landscape`;
- `2×A5 portrait`;
- `8×A6 landscape`.

Координаты находятся в `data/production-regression-cases.json`. Валидатор проверяет границы, пересечения и зеркальный оборот. Автоматического rectangle packing пока нет.

### A5 variable runs

- формат: `148 × 210`;
- сетка: `4×2 = 8`;
- заказы: `400`, `700`, `4200`, по 2 страницы;
- lower bound: `663` листа;
- тиражи монтажей: `50`, `88`, `525`;
- перетираж: `4`.

## Значения первого запуска / Initial defaults

### Legacy UI

- язык: `ru`;
- исходный лист: `620 × 450`;
- зачистка: `2` мм с каждой стороны;
- поля: `4 / 4 / 2 / 13` мм;
- изделие: A6 `105 × 148`;
- выпуск: `0`;
- режим: `commonCut`;
- дополнительный зазор: `0`;
- PDF схем: A4;
- пространство M6: полные кандидаты с 1–2 различными парами, максимум `10000` кандидатов.

### New operator-first product draft

- finished format: A6 `105 × 148`;
- тираж: незаполнен;
- variants: `1`;
- pages: `2`;
- цветность: `4+4`;
- duplex preference: `auto`;
- bleed: `0`;
- cut: `commonCut`;
- rotation: `auto`.

---

## English summary

Configuration now separates legacy first-run defaults from the new operator-first product-row defaults. A draft product starts as A6 duplex 4+4 with one variant and an explicit missing run length. Product limits cover dimensions, variants, total run, color units and text sizes. The general product schema can preserve simplex, forced rotations and mixed specifications, while a separate compatibility validator restricts the existing uniform solver to its documented supported subset.