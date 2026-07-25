# Дорожная карта / Roadmap

<table>
<tr>
<td width="50%" valign="top">

## Русский

### M0–M5 — завершены

- M0: репозиторий, ТЗ, лицензия и контрольные данные;
- M1: лист, зачистка, поля, ввод заказов и пары страниц;
- M2: изделие, выпуск, сетки 0°/90° и вместимость;
- M3: лицо, автоматически зеркальный оборот и проверка схем;
- M4: производство, бумага, формы, листопрогоны и отчёт;
- M5: два PDF, Chromium, `pdfinfo` и Poppler.

Точки отката: `release/v0.1.0-alpha` … `release/v0.5.0-alpha`.

### M6 — `0.6.0-alpha`, текущий кандидат

- чистая модель кандидата и остаточного спроса;
- отдельные событийные тиражи `T_first` и `T_complete`;
- полный контрольный набор `8960` кандидатов с 1–2 парами;
- автоматическая конструкция допустимых тиражей;
- независимая материализация лица, оборота и production report;
- доказанный минимум физической бумаги `3305` листов;
- сравнение с ручными `3395` листами;
- предупреждение о росте layout-форм `8 → 112`;
- отдельный учёт цветовых пластин 4+4;
- regression-кейсы A6 landscape/portrait, mixed A4/A5/A6 и A5 `400/700/4200`;
- desktop/mobile Chromium evidence.

PR: `#10`. После объединения создаётся точка отката `release/v0.6.0-alpha`.

### M7 — `0.7.0-alpha`, решения оператора

#### M7.1 — изменяемая иерархия

- перетаскиваемый порядок целей;
- кнопки вверх/вниз для мобильного режима;
- лексикографическое сравнение;
- мгновенная пересортировка уже найденных вариантов;
- жёсткие ограничения нельзя перемещать или отключать.

Приоритеты включают:

- бумагу;
- layout-формы;
- цветовые пластины;
- два вида перетиража;
- листопрогоны;
- разделённые заказы;
- количество монтажей;
- компактность производственной раскладки.

#### M7.2 — свой и чужой оборот

- сравнение обоих технологических режимов;
- фильтры `только чужой / оба / только свой`;
- отдельное объяснение бумаги, форм, пластин, прогонов и операции переворота;
- контрольный кейс: четыре A6 1+1, 2 страницы, по 4000;
- в контрольном кейсе свой оборот сохраняет `1000` листов и `2000` прогонов, но сокращает layout-формы и цветовые пластины `2 → 1`.

#### M7.3 — все существенно разные варианты

- минимум бумаги;
- минимум форм;
- минимум пластин;
- минимум перетиража;
- минимум прогонов;
- удобная сборка;
- лучший свой оборот;
- лучший чужой оборот;
- рекомендуемый вариант по текущей иерархии;
- полный раскрываемый Pareto-набор без доминируемых дублей.

Для каждого варианта показываются точные дельты: что стало лучше, что стало хуже, где возник перетираж и какие заказы разделены.

#### M7.4 — компактный интерфейс

- плотная таблица вместо множества крупных карточек;
- основные метрики в одной строке;
- закреплённая компактная панель приоритетов;
- режим `Только различия`;
- детали и схемы раскрываются по одной;
- мобильный интерфейс не дублирует длинные пояснения.

Подробности: `docs/M7_IMPLEMENTATION_PLAN.md`.

### M8 — production `1.0.0`

Реальные производственные проверки, граничные случаи, руководство, импорт/экспорт проекта, постоянное хранение и стабильный GitHub Release.

</td>
<td width="50%" valign="top">

## English

### M0–M5 — complete

Repository/specification, geometry, exact pairs, validated front/back schemes, production reporting, two PDFs, Chromium, `pdfinfo`, and Poppler.

### M6 — `0.6.0-alpha`, current candidate

Pure candidate/demand models, the complete 8,960-candidate control space, automatic valid run construction, independent production rematerialisation, a proven 3,305-sheet physical-paper minimum, explicit 3,395-sheet manual comparison, separate color-plate metrics, production regressions, and desktop/mobile Chromium evidence.

### M7 — `0.7.0-alpha`, operator decision system

- drag-and-drop objective hierarchy with instant re-ranking;
- explicit work-and-back versus work-and-turn comparison;
- a four-A6 1+1 × 4000 work-and-turn control case;
- paper, side-layout forms, color plates, passes, overrun, split-order, and layout-compactness metrics;
- recommended, extreme, and full non-dominated Pareto alternatives;
- exact better/worse deltas for every option;
- a compact desktop/mobile comparison interface.

Details: `docs/M7_IMPLEMENTATION_PLAN.md`.

### M8 — production `1.0.0`

Real production validation, edge cases, user guide, project persistence/import/export, and a stable GitHub Release.

</td>
</tr>
</table>
