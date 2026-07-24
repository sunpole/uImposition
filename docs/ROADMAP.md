# Дорожная карта / Roadmap

<table>
<tr>
<td width="50%" valign="top">

## Русский

### M0 — завершён

- репозиторий и GitHub Pages;
- двуязычное ТЗ;
- лицензия и коммерческое направление;
- версия и контрольный набор.

### M1 — `0.1.0-alpha`, завершён

- центральный `config.js`;
- панель настроек;
- реальные пресеты;
- зачистка и поля;
- ввод заказов;
- подсчёт печатных пар;
- RU/EN;
- тесты;
- реальные release screenshots;
- интеграция uNews.

Точка отката: `release/v0.1.0-alpha`.

### M2 — `0.2.0-alpha`, завершён

- формат изделия и выпуск;
- зазор/общий рез;
- размещение 0° и 90°;
- строки, столбцы и число позиций;
- выбор лучшей сетки;
- нумерованная схема вместимости;
- точные пары исходных страниц;
- GitHub Actions, Chromium screenshots и uNews.

Точка отката: `release/v0.2.0-alpha`.

### M3 — `0.3.0-alpha`, завершён

- чистое модульное заполнение лица сплошными блоками;
- автоматическое зеркало оборота без независимой группировки;
- преобразование стрелок при перевороте листа;
- независимая проверка файла, pair-id, страниц, координат и направлений;
- схемы `ЛИСТ-N_ЛИЦО` и `ЛИСТ-N_ОБОРОТ`;
- рамочные desktop/mobile карточки;
- 4 лица и 4 оборота контрольного примера;
- отдельные контрольные данные и тесты;
- реальные Chromium screenshots и патчноут uNews.

После объединения создаётся точка отката: `release/v0.3.0-alpha`.

Подробный план и критерии: `docs/M3_IMPLEMENTATION_PLAN.md`.

### M4 — `0.4.0-alpha`, следующий активный этап

- напечатанное количество по каждой паре страниц;
- недопечатка как недопустимый результат;
- перетираж по файлам и парам;
- количество лицевых и оборотных форм;
- физическая бумага;
- листопрогоны;
- проверяемый производственный отчёт;
- чистые расчётные модули и Node-тесты до подключения UI.

### M5 — PDF

- одна схема на страницу;
- A4 и пропорциональный режим;
- отдельный PDF отчёта.

### M6 — минимум бумаги

- генерация кандидатов;
- подбор тиражей;
- объяснение разделённых заказов.

### M7 — несколько целей

- минимум форм;
- минимум перетиража;
- иерархия пользователя;
- набор Парето.

### M8 — production `1.0.0`

- реальные производственные проверки;
- граничные случаи;
- руководство;
- стабильный GitHub Release.

</td>
<td width="50%" valign="top">

## English

### M0 — complete

- repository and GitHub Pages;
- bilingual specification;
- licensing and commercial direction;
- versioning and control dataset.

### M1 — `0.1.0-alpha`, complete

- central `config.js`;
- settings panel;
- real presets;
- trim and margins;
- order input;
- print-pair totals;
- RU/EN;
- tests;
- factual release screenshots;
- uNews integration.

Rollback checkpoint: `release/v0.1.0-alpha`.

### M2 — `0.2.0-alpha`, complete

- finished size and bleed;
- gap/common cut;
- 0° and 90° placement;
- rows, columns, and position count;
- best-grid selection;
- numbered capacity scheme;
- exact source-page pairs;
- GitHub Actions, Chromium screenshots, and uNews.

Rollback checkpoint: `release/v0.2.0-alpha`.

### M3 — `0.3.0-alpha`, complete

- pure contiguous front-block assignment;
- automatic mirrored back with no independent grouping;
- direction transformation for the sheet turn;
- independent file, pair-id, page, coordinate, and direction validation;
- `SHEET-N_FRONT` and `SHEET-N_BACK` schemes;
- bordered desktop/mobile cards;
- four control fronts and four backs;
- dedicated control data and tests;
- factual Chromium screenshots and a uNews patchnote.

Rollback checkpoint created after merge: `release/v0.3.0-alpha`.

Detailed plan and criteria: `docs/M3_IMPLEMENTATION_PLAN.md`.

### M4 — `0.4.0-alpha`, next active milestone

- produced quantity for every page pair;
- underproduction as an invalid result;
- overrun by file and pair;
- front and back plate/form counts;
- physical paper;
- press passes;
- a validated production report;
- pure calculation modules and Node tests before UI integration.

### M5 — PDF

- one scheme per page;
- A4 and proportional modes;
- separate report PDF.

### M6 — paper minimisation

- candidate generation;
- run assignment;
- split-job explanations.

### M7 — multiple objectives

- minimum plates;
- minimum overrun;
- user hierarchy;
- Pareto set.

### M8 — production `1.0.0`

- real production validation;
- edge cases;
- user guide;
- stable GitHub Release.

</td>
</tr>
</table>
