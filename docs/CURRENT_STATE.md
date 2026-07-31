# uImposition — текущее фактическое состояние

Последнее обновление: **31 июля 2026**.

## 1. Repository checkpoint

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- текущий `main`: `0eaf7f075ed28e74e629a206017a8073ae1f8498`;
- последний объединённый PR: `#61` — UX-3 comparison workspace;
- опубликованный prerelease: **`0.7.0-alpha.5` / M7.5**;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch: `release/v0.7.0-alpha.5`;
- immutable tag: `v0.7.0-alpha.5`;
- publication merge commit: `546f637a25b51f72706ebbe7346acb2df9819af8`;
- `VERSION.json` намеренно остаётся на последнем опубликованном checkpoint;
- `productionReady` остаётся `false`;
- GitHub — единственный источник истины.

## 2. Что добавлено после опубликованного alpha.5

### PR #52 — documentation catalog

- единый `docs/README.md`;
- `docs/PROJECT_CATALOG.md`;
- автоматическая проверка Markdown-ссылок и catalog coverage.

### PR #53 — pure M7.6 comparison model

- одна строка на каждый catalog plan;
- lossless `allRows`;
- view-only filters/sorting;
- `Только различия`;
- exact deltas;
- pricing `null`, а не ноль;
- source plan references сохраняются;
- планы не генерируются заново.

### PR #54 — compact mobile experiment

Уменьшил высоту и размеры исторической страницы, но реальная проверка владельцем подтвердила, что информационная архитектура осталась неверной.

### PR #59 — UX-0 specification

Зафиксировал app-shell подход `Заказ / Проверка / Варианты / План / Экспорт`.

### PR #60 — UX-1 application shell

- desktop sidebar/workspace/summary;
- mobile step navigation;
- технические блоки убраны из основного flow;
- существующие панели перераспределены между экранами.

### PR #61 — UX-3 comparison workspace

- M7.6 comparison model подключён к UI;
- desktop table и mobile rows;
- filters/sort/differences-only;
- recommendation и selection разделены;
- operator selection из строки;
- точные данные существующих планов переиспользуются.

PR #61 прошёл:

- Quality: `183/183`;
- Chromium/PDF: `20/20`;
- visual review desktop/mobile;
- merge commit: `0eaf7f075ed28e74e629a206017a8073ae1f8498`.

## 3. Открытый PR #62

PR `#62` добавляет вкладки выбранного плана поверх существующей shell/DOM архитектуры.

Факты его последнего проверенного head:

- head: `b50fb4c2271db954eae326fedd066c1c5f1cc6bb`;
- Quality: `187/187`;
- Chromium/PDF: `21/21`;
- release-news validation: success;
- review threads отсутствуют.

Несмотря на зелёные проверки, PR **не объединяется**, потому что владелец отклонил само продуктовое направление: интерфейс остаётся запутанным, нелогичным и визуально нестабильным. Зелёные тесты подтверждают отсутствие известных регрессий внутри старой архитектуры, но не доказывают пригодность интерфейса.

## 4. Решение о product reset

Issue `#64` и `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md` заменяют дальнейшее развитие UX-0–UX-5.

Текущий UI считается **временным техническим прототипом**.

Сохраняются:

- geometry;
- page pairs;
- front/back validation;
- production reports;
- pricing/cost;
- lossless catalog;
- comparison data model;
- operator selection semantics;
- PDF;
- tests, fixtures и GitHub Actions.

Не используется как основа нового UI:

- историческая длинная HTML-страница;
- app shell, построенный перестановкой старых DOM-панелей;
- накопленная цепочка CSS overrides;
- milestone/status/evidence панели;
- PR #62 tabs implementation.

## 5. Новый целевой пользовательский сценарий

```text
выбрать или создать sheet/press preset
→ добавить реальные виды продукции
→ получить согласованный live calculation
→ сравнить варианты по бумаге, формам, пластинам, прогонам и стоимости
→ выбрать монтаж
→ открыть понятную схему
→ экспортировать PDF
```

Основные классы результата:

- минимум бумаги;
- минимум форм;
- минимум стоимости;
- производственно удобный — только после формализации критериев;
- остальные допустимые варианты без удаления из lossless catalog.

## 6. Текущий production pipeline

```text
sheet/product inputs
→ printable geometry
→ fitting 0°/90° grids
→ user order page pairs
→ two uniform plan-family per orientation
→ front/back materialization
→ imposition validation
→ production report
→ normalized metrics and cost
→ lossless catalog
→ Pareto/ranking/recommendation annotations
→ explicit operator selection
→ real schemes/report/PDF
```

## 7. Честная finite scope

Полнота текущего каталога относится только к:

```text
один общий формат изделия
× uniform grid
× fitting 0°/90°
× paperMinimum и dedicatedPairForms
× separate front/back forms
× общая duplex-цветность
× полные front/back page pairs
```

Текущий движок ещё не является общим solver сложных многовидовых монтажей.

## 8. Что ещё отсутствует

### Product layer

- versioned application state;
- built-in и local sheet/press presets;
- migrations и deterministic serialization;
- полноценные product rows с индивидуальными параметрами;
- coherent live calculation snapshot;
- чистый новый desktop workspace;
- самостоятельный mobile workflow;
- project save/import/export.

### Solver

- automatic mixed-format packing;
- разные форматы и тиражи в одном search;
- mixed rotations на одном листе;
- bounded sequences частично заполненных форм;
- automatic user-driven work-and-turn;
- односторонние/нечётные работы;
- progress/cancel/time limits;
- production beta matrix.

### Economics

- выручка;
- прибыль/убыток;
- маржа;
- стоимость резки, фальцовки и дополнительных операций.

## 9. Следующий обязательный кодовый PR — R2

R2 не является визуальным redesign.

Измеримая цель:

- pure versioned application-state model;
- sheet/press preset schema;
- встроенные presets;
- local preset repository;
- localStorage persistence;
- migrations;
- deterministic import/export representation;
- unit tests;
- никаких production formula changes;
- никакого нового UI в том же PR.

После R2 визуальное направление должно быть отдельно выбрано и только затем реализовано в R3.

## 10. Release status

- version не меняется;
- новый tag/release не создаётся;
- release news не создаются для документационного R1;
- alpha.6 нельзя выпускать как удобный рабочий инструмент до проверки владельцем нового R3–R4 flow на реальном заказе.

## 11. Известный неблокирующий долг

Issue `#40`: заменить некорректное изображение существующего Telegram-поста `0.7.0-alpha.2` через uNews `edit:media`.
