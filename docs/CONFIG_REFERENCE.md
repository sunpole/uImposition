# Справочник конфигурации / Configuration Reference

## Основной принцип / Core principle

Все изменяемые производственные и экспортные параметры находятся в `src/config.js` или в явных входных данных. Расчётные и PDF-модули не содержат скрытых производственных значений.

All editable production and export parameters live in `src/config.js` or explicit input data. Calculation and PDF modules contain no hidden production constants.

## Действующие группы / Active groups

| Группа | Назначение / Purpose |
|---|---|
| `app` | название, язык, единицы / name, language, units |
| `sheetPresets` | размеры после зачистки / post-trim sizes |
| `productPresets` | A4, A5, A6 / finished sizes |
| `defaults` | первый запуск / initial state |
| `limits` | допустимые диапазоны / allowed ranges |
| `storage` | browser storage keys |
| `demo` | контрольный заказ и монтажи / control input |
| `pdf` | страницы, рендер, качество и имена PDF / PDF pages, rendering, quality, names |
| `i18n` | подписи интерфейса / interface labels |

## Геометрия и производство / Geometry and production

```text
post-trim = source sheet − sheet trim
printable = post-trim − press margins
occupied item = finished size + bleed
positions = rows × columns
produced pair = Σ(position count × imposition run)
underproduction = max(0, required − produced)
overrun = max(0, produced − required)
physical sheets = Σ(imposition run)
forms = front forms + back forms
press passes = 2 × physical sheets
```

`afterTrim` не уменьшается повторно. Недопечатка блокирует производственную готовность.

## Контрольные источники / Control sources

- `data/control-case.json`: лист, изделие, 20 заказов, режим оборота и ожидаемые итоги;
- `data/control-layout-m3.json`: четыре явных лица и ручные тиражи;
- обороты всегда выводятся из лиц;
- производственный отчёт выводится из проверенных схем.

Ручные тиражи `1500`, `1100`, `450`, `345` не являются скрытыми defaults или результатом оптимизатора.

## M5: PDF-конфигурация / M5 PDF configuration

```text
CONFIG.pdf.defaultPageMode          = "a4"
CONFIG.pdf.supportedPageModes       = ["a4", "sheetProportional", "custom"]
CONFIG.pdf.a4                       = 210 × 297 mm
CONFIG.pdf.defaultMarginMm          = 10
CONFIG.pdf.preserveAspectRatio      = true
CONFIG.pdf.safeNameDigits           = 2
CONFIG.pdf.renderDpi                = 180
CONFIG.pdf.jpegQuality              = 0.92
CONFIG.pdf.proportionalLongSideMm   = 297
CONFIG.pdf.schemeDocumentFileName   = "uImposition-schemes.pdf"
CONFIG.pdf.reportDocumentFileName   = "uImposition-production-report.pdf"
```

### Режимы страниц схем / Scheme page modes

- `a4`: фиксированные `210 × 297 мм`;
- `sheetProportional`: длинная сторона `297 мм`, отношение сторон берётся из фактического листа;
- `custom`: пользователь задаёт ширину и высоту;
- во всех режимах схема вписывается через `contain` без искажения.

### PDF отчёта / Report PDF

Производственный отчёт всегда создаётся отдельным A4-документом. Он не добавляется девятой страницей в основной PDF схем.

### Рендер / Rendering

- браузер Canvas отрисовывает кириллицу и стрелки;
- Canvas преобразуется в JPEG;
- `pdf-binary.js` помещает каждый JPEG в отдельный PDF Page/XObject;
- runtime-зависимости, CDN и передача font-файлов отсутствуют.

## Значения первого запуска / Initial defaults

- язык: `ru`;
- исходный лист: `620 × 450`;
- зачистка: `2` мм с каждой стороны;
- поля: `4 / 4 / 2 / 13` мм;
- изделие: A6 `105 × 148`;
- выпуск: `0`;
- режим: `commonCut`;
- дополнительный зазор: `0`;
- PDF схем: A4.
