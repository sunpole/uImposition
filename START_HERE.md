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
- release checkpoint: **`0.6.0-alpha`**;
- implementation Pull Request: **`#10`**;
- этап: **M6 — доказанный минимум физической бумаги**;
- release manifest: `archive/development/0.6.0-alpha/release.json`;
- ожидаемые объекты checkpoint: `release/v0.6.0-alpha`, tag `v0.6.0-alpha`, GitHub prerelease, release news и uNews/Telegram queue;
- фактическое состояние PR, ветки, tag и Release всегда проверить в GitHub перед продолжением;
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
9. `docs/M6_RELEASE_EVIDENCE.md`;
10. `docs/M7_IMPLEMENTATION_PLAN.md`;
11. `docs/TEST_PLAN.md`;
12. `docs/DEVELOPMENT_HISTORY_POLICY.md`;
13. `data/control-case.json`;
14. `data/production-regression-cases.json`;
15. `data/m7-decision-cases.json`;
16. последние Pull Request, GitHub Actions и Releases.

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
- прежние два PDF, `pdfinfo` и Poppler-проверка сохранены;
- три исторических ZIP и общий evidence ZIP сохранены в репозитории;
- release news, короткий Telegram-текст и автоматический GitHub prerelease checkpoint подготовлены.

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
- каждый законченный опубликованный patch получает recovery-ветку, immutable tag, настоящий GitHub Release/prerelease, release news и постоянный архив;
- полезную историю разработки не удалять только потому, что она стала старой.

### Точная точка продолжения после M6

1. Проверить, что PR №10 объединён.
2. Проверить существование `release/v0.6.0-alpha`, tag `v0.6.0-alpha` и GitHub prerelease.
3. Проверить, что патчноут находится в `main` и принят очередью uNews.
4. Создать `m7/0.7.0-alpha` только от окончательного `main`.
5. Начать с чистых модулей целей, профиля приоритетов и лексикографического ранжирования.
6. Затем реализовать свой оборот на контрольном кейсе четырёх A6 1+1 по 4000, Pareto-набор и компактный интерфейс сравнения.

</td>
<td width="50%" valign="top">

## English

### Current state

- repository: `sunpole/uImposition`;
- release checkpoint: **`0.6.0-alpha`**;
- implementation PR: **#10**;
- milestone: **M6 — proven physical-paper minimum**;
- release manifest: `archive/development/0.6.0-alpha/release.json`;
- expected checkpoint objects: rollback branch, immutable tag, actual GitHub prerelease, release news, permanent archive, and uNews/Telegram queue;
- always verify their factual GitHub state before continuing;
- next milestone: **M7 — objective hierarchy, work-and-turn, and Pareto alternatives**.

### Implemented in M6

A pure candidate/demand model, the complete 8,960-candidate one/two-pair control space, automatic valid run construction, independent front/back/report rematerialisation, a proven 3,305-sheet lower-bound solution, explicit 3,395-sheet manual comparison, separate color-plate metrics, production regressions, browser/PDF evidence, a focused Telegram screenshot, permanent historical archives, release news, and automated GitHub prerelease publication.

### Exact continuation point after M6

Verify PR #10, the rollback branch, tag, GitHub prerelease, and uNews queue. Then create `m7/0.7.0-alpha` from final `main` and start with pure objective profiles and lexicographic ranking before implementing the four-A6 1+1 × 4000 work-and-turn case, Pareto alternatives, and the compact comparison interface.

</td>
</tr>
</table>

## Prompt для нового чата / Prompt for a new chat

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/ROADMAP.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/M6_IMPLEMENTATION_PLAN.md, docs/M6_RELEASE_EVIDENCE.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/TEST_PLAN.md, docs/DEVELOPMENT_HISTORY_POLICY.md, data/control-case.json, data/production-regression-cases.json и data/m7-decision-cases.json. Проверь последние PR, GitHub Actions, ветки, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.
Сначала проверь фактическое состояние checkpoint 0.6.0-alpha: PR №10, release/v0.6.0-alpha, tag v0.6.0-alpha, GitHub prerelease, release news и uNews queue.
Если M6 полностью завершён, продолжай M7 только из окончательного main: цели и приоритеты → лексикографическое ранжирование → свой/чужой оборот → Pareto-набор → компактный UI.
```
