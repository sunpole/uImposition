# Документация uImposition / Documentation index

Этот файл — единый каталог документации проекта. Он помогает отличить текущие источники истины от нормативных справочников, завершённых milestone-документов и исторических evidence-материалов.

GitHub остаётся единственным источником истины. Перед разработкой сначала прочитайте [`../AGENTS.md`](../AGENTS.md), [`../START_HERE.md`](../START_HERE.md), [`OPERATOR_FIRST_PRODUCT_REBUILD.md`](OPERATOR_FIRST_PRODUCT_REBUILD.md), [`R2_APPLICATION_STATE_AND_PRESETS.md`](R2_APPLICATION_STATE_AND_PRESETS.md), [`PRODUCT_ROW_MODEL.md`](PRODUCT_ROW_MODEL.md), [`R3_OPERATOR_WORKSPACE.md`](R3_OPERATOR_WORKSPACE.md), [`R3_ACCEPTANCE_BLOCKERS.md`](R3_ACCEPTANCE_BLOCKERS.md), [`R3_WORK_AND_TURN_PLAN_FAMILY.md`](R3_WORK_AND_TURN_PLAN_FAMILY.md) и [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md), затем проверьте фактические `main`, Pull Request, Actions, tags, Releases и issues.

## Статусы документов

- **Актуальный** — обязан описывать фактическое текущее состояние проекта.
- **Нормативный** — задаёт устойчивые правила, требования или процесс.
- **Milestone** — фиксирует границы и решения конкретного этапа; может быть завершённым.
- **История / evidence** — сохраняет факты прошлого релиза или задания и не заменяет текущий handoff.
- **Superseded** — документ сохраняется как история решения, но не задаёт дальнейшую разработку.

Исторические файлы могут намеренно содержать старые версии и прежние планы. Их нужно читать вместе с указанным статусом, а не «осовременивать» задним числом.

## 1. Начало работы и текущее состояние

| Документ | Статус | Назначение |
|---|---|---|
| [`OPERATOR_FIRST_PRODUCT_REBUILD.md`](OPERATOR_FIRST_PRODUCT_REBUILD.md) | **Актуальный обязательный продуктовый контракт** | Новый operator-first workflow: пресеты листов, строки продукции, live calculation, сравнение бумага/forms/cost и чистый UI-слой |
| [`R2_APPLICATION_STATE_AND_PRESETS.md`](R2_APPLICATION_STATE_AND_PRESETS.md) | Завершённый pure-code milestone | Versioned application state, sheet/press presets, persistence normalization, migrations и local repositories из PR `#66` |
| [`PRODUCT_ROW_MODEL.md`](PRODUCT_ROW_MODEL.md) | Завершённый pure-code milestone | Реальный вид продукции, collection operations, field-level validation, legacy migration и application-state adapter из PR `#69` |
| [`R3_OPERATOR_WORKSPACE.md`](R3_OPERATOR_WORKSPACE.md) | **Активный production UI milestone** | Чистый рабочий маршрут `/app/`: presets, product rows, live calculation, alternatives, selection и layout preview |
| [`R3_WORK_AND_TURN_PLAN_FAMILY.md`](R3_WORK_AND_TURN_PLAN_FAMILY.md) | **Активный расчётный контракт R3** | Реальный `workAndTurn` в lossless-каталоге, условия применимости, shared plate, стоимость, UI и одностраничный PDF общей формы |
| [`R3_ACCEPTANCE_BLOCKERS.md`](R3_ACCEPTANCE_BLOCKERS.md) | **Активный acceptance patch contract** | Реальные замечания владельца перед root cutover и `0.7.0-alpha.6`: навигация, TXT, приоритеты, зеркальный оборот, ширина и независимая красочность |
| [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) | Актуальный для расчётного ядра и release-процесса | Полная передача существующего production pipeline и границ search space; UI-next-step заменён rebuild-контрактом |
| [`CURRENT_STATE.md`](CURRENT_STATE.md) | Актуальный | Проверенное фактическое состояние функций, rebuild и release checkpoint |
| [`REMAINING_WORK.md`](REMAINING_WORK.md) | Актуальный расчётный backlog | Остаток solver/production функций до 1.0; порядок UI-разработки задаёт rebuild-контракт |
| [`ROADMAP.md`](ROADMAP.md) | Актуальный ориентир | Укрупнённая последовательность развития; требует дальнейшей синхронизации с R0–R5 |
| [`PROJECT_CATALOG.md`](PROJECT_CATALOG.md) | Актуальный | Карта каталогов, исходных модулей, тестов, automation и правил размещения файлов |
| [`UI_UX_APPLICATION_REDESIGN.md`](UI_UX_APPLICATION_REDESIGN.md) | Superseded / история UX-0–UX-5 | Предыдущая попытка перестроить demo-page через app shell; не является основой нового UI |

