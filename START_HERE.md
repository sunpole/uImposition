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
- основная ветка: `main`;
- текущая версия: **`0.5.0-alpha`**;
- M5 объединён через PR №8;
- merge commit M5: `366ea45efd2566c7bb25ff14ff0cbc0df7472594`;
- завершённый этап: **M5 — PDF-экспорт**;
- следующая версия: **`0.6.0-alpha`**;
- следующий этап: **M6 — автоматический минимум бумаги**;
- точка отката M5: `release/v0.5.0-alpha`.

### Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/ROADMAP.md`;
6. `docs/TECHNICAL_SPECIFICATION_RU.md`;
7. `docs/ARCHITECTURE.md`;
8. `docs/M5_IMPLEMENTATION_PLAN.md`;
9. `docs/M5_RELEASE_EVIDENCE.md`;
10. `data/control-case.json`;
11. `data/control-layout-m3.json`;
12. последние Pull Request и GitHub Actions.

### Что реализовано в M5

- чистая неизменяемая модель двух PDF-документов;
- собственный dependency-free PDF writer;
- Canvas-отрисовка кириллицы, стрелок, схем и таблиц;
- отдельный PDF схем: `8` страниц, одна схема на страницу;
- отдельный PDF отчёта: `6` страниц A4;
- A4, пропорциональный и custom-режимы страниц схем;
- скачивание обоих документов в браузере;
- проверка через Chromium, Node, `pdfinfo` и Poppler;
- ручной просмотр всех `14` страниц.

### Проверенный результат

- четыре монтажа → `8` страниц схем;
- порядок: лицо, оборот для каждого монтажа;
- отчёт не смешивается со схемами;
- отчёт: 1 сводка + 2 страницы файлов + 3 страницы пар;
- все `14` страниц читаются без обрезки, сломанных символов и пересечений;
- производственные итоги сохранены: `3395` листов, `8` форм, `6790` листопрогонов, недопечатка `0`.

### Главные правила

- GitHub — единственный источник истины;
- функциональные этапы не писать напрямую в `main`;
- расчёты, PDF-модель и DOM-renderer держать раздельно;
- экспортировать только валидные схемы и production-ready отчёт;
- недопечатку считать недопустимой;
- ручной контрольный вариант не называть глобальным минимумом;
- alpha-вехе создавать recovery-ветку без настоящего GitHub Release.

### Точная точка продолжения

Начать M6 в отдельной ветке `m6/0.6.0-alpha` от проверенного `main`.

Первый безопасный шаг: определить чистую модель кандидата монтажа и функции расчёта минимального допустимого тиража без недопечатки. Затем генерировать альтернативы, сравнивать физическую бумагу и объяснять разделённые заказы.

</td>
<td width="50%" valign="top">

## English

### Current state

- repository: `sunpole/uImposition`;
- default branch: `main`;
- current version: **`0.5.0-alpha`**;
- M5 merged through PR #8;
- M5 merge commit: `366ea45efd2566c7bb25ff14ff0cbc0df7472594`;
- completed milestone: **M5 — PDF export**;
- next milestone: **M6 — automatic paper minimisation**;
- M5 rollback point: `release/v0.5.0-alpha`.

### Implemented in M5

A pure two-document model, dependency-free PDF writing, Canvas rendering, an eight-page scheme PDF, a separate six-page production report, browser downloads, Chromium/Node/pdfinfo/Poppler verification, and manual review of all fourteen pages.

### Exact continuation point

Start M6 in `m6/0.6.0-alpha` from verified `main`. First define a pure candidate model and minimum valid run-length functions, then generate alternatives, compare physical paper, and explain split orders.

</td>
</tr>
</table>

## Prompt для нового чата / Prompt for a new chat

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/ROADMAP.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/M5_IMPLEMENTATION_PLAN.md, docs/M5_RELEASE_EVIDENCE.md, data/control-case.json и data/control-layout-m3.json. Проверь последние PR и GitHub Actions.

GitHub — единственный источник истины. Не требуй локальный клон.
M5 уже объединён через PR №8, точка отката — release/v0.5.0-alpha.
Начни M6 в ветке m6/0.6.0-alpha: сначала чистая модель кандидатов и расчёт минимальных допустимых тиражей, затем генерация альтернатив, UI, Chromium, uNews и recovery-ветка после merge.
```