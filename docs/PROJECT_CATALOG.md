# Каталог проекта uImposition / Project catalog

Последняя структурная сверка: **27 июля 2026**, checkpoint `0.7.0-alpha.5`.

Этот документ объясняет назначение каталогов и активных групп файлов. Он не заменяет [`ARCHITECTURE.md`](ARCHITECTURE.md): архитектура описывает зависимости и поток расчёта, а каталог отвечает на вопрос «где что лежит и куда добавлять новое».

## 1. Корень репозитория

| Путь | Назначение |
|---|---|
| `index.html` | Основная страница GitHub Pages и стабильные DOM anchors |
| `styles.css` | Базовые стили страницы |
| `m3.css` … `m7-*.css`, `user-*.css` | Стили milestone- и feature-панелей, подключаемые соответствующими UI-модулями |
| `decision-profile-demo.html` | Изолированная демонстрация decision profile |
| `site.js` | Вспомогательный ранний browser script; текущий `index.html` его не загружает |
| `VERSION.json`, `VERSION.md`, `CHANGELOG.md` | Версия, человекочитаемый checkpoint и история изменений |
| `README.md`, `START_HERE.md`, `AGENTS.md` | Публичное описание, точка входа и обязательные правила агента |
| `CONTRIBUTING.md`, `LICENSE.md` | Участие в проекте и лицензирование |
| `package.json` | Node-команды проверок; runtime сайта не требует build step |

Root CSS пока не переносится массово: пути динамически подключаются из UI-модулей и покрыты Chromium-сценариями. Возможная будущая консолидация стилей должна быть отдельным UI/architecture patch.

## 2. Основные каталоги

| Каталог | Что хранится | Правило |
|---|---|---|
| `src/` | Production ES modules и UI coordinators | Расчётная логика остаётся чистой и не прячется в DOM |
| `tests/` | Node unit/integration/regression tests | Имя теста соответствует модулю или milestone |
| `data/` | Контрольные и regression fixtures | Fixture не выдаётся за automatic solver |
| `tools/` | Release, documentation, screenshot и PDF tooling | Инструменты не меняют production-формулы |
| `docs/` | Текущие, нормативные, milestone и исторические документы | Полный индекс находится в [`README.md`](README.md) |
| `docs/codex-tasks/` | Полные задания и completion records для передачи сессий | Не использовать для коротких временных заметок |
| `news/` | Patchnotes и реальные release images | Один release — свой текст и своё изображение |
| `archive/development/` | Постоянные evidence-пакеты опубликованных версий | Не переписывать задним числом |
| `.github/workflows/` | Quality, Chromium/PDF, uNews и release automation | PR объединяется только после exact-head checks |

## 3. Карта `src/`

### Configuration и ввод

```text
config.js
config.example.js
geometry.js
orders.js
orientation.js
print-specification.js
```

Здесь находятся presets/limits, лист и печатная область, строки заказов, направления и спецификация печати.

### Лицо, оборот, кандидаты и validation

```text
front-layout.js
back-layout.js
imposition-validation.js
imposition-candidate.js
candidate-generator.js
imposition-distribution.js
mixed-format-layout.js
paper-minimizer.js
```

`mixed-format-layout.js` проверяет переданную раскладку и не является automatic packing solver. Оборот создаётся только из лица.

### Production, стоимость и метрики

```text
production-metrics.js
production-validation.js
production-report.js
production-cost.js
production-solution-metrics.js
solution-metrics.js
paper-solution-metrics.js
```

Layout-формы и цветовые пластины остаются разными метриками. Отсутствующая цена не становится нулём.

### Решения и каталог вариантов

```text
optimization-objectives.js
decision-profile.js
pareto-alternatives.js
pareto-display-set.js
feasible-solution-catalog.js
production-alternative-set.js
alternative-explanations.js
alternatives-runtime.js
alternatives-controller.js
```

Исходный каталог остаётся lossless; filtering, Pareto и recommendation являются представлением и аннотациями.

### Пользовательский M7.5 pipeline

```text
user-uniform-production-plans.js
user-production-plans-runtime.js
user-objective-priority.js
user-production-plans-ui.js
user-objective-priority-ui.js
user-production-plan-details-ui.js
```

Модель, runtime и UI разделены. Selection оператора не подменяется recommendation, а reranking не регенерирует планы.