## 2. Требования, архитектура и расчёты

| Документ | Статус | Назначение |
|---|---|---|
| [`TECHNICAL_SPECIFICATION_RU.md`](TECHNICAL_SPECIFICATION_RU.md) | Нормативный | Основное полное техническое задание на русском |
| [`TECHNICAL_SPECIFICATION_EN.md`](TECHNICAL_SPECIFICATION_EN.md) | Нормативный | Профессиональная английская версия технического задания |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Актуальный для доменного ядра | Архитектурные слои и текущий M7.5/M7.6 pipeline; новый state/storage layer описан в R2 |
| [`ALGORITHM_AND_OPTIMIZATION.md`](ALGORITHM_AND_OPTIMIZATION.md) | Нормативный | Алгоритмические принципы и честные границы оптимизации |
| [`CONFIG_REFERENCE.md`](CONFIG_REFERENCE.md) | Нормативный | Действующие настройки, presets, product-row defaults и limits |
| [`PRODUCTION_COSTING.md`](PRODUCTION_COSTING.md) | Нормативный | Модель производственной себестоимости и защита отсутствующих цен |
| [`BUSINESS_MODEL.md`](BUSINESS_MODEL.md) | Справочный | Возможная коммерческая модель; не является текущей production-логикой |
| [`BILINGUAL_LAYOUT.md`](BILINGUAL_LAYOUT.md) | Нормативный | Правила русско-английского интерфейса и документации |

## 3. Разработка, качество и публикация

| Документ | Статус | Назначение |
|---|---|---|
| [`GITHUB_ONLY_DEVELOPMENT.md`](GITHUB_ONLY_DEVELOPMENT.md) | Нормативный | Ветки, draft PR, exact-head checks и GitHub-only процесс |
| [`TEST_PLAN.md`](TEST_PLAN.md) | Нормативный | Unit, integration, Chromium, PDF и документационные проверки |
| [`SCREENSHOT_AUTOMATION.md`](SCREENSHOT_AUTOMATION.md) | Нормативный | Реальные Chromium screenshots и PDF evidence |
| [`VERSIONING.md`](VERSIONING.md) | Нормативный | Version checkpoint, recovery branch, immutable tag и GitHub Release |
| [`NEWS_PUBLISHING.md`](NEWS_PUBLISHING.md) | Нормативный | Patchnote, focused image и очередь uNews/Telegram |
| [`DEVELOPMENT_HISTORY_POLICY.md`](DEVELOPMENT_HISTORY_POLICY.md) | Нормативный | Сохранение полезной истории и правила будущей архивации |
| [`GITHUB_PAGES.md`](GITHUB_PAGES.md) | Справочный | Публикация статического сайта |
| [`REPOSITORY_SETUP.md`](REPOSITORY_SETUP.md) | Справочный | Метаданные и первоначальное оформление репозитория |

## 4. Текущий цикл M7 и operator-first rebuild

