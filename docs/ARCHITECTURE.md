# Архитектура / Architecture

## Принцип / Principle

uImposition остаётся статическим браузерным приложением без обязательного сервера и build step. GitHub Pages получает обычные HTML, CSS и JavaScript ES modules. PDF создаётся полностью в браузере без CDN и runtime-зависимостей.

uImposition remains a static browser application with no mandatory server or build step. GitHub Pages serves plain HTML, CSS, and JavaScript ES modules. PDF files are created entirely in the browser with no CDN or runtime packages.

## Слои / Layers

1. **Конфигурация** — пресеты, ограничения, контрольные URL и PDF-параметры.
2. **Домен** — заказы, пары страниц, схемы, производственный отчёт и модели документов.
3. **Расчёт** — геометрия, лицо/оборот и производственные метрики.
4. **Валидация** — независимая проверка схем, отчётов и допустимости экспорта.
5. **Представление** — DOM-renderers и координаторы интерфейса.
6. **PDF-экспорт** — чистая модель, Canvas-renderers и бинарный контейнер.
7. **Проверка артефактов** — Chromium, структурная проверка, `pdfinfo` и Poppler.
8. **Хранение** — browser storage без серверной базы.

## Фактическая структура M5 / Actual M5 structure

```text
src/
├─ config.js
├─ geometry.js
├─ orders.js
├─ orientation.js
├─ front-layout.js
├─ back-layout.js
├─ imposition-validation.js
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

## Расчёт и проверка / Calculation and validation

- `geometry.js` — лист, изделие и сетки 0°/90°;
- `orders.js` — разбор заказов и точные пары страниц;
- `front-layout.js` — детерминированное лицо;
- `back-layout.js` — оборот только из готового лица;
- `imposition-validation.js` — страницы, зеркальность, координаты и направления;
- `production-metrics.js` — напечатано, перетираж, бумага, формы и листопрогоны;
- `production-validation.js` — независимый пересчёт итогов и запрет недопечатки;
- `production-report.js` — готовая проверенная модель отчёта.

## PDF-слой / PDF layer

### `pdf-document-model.js`

Чистая неизменяемая модель двух независимых документов:

- `schemes`: четыре лица и четыре оборота, одна схема на страницу;
- `productionReport`: сводка, файлы и печатные пары;
- A4, пропорциональный и пользовательский режимы страниц схем;
- экспорт разрешён только для валидных схем и production-ready отчёта.

### `pdf-binary.js`

Минимальный dependency-free PDF 1.4 writer:

- каждая Canvas-страница становится JPEG;
- JPEG помещается в отдельный `/Image` XObject;
- каждая картинка используется ровно одним PDF Page object;
- writer формирует Catalog, Pages, Content streams, xref и trailer;
- встроенные PDF-шрифты не используются, поэтому кириллица не зависит от PDF font support.

### `pdf-scheme-renderer.js`

Canvas-renderer схем:

- заголовок, тираж, сетка, поворот и статус;
- 16 ячеек `файл,страница стрелка`;
- `contain` без обрезки и изменения пропорций;
- восемь страниц в порядке лицо → оборот.

### `pdf-report-renderer.js`

Canvas-renderer отдельного отчёта:

- страница сводки;
- две страницы файлов;
- три страницы печатных пар;
- детерминированная пагинация;
- автоматическое уменьшение длинных заголовков;
- стабильная высота строк на неполных страницах.

### `pdf-export-ui.js`

Только DOM-контролы и браузерное скачивание:

- выбор режима страниц схем;
- отдельная кнопка PDF схем;
- отдельная кнопка PDF отчёта;
- никаких производственных формул или повторного расчёта.

## Правила зависимостей / Dependency rules

- `config.js` не импортирует бизнес-модули;
- расчёт, валидация и логическая PDF-модель не используют DOM;
- PDF-renderers получают только готовые проверенные модели;
- DOM-контроллер не изменяет расчётные данные;
- основной PDF содержит только схемы;
- производственный отчёт всегда отдельный документ;
- ошибка любой жёсткой проверки блокирует экспорт;
- runtime-зависимости, CDN и передача font-файлов отсутствуют.

## Проверка PDF / PDF verification

`.github/workflows/capture-screenshots.yml`:

1. открывает точный commit в Chromium;
2. скачивает оба PDF;
3. проверяет имя, `%PDF`, `%%EOF` и число Page-объектов;
4. запускает `pdfinfo`;
5. рендерит каждую страницу через Poppler;
6. сравнивает количество PDF-страниц и PNG;
7. сохраняет PDF, PNG, `pdfinfo`, manifest и logs в artifact.

## Граница / Boundary

M5 экспортирует только уже заданные ручные контрольные монтажи. Генерация альтернатив и автоматический минимум бумаги начинаются в M6.
