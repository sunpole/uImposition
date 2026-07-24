# Текущее состояние / Current State

Последнее обновление: **24 июля 2026**  
Last updated: **24 July 2026**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Версия и ветки

- `main`: **`0.4.0-alpha`**;
- M4 объединён через PR №6;
- merge commit: `67be7ba3441e4ab2c21eac22c2c4eee07d5f65f6`;
- завершённые этапы: M0–M4;
- следующая задача: M5;
- следующая версия: `0.5.0-alpha`;
- точки отката: `release/v0.1.0-alpha`, `release/v0.2.0-alpha`, `release/v0.3.0-alpha`, `release/v0.4.0-alpha`.

### Что реально работает

1. Геометрия листа, зачистка и непечатные поля.
2. Формат изделия, выпуск, общий и раздельный рез.
3. Сетки 0°/90° и максимальная вместимость.
4. Ввод 20 заказов и 35 точных пар страниц.
5. Четыре лица и четыре автоматически зеркальных оборота.
6. Проверка файла, pair-id, страниц, координат и направлений.
7. Напечатанное количество каждой пары и объяснимые вклады монтажей.
8. Недопечатка и перетираж каждой пары.
9. Готовый тираж и перетираж каждого файла.
10. Отдельные суммы перетиража пар и готовых файлов.
11. Физическая бумага, лицевые/оборотные формы и листопрогоны.
12. Независимая проверка всего производственного отчёта.
13. Адаптивная сводка, таблица 20 файлов и детализация 35 пар.
14. Node-тесты, desktop/mobile Chromium, новый PNG и патчноут uNews.

### Проверенный результат M4

- монтажи: `4`, тиражи `1500`, `1100`, `450`, `345`;
- физическая бумага: `3395`;
- формы: `4 + 4 = 8`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- требуемое/напечатанное по парам: `52870 / 54320`;
- перетираж пар: `1450`;
- требуемое/полностью собранное по файлам: `29225 / 30155`;
- перетираж готовых файлов: `930`.

Тиражи монтажей являются ручным контрольным входом. Автоматическая оптимизация ещё не реализована.

### Архитектура

- `production-metrics.js` — чистая производственная арифметика;
- `production-validation.js` — независимая проверка и запрет недопечатки;
- `production-report.js` — готовая модель отчёта;
- `production-report-renderer.js` — только DOM-отображение;
- `docs/M4_RELEASE_EVIDENCE.md` — provenance скриншотов и uNews.

### Чего ещё нет

- автоматического подбора тиражей монтажей;
- генерации и сравнения альтернатив;
- смешанных ориентаций;
- PDF-экспорта;
- постоянного хранения полного проекта.

### Следующий безопасный шаг — M5

Создать ветку `m5/0.5.0-alpha`. Сначала чистая модель PDF и тесты: одна схема на страницу, детерминированный порядок восьми схем и отдельный производственный отчёт. Затем генерация PDF и UI.

</td>
<td width="50%" valign="top">

## English

### Version and branches

- `main`: **`0.4.0-alpha`**;
- M4 merged through PR #6;
- merge commit: `67be7ba3441e4ab2c21eac22c2c4eee07d5f65f6`;
- completed milestones: M0–M4;
- next milestone: M5;
- next version: `0.5.0-alpha`;
- rollback points include `release/v0.4.0-alpha`.

### What actually works

Sheet/product geometry, exact page pairs, four validated fronts and mirrored backs, pair/file production totals, hard underproduction rejection, separate pair/file overrun, physical sheets, front/back forms, press passes, independent report validation, responsive reporting, Node tests, factual Chromium evidence, and uNews assets.

### Verified M4 result

Physical sheets `3395`; forms `8`; press passes `6790`; underproduction `0`; pair overrun `1450`; complete-file overrun `930`.

The explicit run lengths remain manual control input. Automatic optimization is not implemented.

### Next safe step — M5

Create `m5/0.5.0-alpha`. First implement a pure PDF-page model and tests for one scheme per page, deterministic ordering of all eight schemes, and a separate production report. Integrate PDF generation afterward.

</td>
</tr>
</table>
