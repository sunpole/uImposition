# Справочник конфигурации / Configuration Reference

## Основной принцип / Core principle

Все изменяемые производственные параметры и интерфейсные значения находятся в `src/config.js`. Расчётные модули не должны содержать скрытые производственные значения.

All editable production and interface values live in `src/config.js`. Calculation modules must not contain hidden production constants.

## Реализованные группы M3 / Implemented M3 groups

| Группа | Назначение / Purpose |
|---|---|
| `app` | название, язык, единицы / name, language, units |
| `sheetPresets` | реальные размеры после зачистки / real post-trim sheet sizes |
| `productPresets` | A4, A5, A6 / finished-product presets |
| `bleedPresetsMm` | быстрые значения 0, 2, 5 мм / quick bleed values |
| `defaults` | значения первого запуска / initial UI defaults |
| `limits` | допустимые диапазоны и лимиты отображения / ranges and display limits |
| `storage` | ключи браузерного хранения / browser-storage keys |
| `demo` | контрольный заказ и контрольные монтажи / control order and control impositions |
| `i18n` | русские и английские подписи / Russian and English labels |

## Контрольные источники M3 / M3 control sources

В группе `demo` используются два независимых источника:

- `controlCaseUrl` → `data/control-case.json` — лист, изделие и 20 заказов;
- `controlLayoutUrl` → `data/control-layout-m3.json` — четыре ручные раскладки лицевых позиций.

The `demo` group uses two independent sources: the control order and the four manual front-layout assignments. The back layouts are never stored independently; they are derived from the fronts at runtime.

Ручные тиражи `1500`, `1100`, `450`, `345` являются контрольными значениями для M3 и не должны восприниматься как результат оптимизатора.

## Геометрия листа / Sheet geometry

- `beforeTrim`: значения зачистки вычитаются;
- `afterTrim`: размер уже дан после зачистки и не уменьшается повторно;
- непечатные поля вычитаются только после определения фактического листа.

- `beforeTrim`: trim values are subtracted;
- `afterTrim`: the size is already post-trim and is not reduced again;
- non-printable press margins are subtracted only after the physical sheet is established.

## Геометрия изделия / Product geometry

`productPresets` содержит готовые размеры без выпуска. Поддерживаются:

- `width`, `height` — готовый формат;
- `bleed` — выпуск с каждой стороны;
- `spacingMode: commonCut` — общий рез, допускается только при выпуске `0`;
- `spacingMode: separated` — раздельный рез;
- `gap` — дополнительное расстояние между внешними границами выпусков.

Занимаемый размер одного изделия:

```text
occupied width  = finished width  + 2 × bleed
occupied height = finished height + 2 × bleed
```

Для раздельного режима дополнительный `gap` применяется только между соседними занимаемыми прямоугольниками, а не после последнего изделия.

## Подсчёт сетки / Grid count

Для каждой ориентации `0°` и `90°`:

```text
columns = floor((printable width  + gap) / (cell width  + gap))
rows    = floor((printable height + gap) / (cell height + gap))
positions = columns × rows
```

Сначала выбирается максимальное число позиций. При равенстве используется меньшая неиспользованная площадь ограничивающего прямоугольника, затем меньший остаток по краям, затем стабильное предпочтение `0°`.

Maximum position count is the first selector. Ties use the smaller unused bounding area, then smaller combined edge waste, then stable preference for `0°`.

## M3: лицо и оборот / M3: front and back

- лицо заполняется блоками из `data/control-layout-m3.json` в порядке row-major;
- `rotation: 0` создаёт направление `up`, `rotation: 90` — `right`;
- оборот не хранится в конфигурации и не группируется отдельно;
- горизонтальный переворот зеркалит колонки и преобразует `right` в `left`;
- знак `-` является только отображением `backPage: null`.

## Значения по умолчанию / Defaults

- язык / language: `ru`;
- исходный лист / source sheet: `620 × 450`;
- зачистка / trim: `2` мм с каждой стороны;
- поля / margins: `4 / 4 / 2 / 13` мм;
- изделие / product: `A6`, `105 × 148`;
- выпуск / bleed: `0`;
- режим / mode: `commonCut`;
- дополнительный зазор / additional gap: `0`;
- панель настроек после загрузки / settings panel after reload: open.
