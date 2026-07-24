# Справочник конфигурации / Configuration Reference

## Основной принцип / Core principle

Все изменяемые производственные параметры находятся в `src/config.js` или в явных входных данных. Расчётные модули не содержат скрытых производственных значений.

All editable production parameters live in `src/config.js` or explicit input data. Calculation modules contain no hidden production values.

## Действующие группы / Active groups

| Группа | Назначение / Purpose |
|---|---|
| `app` | название, язык, единицы / name, language, units |
| `sheetPresets` | реальные размеры после зачистки / post-trim sheet sizes |
| `productPresets` | A4, A5, A6 / finished-product presets |
| `bleedPresetsMm` | быстрые выпуски / quick bleed values |
| `defaults` | первый запуск / initial state |
| `limits` | допустимые диапазоны / allowed ranges |
| `storage` | ключи браузерного хранения / browser storage keys |
| `demo` | контрольный заказ и монтажи / control order and impositions |
| `i18n` | подписи интерфейса / interface labels |

## Контрольные источники M4 / M4 control sources

- `controlCaseUrl` → `data/control-case.json`: лист, изделие, режим оборота, 20 заказов и ожидаемые производственные суммы;
- `controlLayoutUrl` → `data/control-layout-m3.json`: четыре явных лицевых монтажа и их ручные тиражи;
- оборот не хранится отдельно: он всегда строится из лица;
- производственный отчёт вычисляется из пар страниц и проверенных схем.

The control case provides the orders, duplex mode, and expected totals. The layout file provides four explicit fronts and manual run lengths. Backs and production totals are derived at runtime.

Ручные тиражи `1500`, `1100`, `450`, `345` не являются настройкой по умолчанию и не должны использоваться вне контрольного примера как скрытая константа.

## Геометрия / Geometry

```text
post-trim width  = source width  − left trim − right trim
post-trim height = source height − top trim  − bottom trim
printable width  = post-trim width  − left margin − right margin
printable height = post-trim height − top margin  − bottom margin
occupied width   = finished width  + 2 × bleed
occupied height  = finished height + 2 × bleed
columns = floor((printable width  + gap) / (cell width  + gap))
rows    = floor((printable height + gap) / (cell height + gap))
positions = columns × rows
```

`afterTrim` не уменьшается повторно. `commonCut` допускается только при нулевом выпуске.

## Лицо и оборот / Front and back

- блоки лица заполняются row-major;
- `rotation: 0` → `up`, `rotation: 90` → `right`;
- горизонтальный переворот зеркалит колонки;
- `right` превращается в `left`;
- `backPage: null` отображается знаком `-` только на обороте.

## M4: производственные метрики / M4 production metrics

Для пары `i` и монтажа `m`:

```text
produced_i = Σ(positionCount_i,m × runLength_m)
underproduction_i = max(0, required_i − produced_i)
overrun_i = max(0, produced_i − required_i)
```

Для готового файла:

```text
completeProduced = min(produced quantity of every file pair)
fileOverrun = max(0, completeProduced − required file quantity)
```

Для `duplexMode: separateFrontBackForms`:

```text
physicalSheets = Σ(runLength_m)
frontForms = impositionCount
backForms = impositionCount
forms = frontForms + backForms
pressPasses = 2 × physicalSheets
```

Другие способы оборота пока отклоняются как неподдерживаемые, а не рассчитываются предположительно.

## Значения первого запуска / Initial defaults

- язык / language: `ru`;
- исходный лист / source sheet: `620 × 450`;
- зачистка / trim: `2` мм с каждой стороны;
- поля / margins: `4 / 4 / 2 / 13` мм;
- изделие / product: `A6`, `105 × 148`;
- выпуск / bleed: `0`;
- режим / spacing mode: `commonCut`;
- дополнительный зазор / gap: `0`;
- панель настроек / settings panel: open.
