# Архитектура / Architecture

## Принцип / Principle

uImposition остаётся статическим браузерным приложением без обязательного сервера и build step. GitHub Pages получает обычные HTML, CSS и JavaScript ES modules.

uImposition remains a static browser application with no mandatory server or build step. GitHub Pages serves plain HTML, CSS, and JavaScript ES modules.

## Слои / Layers

1. **Конфигурация** — пресеты, ограничения, URL контрольных данных.
2. **Домен** — заказы, пары страниц, ячейки, монтажи и отчёты.
3. **Расчёт** — геометрия, лицо/оборот и производственные метрики.
4. **Валидация** — независимая проверка схем и отчётов.
5. **Представление** — DOM-renderers и координаторы интерфейса.
6. **Экспорт** — будущие JSON и PDF-модули.
7. **Хранение** — browser storage без серверной базы.

## Фактическая структура M4 / Actual M4 structure

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
├─ app.js
└─ m3-demo.js
```

### Расчётные модули / Calculation modules

- `geometry.js` — лист, изделие, сетки 0°/90°;
- `orders.js` — ввод заказов и пары страниц;
- `orientation.js` — внутренние направления;
- `front-layout.js` — детерминированное лицо;
- `back-layout.js` — оборот только из готового лица;
- `production-metrics.js` — арифметика пар, файлов, бумаги, форм и листопрогонов;
- `production-report.js` — сборка готовой производственной модели.

### Проверка / Validation

- `imposition-validation.js` проверяет страницы, зеркальность, координаты и направления;
- `production-validation.js` независимо пересчитывает вклады и итоги и блокирует недопечатку;
- статус `ready` допустим только после обеих проверок.

### Представление / Presentation

- `scheme-renderer.js` отображает уже проверенные схемы;
- `production-report-renderer.js` отображает уже рассчитанный отчёт;
- renderer не содержит производственных формул;
- `app.js` координирует геометрию и ввод;
- `m3-demo.js` пока координирует контрольные M3/M4 данные и должен быть позднее переименован или разделён без изменения расчётной логики.

## Правила зависимостей / Dependency rules

- `config.js` не импортирует бизнес-модули;
- расчёт и валидация не используют DOM;
- renderer не оптимизирует и не пересчитывает производство;
- оборот строится только после лица;
- производственный отчёт строится только после проверки всех лиц и оборотов;
- PDF-модуль M5 должен получать готовые схемы и отчёт, а не выполнять расчёты заново;
- ошибка любой жёсткой проверки блокирует готовность и экспорт.

## Чистые функции / Pure functions

Геометрия, пары страниц, ориентация, зеркалирование, производственные метрики и валидация являются чистыми функциями и проверяются Node built-in test runner.

Geometry, page pairs, orientation, mirroring, production metrics, and validation are pure functions covered by the Node built-in test runner.
