# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущая версия

**`0.1.0-alpha`**  
Дата: **24 июля 2026**  
Этап: **M1 — первая рабочая версия**

### Что работает

- единый runtime-конфиг `src/config.js`;
- реальные форматы листов после зачистки;
- произвольный размер листа;
- режим «до зачистки» и «уже после зачистки»;
- зачистка одинаково или отдельно по четырём сторонам;
- защита от повторной зачистки готового пресета;
- непечатные поля машины;
- расчёт фактического листа и печатной области;
- ввод заказов строками;
- подсчёт файлов, тиражей и печатных пар;
- загрузка контрольного заказа из 20 файлов;
- двуязычный интерфейс;
- кликабельный логотип с версией;
- Playwright-скриншоты точного commit для uNews.

### Ещё не реализовано

- вместимость изделий на листе;
- пары страниц в визуальной схеме;
- лицо и зеркальный оборот;
- оптимизатор;
- экспорт PDF.

### Следующая целевая версия

**`0.2.0-alpha` — M2**

Расчёт количества изделий на листе без поворота и с поворотом на 90°, выбор лучшей сетки и отображение результата.

</td>
<td width="50%" valign="top">

## English

### Current version

**`0.1.0-alpha`**  
Date: **24 July 2026**  
Stage: **M1 — first working version**

### Working now

- central runtime `src/config.js`;
- real post-trim sheet presets;
- custom sheet size;
- pre-trim and already-post-trim modes;
- uniform or per-side sheet trim;
- protection against trimming a preset twice;
- non-printable press margins;
- physical-sheet and printable-area calculation;
- line-based order input;
- file, run-length and print-pair totals;
- loading the 20-file control dataset;
- bilingual interface;
- clickable logo with synchronized version;
- exact-commit Playwright screenshots for uNews.

### Not implemented yet

- product capacity on sheet;
- visual page-pair schemes;
- front and mirrored back forms;
- optimizer;
- PDF export.

### Next target version

**`0.2.0-alpha` — M2**

Calculate product capacity in both orientations, select the best grid and render the result.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние проекта;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила.

## Релизы и откат / Releases and rollback

Каждая достигнутая стабильная версия должна иметь:

1. синхронизированные `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
2. recovery-ветку `release/v{version}`;
3. GitHub Release с тем же тегом и описанием;
4. проверенный сайт и тесты.

Подключённый GitHub-инструмент умеет создавать recovery-ветки, но не создаёт GitHub Releases. Поэтому ветка фиксируется автоматически, а полноценный Release при необходимости создаётся владельцем вручную.