### Duplex и work-and-turn

```text
duplex-strategies.js
work-and-turn-layout.js
work-and-turn-control-case.js
work-and-turn-runtime.js
work-and-turn-ui.js
```

Текущий контур ограничен задокументированным симметричным контрольным случаем и не доказывает совместимость с конкретной машиной.

### Представление и PDF

```text
paper-solution-view.js
paper-solution-renderer.js
production-report-renderer.js
scheme-renderer.js
pdf-document-model.js
pdf-binary.js
pdf-scheme-renderer.js
pdf-report-renderer.js
pdf-export-ui.js
pricing-ui.js
alternatives-ui.js
app.js
```

Renderer получает готовую проверенную модель и не пересчитывает производственные формулы. `app.js` остаётся DOM-координатором.

### Исторические demo entrypoints

```text
m3-demo.js
m7-decision-demo.js
```

Эти модули поддерживают демонстрационные и regression-контуры. Удаление или объединение требует отдельной проверки их HTML/scenario consumers.

## 4. Тесты и fixtures

`tests/` сгруппирован по ответственности:

- geometry/orders/front-back;
- M4 production report;
- M5 PDF model, writer и renderers;
- M6 candidates и paper minimizer;
- M7 objectives, pricing, Pareto и alternatives;
- user plan generation, runtime, selection/export и objective persistence;
- work-and-turn;
- production regression fixtures.

`data/` содержит:

- `control-case.json` — основной исторический контрольный набор;
- `control-layout-m3.json` — контрольная раскладка M3;
- `m7-decision-cases.json` — decision fixtures;
- `production-regression-cases.json` — производственные regression cases.

Команда полного source/unit контроля:

```text
npm run check
```

## 5. Automation

### GitHub Actions

| Workflow | Назначение |
|---|---|
| `quality.yml` | Source, documentation и Node tests |
| `capture-screenshots.yml` | Real Chromium, desktop/mobile screenshots, PDF download, `pdfinfo` и Poppler |
| `validate-unews.yml` | Проверка patchnote и очереди публикации |
| `prepare-release-news.yml` | Сбор focused release evidence и manifest |
| `publish-version-release.yml` | Recovery branch, immutable tag и GitHub Release/prerelease |

### Локальные инструменты

| Путь | Назначение |
|---|---|
| `tools/docs/check-docs.mjs` | Локальные Markdown-ссылки и полнота каталога документации |
| `tools/screenshots/` | Playwright scenarios, capture manifest и подготовка artifacts |
| `tools/news/prepare-release.mjs` | Patchnote, evidence archive, hashes и release manifest |

## 6. Releases, news и история

- `news/README.md` задаёт формат patchnote.
- `news/*.{md,png,jpg}` хранит опубликованный текст и focused image конкретной версии.
- `archive/development/{version}/release.json` хранит manifest.
- Evidence ZIP и SHA-256 принадлежат конкретному immutable checkpoint.
- Старые milestone/evidence документы индексируются в [`docs/README.md`](README.md), но не становятся текущими инструкциями.

## 7. Куда добавлять новый файл

| Новый материал | Правильное место |
|---|---|
| Чистая расчётная модель | `src/{responsibility}.js` + соответствующий `tests/*.test.js` |
| DOM/UI renderer | отдельный `src/*-ui.js` или `src/*-renderer.js`; стили — связанный CSS |
| Fixture | `data/` с явным описанием границы |
| Chromium scenario | `tools/screenshots/scenarios/` |
| Текущее состояние | существующий `CURRENT_STATE.md`, `REMAINING_WORK.md` или handoff |
| Устойчивое правило/справочник | отдельный нормативный файл в `docs/` и запись в `docs/README.md` |
| Полное задание передачи | `docs/codex-tasks/` |
| Release note | `news/` |
| Immutable release evidence | `archive/development/{version}/` и GitHub Release assets |

Не создавать новый документ, если достаточно обновить существующий источник истины. Не переносить и не удалять исторические файлы массово без отдельного решения владельца.

---

## English summary

This catalog maps repository locations to their responsibilities and file-placement rules. Production logic belongs in pure `src/` modules with matching tests; UI stays separate; fixtures remain explicit; documentation is indexed by status; news and release evidence are version-specific and immutable; and historical files are retained until the owner approves a separate archive migration.
