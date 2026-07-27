# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущий version checkpoint

**`0.7.0-alpha.5`**  
Дата версии: **27 июля 2026**  
Функциональные Pull Request: **№44, №45, №46**  
Этап: **M7.5 — пользовательские производственные планы, выбор, экспорт и приоритеты**  
Release manifest после publication PR: `archive/development/0.7.0-alpha.5/release.json`

Фактическое состояние `main`, recovery-ветки, tag и GitHub prerelease проверяется непосредственно в GitHub. Version checkpoint не заменяет publication package и независимую проверку Release card и assets.

### Что добавлено в M7.5

- реальные пользовательские размеры листа и изделия, строки заказов и page pairs подключены к production pipeline;
- для каждой fitting orientation `0°/90°` создаются проверенные plan-family `paperMinimum` и `dedicatedPairForms`;
- каждый план materialize-ится в front/back layouts, проходит независимую validation и production report;
- недопечатка всегда блокирует план;
- считаются физические листы, layout-формы, цветовые пластины, прогоны, перетираж и BYN-себестоимость;
- все допустимые варианты внутри текущей области остаются в lossless-каталоге;
- Pareto, recommended и dominated являются аннотациями, а не удалением;
- оператор может выбрать любой план независимо от рекомендации;
- выбранный план получает реальные схемы, production report, PDF схем и PDF отчёта;
- доступны 11 целей при готовом прайсе, presets, кнопки вверх/вниз и desktop drag-and-drop;
- reranking повторно использует готовые планы и сообщает `regeneratedPlanCount = 0`;
- выбранный оператором план не заменяется новой рекомендацией.

### Проверенный контрольный пример

Три двухстраничных A6 по `100`, общая цветность `4+1`, evidence-прайс:

| Вариант | Листы | Статус |
|---|---:|---|
| `uniform-r90-paper-minimum` | 20 | выбран оператором |
| `uniform-r90-dedicated-pairs` | 21 | рекомендован при cost-first |

Все четыре допустимых плана остаются в каталоге. После переключения приоритета используются повторно `4` готовых плана и строится заново `0`.

Evidence-прайс служит только regression/Chromium-проверке. Рабочие цены вводит оператор.

### Честная граница

Каталог полный только внутри:

```text
один общий формат изделия
× uniform grid
× fitting rotation 0°/90°
× paperMinimum/dedicatedPairForms
× separate front/back forms
× одна общая duplex-цветность
× полные front/back page pairs
```

M7.5 не заявляет общий solver всех монтажей, automatic work-and-turn для пользовательских заказов, mixed-format packing, mixed rotations, индивидуальную геометрию каждой строки, simplex/odd-page production, фальцевальный спуск, прибыльность, persistence или совместимость с конкретной машиной.

### Следующая целевая версия

**`0.7.0-alpha.6` — M7.6**

Компактная lossless-таблица всех вариантов: одна строка на вариант, `Только различия`, точные component deltas, сортировка и фильтры без удаления plan data.

</td>
<td width="50%" valign="top">

## English

### Current version checkpoint

**`0.7.0-alpha.5`**  
Version date: **27 July 2026**  
Functional Pull Requests: **#44, #45, #46**  
Stage: **M7.5 — user production plans, selection, export, and objective priority**

The actual `main`, recovery branch, tag, prerelease, and attached assets must be verified directly in GitHub. A version checkpoint does not replace the publication package.

### Added in M7.5

Real user geometry and order rows now build validated production plans. Each fitting orientation `0°/90°` retains both `paperMinimum` and `dedicatedPairForms` families. Every plan is materialized, validated, independently reported, and rejected on underproduction. The lossless catalog retains feasible plans while Pareto, recommendation, and dominance remain annotations. The operator selects any plan, inspects its real front/back schemes and report, and exports both PDFs. Eleven objectives, presets, arrow controls, and desktop drag-and-drop rerank the same plan objects without regenerating geometry or replacing explicit selection.

### Verified control result

For three two-page A6 jobs of 100 copies at `4+1`, paper-first keeps the 20-sheet plan selected while cost-first recommends the 21-sheet dedicated plan. Four prepared plans are reused and zero plans are regenerated.

### Scope boundary

Completeness applies only to one shared product format, uniform grids at `0°/90°`, two plan families, separate front/back forms, one shared duplex color specification, and complete page pairs. No global all-impositions claim is made.

### Next target

**`0.7.0-alpha.6` — M7.6:** compact lossless comparison table with differences-only mode, component deltas, and view-only sorting/filtering.

</td>
</tr>
</table>