| Документ | Статус | Назначение |
|---|---|---|
| [`M7_IMPLEMENTATION_PLAN.md`](M7_IMPLEMENTATION_PLAN.md) | Milestone | Общая иерархия решений M7 |
| [`M7_4_WORK_AND_TURN.md`](M7_4_WORK_AND_TURN.md) | Завершённый milestone | Контрольный work-and-turn контур и его ограничения |
| [`M7_5_FEASIBLE_SOLUTION_CATALOG.md`](M7_5_FEASIBLE_SOLUTION_CATALOG.md) | Завершённый milestone | Lossless-каталог допустимых вариантов |
| [`M7_5_USER_UNIFORM_PRODUCTION_PLANS.md`](M7_5_USER_UNIFORM_PRODUCTION_PLANS.md) | Завершённый milestone | Пользовательские uniform production plans |
| [`M7_5_USER_PLAN_SELECTION_EXPORT.md`](M7_5_USER_PLAN_SELECTION_EXPORT.md) | Завершённый milestone | Явный выбор, схемы, report и PDF |
| [`M7_5_OBJECTIVE_PRIORITY_EDITOR.md`](M7_5_OBJECTIVE_PRIORITY_EDITOR.md) | Завершённый milestone | Приоритеты оператора и reranking без regeneration |
| [`M7_6_COMPARISON_TABLE_MODEL.md`](M7_6_COMPARISON_TABLE_MODEL.md) | Завершённая pure model / reusable core | Lossless-модель строк, колонок, filters, sorting, deltas и режима `Только различия` |
| [`OPERATOR_FIRST_PRODUCT_REBUILD.md`](OPERATOR_FIRST_PRODUCT_REBUILD.md) | Активный цикл R0–R5 | Новый продуктовый и архитектурный порядок пользовательской разработки |
| [`R2_APPLICATION_STATE_AND_PRESETS.md`](R2_APPLICATION_STATE_AND_PRESETS.md) | Завершённый R2 | State/preset/storage foundation, `207/207` tests и `20/20` Chromium/PDF regression |
| [`PRODUCT_ROW_MODEL.md`](PRODUCT_ROW_MODEL.md) | Завершённый foundation | Versioned product rows, list operations, compatibility boundaries and legacy order adapter |
| [`R3_OPERATOR_WORKSPACE.md`](R3_OPERATOR_WORKSPACE.md) | Активный R3 | Новый `/app/` без legacy DOM: быстрые presets, строки продукции, live result, comparison и схема |
| [`R3_ACCEPTANCE_BLOCKERS.md`](R3_ACCEPTANCE_BLOCKERS.md) | Активный acceptance cycle | Замечания реального operator acceptance и подтверждённые blocker-исправления |
| [`R3_WORK_AND_TURN_PLAN_FAMILY.md`](R3_WORK_AND_TURN_PLAN_FAMILY.md) | Активный R3 расчётный этап | Dedicated-pair shared plates, честные ограничения, выбор оператора и PDF общей формы |

Pure comparison model и часть app-shell эксперимента существуют в `main`, но новая пользовательская разработка **не продолжает** перестановку старых DOM-панелей.

Design gate `#71` завершён. PR `#72` опубликовал три концепции; выбран hybrid: A как основной быстрый стол, B как live layout pane, C позже как дополнительный expert table mode.

PR `#74` реализовал первый рабочий uniform duplex маршрут `/app/`. PR `#76` подключил PDF выбранного плана. PR `#78`, `#79` и `#80` закрыли подтверждённые acceptance-блокеры, включая зеркальный оборот и адаптацию телефонов. Draft PR `#81` подключает реальную пользовательскую plan-family своего оборота. Корневой сайт переключается только после повторной проверки владельцем.

## 5. Acceptance records

| Документ | Статус | Назначение |
|---|---|---|
| [`acceptance/README.md`](acceptance/README.md) | Каталог acceptance | Список материалов реальной проверки владельцем |
| [`acceptance/R3_OWNER_FEEDBACK_2026-07-31.md`](acceptance/R3_OWNER_FEEDBACK_2026-07-31.md) | Фактическая обратная связь | Замечания по опубликованному `/app/` |
| [`acceptance/R3_IMPLEMENTATION_ORDER.md`](acceptance/R3_IMPLEMENTATION_ORDER.md) | План реализации | Безопасный порядок исправлений PR `#78` |
| [`acceptance/R3_SCOPE_STATUS.md`](acceptance/R3_SCOPE_STATUS.md) | Scope ledger | Что входит и не входит в acceptance patch |
| [`acceptance/R3_TEST_MATRIX.md`](acceptance/R3_TEST_MATRIX.md) | Test contract | Unit, Chromium, PDF и visual acceptance matrix |

