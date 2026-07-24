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
- основная ветка: `main`;
- текущая версия: **`0.4.0-alpha`**;
- M4 объединён через PR №6;
- merge commit M4: `67be7ba3441e4ab2c21eac22c2c4eee07d5f65f6`;
- завершённый этап: **M4 — производственные итоги и отчёт**;
- следующая версия: **`0.5.0-alpha`**;
- следующий этап: **M5 — PDF-экспорт**;
- точка отката M4: `release/v0.4.0-alpha`.

### Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/ROADMAP.md`;
6. `docs/TECHNICAL_SPECIFICATION_RU.md`;
7. `docs/ARCHITECTURE.md`;
8. `docs/M4_IMPLEMENTATION_PLAN.md`;
9. `docs/M4_RELEASE_EVIDENCE.md`;
10. `data/control-case.json`;
11. `data/control-layout-m3.json`;
12. последние Pull Request и GitHub Actions.

### Что реализовано в M4

- чистая производственная арифметика и независимая валидация;
- напечатано, недопечатка и перетираж по 35 парам;
- готовые тиражи и перетираж по 20 файлам;
- физическая бумага, формы и листопрогоны;
- адаптивный производственный отчёт;
- новый фактический PNG и патчноут uNews.

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
- функциональный milestone не писать напрямую в `main`;
- формулы держать в чистых модулях, UI использовать только для отображения;
- оборот всегда выводить из лица;
- недопечатку считать недопустимой;
- ручной вариант не называть глобальным минимумом;
- версию завершать только после Actions, Chromium, uNews и проверки результата;
- alpha-вехе создавать recovery-ветку без настоящего GitHub Release.

### Точная точка продолжения

Начать M5 в отдельной ветке `m5/0.5.0-alpha` от проверенного `main`.

Первый безопасный шаг: спроектировать DOM-независимую модель PDF-документа и тесты, которые гарантируют одну схему на страницу, правильный порядок восьми схем и отдельный производственный отчёт. Только после этого подключать генерацию PDF.

</td>
<td width="50%" valign="top">

## English

### Current state

- repository: `sunpole/uImposition`;
- website: `https://sunpole.github.io/uImposition/`;
- default branch: `main`;
- current version: **`0.4.0-alpha`**;
- M4 merged through PR #6;
- M4 merge commit: `67be7ba3441e4ab2c21eac22c2c4eee07d5f65f6`;
- completed milestone: **M4 — production totals and report**;
- next version: **`0.5.0-alpha`**;
- next milestone: **M5 — PDF export**;
- M4 rollback point: `release/v0.4.0-alpha`.

### Implemented in M4

Pure production arithmetic and independent validation, pair/file totals, physical sheets, forms, press passes, a responsive production report, factual Chromium evidence, and a validated uNews patchnote.

### Exact continuation point

Start M5 in `m5/0.5.0-alpha` from verified `main`. First design and test a DOM-independent PDF document model with one scheme per page, deterministic ordering of all eight schemes, and a separate production report. Integrate PDF generation afterward.

</td>
</tr>
</table>

## Prompt для нового чата / Prompt for a new chat

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/ROADMAP.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/M4_IMPLEMENTATION_PLAN.md, docs/M4_RELEASE_EVIDENCE.md, data/control-case.json и data/control-layout-m3.json. Проверь последние PR и GitHub Actions.

GitHub — единственный источник истины. Не требуй локальный клон.
Начни M5 в ветке m5/0.5.0-alpha: сначала чистая модель PDF и тесты порядка/страниц, затем генерация, UI, Chromium, uNews и recovery-ветка после merge.
```
