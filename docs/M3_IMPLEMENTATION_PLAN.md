# M3 — лицо и зеркальный оборот / Front and Mirrored Back

Целевая версия / Target version: **`0.3.0-alpha`**  
Рабочая ветка / Working branch: **`m3/0.3.0-alpha`**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Цель этапа

M3 превращает рассчитанную сетку и пары страниц в производственные схемы:

- `ЛИСТ-N_ЛИЦО`;
- `ЛИСТ-N_ОБОРОТ`;
- номер файла;
- точная исходная страница;
- стрелка направления головы;
- рамка каждой позиции;
- автоматическая проверка зеркального соответствия.

M3 **не является оптимизатором**. Он получает явное назначение лицевых позиций, строит лицо и автоматически выводит оборот. Поиск минимума бумаги начинается позже.

### Обязательная модульная структура

#### `src/front-layout.js`

Отвечает только за лицевую схему:

- принимает число строк и столбцов;
- принимает последовательность блоков позиций;
- разворачивает блоки слева направо, затем сверху вниз;
- запрещает пустые лицевые позиции;
- запрещает `-` на лице;
- сохраняет исходный порядок блоков;
- не знает ничего о DOM и CSS.

Предпочтительный интерфейс:

```js
createFrontLayout({
  id,
  runLength,
  rows,
  columns,
  rotation,
  blocks,
  pagePairs
})
```

Каждый блок:

```js
{
  file: "33",
  frontPage: 1,
  count: 6
}
```

#### `src/orientation.js`

Отвечает только за направление головы:

- `0°` на лице → `↑`;
- `90°` на лице → `→`;
- при перевороте слева направо `→` становится `←`;
- `←` становится `→`;
- `↑` остаётся `↑`;
- `↓` остаётся `↓`.

Никаких строковых стрелок в других расчётных модулях. Внутреннее значение — enum/идентификатор, символ добавляет renderer.

#### `src/back-layout.js`

Отвечает только за автоматический оборот:

1. получает готовое лицо;
2. не переставляет строки;
3. зеркалит колонки внутри каждой строки;
4. заменяет лицевую страницу на связанную оборотную;
5. для нечётной последней страницы ставит `backPage: null`;
6. преобразует направление через `orientation.js`;
7. никогда не группирует оборот самостоятельно.

Для строки лица:

```text
A | B | C | D
```

оборот обязан стать:

```text
D-back | C-back | B-back | A-back
```

#### `src/imposition-validation.js`

Проверяет независимо от UI:

- точное число лицевых ячеек;
- все лицевые ячейки заполнены;
- лицевая страница нечётная;
- каждая лицевая запись найдена в `pagePairs`;
- оборот имеет то же число ячеек;
- каждая строка оборота зеркальна лицу;
- `1 → 2`, `3 → 4`, а нечётная последняя страница → `null`;
- стрелка оборота преобразована правильно;
- один и тот же файл и pair-id сохраняются;
- `-` появляется только при рендеринге `backPage: null`.

#### `src/scheme-renderer.js`

Отвечает только за DOM:

- принимает уже проверенную модель схемы;
- создаёт карточку с рамкой;
- рисует сетку;
- показывает `файл,страница стрелка`;
- для `backPage: null` показывает только `-`;
- не вычисляет зеркалирование и страницы;
- пригоден для скриншота;
- позднее будет переиспользован PDF-экспортом.

#### `src/app.js`

Остаётся координатором:

- читает параметры;
- вызывает модули;
- передаёт результат renderer;
- показывает ошибки.

В `app.js` нельзя переносить формулы M3.

### Контрольные данные M3

Нужно добавить `data/control-layout-m3.json`.

Это ручная проверенная раскладка для демонстрации, а не доказательство глобального оптимума.

#### ЛИСТ-1 — 1500 листов

```text
33,1 ×4
33,1 ×2 | 33,3 ×2
33,3 ×4
70,1 | 70,3 | 25,1 | 25,3
```

#### ЛИСТ-2 — 1100 листов

```text
20,1 ×2 | 20,3 ×2
99,1 ×2 | 40,1 ×2
70,1 | 70,3 | 41,1 | 41,3
67,1 | 67,3 | 126,1 | 126,3
```

