# Дорожная карта / Roadmap

<table>
<tr>
<td width="50%" valign="top">

## Русский

### M0–M4 — завершены

- M0: репозиторий, ТЗ, лицензия и контрольные данные;
- M1: лист, зачистка, поля, ввод заказов и пары страниц;
- M2: изделие, выпуск, сетки 0°/90° и вместимость;
- M3: лицо, автоматически зеркальный оборот и проверка схем;
- M4: производство, бумага, формы, листопрогоны и отчёт.

Точки отката: `release/v0.1.0-alpha` … `release/v0.4.0-alpha`.

### M5 — `0.5.0-alpha`, завершён

- чистая модель двух PDF-документов;
- одна схема на одну страницу;
- детерминированный порядок четырёх лиц и четырёх оборотов;
- A4, пропорциональный и пользовательский режимы схем;
- отдельный восьмистраничный PDF схем;
- отдельный шестистраничный PDF отчёта;
- dependency-free PDF 1.4 writer;
- Canvas-отрисовка кириллицы, стрелок, метрик и таблиц;
- браузерное скачивание;
- Playwright-проверка структуры и числа страниц;
- `pdfinfo` и Poppler-render всех `14` страниц;
- визуальная проверка обрезки, глифов, заголовков и таблиц.

PR: `#8`. Merge commit: `366ea45efd2566c7bb25ff14ff0cbc0df7472594`.  
Точка отката: `release/v0.5.0-alpha`.  
Подробности: `docs/M5_IMPLEMENTATION_PLAN.md`, `docs/M5_RELEASE_EVIDENCE.md`.

### M6 — `0.6.0-alpha`, следующий активный этап

- чистая модель кандидата монтажа;
- расчёт минимального допустимого тиража кандидата;
- генерация альтернативных наборов позиций;
- запрет недопечатки для любого кандидата;
- автоматический подбор тиражей;
- минимизация физической бумаги как главная цель;
- объяснение разделённых заказов и выбранного результата;
- сравнение с ручным ориентиром `3395` листов.

### M7 — несколько целей

Минимум форм, минимум перетиража, пользовательская иерархия и набор Парето.

### M8 — production `1.0.0`

Реальные производственные проверки, граничные случаи, руководство и стабильный GitHub Release.

</td>
<td width="50%" valign="top">

## English

### M0–M4 — complete

Repository/specification, sheet and order geometry, capacity, validated front/back schemes, and production reporting. Rollback branches exist through `release/v0.4.0-alpha`.

### M5 — `0.5.0-alpha`, complete

A pure two-document PDF model, one scheme per page, deterministic eight-page scheme output, a separate six-page report, A4/proportional/custom scheme modes, dependency-free PDF writing, Canvas rasterisation, browser downloads, Playwright structure checks, `pdfinfo`, Poppler rendering of all fourteen pages, and manual visual review.

PR: `#8`. Merge commit: `366ea45efd2566c7bb25ff14ff0cbc0df7472594`.  
Rollback: `release/v0.5.0-alpha`.

### M6 — `0.6.0-alpha`, next active milestone

Define candidate impositions and minimum valid run lengths, generate alternatives, reject all underproduction, assign runs automatically, minimise physical paper, explain split orders, and compare results with the `3395`-sheet manual reference.

### M7 — multiple objectives

Minimum forms, minimum overrun, user-defined hierarchy, and Pareto alternatives.

### M8 — production `1.0.0`

Real production validation, edge cases, user guide, and a stable GitHub Release.

</td>
</tr>
</table>