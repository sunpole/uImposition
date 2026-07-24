# План тестирования / Test Plan

<table>
<tr>
<td width="50%" valign="top">

## Русская версия

### Уровни

1. модульные тесты;
2. интеграционные тесты расчёта;
3. визуальные проверки схем и отчёта;
4. проверка браузерного скачивания;
5. структурная PDF-проверка;
6. полный Poppler-render;
7. ручная проверка всех страниц.

### Базовые сценарии

- `620 × 450` с зачисткой 2 мм превращается в `616 × 446`;
- `afterTrim` не уменьшается повторно;
- 2, 3, 4 и 5 страниц образуют правильные пары;
- знак `-` появляется только на обороте;
- зеркало меняет столбцы, но не строки;
- `→` превращается в `←`;
- недопечатка блокирует готовность;
- русский и английский режимы сохраняют одинаковые числа.

### M4: производственный отчёт

- вклад пары = число позиций × тираж монтажа;
- сумма вкладов = напечатанное количество пары;
- перетираж = `max(0, напечатано − требуется)`;
- готовый тираж файла = минимум среди его пар;
- перетираж файла и пар показывается отдельно;
- бумага = сумма тиражей монтажей;
- формы = лицо + оборот;
- листопрогоны = 2 × физические листы;
- неизвестные пары и повреждённые схемы блокируются.

### M5: модель PDF

- четыре монтажа создают ровно `8` логических страниц схем;
- порядок: `1 лицо`, `1 оборот`, `2 лицо`, `2 оборот` и далее;
- каждая страница содержит одну схему;
- русский и английский заголовки не меняют порядок;
- основной PDF и отчёт имеют разные имена файлов;
- invalid imposition и invalid production report не экспортируются;
- A4 = `210 × 297 мм`;
- пропорциональный режим сохраняет отношение `616 / 446`;
- custom-режим отклоняет нулевые и отрицательные размеры.

### M5: бинарный PDF

- файл начинается `%PDF-1.4` и заканчивается `%%EOF`;
- число `/Type /Page` совпадает с ожидаемым;
- каждый JPEG использует `/DCTDecode`;
- присутствуют Catalog, Pages, xref, trailer и startxref;
- A4 MediaBox соответствует примерно `595.276 × 841.89 pt`;
- повреждённый JPEG отклоняется до создания PDF.

### M5: PDF схем

- Chromium скачивает `uImposition-schemes.pdf`;
- документ содержит ровно `8` страниц;
- `pdfinfo` успешно читает документ;
- Poppler создаёт ровно `8` PNG;
- на каждой странице есть заголовок, тираж, сетка и 16 ячеек;
- нет обрезки, искажения пропорций, чёрных квадратов и сломанной кириллицы;
- стрелки и знак `-` читаются корректно.

### M5: PDF отчёта

- Chromium скачивает отдельный `uImposition-production-report.pdf`;
- документ содержит ровно `6` страниц A4;
- порядок: сводка, 2 страницы файлов, 3 страницы пар;
- Poppler создаёт ровно `6` PNG;
- итоговые значения `3395 / 8 / 6790 / 0 / 1450 / 930` читаются;
- таблицы содержат 20 файлов и 35 пар;
- длинные строки вкладов не выходят за ячейки;
- заголовок не пересекается с номером страницы;
- неполные последние страницы сохраняют нормальную высоту строк.

</td>
<td width="50%" valign="top">

## English version

### Test levels

1. unit tests;
2. calculation integration tests;
3. scheme/report visual checks;
4. browser download verification;
5. structural PDF checks;
6. complete Poppler rendering;
7. manual review of every page.

### M5: PDF model

- four impositions create exactly eight scheme pages;
- order is front/back for each imposition;
- each page contains one scheme;
- language changes labels but not ordering;
- scheme and report documents use different file names;
- invalid impositions and reports cannot be exported;
- A4, proportional, and custom page modes validate explicitly.

### M5: PDF binary

- `%PDF-1.4`, `%%EOF`, Catalog, Pages, xref, trailer, and startxref exist;
- Page-object count matches the expected count;
- every JPEG uses `/DCTDecode`;
- A4 MediaBox is approximately `595.276 × 841.89 pt`;
- malformed JPEG data is rejected.

### M5: scheme PDF

Chromium downloads an eight-page PDF, `pdfinfo` reads it, Poppler renders eight PNG files, and manual review confirms correct order, Cyrillic, arrows, aspect ratio, and no clipping or broken glyphs.

### M5: report PDF

Chromium downloads a separate six-page A4 report. It contains a summary, two file pages, and three pair pages. Poppler renders all pages, all control totals are readable, long contribution rows fit, and headers never overlap page numbers.

</td>
</tr>
</table>

## Контрольный набор / Control dataset

`data/control-case.json`

- 20 файлов / files;
- 35 печатных пар / print pairs;
- 4 монтажа / impositions;
- 8 форм / forms;
- 3395 физических листов / physical sheets;
- 6790 листопрогонов / press passes;
- недопечатка / underproduction: 0;
- перетираж пар / pair overrun: 1450;
- перетираж файлов / complete-file overrun: 930;
- PDF схем / scheme PDF: 8 pages;
- PDF отчёта / report PDF: 6 pages;
- всего проверенных PDF-страниц / total verified PDF pages: 14.

Программный оптимизатор может улучшить ручной ориентир, но не может нарушать жёсткие ограничения.
