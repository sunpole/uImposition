# R3 — Operator-first workspace `/app/`

Статус: **реализуется в PR #74**.

Issue: `#73`.

Design gate: `#71`, PR `#72`.

## 1. Цель

R3 создаёт самостоятельный рабочий интерфейс для реального uniform duplex расчёта:

```text
sheet/press preset
→ product rows
→ live validation and calculation
→ paper/forms/plates/passes/cost comparison
→ operator selection
→ layout preview
```

Маршрут после merge:

```text
https://sunpole.github.io/uImposition/app/
```

Корневой `index.html` в этом PR не заменяется. Это позволяет владельцу проверить новый рабочий маршрут до окончательного переключения публичной точки входа.

## 2. Архитектурная граница

Новый интерфейс не переставляет legacy DOM и не импортирует superseded app-shell.

```text
/app/index.html
/app/app.css
/app/app.js
        ↓
R2 application state and local repositories
        ↓
product-row collection and field-level validation
        ↓
operator-workspace-calculation adapter
        ↓
existing geometry and user uniform plan pipeline
```

`app.js` отвечает за browser events, persistence, navigation and rendering. Он не содержит production formulas.

`src/operator-workspace-calculation.js` является pure adapter. Он:

- нормализует application state;
- проверяет product rows для текущего uniform pipeline;
- вычисляет sheet geometry и fitting `0°/90°`;
- создаёт реальные page pairs;
- вызывает существующий `createUserUniformProductionPlanSet`;
- сохраняет lossless plan catalog;
- разделяет recommendation и operator selection;
- создаёт plain-data layout preview;
- не изменяет solver и production formulas.

## 3. Sheet/press presets

Рабочий экран использует существующие R2 API:

- `createBuiltInSheetPressPresets()`;
- `createLocalSheetPressPreset()`;
- `createSheetPressPresetRepository()`;
- `applySheetPressPresetToApplicationState()`.

Встроенный или локальный preset применяется атомарно:

- исходный размер листа;
- стадия размера;
- зачистка;
- поля машины.

Пользователь видит отдельно:

- исходный лист;
- лист после зачистки;
- печатную область;
- поля машины.

Локальный preset сохраняется versioned repository в browser storage.

## 4. Product rows

Основная строка содержит:

- название/файл;
- ширину и высоту готового изделия;
- тираж одного вида;
- количество видов;
- страницы;
- краски лица;
- краски оборота.

Progressive disclosure содержит:

- simplex/duplex mode;
- duplex preference;
- bleed mode/value;
- common/separated cut;
- gap;
- rotation policy;
- notes.

Поддерживаются:

- add;
- duplicate;
- update;
- enable/disable;
- remove.

Все операции используют immutable actions из `application-product-rows.js`.

## 5. Live calculation lifecycle

Каждое производственное изменение повышает `inputRevision`.

```text
input change
→ dirty
→ debounced calculation request
→ calculating
→ ready or error
```

Запрос содержит revision. Результат с устаревшей revision не может заменить более новый ввод.

Если draft стал неверным:

- конкретное поле получает error state;
- оператор видит точную причину;
- последний корректный результат остаётся на экране;
- старый результат явно помечается как previous revision;
- новый неверный draft не выдаётся за рассчитанный.

## 6. Результаты

Для каждого найденного плана отображаются:

- physical sheets;
- layout forms;
- color plates;
- press passes;
- pair overrun;
- estimated total cost или явное отсутствие прайса;
- rank;
- Pareto/recommended/dominated annotations;
- explicit operator selection.

Фильтрация или выбор не удаляют планы из lossless catalog.

## 7. Layout preview

Preview строится из реального первого `runDescriptor` выбранного плана:

- rows;
- columns;
- rotation;
- capacity;
- run length;
- file;
- pair index;
- front page;
- paired back page.

Переключение `Лицо / Оборот` меняет только отображаемую страницу одной и той же проверенной пары. Оборот не редактируется независимо.

## 8. Pricing

Прайс считается готовым только если введены:

- grammage;
- paper price per kg;
- color plate price.

Layout-form preparation price может быть нулём.

Если профиль неполный:

```text
estimatedTotalCost = null
```

UI показывает `Прайс не введён`, а не `0`.

## 9. Mobile workflow

На ширинах до `860 px` основной workflow становится:

```text
Заказ → Варианты → Схема
```

Mobile navigation является самостоятельной, а не уменьшенной desktop sidebar.

Поля продукции переходят в двухколоночную форму, summary находится ниже строк, comparison открывается отдельным экраном.

## 10. Честная finite scope

R3 использует текущий полный catalog только внутри:

```text
один общий finished format
× одна общая print specification
× один общий bleed/cut contract
× duplex
× чётные complete page pairs
× automatic fitting 0°/90°
× paperMinimum and dedicatedPairForms
× separate front/back forms
```

Интерфейс может хранить более общие product-row данные, но adapter честно блокирует unsupported execution.

В PR #74 не реализуются:

- automatic mixed-format packing;
- mixed rotations on one sheet;
- general simplex pipeline;
- odd/incomplete page pairs;
- generalized user-driven work-and-turn;
- arbitrary sequences of partially filled forms;
- heavy-search worker/progress/cancel;
- root-site replacement;
- новый release/version;
- подключение selected-plan PDF к новому маршруту.

## 11. Проверки

Node tests покрывают:

- построение реальных uniform plans;
- missing/ready pricing;
- last-valid result;
- stale request protection;
- unequal side bleed boundary;
- operator selection persistence.

Chromium scenarios покрывают:

- desktop order workspace;
- desktop alternatives;
- mobile order;
- mobile plan selection and layout;
- field error with previous valid result;
- local preset creation and application.

Merge разрешён только после exact-head Quality, Chromium/PDF regression и ручного просмотра новых screenshots.
