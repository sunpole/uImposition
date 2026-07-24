# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущая версия

**`0.2.0-alpha`**  
Дата: **24 июля 2026**  
Этап: **M2 — вместимость и пары страниц**

### Что работает

- весь проверенный функционал M1;
- готовые форматы A4, A5, A6 и произвольный формат изделия;
- отдельные ширина и высота готового изделия;
- выпуск за обрез;
- режим общего реза при выпуске 0 мм;
- раздельный рез с дополнительным зазором между границами выпусков;
- расчёт занимаемого размера изделия;
- сравнение однородных сеток без поворота и с поворотом на 90°;
- выбор варианта с максимальным количеством позиций;
- точные размеры использованной и свободной части печатной области;
- схематичная сетка всех позиций;
- раскрытие каждого файла в пары `1/2`, `3/4`, `5/-` и далее;
- сохранение порядка исходных файлов и тиражей.

### Проверенный контрольный результат

Для печатной области `608 × 431 мм` и A6 `105 × 148 мм`, выпуск `0`, общий рез:

- `0°`: `5 × 2 = 10` позиций;
- `90°`: `4 × 4 = 16` позиций;
- выбран вариант `90°`;
- контрольные 20 файлов дают 35 точных печатных пар.

### Ещё не реализовано

- смешанные ориентации внутри одной сетки;
- распределение файлов по позициям;
- лицо и зеркальный оборот;
- расчёт тиражей монтажей;
- оптимизатор и PDF.

### Следующая целевая версия

**`0.3.0-alpha` — M3**

Заполнение позиций сплошными блоками, построение лица и автоматическое получение зеркального оборота с точными страницами и направлениями.

</td>
<td width="50%" valign="top">

## English

### Current version

**`0.2.0-alpha`**  
Date: **24 July 2026**  
Stage: **M2 — capacity and page pairs**

### Working now

- all verified M1 functionality;
- A4, A5, A6 and custom finished-product sizes;
- independent finished width and height;
- bleed input;
- common-cut mode with zero bleed;
- separated-cut mode with an additional gap between bleed boundaries;
- occupied product-size calculation;
- comparison of uniform unrotated and 90-degree grids;
- selection of maximum position count;
- exact used and unused printable-area dimensions;
- schematic position grid;
- exact source-page expansion into `1/2`, `3/4`, `5/-` and later pairs;
- preserved source-file order and quantities.

### Verified control result

For a `608 × 431 mm` printable area and A6 `105 × 148 mm`, zero bleed and common cut:

- `0°`: `5 × 2 = 10` positions;
- `90°`: `4 × 4 = 16` positions;
- the `90°` option is selected;
- the 20-file control dataset expands to 35 exact print pairs.

### Not implemented yet

- mixed orientations within one grid;
- assigning jobs to positions;
- front and mirrored-back schemes;
- imposition run-length calculation;
- optimizer and PDF export.

### Next target version

**`0.3.0-alpha` — M3**

Assign positions in contiguous blocks, build the front and derive the mirrored back with exact pages and directions.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние проекта;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила.

## Релизы и откат / Releases and rollback

Каждая достигнутая стабильная версия должна иметь синхронизированные источники версии, recovery-ветку `release/v{version}`, проверенный сайт и настоящий GitHub Release с тем же тегом. Alpha-этапы получают проверяемую рабочую ветку, но не называются стабильными production-релизами.
