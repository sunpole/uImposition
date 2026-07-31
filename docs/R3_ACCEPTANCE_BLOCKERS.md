# R3 owner acceptance blockers

Дата фиксации: 2026-07-31.

Источник: реальная проверка владельцем опубликованного маршрута `/app/` на desktop 1920×1080.

## Подтверждённое направление

Новый operator-first интерфейс принят как правильное направление и заметно лучше legacy technical page. Этот этап не является новым redesign. Он исправляет реальные рабочие blockers и добавляет ранее предусмотренные operator controls поверх уже принятой архитектуры.

## Обязательный scope патча

### 1. Актуальность ошибок совместимости

Сообщение `Для текущего расчёта все включённые строки должны иметь одинаковый формат, цветность, выпуск и рез` обязано исчезать сразу после того, как все активные строки снова совместимы. Запоздавший invalid result не должен оставаться видимым после новой корректной input revision.

### 2. Сквозная навигация

Desktop top bar на каждом экране содержит постоянные действия:

- `Заказ`;
- `Варианты`;
- `Схема`.

Текущий экран выделен. Переход не теряет project state, operator selection или last valid calculation.

### 3. Лицо и оборот

- проверить доменную операцию построения оборота;
- оборот должен соответствовать утверждённому производственному зеркалированию лица;
- отдельные режимы `Лицо` и `Оборот` сохраняются;
- добавить режим `Лицо + оборот` для одновременного сравнения на одном экране;
- PDF продолжает строиться из тех же validated front/back records.

### 4. Desktop width и вертикальная плотность

- рабочая область использует доступную ширину 1920 px заметно полнее;
- убрать искусственный предел 1440 px там, где он мешает строкам продукции и сравнению;
- на 1920×1080 основной экран заказа должен помещаться без бессмысленной прокрутки примерно на высоту одного сантиметра;
- не уменьшать основной текст ниже принятой читаемой системы;
- mobile 390/360 остаётся отдельным one-screen flow.

### 5. Массовый TXT-ввод

Рядом с `Добавить вид`:

- `Импорт TXT`;
- `Скачать шаблон TXT`;
- UTF-8 формат с явной первой строкой-схемой;
- импорт нескольких строк продукции;
- поддержка разной красочности лица и оборота;
- preview/validation до применения;
- атомарное применение: одна ошибочная строка не должна частично менять заказ;
- ошибки содержат номер строки и поле.

Предлагаемая схема v1:

```text
name;width_mm;height_mm;quantity;variants;pages;front_colors;back_colors;bleed_mm;cut_mode;gap_mm;rotation;duplex_preference;notes
Листовка А6;105;148;1000;1;2;4;1;0;commonCut;0;auto;auto;пример
```

### 6. Приоритет расчёта

Использовать существующую lossless objective/reranking модель. Не генерировать планы заново и не удалять допустимые решения.

Быстрые приоритеты оператора:

- минимум листов;
- минимум полной стоимости — доступно только при полном прайсе;
- минимум форм и цветовых пластин;
- минимум прогонов;
- минимум перетиража;
- минимум разных заказов на одном монтаже / более производственно простой монтаж.

Нужен также расширенный порядок всех активных целей. Recommendation меняется, explicit operator selection не сбрасывается, пока выбранный план существует.

### 7. Разная красочность лица и оборота

- `frontColors` и `backColors` остаются независимыми полями строки продукции;
- uniform compatibility допускает одинаковую геометрию/bleed/cut при общей паре красочности, например все строки `4+1` или все `1+4`;
- строки `4+4` и `4+1` в одном uniform calculation остаются несовместимыми до отдельного mixed-color solver milestone;
- расчёт пластин и стоимости использует фактические значения каждой стороны;
- UI, TXT и persistence не должны принудительно выравнивать лицо и оборот;
- simplex и general mixed-format scope в этот патч не входят.

## Quality gates

- pure tests для актуальности revision/error state, TXT parser, objective preset/reranking и front/back layout contract;
- Chromium desktop 1920×1080 и 1440/1024;
- Chromium mobile 390/360;
- navigation path `Заказ → Варианты → Схема → Заказ`;
- same-side and asymmetric-color examples `4+4`, `1+1`, `4+1`, `1+4`;
- combined face/back screenshot;
- TXT template download and successful/failed import;
- existing selected-plan PDF verification;
- no VERSION/release/root cutover until repeat owner acceptance.

## Explicitly outside this patch

- automatic mixed-format packing;
- arbitrary mixed color groups inside one uniform plan;
- general simplex and odd-page solver;
- generalized work-and-turn search;
- alpha.6 release and root cutover before owner approval.
