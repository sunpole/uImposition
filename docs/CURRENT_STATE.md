# uImposition — текущее фактическое состояние

Последнее обновление: **27 июля 2026**.

## 1. Repository checkpoint

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- функциональный baseline после PR `#46`: `009451cce94d5cde05ee72305f30447aa65a646c`;
- текущий version checkpoint: **`0.7.0-alpha.5` / M7.5**;
- VERSION-файлы синхронизированы с M7.5;
- publication package должен отдельно добавить evidence/news, recovery branch, immutable tag и настоящий GitHub prerelease;
- следующий функциональный milestone: **M7.6 / `0.7.0-alpha.6`**;
- `productionReady` остаётся `false`;
- GitHub — единственный источник истины.

## 2. Последние функциональные PR

### PR #44 — user-driven uniform production plans

Merge commit: `584c634bc53fa2e00801705b68e2b86eea48f1a9`.

Реализовано:

- пользовательские orders/page pairs подключены к production pipeline;
- для fitting `0°/90°` создаются plan-family `paperMinimum` и `dedicatedPairForms`;
- каждый план materialize-ится в front/back layouts;
- каждый план повторно проходит validation и production report;
- недопечатка запрещена;
- считаются sheets/forms/plates/passes/overrun/cost;
- все допустимые планы сохраняются в lossless-каталоге;
- Pareto/recommended/dominated являются аннотациями;
- неполная последняя duplex-пара отклоняется до расчёта.

Проверка PR #44:

- `156/156` тестов;
- Chromium/PDF: success;
- desktop/mobile focused screenshots визуально проверены.

### PR #45 — selection, details and export

Merge commit: `bf005f038869bb66bb4faee37a02ffab2bff4fa0`.

Реализовано:

- оператор явно выбирает любой plan ID;
- recommendation не выбирается автоматически;
- выбранный вариант сохраняется при допустимом пересчёте;
- реальные materialized front/back schemes;
- dynamic production report выбранного плана;
- file/pair totals и contributions;
- PDF схем и PDF отчёта именно выбранного плана;
- mobile summary и локальная прокрутка таблиц;
- preview первых восьми монтажей;
- явный лимит 120 монтажей для интерактивного scheme PDF.

Проверка PR #45:

- `163/163` теста;
- Chromium/PDF: success;
- desktop/mobile focused screenshots визуально проверены.

### PR #46 — operator objective priority editor

Merge commit: `009451cce94d5cde05ee72305f30447aa65a646c`.

Реализовано:

- 11 целей при готовом прайсе;
- presets `По умолчанию / Бумага / Стоимость / Формы / Прогоны / Перетираж`;
- кнопки вверх/вниз;
- desktop drag-and-drop;
- hard constraints read-only;
- reranking использует те же plan-объекты;
- geometry/layouts/reports не генерируются заново;
- выбранный оператором вариант не подменяется новой recommendation;
- preference сохраняется при изменении заказов, размеров, цветности и прайса;
- денежная цель временно исключается без прайса и возвращается на сохранённую позицию;
- desktop/mobile compact UI.

Exact-head PR #46: `ca89cd0f6a7243fb78c3c5ec04a44635c8d75007`.

Проверки:

- Quality: `173/173` теста;
- quality artifact ID: `8638127223`;
- Chromium/PDF: success;
- screenshot artifact ID: `8638136408`;
- uNews validation: success;
- desktop/mobile focused screenshots визуально проверены.

## 3. Опубликованный M7.4

M7.4 добавляет проверяемый work-and-turn контрольный контур:

- `separateFrontBackForms`;
- `workAndTurn`;
- режимы `separateOnly / compareBoth / workAndTurnOnly`;
- одна симметричная форма;
- горизонтальный turn axis;
- зеркальная front/back validation;
- independent production report;
- mode-aware forms/plates;
- runtime без raw reports/layouts/pagePairs.

Контрольный случай: четыре разных A6, две страницы, `1+1`, по `4000`.