#### ЛИСТ-3 — 450 листов

```text
97,1 ×3 | 97,3
97,3 ×2 | 70,1 ×2
70,3 ×2 | 8,1 | 8,3
62,1 | 36,1 | 119,1 | 119,3
```

#### ЛИСТ-4 — 345 листов

```text
33,1 ×2 | 33,3 ×2
111,1 ×2 | 72,1 | 72,3
69,1 | 69,3 | 75,1 | 75,3
84,1 | 84,3 | 43,1 | 43,3
```

Все четыре лица имеют `4 × 4 = 16` позиций и поворот `90°`, поэтому лицо показывает `→`, оборот — `←`.

### Формат модели ячейки

```js
{
  position: 1,
  row: 0,
  column: 0,
  file: "33",
  pairIndex: 1,
  frontPage: 1,
  backPage: 2,
  page: 1,
  direction: "right"
}
```

Для оборота поле `page` получает `backPage`; при отсутствии страницы `page: null`.

### Обязательные тесты

1. Блок из шести позиций занимает шесть последовательных ячеек row-major.
2. Перенос блока через границу строки не меняет порядок.
3. Лицо с 15 или 17 ячейками отклоняется для сетки 4×4.
4. Лицевая чётная страница отклоняется.
5. Оборот строки `[A,B,C,D]` равен `[D-back,C-back,B-back,A-back]`.
6. Строки местами не меняются.
7. `33,1 →` превращается в `33,2 ←` в зеркальной колонке.
8. `33,3 →` превращается в `-` в зеркальной колонке.
9. Файл 119 корректно даёт `119,1/2` и `119,3/4`.
10. Весь контрольный набор создаёт 4 лица и 4 оборота по 16 ячеек.
11. Ни на одном лице нет `null` или `-`.
12. Полная validation-функция возвращает success для контрольной раскладки.

### UI M3

После чистых модулей и тестов сайт показывает раздел:

```text
ЛИСТ-1_ЛИЦО
ЛИСТ-1_ОБОРОТ
...
ЛИСТ-4_ЛИЦО
ЛИСТ-4_ОБОРОТ
```

Каждая карточка содержит:

- название;
- тираж как справочное поле;
- `4 × 4`;
- 16 рамочных ячеек;
- файл, страницу и стрелку;
- статус проверки.

### Не входит в M3

- доказательство закрытия тиражей;
- расчёт перетиража;
- автоматический поиск тиражей монтажей;
- минимум бумаги;
- сравнение разных вариантов;
- PDF.

Эти функции не следует частично прятать в M3. Они относятся к M4–M7.

### Критерий завершения

M3 готов только когда:

- расчёты находятся в отдельных модулях;
- тесты проходят в GitHub Actions;
- сайт показывает 8 рамочных схем;
- обороты получены только из лиц;
- desktop/mobile Chromium screenshots подтверждают результат;
- подготовлен новый патчноут и PNG для uNews;
- версия синхронизирована как `0.3.0-alpha`;
- PR объединён;
- создана `release/v0.3.0-alpha`.

</td>
<td width="50%" valign="top">

## English

### Milestone goal

M3 turns the selected grid and exact page pairs into production-facing schemes:

- `SHEET-N_FRONT`;
- `SHEET-N_BACK`;
- source file identifier;
- exact source page;
- head-direction arrow;
- a border around every position;
- automatic mirrored-front/back validation.

M3 is **not an optimiser**. It receives an explicit front-position assignment, builds the front, and derives the back automatically. Paper minimisation starts in a later milestone.

### Required modular structure

#### `src/front-layout.js`

Owns front-side construction only:

- accepts rows and columns;
- accepts sequential assignment blocks;
- expands blocks left-to-right, then top-to-bottom;
- rejects empty front positions;
- rejects dash values on the front;
- preserves block order;
- has no DOM or CSS knowledge.

Preferred API:

```js
createFrontLayout({
  id,
  runLength,
  rows,
  columns,
  rotation,
  blocks,
  pagePairs
})
```

