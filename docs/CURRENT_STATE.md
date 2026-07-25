# Текущее состояние / Current State

Последнее обновление: **25 июля 2026**  
Last updated: **25 July 2026**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Версия и ветки

- `main`: **`0.5.0-alpha`**;
- рабочая ветка: **`m6/0.6.0-alpha`**;
- Pull Request: **№10**, draft;
- кандидат версии: **`0.6.0-alpha`**;
- завершённые публичные этапы: M0–M5;
- M6 функционально реализован и проходит проверки в PR;
- следующий этап после объединения: M7;
- точки отката: `release/v0.1.0-alpha` … `release/v0.5.0-alpha`.

### Что реально работает в кандидате M6

1. Геометрия листа, зачистка и непечатные поля.
2. Формат изделия, выпуск, общий и раздельный рез.
3. Сетки 0°/90° и максимальная вместимость.
4. Ввод заказов и точные пары страниц.
5. Проверенные лица и автоматически зеркальные обороты.
6. Производственные итоги по парам и файлам.
7. Физическая бумага, layout-формы, листопрогоны и запрет недопечатки.
8. Отдельный PDF схем и отдельный PDF отчёта.
9. Чистая модель кандидата и неизменяемого спроса.
10. Полный контрольный набор `8960` кандидатов с одной или двумя парами.
11. Автоматическая конструкция допустимого решения.
12. Доказанный минимум физической бумаги `3305` листов.
13. Сравнение с ручным вариантом `3395` листов.
14. Явный компромисс: layout-формы `8 → 112`.
15. Отдельный учёт цветовых пластин 4+4.
16. Regression-кейсы A6 landscape/portrait, mixed A4/A5/A6 и A5 `400/700/4200`.
17. Node, Chromium, `pdfinfo`, Poppler и ручная визуальная проверка.

### Проверенный результат M6

```text
Требуемое количество пар: 52870
Вместимость листа:        16
Нижняя граница:           ceil(52870 / 16) = 3305
Построенный вариант:      3305
```

- бумага: `3305`;
- экономия: `90` листов;
- монтажи: `56`;
- layout-формы: `112`;
- листопрогоны: `6610`;
- недопечатка: `0`;
- перетираж пар: `10`;
- перетираж готовых файлов: `0`.

### Что ещё не реализовано

- пользовательская перестановка приоритетов в интерфейсе;
- мгновенная пересортировка решений;
- автоматический свой оборот;
- сравнение своего и чужого оборота;
- полный Pareto-набор;
- автоматический mixed-format packing;
- тетрадный/фальцевальный спуск;
- постоянное хранение полного проекта.

### Следующий безопасный шаг — M7

M7 начинается только после объединения и точки отката M6. Сначала создаются чистые модели целей, профиля решений и лексикографического ранжирования. Затем добавляется свой оборот на контрольном кейсе:

```text
4 разных A6
2 страницы
1+1
по 4000 экземпляров
```

Чужой и свой оборот должны оба дать `1000` физических листов и `2000` листопрогонов. Свой оборот должен уменьшить layout-формы и цветовые пластины `2 → 1`. Пользователь видит оба варианта, точные дельты и технологическое предупреждение.

Подробности: `docs/M7_IMPLEMENTATION_PLAN.md`.  
Машинный fixture: `data/m7-decision-cases.json`.

</td>
<td width="50%" valign="top">

## English

### Version and branches

- `main`: **`0.5.0-alpha`**;
- working branch: **`m6/0.6.0-alpha`**;
- draft PR: **#10**;
- candidate version: **`0.6.0-alpha`**;
- M6 is functionally implemented and verified in the PR;
- M7 begins after merge and the `release/v0.6.0-alpha` rollback point.

### Verified M6 candidate

A complete 8,960-candidate control space, automatic valid run construction, a proven 3,305-sheet physical-paper minimum, 56 impositions, 112 side-layout forms, 6,610 passes, zero underproduction, 10 pair overrun, zero file overrun, separate color-plate metrics, production regressions, and browser/PDF verification.

### Not implemented yet

Interactive objective ordering, instant re-ranking, automatic work-and-turn, work-and-back/work-and-turn comparison, a full Pareto set, automatic mixed-format packing, folded-signature pagination, and complete-project persistence.

### Next safe step — M7

Implement pure objective/ranking models first, then the four-A6 1+1 × 4000 work-and-turn case. Both duplex strategies must use 1,000 sheets and 2,000 passes; work-and-turn must reduce side-layout forms and color plates from two to one while remaining an explicit operator choice.

Details: `docs/M7_IMPLEMENTATION_PLAN.md`.  
Fixture: `data/m7-decision-cases.json`.

</td>
</tr>
</table>
