# Текущее состояние / Current State

Последнее обновление: **24 июля 2026**  
Last updated: **24 July 2026**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Версия и ветки

- `main`: `0.4.0-alpha`, стабильная точка M4;
- релиз-кандидат: `m5/0.5.0-alpha`, PR №8;
- версия кандидата: **`0.5.0-alpha`**;
- завершённые функциональные этапы в кандидате: M0–M5;
- следующая задача после merge: M6;
- следующая версия: `0.6.0-alpha`;
- существующие точки отката заканчиваются `release/v0.4.0-alpha`;
- после merge создаётся `release/v0.5.0-alpha`.

### Что реально работает в кандидате M5

1. Весь проверенный функционал M1–M4.
2. Чистая модель страниц схем и отдельного отчёта.
3. Детерминированный порядок `ЛИЦО → ОБОРОТ` для каждого монтажа.
4. Четыре монтажа дают ровно восемь страниц схем.
5. A4, пропорциональный и пользовательский режимы страниц схем.
6. Отдельный шестистраничный PDF производственного отчёта.
7. Canvas-отрисовка кириллицы, стрелок, метрик и таблиц.
8. Собственный PDF 1.4 writer без внешних runtime-зависимостей.
9. Прямое скачивание двух PDF из браузера.
10. Playwright проверяет имя, заголовок, EOF и число Page-объектов.
11. `pdfinfo` проверяет документ, Poppler рендерит каждую страницу в PNG.
12. Ручная визуальная проверка всех 14 страниц.

### Проверенный результат M5

- `uImposition-schemes.pdf`: A4, `8` страниц, одна схема на страницу;
- порядок страниц: 1 лицо, 1 оборот, 2 лицо, 2 оборот и далее;
- `uImposition-production-report.pdf`: A4, `6` страниц;
- отчёт: 1 сводка, 2 страницы файлов, 3 страницы пар;
- все 14 страниц прочитаны и отрендерены Poppler;
- кириллица, стрелки, номера страниц и длинные вклады читаются;
- обрезка, наложение заголовков, чёрные квадраты и сломанные глифы отсутствуют.

### Архитектура M5

- `pdf-document-model.js` — чистая логическая модель документов;
- `pdf-binary.js` — dependency-free PDF-контейнер;
- `pdf-scheme-renderer.js` — Canvas-renderer схем;
- `pdf-report-renderer.js` — Canvas-renderer отчёта и пагинация;
- `pdf-export-ui.js` — только браузерные контролы и скачивание;
- `.github/workflows/capture-screenshots.yml` — Chromium, `pdfinfo`, Poppler и artifact.

### Чего ещё нет

- автоматического подбора тиражей;
- генерации и сравнения альтернатив;
- доказанного минимума бумаги;
- смешанных ориентаций;
- постоянного хранения полного проекта.

### Следующий безопасный шаг — M6

После завершения PR №8 создать `m6/0.6.0-alpha`. Начать с чистой модели кандидата монтажа и расчёта минимального допустимого тиража без недопечатки. Затем генерировать альтернативы и сравнивать физическую бумагу.

</td>
<td width="50%" valign="top">

## English

### Version and branches

- `main`: `0.4.0-alpha`, verified M4 checkpoint;
- release candidate: `m5/0.5.0-alpha`, PR #8;
- candidate version: **`0.5.0-alpha`**;
- completed functional milestones in the candidate: M0–M5;
- next milestone after merge: M6;
- next version: `0.6.0-alpha`;
- `release/v0.5.0-alpha` is created after merge.

### What actually works in M5

A pure PDF document model, deterministic eight-page scheme output, a separate six-page report, A4/proportional/custom scheme modes, Canvas rasterisation, a dependency-free PDF writer, browser downloads, Playwright structure checks, `pdfinfo`, Poppler page rendering, and manual review of all fourteen pages.

### Next safe step — M6

After PR #8, create `m6/0.6.0-alpha`. Start with a pure candidate model and minimum valid run-length calculation, then generate alternatives and compare physical paper.

</td>
</tr>
</table>
