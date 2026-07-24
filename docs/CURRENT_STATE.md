# Текущее состояние / Current State

Последнее обновление: **24 июля 2026**  
Last updated: **24 July 2026**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Версия и ветки

- `main`: `0.2.0-alpha`;
- завершённые этапы: M0, M1, M2;
- активная следующая задача: M3;
- рабочая ветка: `m3/0.3.0-alpha`;
- M3 пока содержит состояние `main` без функциональной реализации;
- откат M1: `release/v0.1.0-alpha`;
- откат M2: `release/v0.2.0-alpha`.

### Что реально работает

1. Двуязычный GitHub Pages интерфейс.
2. Кликабельный логотип с версией из `VERSION.json`.
3. Реальные форматы листов после зачистки.
4. Произвольный размер до или после зачистки.
5. Зачистка одинаково или отдельно по сторонам.
6. Непечатные поля машины как отдельный этап.
7. A4, A5, A6 и произвольный формат изделия.
8. Выпуск, общий рез и дополнительный зазор.
9. Расчёт однородных сеток 0° и 90°.
10. Выбор сетки с максимальным количеством позиций.
11. Нумерованная схема вместимости.
12. Ввод заказов `файл | тираж | страницы | примечание`.
13. Разбиение в точные пары страниц `1/2`, `3/4`, `5/-`.
14. Контрольный набор из 20 файлов и 35 пар.
15. Node built-in tests через GitHub Actions.
16. Реальные Chromium-скриншоты точного commit.
17. Подготовка патчноутов и PNG для uNews.

### Проверенный контрольный результат M2

- исходный лист: `620 × 450 мм`;
- стандартная зачистка: `2 мм` с каждой стороны;
- фактический лист: `616 × 446 мм`;
- печатная область: `608 × 431 мм`;
- изделие: A6 `105 × 148 мм`;
- выпуск: `0 мм`;
- режим: общий рез;
- 0°: `5 × 2 = 10` позиций;
- 90°: `4 × 4 = 16` позиций;
- выбран вариант: `90°`, `4 × 4`, `16` позиций;
- 20 файлов раскрываются в 35 точных пар страниц.

### Чего ещё нет

- назначения конкретных файлов в позиции;
- законченной схемы `ЛИСТ-N_ЛИЦО`;
- автоматически зеркального `ЛИСТ-N_ОБОРОТ`;
- проверки страниц и стрелок между лицом и оборотом;
- расчёта тиражей монтажей;
- бумаги, форм, листопрогонов и перетиража;
- автоматического оптимизатора;
- PDF-экспорта.

### Текущая архитектура

- `src/config.js` — все действующие настройки и производственные значения;
- `src/geometry.js` — чистые расчёты листа, изделия и вместимости;
- `src/orders.js` — разбор заказов и пары страниц;
- `src/app.js` — только связывание DOM, состояния и расчётных модулей;
- `tests/geometry.test.js` — тесты геометрии и вместимости;
- `tests/orders.test.js` — тесты ввода и пар страниц;
- `data/control-case.json` — основной контрольный пример;
- `tools/screenshots/` — изолированный Playwright, не runtime-зависимость сайта;
- `tools/news/` и `news/` — подготовка релизных доказательств и uNews.

### Следующий безопасный шаг

Создать расчётные модули M3 без DOM:

- `src/front-layout.js`;
- `src/orientation.js`;
- `src/back-layout.js`;
- `src/imposition-validation.js`;
- тесты каждого модуля.

После прохождения тестов добавить отдельный модуль визуализации схемы и минимально подключить его в `src/app.js`.

</td>
<td width="50%" valign="top">

## English

### Version and branches

- `main`: `0.2.0-alpha`;
- completed milestones: M0, M1, M2;
- active next task: M3;
- working branch: `m3/0.3.0-alpha`;
- M3 currently mirrors `main` and contains no functional implementation yet;
- M1 rollback: `release/v0.1.0-alpha`;
- M2 rollback: `release/v0.2.0-alpha`.

### What actually works

1. Bilingual GitHub Pages interface.
2. Clickable logo with the version loaded from `VERSION.json`.
3. Real post-trim sheet presets.
4. Custom pre-trim or post-trim dimensions.
5. Uniform or per-side sheet trim.
6. Non-printable press margins as a separate stage.
7. A4, A5, A6, and custom finished-product sizes.
8. Bleed, common cut, and additional gap.
9. Uniform 0° and 90° grid calculation.
10. Maximum-position grid selection.
11. Numbered capacity scheme.
12. Order input as `file | quantity | pages | note`.
13. Exact page-pair expansion: `1/2`, `3/4`, `5/-`.
14. A 20-file / 35-pair control dataset.
15. Node built-in tests through GitHub Actions.
16. Factual Chromium screenshots of the exact commit.
17. Patchnote and PNG preparation for uNews.

### Verified M2 control result

- source sheet: `620 × 450 mm`;
- standard trim: `2 mm` per side;
- physical sheet: `616 × 446 mm`;
- printable area: `608 × 431 mm`;
- product: A6 `105 × 148 mm`;
- bleed: `0 mm`;
- mode: common cut;
- 0°: `5 × 2 = 10` positions;
- 90°: `4 × 4 = 16` positions;
- selected result: `90°`, `4 × 4`, `16` positions;
- 20 files expand into 35 exact source-page pairs.

### Not implemented yet

- assigning actual files to positions;
- final `SHEET-N_FRONT` schemes;
- automatically mirrored `SHEET-N_BACK` schemes;
- front/back page and direction validation;
- imposition run-length calculation;
- paper, plates, press passes, and overrun;
- automatic optimizer;
- PDF export.

### Current architecture

- `src/config.js` — all active settings and production values;
- `src/geometry.js` — pure sheet, product, and capacity calculations;
- `src/orders.js` — order parsing and page pairs;
- `src/app.js` — DOM, state, and module integration only;
- `tests/geometry.test.js` — geometry and capacity tests;
- `tests/orders.test.js` — input and page-pair tests;
- `data/control-case.json` — primary control example;
- `tools/screenshots/` — isolated Playwright tooling, not a site runtime dependency;
- `tools/news/` and `news/` — release evidence and uNews preparation.

### Next safe step

Create DOM-independent M3 calculation modules:

- `src/front-layout.js`;
- `src/orientation.js`;
- `src/back-layout.js`;
- `src/imposition-validation.js`;
- dedicated tests for every module.

After those tests pass, add a separate scheme-rendering module and connect it minimally through `src/app.js`.

</td>
</tr>
</table>
