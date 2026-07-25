# Архитектура / Architecture

## Принцип / Principle

uImposition остаётся статическим браузерным приложением без обязательного сервера и build step. GitHub Pages получает обычные HTML, CSS и JavaScript ES modules. Расчёт, оптимизация и PDF выполняются локально в браузере; GitHub Actions используются для воспроизводимой проверки.

uImposition remains a static browser application with no mandatory server or build step. GitHub Pages serves plain HTML, CSS, and JavaScript ES modules. Calculation, optimisation, and PDF generation run locally in the browser; GitHub Actions provide reproducible verification.

## Слои / Layers

1. **Конфигурация** — пресеты, ограничения, PDF и границы поиска.
2. **Домен** — заказы, пары страниц, кандидаты, спрос, схемы и отчёты.
3. **Геометрия** — лист, изделие, uniform-grid и заданные mixed-format placements.
4. **Оптимизация** — кандидаты, событийные тиражи, упаковка остатков и доказательство бумажной нижней границы.
5. **Валидация** — схемы, mixed-format duplex, производство и экспорт.
6. **Представление** — DOM-renderers без производственных формул.
7. **PDF-экспорт** — чистая модель, Canvas-renderers и бинарный контейнер.
8. **Проверка артефактов** — Node, Chromium, `pdfinfo`, Poppler и ручной review.
9. **Хранение** — browser storage без серверной базы.

## Фактическая структура M6 / Actual M6 structure

```text
src/
├─ config.js
├─ geometry.js
├─ orders.js
├─ orientation.js
├─ front-layout.js
├─ back-layout.js
├─ imposition-validation.js
├─ imposition-candidate.js
├─ candidate-generator.js
├─ paper-minimizer.js
├─ paper-solution-view.js
├─ paper-solution-renderer.js
├─ mixed-format-layout.js
├─ print-specification.js
├─ production-metrics.js
├─ production-validation.js
├─ production-report.js
├─ scheme-renderer.js
├─ production-report-renderer.js
├─ pdf-document-model.js
├─ pdf-binary.js
├─ pdf-scheme-renderer.js
├─ pdf-report-renderer.js
├─ pdf-export-ui.js
├─ app.js
└─ m3-demo.js
```

## Геометрия, лицо и оборот

- `geometry.js` — лист, изделие и uniform-grid 0°/90°;
- `orders.js` — заказы и последовательные пары страниц;
- `front-layout.js` — детерминированное row-major лицо;
- `back-layout.js` — оборот только из готового лица;
- `imposition-validation.js` — страницы, зеркальность, координаты и направления;
- `mixed-format-layout.js` — проверка заданных прямоугольников разных форматов и зеркальный mixed-format оборот.

`mixed-format-layout.js` не является автоматическим rectangle-packing solver. Он валидирует явную раскладку: границы, пересечения, страницы и зеркальность.

## M6: модель кандидата

### `imposition-candidate.js`

Чистый слой без DOM:

- полный кандидат `rows × columns`;
- один непрерывный блок на пару;
- неизменяемое состояние спроса;
- `T_first` и `T_complete`;
- применение явного тиража;
- объяснимые вклады и остатки;
- преобразование в вход `createFrontLayout`.

### `candidate-generator.js`

- генерирует точное ограниченное пространство;
- текущая конфигурация: 1–2 различные пары на полном лице;
- для 35 пар и 16 позиций даёт все `8960` кандидатов;
- production signature удаляет только эквивалентность порядка блоков;
- любое усечение сообщается явно и запрещает заявление о полноте.

## M6: минимум бумаги

### `paper-minimizer.js`

Конструкция состоит из двух частей:

1. для каждой пары печатаются полные группы по `capacity`;
2. остатки упаковываются в полные листы с не более чем двумя парами.

После построения:

- эквивалентные тиражи объединяются;
- весь план применяется к неизменяемому спросу;
- лица, обороты и production report материализуются повторно;
- решение допустимо только при остатке `0`.

Доказательство контрольного результата:

```text
required pair impressions = 52870
capacity                   = 16
universal lower bound      = ceil(52870 / 16) = 3305
constructed paper          = 3305
```

