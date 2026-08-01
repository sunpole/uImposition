# AGENTS.md — правила работы над uImposition

## Начало любой новой сессии

Сначала прочитать:

1. `START_HERE.md`;
2. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
3. `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
4. `docs/PRODUCT_ROW_MODEL.md`;
5. Issue `#64`;
6. `docs/CODEX_HANDOFF.md`;
7. `docs/README.md` и `docs/PROJECT_CATALOG.md`;
8. `docs/AGENT_SKILLS.md`;
9. фактические `main`, PR, Actions, tags, Releases и issues.

Не опираться на память предыдущего чата. GitHub — единственный источник истины.

Эти правила обязательны во всех средах: Codex, Claude Code, терминал, ChatGPT в браузере или на телефоне, GitHub connector и GitHub-only работа без локального checkout.

## Источники истины

Порядок приоритета:

1. фактическое состояние GitHub;
2. `START_HERE.md`;
3. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`;
4. Issue `#64`;
5. активный milestone-документ;
6. `docs/R2_APPLICATION_STATE_AND_PRESETS.md`;
7. `docs/PRODUCT_ROW_MODEL.md`;
8. `docs/CODEX_HANDOFF.md`;
9. `docs/CURRENT_STATE.md`;
10. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
11. `docs/REMAINING_WORK.md`;
12. `docs/TECHNICAL_SPECIFICATION_RU.md`;
13. `docs/ARCHITECTURE.md`;
14. `src/config.js`;
15. tests и fixtures;
16. process/release/news документы;
17. `docs/AGENT_SKILLS.md` и `docs/agents/` для agent workflow.

`docs/UI_UX_APPLICATION_REDESIGN.md` и PR `#62` — superseded-история. Они не задают новый UI.

При расхождении документации и кода расхождение фиксируется и исправляется, а не скрывается.

## GitHub-only разработка

- отдельная ветка на одну измеримую цель;
- draft PR;
- exact-head GitHub Actions;
- реальный Chromium для пользовательских изменений;
- merge только проверенного head;
- терминал может дополнять проверку, но не заменяет GitHub evidence;
- важный результат сохраняется как code, test, document, issue или artifact.

## AGENTS.md — обязательный диспетчер skills

`AGENTS.md` контролирует применение всех project и upstream skills. Агент не должен начинать планирование реализации, изменять файлы, создавать implementation issue/PR или писать production-код, пока не выполнит маршрутизацию skills.

Перед каждой задачей агент обязан:

1. классифицировать запрос и определить, какие решения и риски он затрагивает;
2. выбрать обязательные skills по таблице ниже;
3. прочитать полные `SKILL.md` выбранных skills до действия;
4. применять все выбранные skills совместно, соблюдая их порядок и зависимости;
5. указать использованные skills в specification, issue, PR или итоговом отчёте;
6. при появлении нового типа работы остановиться, повторить маршрутизацию и подключить дополнительный skill.

### Как загружать skills

Локальная установка не является условием соблюдения правил.

- Если skill установлен и доступен агенту, использовать установленную версию.
- Если работа идёт с телефона, через ChatGPT/GitHub connector или без локального checkout, прочитать project skill из `agent-skills/<name>/SKILL.md`, а upstream skill — из pinned submodule `.agent-vendor/mattpocock-skills/skills/**/<name>/SKILL.md` через GitHub.
- Upstream должен соответствовать commit, закреплённому в `docs/AGENT_SKILLS.md`.
- Отсутствие slash-команды, локального skill index или терминала не разрешает пропустить skill: его инструкции выполняются вручную как обязательный протокол.
- Если обязательный `SKILL.md` невозможно открыть, нельзя продолжать работу. Нужно сообщить блокер владельцу.

### Приоритет правил

1. system/safety ограничения среды;
2. этот `AGENTS.md` и неприкосновенные правила uImposition;
3. project skills из `agent-skills/`;
4. upstream skills из pinned `mattpocock/skills`;
5. specification/ticket текущей задачи;
6. предпочтения и стандартные рекомендации skill.

Upstream skill не может отменить production invariants, GitHub-only процесс, exact-head проверки или явное решение владельца, принятое после clarification gate.

### Обязательная маршрутизация

