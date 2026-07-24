# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущая версия

**`0.3.0-alpha`**  
Дата: **24 июля 2026**  
Этап: **M3 — лицо и зеркальный оборот**

### Что работает

- весь проверенный функционал M1 и M2;
- заполнение лицевых позиций сплошными блоками слева направо и сверху вниз;
- запрет пустых лицевых позиций, чётных страниц и знака `-` на лице;
- автоматическое зеркалирование колонок для оборота без перестановки строк;
- точное соответствие `1 → 2`, `3 → 4`, а для отсутствующей последней страницы — `null`;
- преобразование направления головы `→` в `←` при перевороте слева направо;
- независимая проверка файла, пары, страницы, координат и направления;
- четыре контрольных лица и четыре автоматически полученных оборота по `4 × 4 = 16` позиций;
- рамочные desktop/mobile схемы `файл,страница стрелка`;
- знак `-` только при отображении отсутствующей оборотной страницы.

### Проверенный контрольный результат M3

- контрольный заказ: `20` файлов и `35` пар страниц;
- сетка каждого монтажа: `4 × 4`, поворот `90°`;
- формы: `4` лица и `4` оборота;
- тиражи ручной контрольной раскладки: `1500`, `1100`, `450`, `345`;
- каждый оборот построен только из соответствующего лица;
- файл `119` сохраняет полные пары `1/2` и `3/4`;
- все восемь схем проходят автоматическую валидацию.

Контрольные тиражи являются ручным проверочным примером, а не результатом оптимизатора и не доказанным глобальным минимумом бумаги.

### Ещё не реализовано

- автоматический расчёт тиражей монтажей;
- напечатанное количество, недопечатка и перетираж;
- формы, бумага и листопрогоны;
- автоматический оптимизатор;
- смешанные ориентации внутри одной сетки;
- PDF-экспорт.

### Следующая целевая версия

**`0.4.0-alpha` — M4**

Расчёт производственных итогов для явных монтажей: напечатано, недопечатка, перетираж, формы, бумага и листопрогоны.

</td>
<td width="50%" valign="top">

## English

### Current version

**`0.3.0-alpha`**  
Date: **24 July 2026**  
Stage: **M3 — front and mirrored back**

### Working now

- all verified M1 and M2 functionality;
- contiguous front-position blocks expanded left-to-right and top-to-bottom;
- rejection of empty fronts, even front pages, and dash identifiers;
- automatic back derivation by mirroring columns without reordering rows;
- exact `1 → 2`, `3 → 4`, and unmatched-final-page `null` mapping;
- head-direction transformation from `→` to `←` for a left-to-right sheet turn;
- independent file, pair, page, coordinate, and direction validation;
- four control fronts and four automatically derived backs, each using `4 × 4 = 16` positions;
- bordered desktop/mobile `file,page arrow` schemes;
- dash-only rendering exclusively for missing back pages.

### Verified M3 control result

- control dataset: `20` files and `35` page pairs;
- every imposition uses a `4 × 4` grid at `90°`;
- forms: `4` fronts and `4` backs;
- manual control run lengths: `1500`, `1100`, `450`, `345`;
- every back is derived only from its corresponding front;
- file `119` preserves complete `1/2` and `3/4` pairs;
- all eight schemes pass automatic validation.

The control run lengths are a verified manual reference, not optimizer output or a proven global paper minimum.

### Not implemented yet

- automatic imposition run calculation;
- produced quantity, underproduction, and overrun;
- plates, paper, and press passes;
- automatic optimization;
- mixed orientations within one grid;
- PDF export.

### Next target version

**`0.4.0-alpha` — M4**

Calculate production totals for explicit impositions: produced quantity, underproduction, overrun, plates, paper, and press passes.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние проекта;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила.

## Релизы и откат / Releases and rollback

Alpha-веха `0.3.0-alpha` получает recovery-ветку `release/v0.3.0-alpha` после объединения и проверки GitHub Pages. Настоящий GitHub Release обязателен после признания версии стабильной production-версией; alpha-версия стабильной не называется.
