# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущая версия

**`0.4.0-alpha`**  
Дата: **24 июля 2026**  
Этап: **M4 — производственные итоги и отчёт**

### Что работает

- весь проверенный функционал M1–M3;
- чистый расчёт напечатанного количества каждой из 35 печатных пар;
- объяснимые вклады: число позиций пары × тираж конкретного монтажа;
- недопечатка и перетираж по каждой паре;
- жёсткая блокировка производственной готовности при любой недопечатке;
- готовый тираж и перетираж по каждому файлу;
- отдельное отображение суммарного перетиража пар и перетиража готовых файлов;
- физическая бумага как сумма тиражей монтажей;
- отдельные лицевые и оборотные формы для чужого оборота;
- листопрогоны как два прохода каждого физического листа;
- независимая арифметическая проверка итогового отчёта;
- адаптивная сводка, таблица 20 файлов и детализация 35 пар.

### Проверенный контрольный результат M4

- контрольный заказ: `20` файлов и `35` печатных пар;
- заданные монтажи: `4` лица и `4` оборота;
- тиражи ручной контрольной раскладки: `1500`, `1100`, `450`, `345`;
- физическая бумага: `3395` листов;
- формы: `4` лица + `4` оборота = `8`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- суммарный перетираж по парам: `1450`;
- перетираж готовых файлов: `930`;
- отчёт проходит Node-тесты и desktop/mobile Chromium-проверку.

Тиражи четырёх монтажей являются ручным проверочным входом. M4 не заявляет автоматический подбор тиражей или доказанный минимум бумаги.

### Ещё не реализовано

- автоматический подбор тиражей монтажей;
- автоматический оптимизатор и сравнение альтернатив;
- смешанные ориентации внутри одной сетки;
- PDF-экспорт;
- импорт/экспорт полного проекта и постоянное хранение отчёта.

### Следующая целевая версия

**`0.5.0-alpha` — M5**

Одна схема на PDF-страницу и отдельный PDF производственного отчёта.

</td>
<td width="50%" valign="top">

## English

### Current version

**`0.4.0-alpha`**  
Date: **24 July 2026**  
Stage: **M4 — production totals and report**

### Working now

- all verified M1–M3 functionality;
- pure produced-quantity calculation for all 35 print pairs;
- explainable contributions: pair position count × explicit imposition run length;
- underproduction and overrun for every pair;
- hard rejection of production readiness when any pair underproduces;
- complete produced quantity and overrun for every file;
- separate pair-overrun and complete-file-overrun reporting;
- physical sheets as the sum of imposition run lengths;
- separate front and back forms for the current duplex mode;
- press passes as two passes per physical sheet;
- independent arithmetic validation of the complete report;
- responsive summary, 20-file table, and 35-pair detail table.

### Verified M4 control result

- control dataset: `20` files and `35` print pairs;
- explicit impositions: `4` fronts and `4` backs;
- manual control run lengths: `1500`, `1100`, `450`, `345`;
- physical sheets: `3395`;
- forms: `4` front + `4` back = `8`;
- press passes: `6790`;
- underproduction: `0`;
- total pair overrun: `1450`;
- complete-file overrun: `930`;
- the report passes Node tests and desktop/mobile Chromium verification.

The four imposition run lengths are verified manual input. M4 does not claim automatic run assignment or a proven global paper minimum.

### Not implemented yet

- automatic imposition run assignment;
- automatic optimization and alternative comparison;
- mixed orientations inside one grid;
- PDF export;
- complete-project import/export and persistent report storage.

### Next target version

**`0.5.0-alpha` — M5**

One scheme per PDF page and a separate production-report PDF.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние проекта;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила.

## Релизы и откат / Releases and rollback

После объединения и проверки GitHub Pages alpha-веха `0.4.0-alpha` получает recovery-ветку `release/v0.4.0-alpha`. Настоящий GitHub Release обязателен только после признания версии стабильной production-версией.
