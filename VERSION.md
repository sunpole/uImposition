# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущий release checkpoint

**`0.7.0-alpha.4`**  
Дата версии: **26 июля 2026**  
Implementation Pull Request: **№39**  
Этап: **M7.4 — проверяемый свой оборот / work-and-turn**  
Release manifest: `archive/development/0.7.0-alpha.4/release.json`

Фактическое состояние PR, `main`, recovery-ветки, tag и GitHub prerelease проверяется непосредственно в GitHub. Документ не заменяет независимую проверку Release card и assets.

### Что добавлено в M7.4

- отдельные duplex-стратегии `separateFrontBackForms` и `workAndTurn`;
- режимы `только чужой / сравнить оба / только свой`;
- чистая модель одной симметричной общей формы;
- обязательная проверка зеркальной пары страниц одного файла;
- проверка направления и горизонтального переворота;
- независимая материализация готовых front/back пар через существующий duplex validator;
- mode-aware production metrics: отдельные формы `1+1` или одна общая форма `1+0`;
- повторная проверка недопечатки через production report;
- sanitized runtime без raw reports, layouts, pagePairs и halfRows;
- смена разрешённого режима без повторной подготовки геометрии;
- компактный RU/EN-блок сравнения и фактический preview общей формы `4 × 4`;
- focused Chromium evidence и технологическое предупреждение для оператора.

### Проверенный контрольный пример

Четыре разных A6, 2 страницы, `1+1`, по `4000` экземпляров:

| Метрика | Чужой оборот | Свой оборот |
|---|---:|---:|
| Физические листы | 1000 | 1000 |
| Листопрогоны | 2000 | 2000 |
| Layout-формы | 2 | 1 |
| Цветовые пластины | 2 | 1 |
| Недопечатка | 0 | 0 |
| Перетираж | 0 | 0 |

При evidence-прайсе `130 г/м²`, `4 BYN/кг`, `15 BYN` за пластину и `0 BYN` за подготовку:

- чужой оборот: `175,08 BYN`;
- свой оборот: `160,08 BYN`;
- экономия: `15 BYN` — ровно одна цветовая пластина.

Эти цены используются только для regression/evidence и не являются рабочими значениями по умолчанию.

### Технологическая граница

M7.4 подтверждает горизонтальный work-and-turn и фиксированный A6-кейс. Он не заявляет общий автоматический work-and-turn solver для произвольных заказов, вертикальный переворот или автоматическую совместимость с конкретной машиной. Перед производством оператор проверяет захват, боковой упор, приводку и допустимость переворота.

### Что ещё не реализовано

- компактный редактор полного порядка приоритетов и цен;
- итоговая таблица и экспорт выбранного решения;
- automatic mixed-format packing;
- общий work-and-turn search для произвольного набора;
- тетрадный/фальцевальный спуск;
- полный импорт/экспорт и постоянное хранение проекта.

### Следующая целевая версия

**`0.7.0-alpha.5` — M7.5**

Добавить компактный доступный редактор порядка приоритетов и рабочих цен для desktop/mobile без повторной генерации готовых вариантов.

</td>
<td width="50%" valign="top">

## English

### Current release checkpoint

**`0.7.0-alpha.4`**  
Version date: **26 July 2026**  
Implementation Pull Request: **#39**  
Stage: **M7.4 — validated work-and-turn production**  
Release manifest: `archive/development/0.7.0-alpha.4/release.json`

### Added in M7.4

Separate `separateFrontBackForms` and `workAndTurn` strategies, three operator modes, one symmetric shared-plate model, mandatory mirrored page-pair and direction validation, independent materialization through the existing duplex validator, mode-aware production metrics, zero-underproduction production-report checks, a sanitized runtime, mode changes without rebuilding geometry, a compact RU/EN comparison panel, and a factual 4×4 shared-plate preview.

### Verified control example

Four different A6 jobs, 2 pages, 1+1, 4,000 copies each:

| Metric | Separate forms | Work-and-turn |
|---|---:|---:|
| Physical sheets | 1000 | 1000 |
| Press passes | 2000 | 2000 |
| Side-layout forms | 2 | 1 |
| Color plates | 2 | 1 |
| Underproduction | 0 | 0 |
| Overrun | 0 | 0 |

With the evidence profile of 130 gsm, 4 BYN/kg, 15 BYN per plate, and zero layout-preparation cost, work-and-turn saves exactly 15 BYN. These values are not production defaults.

### Technology boundary

M7.4 validates horizontal work-and-turn for the fixed A6 control case. It does not claim a general arbitrary-order solver, vertical turning, or automatic press compatibility. The operator must still verify gripper, side guide, registration, and press constraints.

### Next target version

**`0.7.0-alpha.5` — M7.5**

Add an accessible compact priority-order and production-pricing editor for desktop and mobile without regenerating prepared alternatives.

</td>
</tr>
</table>