## 6. Завершённые milestone и release evidence

Эти документы сохраняют историю. Они не заменяют `CURRENT_STATE.md`.

| Документ | Статус |
|---|---|
| [`M3_IMPLEMENTATION_PLAN.md`](M3_IMPLEMENTATION_PLAN.md) | История M3 |
| [`M4_IMPLEMENTATION_PLAN.md`](M4_IMPLEMENTATION_PLAN.md) | История M4 |
| [`M4_RELEASE_EVIDENCE.md`](M4_RELEASE_EVIDENCE.md) | Evidence M4 |
| [`M5_IMPLEMENTATION_PLAN.md`](M5_IMPLEMENTATION_PLAN.md) | История M5 |
| [`M5_RELEASE_EVIDENCE.md`](M5_RELEASE_EVIDENCE.md) | Evidence M5 |
| [`M6_IMPLEMENTATION_PLAN.md`](M6_IMPLEMENTATION_PLAN.md) | История M6 |
| [`M6_RELEASE_EVIDENCE.md`](M6_RELEASE_EVIDENCE.md) | Evidence M6 |
| [`M7_1_RELEASE_EVIDENCE.md`](M7_1_RELEASE_EVIDENCE.md) | Evidence M7.1 |
| [`M7_3_PRODUCTION_ALTERNATIVES.md`](M7_3_PRODUCTION_ALTERNATIVES.md) | История M7.3 production alternatives |
| [`M7_3_DISPLAY_ALTERNATIVES.md`](M7_3_DISPLAY_ALTERNATIVES.md) | История M7.3 display set |
| [`M7_3_ALTERNATIVE_EXPLANATIONS.md`](M7_3_ALTERNATIVE_EXPLANATIONS.md) | История M7.3 explanations |
| [`M7_3_RUNTIME_UI.md`](M7_3_RUNTIME_UI.md) | История первого M7.3 runtime UI |
| [`M7_3_RUNTIME_ALTERNATIVES_UI.md`](M7_3_RUNTIME_ALTERNATIVES_UI.md) | История уточнённого M7.3 runtime UI |

## 7. Задания Codex

| Документ | Статус | Назначение |
|---|---|---|
| [`codex-tasks/2026-07-27_01_HANDOFF_AND_ALPHA5_RELEASE.md`](codex-tasks/2026-07-27_01_HANDOFF_AND_ALPHA5_RELEASE.md) | Выполненная история | Полное задание и completion record релиза `0.7.0-alpha.5` |
| [`codex-tasks/2026-07-31_01_R3_ACCEPTANCE_BLOCKERS.md`](codex-tasks/2026-07-31_01_R3_ACCEPTANCE_BLOCKERS.md) | Активное задание | Реализация blocker-only PR `#78` до повторной owner acceptance |

Новые задания сохраняются в `docs/codex-tasks/` только когда их полный текст и completion record нужны для передачи между сессиями. Operator-first rebuild закреплён в Issue #64, #68, #71, #73, #77 и PR #65/#66/#69/#72/#74/#76/#78/#79/#80/#81.

## 8. Проверка каталога

```text
npm run check:docs
```

Проверка подтверждает, что локальные Markdown-ссылки не сломаны и каждый Markdown-файл внутри `docs/` присутствует в этом каталоге.

---

## English summary

This is the canonical documentation index. R1 stopped the legacy app-shell direction, R2 completed versioned state and sheet/press presets, and the product-row foundation defines real production rows with field-level validation. The active R3 milestone builds a clean `/app/` route on top of those pure models and the existing uniform production pipeline. PRs `#78`–`#80` completed the confirmed owner-acceptance blocker fixes, while draft PR `#81` connects a real horizontally eligible work-and-turn shared-plate family to comparison, operator selection and PDF export.