| Тип работы | Обязательные skills / порядок |
|---|---|
| Новый продуктовый сценарий, frontend/UX, backend/API, solver, persistence, pricing, import/export/PDF, performance | `uimposition-product-gate` → `grill-with-docs` или `grilling`; при терминах/архитектуре также `domain-modeling` |
| Большая или неясная задача, которая не помещается в одну сессию | `wayfinder`; для решений — `grill-with-docs` |
| Исследование внешнего стандарта, алгоритма или технологии | `research` |
| Одноразовый эксперимент для ответа на конкретный вопрос | `prototype`; только после явного разрешения владельца во время gate |
| Ошибка или регрессия | `diagnosing-bugs` → `tdd` → `code-review` |
| Реализация утверждённой функции | `to-spec` → `to-tickets` при нескольких slices → `implement` → `tdd` → `code-review` |
| Архитектурное улучшение | `improve-codebase-architecture` → `codebase-design`; при изменении языка проекта также `domain-modeling` |
| Обработка issues и готовности задач | `triage` |
| Конфликт merge/rebase | `resolving-merge-conflicts` |
| Передача между чатами, устройствами или агентами | `handoff` |
| Обучение пользователя | `teach` |
| Неясно, какой flow выбрать | `ask-matt`, затем выполнить выбранный flow |

