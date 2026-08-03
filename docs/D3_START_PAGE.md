# D3 — компактная стартовая страница оператора

Статус: **implementation в draft PR #115**.  
Product Gate и журнал решений: **Issue #113**.  
Полная specification: **Issue #114**.

## 1. Назначение

D3 заменяет крупную карточную форму стартового экрана `/app/` на компактный table-first ввод, сохраняя существующий production workflow:

```text
D3 start page
→ R2 application state and repositories
→ versioned product rows
→ existing operator-workspace calculation adapter
→ existing plan catalog and operator selection
→ existing layout and PDF export
```

D3 не содержит production formulas и не переписывает solver.

## 2. Экран заказа

### Верхняя панель

- высота строго `26 px` на всех разрешениях;
- выбранный лист — оранжевая кнопка слева;
- живые счётчики: задания, пластины, листы;
- справа: `+`, TXT, настройки;
- `+` не имеет маркера раскрытия;
- preset, TXT и settings используют универсальный marker `2×2 px`;
- одновременно открыта одна overlay-поверхность;
- outside click и `Esc` закрывают overlay.

### Таблица

Колонки:

```text
Название | Формат | Ширина | ↔ | Высота | Красочность | Выпуск | Страниц | Тираж | Копия | Удаление
```

Компактный режим для телефона и небольшого экрана:

```text
column header = 6 px
ordinary row  = 8 px
active row    = 16 px
```

Full HD desktop-режим включается при ширине от `1600 px` и высоте от `900 px`:

```text
column header = 24 px
ordinary row  = 24 px
active row    = 38 px
```

Desktop-режим не масштабирует мобильную таблицу целиком. Он задаёт отдельные ширины колонок, увеличивает шрифт и рабочие зоны, добавляет поля по краям, расширяет overlay-поверхности и использует пространство экрана на страницах вариантов и схемы.

Одновременно чёрная только одна строка. Когда существующая строка не выбрана, активна верхняя строка нового заказа.

## 3. Верхняя строка нового заказа

Начинается полностью пустой. Название необязательно; все производственные поля обязательны.

После успешного `+`:

1. draft проходит pure D3 validation;
2. пустое имя получает монотонное `Заказ N`;
3. draft преобразуется в существующую product-row schema;
4. product row добавляется через `application-product-rows.js`;
5. новая строка перемещается в начало collection;
6. верхний draft очищается и снова становится активным.

Незавершённый draft сохраняется отдельно от application state и восстанавливается после reload. Намеренный выбор существующей строки очищает этот draft.

## 4. Производственные значения

Источником является `src/config.js`:

- печатные листы: `616×446`, `616×466`, `636×448`, `646×466`, `650×313`, `716×326`, `716×336`, `716×516`, `500×350`, `450×320`;
- изделия: A4, A5, A6, A7, произвольный;
- точность изделия: `0,01 мм`;
- красочность: первая сторона `1–20`, вторая `0–20`;
- выпуск: `0–20 мм`, точность `0,1 мм`, shortcuts `0/2/3/5`;
- страницы и тираж: целые от `1`;
- тираж отображается обычными пробелами по три цифры.

Fit validation проверяет готовый размер вместе с выпуском по фактической печатной области выбранного sheet/press preset. Допустимо размещение `0°` или `90°`; исходные размеры строки не меняются.

## 5. Строки заказа

- выбор строки включает inline editing;
- изменения immediately проходят существующую application action и local repository;
- копия создаёт новый stable product ID и вставляется под оригиналом;
- copy naming использует монотонную sequence и не переиспользует удалённые номера;
- удаление немедленное;
- одно последнее удаление можно вернуть около пяти секунд;
- undo восстанавливает точные данные, ID и позицию.

## 6. Calculation lifecycle

```text
input change
→ application inputRevision++
→ dirty
→ debounced calculation request
→ calculating
→ ready or error
```

Stale response не может заменить более новый input. Последний корректный результат сохраняется при ошибочном draft, но верхние counters не выдают его за текущий результат.

## 7. Граница этапа

В PR #115 входят:

- D3 HTML/CSS/JS;
- связь с R2 state, persistence и product rows;
- реальный current uniform calculation;
- существующие alternatives/layout/PDF;
- pure unit tests;
- Chromium evidence на `360`, `390`, `1024`, `1280`, `1440` и `1920×1080`;
- PDF download verification.

Не входят:

- новый solver;
- mixed-format packing;
- новая логика оборота;
- новые обозначения экземпляров и стрелки в PDF;
- переключение корневой страницы сайта;
- release/version/tag.

## 8. Проверка

Node seam:

- formats and exact recognition;
- decimal normalization;
- `20+20` color range;
- bleed rounding/clamping;
- direct/rotated fitting;
- integer pages/quantity;
- product-row conversion;
- monotonic copy naming.

Chromium seam:

- mobile exact heights `26/6/8/16 px`;
- Full HD exact heights `26/24/24/38 px`;
- widths `360/390/1024/1440/1920`;
- no full-page horizontal overflow;
- add/copy/delete/undo;
- draft and application persistence;
- alternatives and layout;
- selected-plan scheme/report PDF.

---

## English summary

D3 is the compact table-first start page for `/app/`. It connects an empty, versioned top draft and inline order rows to the existing R2 application state, product-row actions, uniform calculation adapter, operator selection, layout preview and PDF export. Mobile keeps the approved compact metrics, while Full HD workstations receive a dedicated desktop composition. Production values come from `src/config.js`; formulas and solver scope are unchanged.
