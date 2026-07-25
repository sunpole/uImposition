# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущая версия кандидата

**`0.6.0-alpha`**  
Дата версии: **25 июля 2026**  
Ветка: **`m6/0.6.0-alpha`**  
Pull Request: **№10**  
Этап: **M6 — доказанный минимум физической бумаги**

### Что работает

- весь проверенный функционал M1–M5;
- чистая модель кандидата и неизменяемого остаточного спроса;
- отдельные `T_first` и `T_complete`;
- точный контрольный набор из `8960` полных кандидатов с 1–2 парами;
- явное сообщение об усечении для слишком большого пространства;
- автоматическая конструкция допустимых тиражей;
- повторная материализация лица, зеркального оборота и production report;
- доказанный бумажный минимум `3305` листов;
- интерфейс сравнения с ручной раскладкой `3395` листов;
- предупреждение о росте layout-форм `8 → 112`;
- отдельный учёт цветовых пластин 4+4;
- проверка заданного mixed-format duplex;
- regression-кейсы A6 landscape/portrait и A5 `400/700/4200`;
- прежние два PDF и их Chromium/Poppler-проверка сохранены;
- отдельный крупный screenshot панели M6 для Telegram;
- постоянный архив разработки и автоматическая публикация GitHub prerelease.

### Проверенный контрольный результат M6

```text
Сумма требуемых пар: 52870
Вместимость листа:   16
Нижняя граница:      ceil(52870 / 16) = 3305
Построенный вариант: 3305
```

- физическая бумага: `3305`;
- экономия относительно ручного варианта: `90` листов (`2,65%`);
- монтажи: `56`;
- layout-формы: `112`;
- листопрогоны: `6610`;
- недопечатка: `0`;
- перетираж пар: `10`;
- перетираж готовых файлов: `0`.

Допустимый вариант достигает универсальной нижней границы, поэтому `3305` — доказанный глобальный минимум физической бумаги для контрольного uniform-grid входа. Это не минимум форм.

### Дополнительные regression-кейсы

- A6 `148×105`, 32 страницы, 4+4: `4×4`, один тираж 1000;
- A6 `105×148`, 32 страницы, 4+4: поворот 90°, `4×4`;
- `1×A4 + 2×A5 + 8×A6` на одном зеркальном duplex-листе;
- A5, 8 позиций, тиражи `400 / 700 / 4200`: минимум `663`, перетираж `4`;
- один монтаж 4+4: `2` layout-формы, `8` цветовых пластин.

### Ещё не реализовано

- автоматическая упаковка смешанных форматов;
- минимум форм и многокритериальный компромисс;
- набор Парето;
- тетрадный/фальцевальный спуск полос;
- импорт/экспорт полного проекта и постоянное хранение.

### Следующая целевая версия

**`0.7.0-alpha` — M7**

Сократить число форм и показать многокритериальный набор вариантов между бумагой, формами и перетиражем.

</td>
<td width="50%" valign="top">

## English

### Current candidate version

**`0.6.0-alpha`**  
Version date: **25 July 2026**  
Branch: **`m6/0.6.0-alpha`**  
Pull Request: **#10**  
Stage: **M6 — proven physical-paper minimum**

### Working now

All verified M1–M5 functionality plus a pure candidate/demand model, exact first/completion event runs, the complete 8,960-candidate one/two-pair control space, automatic valid run construction, independent front/back/report rematerialisation, a proven 3,305-sheet paper minimum, explicit manual comparison, separate 4+4 plate metrics, fixed mixed-format duplex validation, additional A6/A5 production regressions, a focused Telegram screenshot, a permanent development archive, and automatic GitHub prerelease publication.

### Verified M6 result

The universal capacity lower bound is `ceil(52870 / 16) = 3305`. The constructed valid solution reaches 3305, proving the global physical-paper minimum for the control uniform-grid input. It uses 56 impositions, 112 side-layout forms, 6,610 press passes, zero underproduction, 10 pair overrun, and zero complete-file overrun.

### Not implemented yet

Automatic mixed-format packing, form minimisation, multi-objective Pareto alternatives, folded-signature pagination, and complete-project persistence.

### Next target version

**`0.7.0-alpha` — M7**

Reduce form count and present multi-objective trade-offs across paper, forms, and overrun.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила.

## Релизы и откат / Releases and rollback

`0.6.0-alpha` пока является проверяемым кандидатом в PR №10. После объединения автоматически создаются recovery-ветка `release/v0.6.0-alpha`, tag `v0.6.0-alpha` и настоящий GitHub **prerelease** с release notes, крупным PNG и ZIP доказательств. Патчноут и изображение одновременно входят в очередь uNews/Telegram.