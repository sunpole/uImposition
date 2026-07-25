# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущий release checkpoint

**`0.6.0-alpha`**  
Дата версии: **25 июля 2026**  
Implementation Pull Request: **№10**  
Этап: **M6 — доказанный минимум физической бумаги**  
Release manifest: `archive/development/0.6.0-alpha/release.json`

Фактическое состояние PR, `main`, rollback-ветки, tag и GitHub prerelease проверяется непосредственно в GitHub; документ не хранит переходный статус `draft/open/merged`.

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
- release news и короткий Telegram-текст;
- три исторических Action ZIP и общий evidence ZIP сохранены в репозитории;
- автоматическая публикация rollback-ветки, immutable tag и GitHub prerelease после входа manifest в `main`.

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
- автоматический свой оборот;
- тетрадный/фальцевальный спуск полос;
- импорт/экспорт полного проекта и постоянное хранение.

### Следующая целевая версия

**`0.7.0-alpha` — M7**

Сократить число форм, добавить изменяемую иерархию, свой/чужой оборот и показать многокритериальный набор вариантов между бумагой, формами и перетиражем.

</td>
<td width="50%" valign="top">

## English

### Current release checkpoint

**`0.6.0-alpha`**  
Version date: **25 July 2026**  
Implementation PR: **#10**  
Stage: **M6 — proven physical-paper minimum**  
Release manifest: `archive/development/0.6.0-alpha/release.json`

The factual PR, main, rollback branch, tag, and GitHub prerelease state is verified directly in GitHub rather than stored as transient draft/open/merged wording in this document.

### Working now

All verified M1–M5 functionality plus a pure candidate/demand model, exact first/completion event runs, the complete 8,960-candidate one/two-pair control space, automatic valid run construction, independent front/back/report rematerialisation, a proven 3,305-sheet paper minimum, explicit manual comparison, separate 4+4 plate metrics, fixed mixed-format duplex validation, additional A6/A5 production regressions, a focused Telegram screenshot, permanent historical archives, release news, and automatic rollback branch/tag/GitHub prerelease publication.

### Verified M6 result

The universal capacity lower bound is `ceil(52870 / 16) = 3305`. The constructed valid solution reaches 3305, proving the global physical-paper minimum for the control uniform-grid input. It uses 56 impositions, 112 side-layout forms, 6,610 press passes, zero underproduction, 10 pair overrun, and zero complete-file overrun.

### Not implemented yet

Automatic mixed-format packing, form minimisation, objective reordering, work-and-turn, multi-objective Pareto alternatives, folded-signature pagination, and complete-project persistence.

### Next target version

**`0.7.0-alpha` — M7**

Reduce form count, add objective ordering and work-and-turn/work-and-back comparison, and present multi-objective trade-offs across paper, forms, and overrun.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила;
- `archive/development/0.6.0-alpha/release.json` — machine-readable release checkpoint.

## Релизы и откат / Releases and rollback

Checkpoint `0.6.0-alpha` определяет recovery-ветку `release/v0.6.0-alpha`, immutable tag `v0.6.0-alpha` и настоящий GitHub **prerelease** с release notes, крупным PNG и ZIP доказательств. Патчноут и изображение одновременно входят в очередь uNews/Telegram. Их фактическое существование проверяется через GitHub после merge.