#### `src/orientation.js`

Owns head direction only:

- front at `0°` → `↑`;
- front at `90°` → `→`;
- left-to-right sheet turn maps `→` to `←`;
- `←` maps to `→`;
- `↑` remains `↑`;
- `↓` remains `↓`.

Other calculation modules must not contain arrow glyphs. They use internal direction identifiers; the renderer supplies glyphs.

#### `src/back-layout.js`

Owns automatic back derivation only:

1. receives a completed front;
2. keeps row order unchanged;
3. reverses columns within every row;
4. replaces the front page with its linked back page;
5. uses `backPage: null` for an unmatched final odd page;
6. transforms direction through `orientation.js`;
7. never regroups the back independently.

#### `src/imposition-validation.js`

Validates independently of the UI:

- exact front-cell count;
- no empty front cells;
- odd front pages only;
- every front entry exists in `pagePairs`;
- equal front/back cell counts;
- every back row is a mirror of the front row;
- `1 → 2`, `3 → 4`, and an unmatched final odd page → `null`;
- correct back direction;
- stable file and pair identity;
- a dash appears only when the renderer formats `backPage: null`.

#### `src/scheme-renderer.js`

Owns DOM rendering only:

- receives an already validated scheme model;
- creates a bordered card;
- draws the grid;
- displays `file,page direction`;
- displays only `-` for `backPage: null`;
- performs no mirroring or page calculation;
- remains screenshot-friendly;
- can later be reused by PDF export.

#### `src/app.js`

Remains a coordinator:

- reads parameters;
- invokes modules;
- passes models to the renderer;
- presents errors.

M3 formulas must not be moved into `app.js`.

### M3 control data

Add `data/control-layout-m3.json`.

It is a manually verified demonstration layout, not proof of a global optimum.

The four front schemes are exactly the layouts listed in the Russian column. Every front uses a `4 × 4 = 16` grid and `90°` rotation. Therefore the front direction is `→` and the back direction is `←`.

### Cell model

```js
{
  position: 1,
  row: 0,
  column: 0,
  file: "33",
  pairIndex: 1,
  frontPage: 1,
  backPage: 2,
  page: 1,
  direction: "right"
}
```

For the back, `page` receives `backPage`; when the source page does not exist, `page: null`.

### Required tests

1. A six-position block occupies six consecutive row-major cells.
2. A block crossing a row boundary preserves order.
3. A 15- or 17-cell front is rejected for a 4×4 grid.
4. An even front page is rejected.
5. Back row `[A,B,C,D]` equals `[D-back,C-back,B-back,A-back]`.
6. Row order remains unchanged.
7. `33,1 →` becomes `33,2 ←` in the mirrored column.
8. `33,3 →` becomes `-` in the mirrored column.
9. File 119 correctly produces `119,1/2` and `119,3/4`.
10. The full control data creates four fronts and four backs with 16 cells each.
11. No front contains `null` or a dash.
12. Full validation returns success for the control layouts.

### M3 interface

After pure modules and tests, the site displays:

```text
SHEET-1_FRONT
SHEET-1_BACK
...
SHEET-4_FRONT
SHEET-4_BACK
```

In Russian mode the visible titles remain `ЛИСТ-N_ЛИЦО` and `ЛИСТ-N_ОБОРОТ`.

Every card includes:

- title;
- run length as reference metadata;
- `4 × 4`;
- 16 bordered cells;
- file, page, and direction;
- validation status.

### Outside M3 scope

- proving run completion;
- overrun calculation;
- automatic imposition run selection;
- paper minimisation;
- alternative comparison;
- PDF export.

These must not be partially hidden inside M3. They belong to M4–M7.

### Completion criteria

M3 is complete only when:

- calculations live in separate modules;
- GitHub Actions tests pass;
- the site displays eight bordered schemes;
- every back is derived exclusively from its front;
- desktop and mobile Chromium screenshots prove the result;
- a new uNews patchnote and PNG are prepared;
- the version is synchronised as `0.3.0-alpha`;
- the PR is merged;
- `release/v0.3.0-alpha` exists.

</td>
</tr>
</table>
