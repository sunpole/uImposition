# Product row model — реальные виды продукции

Статус: **pure model до визуального R3**.  
Основная задача: Issue `#68`.  
Основная программа: [`OPERATOR_FIRST_PRODUCT_REBUILD.md`](OPERATOR_FIRST_PRODUCT_REBUILD.md).

## 1. Зачем нужна новая модель

Исторический ввод `file | quantity | pages` недостаточен для рабочего калькулятора монтажей. Оператор должен одной строкой описать реальный вид продукции: формат, тираж, число вариантов, страницы, цветность, выпуск, рез и допустимую технологию оборота.

Новый UI нельзя строить до формализации этих данных. Поэтому этот этап создаёт pure immutable schema и операции со списком без HTML, CSS и нового solver.

## 2. Product row schema v1

```text
product row
├── schemaVersion = 1
├── id                         product:<positive integer>
├── enabled
├── name
├── sourceFileName             optional
├── finished
│   ├── widthMm
│   └── heightMm
├── quantityPerVariant
├── variantCount
├── pages
├── print
│   ├── mode                   simplex | duplex
│   ├── frontColors
│   ├── backColors
│   └── duplexPreference       auto | separateFrontBackForms | workAndTurn
├── bleed
│   ├── mode                   uniform | sides
│   ├── uniformMm
│   └── sidesMm
├── cut
│   ├── mode                   commonCut | separated
│   └── gapMm
├── rotationPolicy             auto | 0 | 90
└── notes
```

### Семантика тиража

```text
quantityPerVariant = тираж одного вида/файла
variantCount       = количество одинаково настроенных видов/файлов
totalQuantity      = quantityPerVariant × variantCount
```

Например:

```text
Название: Этикетка
Тираж одного вида: 1 000
Количество видов: 6
Итоговый тираж коллекции: 6 000
```

При адаптации к текущему legacy order pipeline одна строка создаёт шесть отдельных заказов с одинаковыми production-параметрами и стабильной ссылкой `productRowId`.

## 3. Черновик и готовая строка

`normalizeProductRowDraft` сохраняет пользовательский черновик:

- числовые строки преобразуются в числа;
- пустое значение остаётся `null`;
- некорректный текст числового поля сохраняется для field-level ошибки;
- длинный текст не обрезается молча;
- объект глубоко immutable.

`validateProductRow` возвращает:

```text
row
issues[]
valid
summary.totalQuantity
summary.printPairCount
```

Каждая issue содержит:

```text
severity
code
field
messageKey
details
```

Будущий UI сможет подсветить конкретное поле без разбора строки ошибки.

## 4. Общая validation

Общая модель допускает хранение будущих product types, даже если нынешний solver ещё не умеет их рассчитывать.

Проверяется:

- обязательное название;
- длина имени, имени файла и заметок;
- готовая ширина/высота;
- положительный целый тираж;
- положительное целое число вариантов;
- число страниц;
- количество красок;
- выпуск uniform/sides;
- gap;
- общий рез только при нулевом выпуске;
- максимальный суммарный тираж.

Simplex является допустимой общей строкой. При simplex оборотная цветность принудительно равна `0`, а duplex preference становится `auto`.

## 5. Совместимость с нынешним uniform pipeline

`validateProductRowForUniformPipeline` добавляет честные ошибки текущей границы:

- требуется duplex;
- требуется чётное число страниц и полные page pairs;
- общий user-driven work-and-turn ещё не реализован;
- принудительная ориентация `0°/90°` пока не подключена к текущему user planner.

Таким образом программа может сохранить simplex или forced-rotation строку, но не выдаёт её за рассчитанную нынешним solver.

## 6. Product row collection v1

```text
collection
├── schemaVersion = 1
└── rows[]
```

Pure operations:

- `addProductRow`;
- `duplicateProductRow`;
- `updateProductRow`;
- `setProductRowEnabled`;
- `removeProductRow`;
- `moveProductRow`;
- deterministic serialize/deserialize;
- monotonic IDs;
- immutable results.

Удаление строки не переиспользует её ID. Новая строка получает ID после максимального существующего, чтобы ссылки, selection и future diagnostics не меняли смысл.

## 7. Отключённые черновики

Оператор может временно отключить незавершённую строку.

Правила:

- ошибки отключённой строки сохраняются и видны;
- issues получают `blocking: false`;
- отключённая строка не входит в active totals;
- отключённая строка не блокирует расчёт остальных видов;
- если включённых строк нет, general validation показывает warning;
- uniform calculation получает blocking error `uniformPipelineRequiresEnabledRows`.

Это позволяет подготовить будущий вид продукции, не удаляя его и не ломая текущий заказ.

## 8. Общая совместимость строк

Нынешний user uniform planner использует один общий формат и одну общую print specification.

`validateProductRowsForUniformPipeline` требует для включённых строк одинаковые:

- готовые размеры;
- цветность;
- duplex preference;
- выпуск;
- cut/gap;
- rotation policy.

Разные тиражи, страницы и variantCount допустимы. Разные форматы и print specifications сохраняются в product model, но требуют будущего mixed-format/multi-product solver.

## 9. Legacy migration

Поддерживаются:

```text
file | quantity | pages | note
```

и массивы объектов:

```json
{
  "file": "A.pdf",
  "quantity": 4000,
  "pages": 2,
  "note": "..."
}
```

Migration добавляет:

- stable `product:n` ID;
- общий переданный finished format;
- общий print specification;
- variantCount `1`;
- bleed/cut/rotation defaults.

Некорректные legacy-строки не исчезают молча: возвращаются structured issues с точным номером строки.

## 10. Application state adapter

`src/application-product-rows.js` соединяет коллекцию с R2 state без изменения проверенной schema v1.

Application state продолжает хранить `input.products[]`, но adapter гарантирует, что это нормализованные versioned rows.

Операции:

- прочитать коллекцию;
- заменить коллекцию;
- добавить/дублировать/обновить/включить/удалить/переместить строку;
- general validation;
- current uniform compatibility validation.

Каждая реальная операция проходит через `replaceApplicationInput`, поэтому:

- `inputRevision` повышается один раз;
- calculation становится `dirty`;
- stale active request очищается;
- старый selected plan сбрасывается;
- equivalent replacement не создаёт ложный revision.

## 11. Граница этапа

Этот patch не добавляет:

- HTML/CSS;
- визуальную строку продукции;
- новый workspace;
- автоматический mixed-format packing;
- simplex solver;
- generalized work-and-turn;
- forced-rotation execution;
- новые production formulas;
- version/release.

## 12. Следующий этап

После merge:

1. подготовить несколько визуально разных направлений operator-first workspace;
2. выбрать одно направление;
3. реализовать R3 clean entrypoint поверх R2 state и product-row model;
4. подключить existing uniform pipeline через явный adapter;
5. показывать field-level validation и last valid calculation;
6. не переносить legacy DOM-панели.

---

## English summary

The product-row model replaces the legacy `file | quantity | pages` input with a versioned immutable production specification: finished size, run length, variant count, pages, color, simplex/duplex, bleed, cut/gap, rotation and duplex preference. General validation can preserve future unsupported rows, while a separate uniform-pipeline validator explicitly rejects capabilities the current solver cannot yet calculate. Disabled drafts retain non-blocking issues. Collection operations are deterministic and are connected to the R2 application state through a dedicated adapter, without changing the UI or solver.