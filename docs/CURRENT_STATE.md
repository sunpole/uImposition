# Текущее состояние / Current State

Последнее обновление: **25 июля 2026**  
Last updated: **25 July 2026**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Версия и ветки

- `main`: **`0.5.0-alpha`**;
- M5 объединён через PR №8;
- merge commit: `366ea45efd2566c7bb25ff14ff0cbc0df7472594`;
- завершённые этапы: M0–M5;
- следующая задача: M6;
- следующая версия: `0.6.0-alpha`;
- точки отката: `release/v0.1.0-alpha` … `release/v0.5.0-alpha`.

### Что реально работает

1. Геометрия листа, зачистка и непечатные поля.
2. Формат изделия, выпуск, общий и раздельный рез.
3. Сетки 0°/90° и максимальная вместимость.
4. Ввод 20 заказов и 35 точных пар страниц.
5. Четыре лица и четыре автоматически зеркальных оборота.
6. Проверка файла, pair-id, страниц, координат и направлений.
7. Производственные итоги по парам и файлам.
8. Физическая бумага, формы, листопрогоны и запрет недопечатки.
9. Адаптивный производственный отчёт.
10. Чистая модель двух PDF-документов.
11. PDF схем: `8` страниц, одна схема на страницу.
12. PDF отчёта: `6` страниц A4.
13. A4, пропорциональный и пользовательский режимы схем.
14. Собственный PDF 1.4 writer без runtime-зависимостей.
15. Canvas-отрисовка кириллицы, стрелок, метрик и таблиц.
16. Прямое скачивание обоих PDF из браузера.
17. Chromium, Node, `pdfinfo`, Poppler и ручной просмотр всех `14` страниц.

### Проверенный результат M5

- `uImposition-schemes.pdf`: `8` страниц, порядок лицо → оборот;
- `uImposition-production-report.pdf`: `6` страниц A4;
- отчёт: 1 сводка, 2 страницы файлов, 3 страницы печатных пар;
- все `14` страниц прочитаны и отрендерены Poppler;
- кириллица, стрелки, номера страниц и длинные вклады читаются;
- обрезка, наложение заголовков, чёрные квадраты и сломанные глифы отсутствуют;
- производственные итоги: `3395` листов, `8` форм, `6790` листопрогонов, недопечатка `0`.

### Архитектура M5

- `pdf-document-model.js` — чистая логическая модель документов;
- `pdf-binary.js` — dependency-free PDF-контейнер;
- `pdf-scheme-renderer.js` — Canvas-renderer схем;
- `pdf-report-renderer.js` — Canvas-renderer отчёта и пагинация;
- `pdf-export-ui.js` — браузерные контролы и скачивание;
- `.github/workflows/capture-screenshots.yml` — Chromium, `pdfinfo`, Poppler и artifacts;
- `docs/M5_RELEASE_EVIDENCE.md` — provenance проверок и uNews.

### Чего ещё нет

- автоматического подбора тиражей;
- генерации и сравнения альтернатив;
- доказанного минимума бумаги;
- смешанных ориентаций;
- постоянного хранения полного проекта.

### Следующий безопасный шаг — M6

Создать `m6/0.6.0-alpha` от проверенного `main`. Начать с чистой модели кандидата монтажа и расчёта минимального допустимого тиража без недопечатки. Затем генерировать альтернативы, сравнивать физическую бумагу и объяснять разделённые заказы.

</td>
<td width="50%" valign="top">

## English

### Version and branches

- `main`: **`0.5.0-alpha`**;
- M5 merged through PR #8;
- merge commit: `366ea45efd2566c7bb25ff14ff0cbc0df7472594`;
- completed milestones: M0–M5;
- next milestone: M6;
- next version: `0.6.0-alpha`;
- rollback points include `release/v0.5.0-alpha`.

### What actually works

Verified sheet and order geometry, front/back impositions, production totals, hard underproduction rejection, responsive reporting, a pure two-document PDF model, eight one-scheme pages, a separate six-page report, browser downloads, dependency-free PDF writing, Chromium/Node/pdfinfo/Poppler verification, and manual review of all fourteen pages.

### Next safe step — M6

Create `m6/0.6.0-alpha` from verified `main`. Start with a pure candidate model and minimum valid run-length calculation, then generate alternatives, compare physical paper, and explain split orders.

</td>
</tr>
</table>