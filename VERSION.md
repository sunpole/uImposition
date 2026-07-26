# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущий release checkpoint

**`0.7.0-alpha.3`**  
Дата версии: **26 июля 2026**  
Implementation Pull Requests: **№20, №25, №26, №27, №28**  
Этап: **M7.3 — реальные Pareto-варианты и объяснение компромиссов**  
Release manifest: `archive/development/0.7.0-alpha.3/release.json`

Фактическое состояние PR, `main`, rollback-ветки, tag и GitHub prerelease проверяется непосредственно в GitHub; документ не хранит переходный статус `draft/open/merged`.

### Что добавлено в M7.3

- строгая модель Pareto-frontier с удалением полных дублей и доминируемых решений;
- компактный набор существенно разных вариантов с закреплённой рекомендацией и обязательными крайними решениями;
- реальный compact manual из production report и доказанный paper minimum из paper minimizer;
- общая guarded-модель `SolutionMetrics` для обоих вариантов;
- мгновенная смена первого приоритета `Физическая бумага / Расчётная стоимость` без повторной генерации монтажей;
- выбор reference-варианта для точного сравнения;
- RU/EN-объяснения преимущества, цены компромисса и решающей цели;
- отдельные денежные дельты: бумага, цветовые пластины, подготовка layout-форм и итог;
- денежное сравнение только при общем совместимом прайсе;
- read-only панель реальных альтернатив на основной странице;
- очищенный runtime event без сырых layouts, candidates, planned runs и paper solution;
- focused Chromium-сценарий реального cost-first выбора.

### Проверенный контрольный пример

Прайс используется только как regression/evidence-пример, а не как рабочее значение по умолчанию:

```text
исходный лист:  620 × 450 мм
плотность:      130 г/м²
бумага:         4 BYN/кг
цветовая форма: 15 BYN
```

| Приоритет | Рекомендация | Листы | Layout-формы | Пластины | Итог |
|---|---|---:|---:|---:|---:|
| Бумага | Минимум бумаги | 3305 | 112 | 448 | 7199,49 BYN |
| Стоимость | Компактный ручной | 3395 | 8 | 32 | 972,55 BYN |

Минимум бумаги экономит `90` физических листов, но при контрольном прайсе дороже на `6226,94 BYN`. Программа показывает обе стороны компромисса и оставляет окончательное решение оператору.

### Что было добавлено в M7.2

- единая нормализованная модель `SolutionMetrics`;
- рабочий ввод плотности, цены бумаги BYN/кг, цены цветовой формы и подготовки layout-форм;
- статусы `pricing incomplete / pricing inputs ready / pricing ready`;
- production report → реальная BYN-стоимость решения;
- защита от `null → 0`, недопечатки и несовместимой денежной базы.

### Что ещё не реализовано

- автоматический свой оборот / work-and-turn;
- полный редактор всех приоритетов;
- полная таблица и экспорт выбранного варианта;
- автоматическая упаковка смешанных форматов;
- тетрадный/фальцевальный спуск полос;
- импорт/экспорт полного проекта и постоянное хранение.

### Следующая целевая версия

**`0.7.0-alpha.4` — M7.4**

Добавить проверяемый свой оборот / work-and-turn и сравнить его с отдельными формами лица и оборота на контрольном кейсе четырёх A6 1+1 по 4000 экземпляров.

</td>
<td width="50%" valign="top">

## English

### Current release checkpoint

**`0.7.0-alpha.3`**  
Version date: **26 July 2026**  
Implementation Pull Requests: **#20, #25, #26, #27, #28**  
Stage: **M7.3 — real Pareto alternatives and transparent tradeoffs**  
Release manifest: `archive/development/0.7.0-alpha.3/release.json`

### Added in M7.3

A strict Pareto-frontier model, compact materially-different alternative selection, real compact-manual and proven paper-minimum solutions, shared guarded `SolutionMetrics`, instant paper/cost re-ranking without regenerating impositions, selectable comparison references, RU/EN benefit/tradeoff/deciding-objective explanations, compatible component-cost deltas, a sanitized runtime event, and a compact read-only alternatives panel on the main page.

### Verified control example

With the illustrative 620×450 mm source sheet, 130 gsm paper, 4 BYN/kg paper, and 15 BYN per color plate, paper-first recommends the 3,305-sheet solution while cost-first recommends the compact 3,395-sheet / 8-form solution. The paper minimum saves 90 sheets but costs 6,226.94 BYN more under this evidence pricing profile. These prices are not production defaults.

### Not implemented yet

Validated work-and-turn, the full priority editor, the final alternatives table and selected-solution export, automatic mixed-format packing, folded-signature pagination, and complete-project persistence.

### Next target version

**`0.7.0-alpha.4` — M7.4**

Add validated work-and-turn production and compare it with separate front/back forms using the four-A6 1+1 control case.

</td>
</tr>
</table>
