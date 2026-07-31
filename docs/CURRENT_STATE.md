# uImposition — текущее фактическое состояние

Последнее обновление: **31 июля 2026**.

## 1. Repository checkpoint

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- текущий `main`: `1180ff5de008662db63b07d6b973af4f772326ed`;
- последний объединённый PR: `#66` — R2 application state and sheet/press presets;
- опубликованный prerelease: **`0.7.0-alpha.5` / M7.5**;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch: `release/v0.7.0-alpha.5`;
- immutable tag: `v0.7.0-alpha.5`;
- `VERSION.json` остаётся на последнем опубликованном checkpoint;
- `productionReady` остаётся `false`;
- текущий сайт остаётся временным техническим прототипом;
- GitHub — единственный источник истины.

## 2. Функциональность после опубликованного alpha.5

### M7.6 comparison foundation

PR `#53`:

- pure lossless comparison rows;
- view-only filters/sorting;
- `Только различия`;
- exact deltas;
- missing pricing остаётся `null`;
- plan objects не генерируются заново.

PR `#61`:

- technical desktop/mobile comparison workspace;
- filters/sort/differences-only;
- recommendation и selection разделены;
- operator selection из строки;
- `183/183` tests и `20/20` Chromium/PDF regression.

Эти модули сохраняются как reusable calculation/view foundation, но текущий visual shell не является целевым продуктом.

## 3. Product reset

Реальная проверка владельцем показала:

- интерфейс запутан и нелогичен;
- верстка визуально нестабильна;
- функции распределены по старым панелям;
- app-shell не соответствует реальной работе оператора;
- добавление вкладок не исправляет информационную архитектуру.

Поэтому:

- Issue `#64` задаёт operator-first rebuild;
- `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md` — обязательный продуктовый контракт;
- PR `#62` закрыт без merge;
- UI UX-0–UX-5 сохраняется как superseded experiment;
- расчётное ядро, tests, PDF и production invariants сохраняются.

R1 объединён через PR `#65`, merge commit `816f1d67844494864ae6a31bb0b493a7e30242ec`.

## 4. R2 — завершён

PR `#66` объединён в `main`, merge commit `1180ff5de008662db63b07d6b973af4f772326ed`.

### Sheet/press presets

`src/sheet-press-presets.js`:

- complete built-in/local preset schema;
- sheet size stage;
- trim mode и стороны;
- press margins;
- favorite/recent metadata;
- namespaces `builtin:` / `local:`;
- deterministic local IDs;
- legacy migration;
- no duplicate trim for post-trim presets;
- immutable normalized objects.

### Application state

`src/application-state.js`:

- versioned project/input/runtime state;
- sheet, press, products, pricing и objective preferences;
- deterministic JSON;
- input revisions;
- begin/complete/fail calculation transitions;
- stale calculation result protection;
- selected plan и active screen вне production input.

### Persistence normalization

`src/application-state-persistence.js`:

- browser request не восстанавливается как active после reload;
- interrupted `calculating` state становится `dirty` и restartable;
- последний valid revision сохраняется.

### Local repositories

`src/local-state-repository.js`:

- project save/load/import/export/clear;
- local preset CRUD;
- favorite/recent ordering;
- deterministic collection JSON;
- legacy array migration;
- corrupted data не стирается молча;
- dependency injection позволяет тестировать без браузера.

### R2 evidence

Exact head: `374f410343417633c3ce55c168e1860b10c52288`.

Quality:

- run `30603877867` — success;
- `207/207` Node tests;
- artifact `8782884025`;
- digest `sha256:da88043476c656419a22dbb59997dc5a7e53dfc8613980880eb85a948d152073`.

Chromium/PDF regression:

- run `30603877872` — success;
- `20/20` Playwright scenarios;
- PDF verification passed;
- artifact `8782903792`;
- digest `sha256:114e1b48a4a2135f1e1f44e939b67755716c63f7539dd9e0da667a8259de0c7e`.

R2 не менял HTML, CSS, production formulas, solver, costing, PDF или version.

## 5. Новый целевой сценарий

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

## 6. Следующий обязательный pure model

До визуального R3 требуется полноценная product-row schema.

Она должна описывать:

- stable ID;
- name/file reference;
- finished size;
- quantity;
- pages;
- variant/file count;
- front/back colors;
- simplex/duplex;
- bleed;
- cut mode и gap;
- allowed duplex technology;
- enabled state;
- notes;
- field-level validation.

Collection model должен поддерживать add, duplicate, update, enable/disable, remove, reorder, serialization и migration старого `file,quantity,pages` ввода.

Этот patch не должен одновременно менять UI или solver.

## 7. Текущий production pipeline

```text
sheet/product inputs
→ printable geometry
→ fitting 0°/90° grids
→ page pairs
→ paperMinimum/dedicatedPairForms
→ front/back materialization
→ validation
→ production report
→ metrics and cost
→ lossless catalog
→ annotations/ranking
→ explicit operator selection
→ schemes/report/PDF
```

## 8. Честная finite scope

Полнота текущего пользовательского каталога относится только к:

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

## 9. Что ещё отсутствует

### Product layer

- окончательная product-row model;
- clean R3 desktop workspace;
- самостоятельный mobile workflow;
- live calculation adapter;
- field-level UI validation;
- project file download/upload UX;
- визуальный preset manager.

### Solver

- automatic mixed-format packing;
- разные форматы/тиражи в одном search;
- mixed rotations;
- bounded sequences частично заполненных форм;
- automatic user-driven work-and-turn;
- общий simplex/odd-page pipeline;
- progress/cancel/time limits;
- production beta matrix.

### Economics

- выручка;
- прибыль/убыток;
- маржа;
- резка, фальцовка и дополнительные операции.

## 10. Release status

- version не менялась;
- tag/release/news для R1/R2 не создавались;
- alpha.6 нельзя выпускать как удобный рабочий инструмент до реальной проверки владельцем нового R3–R4 flow.

## 11. Неблокирующий долг

Issue `#40`: заменить некорректное изображение Telegram-поста `0.7.0-alpha.2` через uNews `edit:media`.
