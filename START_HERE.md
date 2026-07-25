# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> First entry point for a new conversation, device, or developer.

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущее состояние

- репозиторий: `sunpole/uImposition`;
- сайт: `https://sunpole.github.io/uImposition/`;
- основная ветка: `main`, публичная версия пока `0.5.0-alpha`;
- рабочая ветка: `m6/0.6.0-alpha`;
- Pull Request: `#10`, draft до финальных проверок;
- кандидат версии: **`0.6.0-alpha`**;
- этап: **M6 — доказанный минимум физической бумаги**;
- после merge создаётся `release/v0.6.0-alpha`;
- следующий этап: **M7 — иерархия решений, свой оборот и Pareto-варианты**.

### Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/ROADMAP.md`;
6. `docs/TECHNICAL_SPECIFICATION_RU.md`;
7. `docs/ARCHITECTURE.md`;
8. `docs/M6_IMPLEMENTATION_PLAN.md`;
9. `docs/M7_IMPLEMENTATION_PLAN.md`;
10. `docs/TEST_PLAN.md`;
11. `data/control-case.json`;
12. `data/production-regression-cases.json`;
13. `data/m7-decision-cases.json`;
14. последние Pull Request и GitHub Actions.

### Что реализовано в M6

- чистая модель кандидата и остаточного спроса;
- отдельные `T_first` и `T_complete`;
- полный набор `8960` контрольных кандидатов с 1–2 парами;
- автоматическая конструкция тиражей без недопечатки;
- повторная материализация лиц, оборотов и production report;
- доказанный минимум физической бумаги `3305` листов;
- сравнение с ручными `3395` листами;
- экономия `90` листов;
- перетираж пар `10`, готовых файлов `0`;
- явный компромисс layout-форм `8 → 112`;
- отдельный учёт цветовых пластин 4+4;
- regression-тесты обеих ориентаций A6, mixed A4/A5/A6 и A5 `400/700/4200`;
- desktop/mobile Chromium и фокусный снимок панели M6 для Telegram;
- прежние два PDF, `pdfinfo` и Poppler-проверка сохранены.

### Проверенный контрольный результат

```text
Требуемое количество пар: 52870
Вместимость листа:        16
Нижняя граница:           ceil(52870 / 16) = 3305
Построенный вариант:      3305
```

- физическая бумага: `3305`;
- монтажи: `56`;
- layout-формы: `112`;
- листопрогоны: `6610`;
- недопечатка: `0`;
- перетираж пар: `10`;
- перетираж готовых файлов: `0`.

### Главные правила

- GitHub — единственный источник истины;
- функциональные этапы не писать напрямую в `main`;
- жёсткие ограничения выше пользовательских приоритетов;
- недопечатку считать недопустимой;
- минимум бумаги не называть минимумом форм;
- mixed-format manual validation не выдавать за automatic packing;
- 32-страничную последовательную модель пар не выдавать за тетрадный спуск;
- alpha-вехе создавать recovery-ветку без настоящего GitHub Release.

### Точная точка продолжения после M6

Создать `m7/0.7.0-alpha` от окончательного `main` после merge и recovery-ветки M6.

Первый безопасный шаг: чистые модули целей, профиля приоритетов и лексикографического ранжирования. Затем — свой оборот на контрольном кейсе четырёх A6 1+1 по 4000, Pareto-набор и компактный интерфейс сравнения.

</td>
<td width="50%" valign="top">

## English

### Current state

- repository: `sunpole/uImposition`;
- public `main`: `0.5.0-alpha` until PR #10 merges;
- candidate branch: `m6/0.6.0-alpha`;
- candidate version: **`0.6.0-alpha`**;
- milestone: **M6 — proven physical-paper minimum**;
- next milestone: **M7 — objective hierarchy, work-and-turn, and Pareto alternatives**.

### Implemented in M6

A pure candidate/demand model, the complete 8,960-candidate one/two-pair control space, automatic valid run construction, independent front/back/report rematerialisation, a proven 3,305-sheet lower-bound solution, explicit 3,395-sheet manual comparison, separate color-plate metrics, production regressions, browser evidence, and a focused Telegram feature screenshot.

### Exact continuation point after M6

Create `m7/0.7.0-alpha` from the final merged M6 main. Start with pure objective profiles and lexicographic ranking, then implement the four-A6 1+1 × 4000 work-and-turn case, Pareto alternatives, and the compact comparison interface.

</td>
</tr>
</table>

## Prompt для нового чата / Prompt for a new chat

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/ROADMAP.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/M6_IMPLEMENTATION_PLAN.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/TEST_PLAN.md, data/control-case.json, data/production-regression-cases.json и data/m7-decision-cases.json. Проверь последние PR и GitHub Actions.

GitHub — единственный источник истины. Не требуй локальный клон.
M6 находится в PR №10 как кандидат 0.6.0-alpha. Сначала проверь фактический статус PR, Actions, uNews-патчноут и recovery-ветку.
Если M6 уже объединён, продолжай M7 только из окончательного main: цели и приоритеты → лексикографическое ранжирование → свой/чужой оборот → Pareto-набор → компактный UI.
```