User-invoked skills (`grill-me`, `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `wayfinder`, `handoff`, `teach`, `ask-matt` и другие с таким режимом) не вызываются агентом как slash-команда без пользователя, но `AGENTS.md` всё равно требует применять их опубликованный процесс вручную либо попросить владельца явно запустить соответствующий flow.

## Agent skills

### Issue tracker

Задачи, specifications и investigation tickets ведутся в GitHub Issues. См. `docs/agents/issue-tracker.md`.

### Triage labels

Используются стандартные роли `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. См. `docs/agents/triage-labels.md`.

### Domain docs

Проект использует single-context layout. См. `docs/agents/domain.md`.

### Обязательный clarification gate

До написания production-кода для любого нетривиального изменения frontend/UX, backend/API, solver/формул, persistence/schema, pricing, import/export/PDF, performance или operator workflow обязательно использовать skill `uimposition-product-gate` и дисциплину `grill-with-docs`/`grilling`.

- факты искать в GitHub, коде, tests, fixtures и документации, а не спрашивать у владельца;
- владельцу задавать только вопросы решений;
- задавать ровно один вопрос за сообщение;
- к каждому вопросу давать рекомендуемый ответ;
- пройти зависимости, исключения и edge cases;
- не писать production-код, не менять поведение и не мигрировать данные до завершения интервью;
- реализация разрешена только после явного подтверждения владельца: `Общее понимание достигнуто. Можно переходить к спецификации и реализации.`

После подтверждения использовать flow `to-spec → to-tickets → implement → tdd → code-review` по масштабу задачи.

Gate можно пропустить только для механической правки, однозначного bug fix с уже зафиксированным expected behaviour или явного waiver владельца для конкретной ограниченной задачи. Даже при исключении агент обязан выполнить маршрутизацию и записать основание исключения. Полные правила: `docs/AGENT_SKILLS.md`.

## Неприкосновенные производственные правила

- не менять формулы молча;
- не добавлять магические числа вне config;
- не строить оборот независимо от лица;
- недопечатка запрещена;
- feasible не равен proven minimum;
- bounded/truncated search не называется глобально полным;
- допустимые планы не удаляются из catalog data;
- filters/sort меняют view, а не планы;
- recommendation не заменяет operator selection;
- отсутствующая стоимость не превращается в ноль;
- layout forms и color plates не смешиваются;
- machine compatibility подтверждает оператор;
- новый расчётный модуль получает pure API и unit tests;
- русский пользовательский текст имеет профессиональную английскую версию.

## Operator-first product layer

- текущий сайт — технический прототип;
- не переставлять legacy DOM как основу новой оболочки;
- не лечить архитектуру очередным CSS override;
- milestone, roadmap, diagnostics и evidence не входят в основной workflow;
- новый UI использует versioned application state из R2;
- product input использует product-row/collection model из PR `#69`;
- domain modules получают plain data и не читают DOM;
- UI dispatch-ит actions и render-ит state, но не содержит production formulas;
- один расчёт создаёт один согласованный snapshot;
- stale async result не перезаписывает новый input;
- ошибка draft input не уничтожает последний valid result;
- disabled invalid product row сохраняется, но не блокирует активный заказ;
- interrupted calculation после reload становится `dirty`, а не остаётся active;
- local presets и projects используют schemaVersion и migrations;
- mobile — самостоятельный сценарий `Заказ → Варианты → Схема`;
- production implementation R3 начинается только после выбора визуального направления.

## Завершённые этапы rebuild

### R0

Старое UI-направление остановлено, PR `#62` закрыт без merge.

### R1

Operator-first contract объединён через PR `#65`.

### R2

PR `#66` добавил:

- `sheet-press-presets.js`;
- `application-state.js`;
- `application-state-persistence.js`;
- `local-state-repository.js`;
- versioned storage keys;
- migrations;
- `207/207` Node tests;
- `20/20` Chromium/PDF regression scenarios.

### Product-row foundation

PR `#69` добавил:

- `product-row.js`;
- `product-row-collection.js`;
- `application-product-rows.js`;
- реальную schema вида продукции;
- field-level validation;
- immutable collection operations;
- disabled non-blocking drafts;
- legacy migration;
- current uniform compatibility boundary;
- application-state revisions;
- `236/236` Node tests;
- `20/20` Chromium/PDF regression scenarios.

R2 и product-row foundation намеренно не подключены к legacy DOM.

## Следующий обязательный этап — R3 visual direction gate

До production HTML/CSS подготовить минимум три действительно разных направления:

1. `Compact production desk`;
2. `Split workspace`;
3. `Table-first operator console`.

Каждое направление должно показать:

- desktop 1440 и 1024;
- mobile 390 и 360;
- preset switcher;
- один и пять product rows;
- field-level error;
- calculating/ready states;
- comparison бумага/forms/plates/passes/cost;
- selected layout preview;
- primary/secondary action hierarchy;
- отсутствие milestone/roadmap/debug панелей.

Перед идеацией и redesign использовать Product Design context workflow. Решение должно быть зафиксировано в issue/document before production implementation.

Запрещено:

- начинать R3 с копирования `index.html`;
- переносить существующие панели как готовые компоненты;
- выбирать направление только по красоте без рабочего сценария;
- смешивать visual exploration, production implementation и новый solver в одном PR.

## R3 — после выбора направления

Отдельный implementation PR:

- новый clean entrypoint;
- отдельная чистая CSS-система;
- preset switcher;
- product rows;
- field-level validation;
- live calculation controller;
- last valid result;
- current uniform-pipeline adapter;
- самостоятельный mobile flow;
- desktop/mobile Chromium evidence.

## R4

- comparison бумага/forms/plates/passes/cost;
- operator selection;
- layout preview;
- existing PDFs.

## R5

Mixed-format/multi-product solver расширяется отдельными bounded plan-family с limits, progress/cancel и validation.

## Правила патча

- одна ветка/PR — одна цель;
- сначала pure model/tests, затем runtime/UI;
- не смешивать persistence, visual redesign, solver и release packaging;
- не ослаблять validation ради зелёного теста;
- draft PR остаётся draft до exact-head checks;
- пользовательский patch получает desktop/mobile Chromium evidence;
- merge выполнять только immutable проверенного head.

## Version и release

- internal pure foundation и visual exploration могут не менять version;
- version меняется только для законченного публикуемого checkpoint;
- при version change синхронизируются все version sources, visible version и screenshot assertions;
- каждый опубликованный patch получает recovery branch, immutable tag и GitHub Release/prerelease;
- release получает patchnote, реальный focused image, uNews payload и permanent evidence archive;
- нельзя утверждать Release без настоящей Release card и проверенных assets;
- опубликованный tag не перемещается.

## История и evidence

- полезные historical files, tests, workflows, screenshots и evidence не удалять без отдельной причины;
- старый UI можно сохранять как regression/reference;
- AI image не доказывает работу функции;
- screenshot не содержит secrets, cookies, private data или local paths;
- Telegram отправляется только через uNews.

## Предпочтительная технология

- HTML/CSS/JavaScript ES modules;
- без обязательного build step;
- pure domain/state/product modules;
- versioned plain-data state;
- deterministic actions/reducer-style updates;
- Node built-in tests;
- Playwright Chromium evidence;
- GitHub Pages;
- небольшие модули с одной ответственностью;
- Web Worker только для реально тяжёлого search.

## Формат отчёта агента

Сообщить:

1. исходную branch/version/commit;
2. измеримую цель;
3. применённые skills и основание маршрутизации;
4. изменённые файлы и решения;
5. фактические tests и Actions;
6. artifact IDs/digests;
7. screenshot evidence, если UI менялся;
8. сохранённые invariants и оставшиеся boundaries;
9. version/release status;
10. PR, exact head и merge commit.

---

## English summary

`AGENTS.md` is the mandatory, device-independent skill router for uImposition. Every agent session, including phone and GitHub-only chat, must classify the task, load the applicable project and pinned upstream `SKILL.md` files, and follow their process before taking action. Local installation is optional convenience and never a reason to bypass a skill. The product clarification gate remains mandatory before non-trivial implementation.