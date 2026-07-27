# Документация uImposition / Documentation index

Этот файл — единый каталог документации проекта. Он помогает отличить текущие источники истины от нормативных справочников, завершённых milestone-документов и исторических evidence-материалов.

GitHub остаётся единственным источником истины. Перед разработкой сначала прочитайте [`../AGENTS.md`](../AGENTS.md), [`../START_HERE.md`](../START_HERE.md) и [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md), затем проверьте фактические `main`, Pull Request, Actions, tags, Releases и issues.

## Статусы документов

- **Актуальный** — обязан описывать фактическое текущее состояние проекта.
- **Нормативный** — задаёт устойчивые правила, требования или процесс.
- **Milestone** — фиксирует границы и решения конкретного этапа; может быть завершённым.
- **История / evidence** — сохраняет факты прошлого релиза или задания и не заменяет текущий handoff.

Исторические файлы могут намеренно содержать старые версии и прежние планы. Их нужно читать вместе с указанным статусом, а не «осовременивать» задним числом.

## 1. Начало работы и текущее состояние

| Документ | Статус | Назначение |
|---|---|---|
| [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) | Актуальный | Полная передача проекта, текущие границы search space и следующий этап |
| [`CURRENT_STATE.md`](CURRENT_STATE.md) | Актуальный | Проверенное фактическое состояние функций и release checkpoint |
| [`REMAINING_WORK.md`](REMAINING_WORK.md) | Актуальный | Остаток до 1.0 и порядок следующих milestone |
| [`ROADMAP.md`](ROADMAP.md) | Актуальный ориентир | Укрупнённая последовательность развития |
| [`PROJECT_CATALOG.md`](PROJECT_CATALOG.md) | Актуальный | Карта каталогов, исходных модулей, тестов, automation и правил размещения файлов |

## 2. Требования, архитектура и расчёты

| Документ | Статус | Назначение |
|---|---|---|
| [`TECHNICAL_SPECIFICATION_RU.md`](TECHNICAL_SPECIFICATION_RU.md) | Нормативный | Основное полное техническое задание на русском |
| [`TECHNICAL_SPECIFICATION_EN.md`](TECHNICAL_SPECIFICATION_EN.md) | Нормативный | Профессиональная английская версия технического задания |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Актуальный | Архитектурные слои, зависимости и карта текущего M7.5 pipeline |
| [`ALGORITHM_AND_OPTIMIZATION.md`](ALGORITHM_AND_OPTIMIZATION.md) | Нормативный | Алгоритмические принципы и честные границы оптимизации |
| [`CONFIG_REFERENCE.md`](CONFIG_REFERENCE.md) | Нормативный | Действующие настройки, presets и limits |
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

## 4. Текущий цикл M7

| Документ | Статус | Назначение |
|---|---|---|
| [`M7_IMPLEMENTATION_PLAN.md`](M7_IMPLEMENTATION_PLAN.md) | Milestone | Общая иерархия решений M7 |
| [`M7_4_WORK_AND_TURN.md`](M7_4_WORK_AND_TURN.md) | Завершённый milestone | Контрольный work-and-turn контур и его ограничения |
| [`M7_5_FEASIBLE_SOLUTION_CATALOG.md`](M7_5_FEASIBLE_SOLUTION_CATALOG.md) | Завершённый milestone | Lossless-каталог допустимых вариантов |
| [`M7_5_USER_UNIFORM_PRODUCTION_PLANS.md`](M7_5_USER_UNIFORM_PRODUCTION_PLANS.md) | Завершённый milestone | Пользовательские uniform production plans |
| [`M7_5_USER_PLAN_SELECTION_EXPORT.md`](M7_5_USER_PLAN_SELECTION_EXPORT.md) | Завершённый milestone | Явный выбор, схемы, report и PDF |
| [`M7_5_OBJECTIVE_PRIORITY_EDITOR.md`](M7_5_OBJECTIVE_PRIORITY_EDITOR.md) | Завершённый milestone | Приоритеты оператора и reranking без regeneration |

Следующий функциональный milestone описан в актуальных [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) и [`REMAINING_WORK.md`](REMAINING_WORK.md). Отдельного M7.6 implementation-документа пока нет.

## 5. Завершённые milestone и release evidence

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

## 6. Задания Codex

| Документ | Статус | Назначение |
|---|---|---|
| [`codex-tasks/2026-07-27_01_HANDOFF_AND_ALPHA5_RELEASE.md`](codex-tasks/2026-07-27_01_HANDOFF_AND_ALPHA5_RELEASE.md) | Выполненная история | Полное задание и completion record релиза `0.7.0-alpha.5` |

Новые задания сохраняются в `docs/codex-tasks/` только когда их полный текст и completion record нужны для передачи между сессиями. Короткие текущие действия должны отражаться в PR и актуальных status-документах, а не создавать лишние дубли.

## 7. Проверка каталога

```text
npm run check:docs
```

Проверка подтверждает, что локальные Markdown-ссылки не сломаны и каждый Markdown-файл внутри `docs/` присутствует в этом каталоге.

---

## English summary

This is the canonical documentation index. It separates current operational truth from stable policies, completed milestones, and historical evidence. Start with `AGENTS.md`, `START_HERE.md`, and `CODEX_HANDOFF.md`; verify live GitHub state before making changes; use `PROJECT_CATALOG.md` for the repository map; and run `npm run check:docs` to validate local links and catalog coverage.
