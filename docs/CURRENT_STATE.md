# Текущее состояние / Current State

Последнее обновление: **24 июля 2026**  
Last updated: **24 July 2026**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Версия и ветки

- кандидат в `main`: **`0.3.0-alpha`**;
- завершённые этапы: M0, M1, M2, M3;
- рабочая ветка релиз-кандидата: `m3/0.3.0-alpha`;
- активная следующая задача после объединения: M4;
- следующая версия: `0.4.0-alpha`;
- точки отката: `release/v0.1.0-alpha`, `release/v0.2.0-alpha`;
- после объединения M3 создаётся `release/v0.3.0-alpha`.

### Что реально работает

1. Двуязычный статический GitHub Pages интерфейс.
2. Кликабельный логотип с версией из `VERSION.json`.
3. Реальные форматы листов после зачистки.
4. Произвольный размер до или после зачистки.
5. Зачистка одинаково или отдельно по сторонам.
6. Непечатные поля машины как отдельный этап.
7. A4, A5, A6 и произвольный формат изделия.
8. Выпуск, общий рез и дополнительный зазор.
9. Расчёт однородных сеток 0° и 90°.
10. Выбор сетки с максимальным количеством позиций.
11. Ввод заказов `файл | тираж | страницы | примечание`.
12. Разбиение в точные пары страниц `1/2`, `3/4`, `5/-`.
13. Заполнение лицевых позиций сплошными блоками row-major.
14. Запрет пустых лицевых позиций, чётных страниц и знака `-` на лице.
15. Автоматический оборот только из готового лица: строки сохраняются, колонки зеркалятся.
16. Преобразование направления головы `→` в `←` при перевороте слева направо.
17. Независимая проверка файла, пары, страниц, координат и направления.
18. Четыре контрольных лица и четыре оборота по `4 × 4 = 16` позиций.
19. Рамочные desktop/mobile схемы `файл,страница стрелка`.
20. Node built-in tests и настоящие Chromium-скриншоты через GitHub Actions.
21. Подготовка нового PNG и патчноута через uNews.

### Проверенный контрольный результат M3

- исходный лист: `620 × 450 мм`;
- после зачистки: `616 × 446 мм`;
- печатная область: `608 × 431 мм`;
- изделие: A6 `105 × 148 мм`, выпуск `0`, общий рез;
- выбранная сетка: `90°`, `4 × 4`, `16` позиций;
- контрольный заказ: `20` файлов и `35` точных пар страниц;
- монтажи: `4` лица и `4` автоматически зеркальных оборота;
- ручные контрольные тиражи: `1500`, `1100`, `450`, `345`;
- файл `119` сохраняет пары `1/2` и `3/4`;
- отсутствующая оборотная страница хранится как `null` и отображается только знаком `-`;
- все восемь схем проходят автоматическую валидацию.

Контрольные тиражи — ручная проверенная раскладка, а не результат оптимизатора и не доказанный глобальный минимум бумаги.

### Чего ещё нет

- автоматического расчёта тиражей монтажей;
- расчёта напечатанного количества по файлам и парам;
- недопечатки и перетиража;
- расчёта форм, бумаги и листопрогонов;
- смешанных ориентаций внутри одной сетки;
- автоматического оптимизатора;
- PDF-экспорта.

### Текущая архитектура

- `src/config.js` — настройки и производственные значения;
- `src/geometry.js` — геометрия листа, изделия и вместимости;
- `src/orders.js` — разбор заказов и пары страниц;
- `src/orientation.js` — внутренние направления и преобразования;
- `src/front-layout.js` — чистое построение лица;
- `src/back-layout.js` — чистое получение оборота из лица;
- `src/imposition-validation.js` — независимая проверка соответствия;
- `src/scheme-renderer.js` — только DOM-отрисовка готовых схем;
- `src/m3-demo.js` — загрузка и координация контрольного M3-примера;
- `src/app.js` — координатор геометрии, вместимости и заказов;
- `data/control-case.json` — контрольный заказ;
- `data/control-layout-m3.json` — четыре ручные контрольные раскладки;
- `tests/` — модульные и интеграционные Node-тесты;
- `tools/screenshots/` — изолированный Playwright;
- `tools/news/` и `news/` — подготовка релизных доказательств и uNews.

### Следующий безопасный шаг — M4

Создать DOM-независимые расчётные модули для явных монтажей:

- напечатанное количество по каждой паре;
- недопечатка и перетираж;
- количество лицевых и оборотных форм;
- физическая бумага;
- листопрогоны;
- сводный отчёт и проверки инвариантов.

Сначала чистые функции и тесты, затем минимальное подключение отчёта к интерфейсу.

</td>
<td width="50%" valign="top">

## English

### Version and branches

- candidate for `main`: **`0.3.0-alpha`**;
- completed milestones: M0, M1, M2, M3;
- release-candidate branch: `m3/0.3.0-alpha`;
- next active task after merge: M4;
- next version: `0.4.0-alpha`;
- rollback points: `release/v0.1.0-alpha`, `release/v0.2.0-alpha`;
- `release/v0.3.0-alpha` is created after the M3 merge.

### What actually works

1. Bilingual static GitHub Pages interface.
2. Clickable logo with the version loaded from `VERSION.json`.
3. Real post-trim and custom sheet sizes.
4. Separate sheet-trim and press-margin stages.
5. A4, A5, A6, and custom finished-product sizes.
6. Bleed, common cut, and additional gap.
7. Uniform 0° and 90° grid calculation and maximum-capacity selection.
8. Exact order parsing and page-pair expansion.
9. Contiguous row-major front-position blocks.
10. Rejection of empty fronts, even front pages, and dash identifiers.
11. Automatic back derivation only from a completed front: rows stay fixed and columns mirror.
12. Head-direction transformation from `→` to `←` for a horizontal turn.
13. Independent file, pair, page, coordinate, and direction validation.
14. Four control fronts and four backs with `4 × 4 = 16` positions each.
15. Bordered desktop/mobile `file,page arrow` schemes.
16. Node built-in tests and factual Chromium screenshots through GitHub Actions.
17. New PNG and patchnote preparation through uNews.

### Verified M3 control result

- source sheet: `620 × 450 mm`;
- post-trim sheet: `616 × 446 mm`;
- printable area: `608 × 431 mm`;
- product: A6 `105 × 148 mm`, zero bleed, common cut;
- selected grid: `90°`, `4 × 4`, `16` positions;
- control order: `20` files and `35` exact page pairs;
- impositions: `4` fronts and `4` automatically mirrored backs;
- manual control runs: `1500`, `1100`, `450`, `345`;
- file `119` preserves `1/2` and `3/4` pairs;
- an absent back page remains `null` and renders only as `-`;
- all eight schemes pass automatic validation.

The control runs are a verified manual layout, not optimizer output or a proven global paper minimum.

### Not implemented yet

- automatic imposition run calculation;
- produced quantity by file and pair;
- underproduction and overrun;
- plates, paper, and press passes;
- mixed orientations within one grid;
- automatic optimization;
- PDF export.

### Current architecture

The calculation layer is split into geometry, orders, orientation, front layout, mirrored back, and validation. DOM rendering is isolated in `scheme-renderer.js`; `m3-demo.js` coordinates the control example. Control order and control layouts are separate JSON sources, and all calculation modules remain DOM-independent.

### Next safe step — M4

Create pure modules and tests for produced quantity, underproduction, overrun, plates, physical paper, press passes, and a verified production report. Connect the report to the UI only after the calculation tests pass.

</td>
</tr>
</table>