| Метрика | Separate | Work-and-turn |
|---|---:|---:|
| Физические листы | 1000 | 1000 |
| Прогоны | 2000 | 2000 |
| Layout-формы | 2 | 1 |
| Цветовые пластины | 2 | 1 |
| Недопечатка | 0 | 0 |
| Перетираж | 0 | 0 |

M7.4 не является общим automatic work-and-turn solver для пользовательских заказов, не поддерживает vertical axis и не заменяет технологическую проверку конкретной машины.

## 4. Что сейчас реально принимает пользователь

### Лист

- произвольная ширина/высота;
- размер до или после зачистки;
- зачистка одинаковая или раздельная;
- поля машины по четырём сторонам;
- рабочие листовые presets.

### Изделие

- произвольная ширина/высота;
- bleed;
- общий/раздельный рез;
- gap;
- fitting uniform grids `0°/90°`.

### Заказы

Формат:

```text
файл | тираж | страниц | примечание
```

Поддерживаются validation, exact sequential page pairs и потребность пары.

### Цветность и прайс

- общая цветность лица/оборота для пользовательского набора;
- grammage;
- paper BYN/kg;
- color plate BYN/шт.;
- optional layout preparation BYN/форму;
- отсутствие прайса не превращается в нулевую стоимость.

## 5. Фактический end-to-end пользовательский pipeline

```text
sheet/product inputs
→ printable geometry
→ fitting 0°/90° grids
→ user order page pairs
→ two plan-family per orientation
→ front/back materialization
→ imposition validation
→ production report
→ normalized metrics and cost
→ lossless catalog
→ Pareto/ranking/recommendation annotations
→ explicit operator selection
→ real schemes/report/PDF
```

## 6. Текущая finite scope

Полнота каталога относится только к:

```text
один общий формат изделия
× uniform grid
× fitting 0°/90°
× paperMinimum и dedicatedPairForms
× separate front/back forms
× общая duplex-цветность
× полные front/back page pairs
```

Нельзя утверждать глобальную полноту за пределами этой области.

## 7. Что ещё отсутствует

- дополнительные plan-family и bounded search последовательностей форм;
- automatic user-driven work-and-turn;
- vertical work-and-turn;
- automatic mixed-format packing;
- mixed rotations на одном листе;
- индивидуальные параметры каждой строки;
- односторонние/нечётные работы;
- тетрадный/фальцевальный спуск;
- machine profiles;
- прибыль/убыток, маржа и стоимость дополнительных операций;
- project persistence/import/export;
- heavy-search worker, progress/cancel/time limits;
- единая таблица `Только различия`;
- полный accessibility/performance/browser audit;
- production beta matrix.

## 8. Следующий обязательный release

До начала M7.6 нужно выпустить `0.7.0-alpha.5`:

1. audit main и VERSION sources;
2. version sync;
3. CHANGELOG/README/site sync;
4. screenshot scenario version sync;
5. focused M7.5 release image;
6. patchnote и uNews/Telegram payload;
7. permanent evidence ZIP и manifest;
8. exact-head Quality и Chromium/PDF;
9. version/publication PR merge;
10. recovery branch `release/v0.7.0-alpha.5`;
11. immutable tag `v0.7.0-alpha.5`;
12. настоящий GitHub prerelease с assets;
13. независимая проверка Release card и assets.

## 9. Следующий функциональный milestone

M7.6 должен завершить операторскую систему сравнения:

- одна компактная строка на вариант;
- полный каталог без удаления;
- режим `Только различия`;
- component deltas;
- sorting/filtering без regeneration;
- weight/paper/forms/plates/passes/overrun/cost/unit cost;
- plan-family и duplex strategy;
- выбранный вариант раскрывает schemes/report/PDF;
- desktop/mobile evidence.

После M7.6 расширять search space отдельными небольшими патчами.

## 10. Известный неблокирующий долг

Issue `#40`: заменить некорректное изображение существующего Telegram-поста `0.7.0-alpha.2`, сообщение `@uNewsLog/76`, через uNews `edit:media`. Пост не удалять и не публиковать заново.

## 11. Основной handoff

Полный операционный контекст для Codex: `docs/CODEX_HANDOFF.md`.
