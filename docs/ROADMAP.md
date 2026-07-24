# Дорожная карта / Roadmap

<table>
<tr>
<td width="50%" valign="top">

## Русский

### M0 — завершён

Репозиторий, GitHub Pages, двуязычное ТЗ, лицензия, версия и контрольный набор.

### M1 — `0.1.0-alpha`, завершён

Конфигурация, лист, зачистка, поля, ввод заказов, пары страниц, RU/EN, тесты, Chromium и uNews.  
Точка отката: `release/v0.1.0-alpha`.

### M2 — `0.2.0-alpha`, завершён

Формат изделия, выпуск, общий/раздельный рез, сетки 0°/90°, вместимость и точные пары страниц.  
Точка отката: `release/v0.2.0-alpha`.

### M3 — `0.3.0-alpha`, завершён

Лицо сплошными блоками, автоматически зеркальный оборот, направления, независимая проверка и восемь адаптивных схем.  
Точка отката: `release/v0.3.0-alpha`.

### M4 — `0.4.0-alpha`, завершён

- напечатанное количество каждой пары;
- объяснимые вклады монтажей;
- недопечатка как недопустимый результат;
- перетираж пар и готовых файлов;
- физическая бумага;
- лицевые и оборотные формы;
- листопрогоны;
- независимая проверка производственного отчёта;
- сводка, таблица 20 файлов и детализация 35 пар;
- Node-тесты, desktop/mobile Chromium и uNews.

Контроль: `3395` листов, `8` форм, `6790` листопрогонов, недопечатка `0`, перетираж пар `1450`, файлов `930`.

PR: `#6`. Merge commit: `67be7ba3441e4ab2c21eac22c2c4eee07d5f65f6`.  
Точка отката: `release/v0.4.0-alpha`.  
Подробности: `docs/M4_IMPLEMENTATION_PLAN.md`, `docs/M4_RELEASE_EVIDENCE.md`.

### M5 — `0.5.0-alpha`, следующий активный этап

- чистая модель PDF-документа;
- одна схема на одну страницу;
- детерминированный порядок четырёх лиц и четырёх оборотов;
- A4 и пропорциональный режим;
- отдельный PDF производственного отчёта;
- тесты числа, порядка и содержимого страниц;
- браузерная загрузка готового PDF.

### M6 — минимум бумаги

Генерация кандидатов, автоматический подбор тиражей и объяснение разделённых заказов.

### M7 — несколько целей

Минимум форм, минимум перетиража, пользовательская иерархия и набор Парето.

### M8 — production `1.0.0`

Реальные производственные проверки, граничные случаи, руководство и стабильный GitHub Release.

</td>
<td width="50%" valign="top">

## English

### M0 — complete

Repository, GitHub Pages, bilingual specification, licensing, versioning, and control dataset.

### M1 — `0.1.0-alpha`, complete

Configuration, sheet geometry, trim, margins, order input, page pairs, RU/EN, tests, Chromium, and uNews.  
Rollback: `release/v0.1.0-alpha`.

### M2 — `0.2.0-alpha`, complete

Finished size, bleed, cutting modes, 0°/90° capacity, and exact page pairs.  
Rollback: `release/v0.2.0-alpha`.

### M3 — `0.3.0-alpha`, complete

Contiguous fronts, automatically mirrored backs, directions, independent validation, and eight responsive schemes.  
Rollback: `release/v0.3.0-alpha`.

### M4 — `0.4.0-alpha`, complete

Pair production, explainable contributions, hard underproduction rejection, pair/file overrun, physical sheets, front/back forms, press passes, independent report validation, responsive tables, Node tests, Chromium, and uNews.

Control totals: `3395` sheets, `8` forms, `6790` press passes, `0` underproduction, `1450` pair overrun, and `930` complete-file overrun.

PR: `#6`. Merge commit: `67be7ba3441e4ab2c21eac22c2c4eee07d5f65f6`.  
Rollback: `release/v0.4.0-alpha`.

### M5 — `0.5.0-alpha`, next active milestone

A pure PDF document model, one scheme per page, deterministic ordering of four fronts and four backs, A4/proportional modes, a separate production-report PDF, page-count/content tests, and browser download.

### M6 — paper minimisation

Candidate generation, automatic run assignment, and split-order explanations.

### M7 — multiple objectives

Minimum forms, minimum overrun, user-defined hierarchy, and Pareto alternatives.

### M8 — production `1.0.0`

Real production validation, edge cases, user guide, and a stable GitHub Release.

</td>
</tr>
</table>