Поскольку допустимая конструкция достигает универсальной нижней границы, `3305` — глобальный минимум бумаги для этого входа и этой вместимости. Это не доказывает минимум форм.

### `paper-solution-view.js`

Создаёт неизменяемую модель сравнения:

- ручной вариант `3395 / 4 / 8 / 6790 / 1450 / 930`;
- бумажный минимум `3305 / 56 / 112 / 6610 / 10 / 0`;
- экономия 90 листов;
- строки сравнения и 56 объяснимых тиражей.

### `paper-solution-renderer.js`

Показывает:

- доказанный статус;
- нижнюю границу;
- бумагу, формы, листопрогоны и перетираж;
- предупреждение, что формы выросли `8 → 112`;
- свёрнутую таблицу автоматических монтажей.

Renderer не пересчитывает решение.

## 4+4 и терминология форм

### `print-specification.js`

Явно разделяет:

- **layout-формы сторон** — лицо и оборот;
- **цветовые пластины** — число цветоделённых пластин.

Для одного монтажа 4+4:

```text
layout forms = 2
color plates = 4 + 4 = 8
```

Для трёх монтажей 4+4: `6` layout-форм и `24` цветовые пластины. Поле `productionReport.totals.forms` пока сохраняет исторический смысл layout-форм сторон.

## Производственные regression fixtures

`data/production-regression-cases.json` содержит:

- 32-страничный A6 landscape `148×105`, сетка `4×4`;
- 32-страничный A6 portrait `105×148`, лучший поворот `90°`, сетка `4×4`;
- заданный mixed-format duplex `1×A4 + 2×A5 + 8×A6`;
- три A5 заказа `400 / 700 / 4200`, доказанный минимум `663` листа.

Эти данные отделены от основного control-case и служат постоянными regression fixtures.

## Производство и проверка

- `production-metrics.js` — напечатано, перетираж, бумага, layout-формы и листопрогоны;
- `production-validation.js` — независимый пересчёт и запрет недопечатки;
- `production-report.js` — production-ready модель;
- бумажный оптимизатор обязан проходить этот существующий слой заново.

## PDF-слой / PDF layer

- `pdf-document-model.js` — две независимые модели документов;
- `pdf-binary.js` — dependency-free PDF 1.4 writer;
- `pdf-scheme-renderer.js` — одна схема на страницу;
- `pdf-report-renderer.js` — отдельный пагинированный отчёт;
- `pdf-export-ui.js` — только DOM-контролы и скачивание.

Основной PDF содержит только четыре ручные контрольные схемы M3/M4. Экспорт 56 автоматических M6-схем намеренно не включён в этот milestone, чтобы не создавать неуправляемый документ до появления многокритериального выбора M7.

## Правила зависимостей / Dependency rules

- `config.js` не импортирует бизнес-модули;
- расчёт, оптимизация, валидация и PDF-модель не используют DOM;
- оборот никогда не строится независимо от лица;
- renderer получает готовую проверенную модель;
- mixed-format manual validation не выдаётся за automatic packing;
- paper minimum не выдаётся за minimum forms;
- layout-формы не смешиваются с цветовыми пластинами;
- ошибка жёсткой проверки блокирует рекомендацию и экспорт;
- runtime-зависимости и CDN отсутствуют.

## Проверка / Verification

`.github/workflows/quality.yml`:

- source checks;
- все Node tests;
- короткий хвост лога в консоли;
- полный diagnostic log как artifact.

`.github/workflows/capture-screenshots.yml`:

- открывает точный commit в Chromium;
- проверяет desktop/mobile M6-panel;
- сохраняет фактические screenshots;
- повторно скачивает и проверяет оба M5 PDF;
- запускает `pdfinfo` и Poppler;
- сохраняет manifest, logs, PDF и PNG в artifact.

## Граница / Boundary

M6 доказывает минимум физической бумаги для контрольного uniform-grid случая и проверяет заданный mixed-format монтаж. Автоматический mixed-format packing, минимум форм, Pareto-набор и сигнатурная пагинация остаются следующими отдельными задачами.