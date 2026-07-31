# Каталог проекта uImposition / Project catalog

Последняя структурная сверка: **31 июля 2026**, опубликованный checkpoint `0.7.0-alpha.5`, operator-first rebuild R2.

Этот документ объясняет назначение каталогов и активных групп файлов. Он не заменяет [`ARCHITECTURE.md`](ARCHITECTURE.md): архитектура описывает зависимости и поток расчёта, а каталог отвечает на вопрос «где что лежит и куда добавлять новое».

## 1. Корень репозитория

| Путь | Назначение |
|---|---|
| `index.html` | Текущая историческая GitHub Pages оболочка и legacy DOM anchors; не является основой нового R3 UI |
| `styles.css` | Базовые стили текущей страницы |
| `m3.css` … `m7-*.css`, `user-*.css` | Стили milestone- и feature-панелей текущего технического UI |
| `decision-profile-demo.html` | Изолированная демонстрация decision profile |
| `site.js` | Вспомогательный ранний browser script; текущий `index.html` его не загружает |
| `VERSION.json`, `VERSION.md`, `CHANGELOG.md` | Версия, человекочитаемый checkpoint и история изменений |
| `README.md`, `START_HERE.md`, `AGENTS.md` | Публичное описание, точка входа и обязательные правила агента |
| `CONTRIBUTING.md`, `LICENSE.md` | Участие в проекте и лицензирование |
| `package.json` | Node-команды проверок; runtime сайта не требует build step |

Root CSS не переносится массово в R2: этот этап не меняет визуальную оболочку. Новый R3 workspace должен получить отдельную чистую HTML/CSS-структуру после выбора визуального направления, а не продолжать цепочку legacy overrides.

## 2. Основные каталоги

| Каталог | Что хранится | Правило |
|---|---|---|
| `src/` | Production ES modules, pure state/storage models и UI coordinators | Расчётная логика и application state остаются чистыми и не прячутся в DOM |
| `tests/` | Node unit/integration/regression tests | Имя теста соответствует модулю или milestone |
| `data/` | Контрольные и regression fixtures | Fixture не выдаётся за automatic solver |
| `tools/` | Release, documentation, screenshot и PDF tooling | Инструменты не меняют production-формулы |
| `docs/` | Текущие, нормативные, milestone и исторические документы | Полный индекс находится в [`README.md`](README.md) |
| `docs/codex-tasks/` | Полные задания и completion records для передачи сессий | Не использовать для коротких временных заметок |
| `news/` | Patchnotes и реальные release images | Один release — свой текст и своё изображение |
| `archive/development/` | Постоянные evidence-пакеты опубликованных версий | Не переписывать задним числом |
| `.github/workflows/` | Quality, Chromium/PDF, uNews и release automation | PR объединяется только после exact-head checks |

## 3. Карта `src/`

### Configuration, application state и ввод

```text
config.js
sheet-press-presets.js
application-state.js
application-state-persistence.js
local-state-repository.js
geometry.js
orders.js
orientation.js
print-specification.js
```

Назначение:

- `config.js` — production presets, defaults, limits и versioned storage keys;
- `sheet-press-presets.js` — полная immutable schema встроенных и локальных пресетов листа/машины, validation и migration;
- `application-state.js` — versioned plain-data state нового operator-first product layer, input revisions и защита от stale calculation results;
- `application-state-persistence.js` — удаляет transient active request перед сохранением и восстанавливает прерванный расчёт как `dirty`/restartable;
- `local-state-repository.js` — dependency-injected repositories для project state и локальных sheet/press presets;
- `geometry.js`, `orders.js`, `orientation.js`, `print-specification.js` — существующая чистая геометрия, строки заказов, направления и спецификация печати.

R2-модули не импортируют DOM и не подключаются к legacy `app.js`. Новый R3 UI обязан потреблять application state, а не читать production input напрямую из разрозненных полей.

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

### Пользовательский M7.5/M7.6 pipeline

```text
user-uniform-production-plans.js
user-production-plans-runtime.js
user-objective-priority.js
user-production-comparison-table.js
user-production-comparison-ui.js
user-production-comparison-status-layout.js
user-production-plans-ui.js
user-objective-priority-ui.js
user-production-plan-details-ui.js
```

M7.5 разделяет generation, runtime, selection/details и UI. M7.6 `user-production-comparison-table.js` является чистой reusable view-model: сохраняет ссылку на каждый исходный plan, даёт lossless `allRows`, view-only filters/sorting, exact deltas и режим `Только различия` без regeneration.

UI-модули этого раздела сохраняются как работающий технический эксперимент и regression reference, но не являются обязательной основой R3.

### Application shell experiment

```text
app-shell-model.js
app-shell.js
app-shell-bootstrap.js
```

Эти файлы принадлежат superseded UX-0–UX-5 направлению. Они остаются в `main` для истории и regression, но новая оболочка не должна строиться их дальнейшим расширением или перестановкой legacy DOM.

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

Renderer получает готовую проверенную модель и не пересчитывает производственные формулы. `app.js` остаётся координатором legacy DOM до появления отдельного R3 entrypoint.

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
- M7.6 comparison rows, view-only filters/sorting, deltas и missing-pricing guards;
- R2 sheet/press preset validation, namespaces и migrations;
- R2 immutable application state, deterministic serialization и stale-result guards;
- R2 project/preset repositories, import/export, favorites/recent ordering, interrupted-calculation recovery и corrupted-storage handling;
- work-and-turn;
- production regression fixtures.

R2 tests:

```text
tests/sheet-press-presets.test.js
tests/application-state.test.js
tests/local-state-repository.test.js
```

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

R2 меняет только pure modules, tests, config keys и документацию. Chromium/PDF не является обязательным gate по содержанию, но workflow может запускаться консервативной path matrix и тогда должен оставаться зелёным.

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
- Внутренний pure R2 foundation не меняет version и не создаёт release assets.

## 7. Куда добавлять новый файл

| Новый материал | Правильное место |
|---|---|
| Чистая расчётная модель | `src/{responsibility}.js` + соответствующий `tests/*.test.js` |
| Versioned application state или migration | отдельный pure `src/*state*.js` / `src/*migration*.js` + tests |
| Storage adapter/repository | отдельный dependency-injected `src/*repository*.js` + memory-storage tests |
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

This catalog maps repository locations to their responsibilities. R2 introduces complete sheet/press presets, a versioned immutable application state with stale-calculation guards, transient persistence normalization, and dependency-injected local repositories with explicit migrations. They do not touch the DOM or production formulas. The existing app-shell/UI modules remain as superseded regression references; R3 must create a clean operator-first entrypoint on top of R2 rather than rearranging the legacy page.