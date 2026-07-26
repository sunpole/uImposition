# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущий release checkpoint

**`0.7.0-alpha.3`**  
Дата версии: **26 июля 2026**  
Implementation Pull Requests: **№20, №25, №26, №27, №28**  
Этап: **M7.3 — реальные Pareto-альтернативы и прозрачный выбор**  
Release manifest: `archive/development/0.7.0-alpha.3/release.json`

Фактическое состояние `main`, recovery-ветки, tag и GitHub prerelease проверяется непосредственно в GitHub.

### Что добавлено в M7.3

- удаление полных дублей и доминируемых решений;
- детерминированный Pareto-frontier;
- обязательные крайние варианты по бумаге, стоимости, формам, пластинам, перетиражу и прогонам;
- компактный materially-different display set без скрытого суммарного score;
- реальные `SolutionMetrics` для compact manual и доказанного paper minimum;
- реальные split orders, fragmentation и число разных заказов на монтаже;
- строгая совместимость валюты, листа, плотности и операторских ставок;
- RU/EN-объяснения преимущества, цены компромисса и решающей цели;
- покомпонентные дельты бумаги, пластин, подготовки layout-форм и итоговой стоимости;
- runtime state/event и компактная read-only панель на основной странице;
- мгновенная смена `Сначала бумага / Сначала стоимость` без повторной генерации монтажей;
- смена базы сравнения без изменения рекомендации;
- focused Chromium evidence реального пользовательского результата.

### Проверенный контрольный результат

| Метрика | Compact manual | Paper minimum |
|---|---:|---:|
| Физические листы | 3395 | 3305 |
| Layout-формы | 8 | 112 |
| Цветовые пластины | 32 | 448 |
| Листопрогоны | 6790 | 6610 |
| Перетираж файлов | 930 | 0 |
| Перетираж пар | 1450 | 10 |
| Разделённые заказы | 2 | 19 |
| Иллюстративная стоимость | 972.5466 BYN | 7199.4894 BYN |

При paper-first рекомендуется `paper-minimum`; при cost-first — `manual-compact`. Исходные производственные решения не пересчитываются.

Контрольный прайс `130 г/м²`, `4 BYN/кг`, `15 BYN/пластина` используется только как regression fixture. Реальные цены вводит оператор.

### Что ещё не реализовано

- автоматический свой оборот / work-and-turn;
- полный редактор всех приоритетов;
- полная таблица и экспорт выбранного варианта;
- automatic mixed-format packing;
- тетрадный/фальцевальный спуск;
- импорт/экспорт полного проекта и постоянное хранение.

### Следующая целевая версия

**`0.7.0-alpha.4` — M7.4**

Реализовать технологически проверяемый свой оборот и честно сравнить его с отдельными формами лица и оборота.

</td>
<td width="50%" valign="top">

## English

### Current release checkpoint

**`0.7.0-alpha.3`**  
Version date: **26 July 2026**  
Implementation Pull Requests: **#20, #25, #26, #27, #28**  
Stage: **M7.3 — real Pareto alternatives and transparent choice**  
Release manifest: `archive/development/0.7.0-alpha.3/release.json`

### Added in M7.3

Deterministic duplicate removal and Pareto filtering, required extremes, compact materially different display selection, real compact-manual and paper-minimum `SolutionMetrics`, pricing compatibility checks, RU/EN advantage and tradeoff explanations, component cost deltas, runtime state/events, and a compact main-page panel with instant paper-first/cost-first reranking and reference selection.

### Verified control result

The real control pipeline compares 3,395-sheet / 8-form compact manual against the proven 3,305-sheet / 112-form paper minimum. Paper-first recommends the paper minimum; cost-first recommends compact manual. With the illustrative shared pricing fixture, totals are 972.5466 BYN and 7199.4894 BYN respectively. Production alternatives are not regenerated when priority or reference changes.

### Not implemented yet

Work-and-turn, the full priority editor, the complete selectable/exportable alternatives table, automatic mixed-format packing, folded-signature pagination, and complete-project persistence.

### Next target version

**`0.7.0-alpha.4` — M7.4**

Implement technologically validated work-and-turn and compare it transparently with separate front and back forms.

</td>
</tr>
</table>
