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
- релиз-кандидат: ветка `m5/0.5.0-alpha`, PR №8;
- версия кандидата: **`0.5.0-alpha`**;
- завершённый функциональный этап: **M5 — PDF-экспорт**;
- следующая версия после объединения: **`0.6.0-alpha`**;
- следующий этап: **M6 — автоматический минимум бумаги**;
- текущая точка отката в `main`: `release/v0.4.0-alpha`;
- после объединения M5 создаётся `release/v0.5.0-alpha`.

### Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/ROADMAP.md`;
6. `docs/TECHNICAL_SPECIFICATION_RU.md`;
7. `docs/ARCHITECTURE.md`;
8. `docs/M5_IMPLEMENTATION_PLAN.md`;
9. `data/control-case.json`;
10. `data/control-layout-m3.json`;
11. последние Pull Request и GitHub Actions.

### Что реализовано в M5

- чистая неизменяемая модель PDF-документов;
- собственный dependency-free PDF writer;
- Canvas-отрисовка кириллицы, стрелок, схем и таблиц;
- отдельный PDF схем: `8` страниц;
- отдельный PDF отчёта: `6` страниц;
- A4, пропорциональный и custom-режимы страниц схем;
- скачивание обоих документов в браузере;
- структурная проверка, `pdfinfo` и Poppler-render всех страниц.

### Проверенный результат

- четыре монтажа → `8` страниц схем;
- одна страница = одна схема;
- порядок: лицо, оборот для каждого монтажа;
- отчёт не смешивается со схемами;
- отчёт: сводка + 2 страницы файлов + 3 страницы пар;
- все `14` страниц читаются и рендерятся без обрезки и сломанных символов.

### Главные правила

- GitHub — единственный источник истины;
- функциональные этапы не писать напрямую в `main`;
- расчёты и PDF-модель держать отдельно от DOM-renderer;
- экспортировать только валидные схемы и production-ready отчёт;
- недопечатку считать недопустимой;
- ручной контрольный вариант не называть глобальным минимумом;
- alpha-вехе создавать recovery-ветку без настоящего GitHub Release.

### Точная точка продолжения

После объединения PR №8 начать M6 в ветке `m6/0.6.0-alpha`.

Первый безопасный шаг M6: описать модель кандидата монтажа и чистые функции расчёта допустимого минимального тиража каждого кандидата. Только после этого генерировать альтернативы и сравнивать бумагу.

</td>
<td width="50%" valign="top">

## English

### Current state

- release candidate: `m5/0.5.0-alpha`, PR #8;
- candidate version: **`0.5.0-alpha`**;
- completed functional milestone: **M5 — PDF export**;
- next milestone: **M6 — automatic paper minimisation**;
- current rollback point: `release/v0.4.0-alpha`;
- `release/v0.5.0-alpha` is created after merge.

### Implemented in M5

A pure document model, dependency-free PDF writer, Canvas rendering, a separate eight-page scheme PDF, a separate six-page report PDF, browser downloads, structural checks, `pdfinfo`, and Poppler rendering of every page.

### Exact continuation point

After PR #8 is merged, start M6 in `m6/0.6.0-alpha`. First define a pure candidate model and minimum valid run-length functions, then generate and compare alternatives.

</td>
</tr>
</table>

## Prompt для нового чата / Prompt for a new chat

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/ROADMAP.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/M5_IMPLEMENTATION_PLAN.md, data/control-case.json и data/control-layout-m3.json. Проверь последние PR и GitHub Actions.

GitHub — единственный источник истины. Не требуй локальный клон.
Если PR №8 открыт — заверши финальные проверки, uNews, merge и recovery-ветку release/v0.5.0-alpha.
Если M5 уже объединён — начни M6 в ветке m6/0.6.0-alpha: сначала чистая модель кандидатов и расчёт минимальных допустимых тиражей, затем генерация альтернатив, UI, Chromium, uNews и recovery-ветка.
```
