# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущая версия

**`0.5.0-alpha`**  
Дата версии: **24 июля 2026**  
Объединено в `main`: **25 июля 2026**  
Этап: **M5 — PDF-экспорт**

### Что работает

- весь проверенный функционал M1–M4;
- отдельный PDF схем: `8` страниц, одна схема на страницу;
- порядок: лицо, оборот для каждого из четырёх монтажей;
- безопасный файл `uImposition-schemes.pdf`;
- режимы страниц схем: A4, пропорции фактического листа и пользовательский формат;
- отдельный PDF производственного отчёта: `6` страниц A4;
- страницы отчёта: сводка, две страницы файлов и три страницы печатных пар;
- кириллица и стрелки отрисовываются браузером в Canvas до помещения в PDF;
- собственный dependency-free PDF writer без CDN и runtime-зависимостей;
- структурная проверка PDF, `pdfinfo` и рендер всех страниц через Poppler;
- скачивание обоих документов непосредственно из браузера.

### Проверенный контрольный результат M5

- четыре монтажа → `8` страниц схем;
- основной PDF содержит только схемы;
- отчёт создаётся отдельным шестистраничным файлом;
- Poppler успешно прочитал и отрендерил все `14` страниц;
- A4-схемы не обрезаны, пропорции сохранены;
- в отчёте читаются итоговые метрики, 20 файлов, 35 пар и вклады монтажей;
- заголовки, номера страниц, кириллица и длинные строки не пересекаются;
- производственные итоги: `3395` листов, `8` форм, `6790` листопрогонов, недопечатка `0`.

### Ещё не реализовано

- автоматический подбор тиражей монтажей;
- генерация и сравнение альтернатив;
- доказанный минимум физической бумаги;
- смешанные ориентации внутри сетки;
- импорт/экспорт полного проекта и постоянное хранение.

### Следующая целевая версия

**`0.6.0-alpha` — M6**

Автоматическая генерация альтернатив, подбор тиражей и минимум физической бумаги без недопечатки.

</td>
<td width="50%" valign="top">

## English

### Current version

**`0.5.0-alpha`**  
Version date: **24 July 2026**  
Merged to `main`: **25 July 2026**  
Stage: **M5 — PDF export**

### Working now

All verified M1–M4 functionality; a separate eight-page scheme PDF; deterministic front/back order; A4, sheet-proportional, and custom scheme modes; a separate six-page A4 production report; browser Canvas rasterisation; dependency-free PDF writing; structural checks; `pdfinfo`; Poppler rendering; and direct browser download of both documents.

### Verified M5 result

Four impositions produce eight scheme pages. The report remains a separate six-page document. Poppler successfully reads and renders all fourteen pages; no clipping, broken glyphs, overlapping headers, or black squares were found. Verified production totals remain `3395` physical sheets, `8` forms, `6790` press passes, and `0` underproduction.

### Not implemented yet

Automatic run assignment, alternative generation, proven paper minimisation, mixed orientations, and complete-project persistence.

### Next target version

**`0.6.0-alpha` — M6**

Generate alternatives, assign imposition run lengths automatically, and minimise physical paper without underproduction.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник;
- `VERSION.md` — понятное состояние;
- `CHANGELOG.md` — история;
- `docs/VERSIONING.md` — правила.

## Релизы и откат / Releases and rollback

M5 объединён через PR №8, merge commit `366ea45efd2566c7bb25ff14ff0cbc0df7472594`. Проверенная alpha-точка отката существует как `release/v0.5.0-alpha`. Настоящий GitHub Release создаётся только для стабильной production-версии.