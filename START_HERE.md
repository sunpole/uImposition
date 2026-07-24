# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> First entry point for a new conversation, device, or developer.

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Как продолжается разработка

GitHub является единственным источником истины. Разработка ведётся в отдельных ветках и Pull Request, а результат проверяется GitHub Actions, настоящим Chromium и GitHub Pages. Терминал и локальный компьютер необязательны.

### Текущее состояние

- репозиторий: `sunpole/uImposition`;
- сайт: `https://sunpole.github.io/uImposition/`;
- релиз-кандидат: ветка `m4/0.4.0-alpha`, PR №6;
- версия кандидата: **`0.4.0-alpha`**;
- завершённый функциональный этап: **M4 — производственные итоги и отчёт**;
- следующая версия после объединения: **`0.5.0-alpha`**;
- следующий этап: **M5 — PDF-экспорт**;
- текущая точка отката в `main`: `release/v0.3.0-alpha`;
- после объединения M4 создаётся `release/v0.4.0-alpha`.

### Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/ROADMAP.md`;
6. `docs/TECHNICAL_SPECIFICATION_RU.md`;
7. `docs/ARCHITECTURE.md`;
8. `docs/M4_IMPLEMENTATION_PLAN.md`;
9. `data/control-case.json`;
10. `data/control-layout-m3.json`;
11. последние Pull Request и GitHub Actions.

### Что реализовано в M4

- `src/production-metrics.js` — напечатано, недопечатка, перетираж, бумага, формы и листопрогоны;
- `src/production-validation.js` — независимая проверка арифметики и жёстких ограничений;
- `src/production-report.js` — проверяемая модель производственного отчёта;
- `src/production-report-renderer.js` — DOM-отрисовка готового отчёта;
- сводка из шести метрик;
- таблица по 20 файлам;
- детализация по 35 печатным парам;
- desktop/mobile Chromium-проверки.

### Проверенный контрольный результат

- физическая бумага: `3395`;
- формы: `4` лица + `4` оборота = `8`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- перетираж печатных пар: `1450`;
- перетираж готовых файлов: `930`.

Тиражи монтажей `1500`, `1100`, `450`, `345` остаются ручным контрольным входом. Автоматический подбор и доказанный минимум бумаги ещё не реализованы.

### Главные правила

- сначала читать GitHub, а не историю чата;
- не менять функциональный milestone напрямую в `main`;
- формулы держать в чистых модулях, UI использовать только для отображения;
- оборот всегда выводить из лица;
- недопечатку считать недопустимой;
- не называть ручной вариант глобальным минимумом;
- версию завершать только после Actions, Chromium, uNews и проверки результата;
- alpha-вехе создавать recovery-ветку, но не настоящий GitHub Release.

### Точная точка продолжения

После объединения PR №6 начать M5 в новой ветке `m5/0.5.0-alpha` от проверенного `main`.

Первый безопасный шаг M5: спроектировать DOM-независимую модель PDF-документа и тесты, которые гарантируют одну схему на страницу, правильный порядок восьми схем и отдельный производственный отчёт. Только после этого подключать библиотеку или браузерную генерацию PDF.

</td>
<td width="50%" valign="top">

## English

### Development model

GitHub is the single source of truth. Development uses feature branches and Pull Requests, with GitHub Actions, factual Chromium screenshots, and GitHub Pages as verification. A local terminal is optional.

### Current state

- repository: `sunpole/uImposition`;
- website: `https://sunpole.github.io/uImposition/`;
- release candidate: branch `m4/0.4.0-alpha`, PR #6;
- candidate version: **`0.4.0-alpha`**;
- completed functional milestone: **M4 — production totals and report**;
- next version after merge: **`0.5.0-alpha`**;
- next milestone: **M5 — PDF export**;
- current rollback point in `main`: `release/v0.3.0-alpha`;
- `release/v0.4.0-alpha` is created after the M4 merge.

### Implemented in M4

Pure production metrics, independent validation, a DOM-free report model, a DOM-only renderer, six summary metrics, a 20-file table, 35-pair details, and desktop/mobile Chromium verification.

### Verified control result

Physical sheets `3395`; forms `8`; press passes `6790`; underproduction `0`; pair overrun `1450`; complete-file overrun `930`.

The four run lengths remain verified manual input, not optimizer output or a proven global minimum.

### Exact continuation point

After PR #6 is merged, start M5 in `m5/0.5.0-alpha` from verified `main`. First design a DOM-independent PDF document model and tests for one scheme per page, correct ordering of all eight schemes, and a separate production report. Integrate PDF generation only after those tests pass.

</td>
</tr>
</table>

## Prompt для нового чата / Prompt for a new chat

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/ROADMAP.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/M4_IMPLEMENTATION_PLAN.md, data/control-case.json и data/control-layout-m3.json. Проверь последние PR и GitHub Actions.

GitHub — единственный источник истины. Не требуй локальный клон.
Если PR №6 ещё открыт — заверши его проверки, uNews, merge и recovery-ветку release/v0.4.0-alpha.
Если M4 уже объединён — начни M5 в ветке m5/0.5.0-alpha: сначала чистая модель PDF и тесты, затем генерация, UI, Chromium, uNews и recovery-ветка.
```
