# Текущее состояние / Current State

Последнее обновление: **24 июля 2026**  
Last updated: **24 July 2026**

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Версия и ветки

- `main`: `0.3.0-alpha`, стабильная точка M3;
- релиз-кандидат M4: ветка `m4/0.4.0-alpha`, PR №6;
- версия кандидата: **`0.4.0-alpha`**;
- завершённые функциональные этапы в кандидате: M0–M4;
- следующий этап после объединения: M5;
- следующая версия: `0.5.0-alpha`;
- существующие точки отката: `release/v0.1.0-alpha`, `release/v0.2.0-alpha`, `release/v0.3.0-alpha`;
- после merge создаётся `release/v0.4.0-alpha`.

### Что реально работает в кандидате M4

1. Весь проверенный функционал M1–M3.
2. Чистый расчёт производства каждой печатной пары.
3. Вклад каждого монтажа: число позиций × тираж монтажа.
4. Недопечатка и перетираж по каждой паре.
5. Жёсткая блокировка отчёта при недопечатке.
6. Готовый тираж и перетираж каждого файла по минимальному тиражу его пар.
7. Отдельные суммы перетиража пар и готовых файлов.
8. Физическая бумага как сумма тиражей монтажей.
9. Четыре лицевые и четыре оборотные формы для чужого оборота.
10. Два листопрогона на каждый физический лист.
11. Независимая арифметическая валидация отчёта.
12. Адаптивная сводка, таблица 20 файлов и детализация 35 пар.
13. Node built-in tests и реальные desktop/mobile Chromium-сценарии.

### Проверенный контрольный результат M4

- заказ: `20` файлов, `35` печатных пар;
- монтажи: `4`, тиражи `1500`, `1100`, `450`, `345`;
- физическая бумага: `3395`;
- формы: `4` лица + `4` оборота = `8`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- требуемое/напечатанное количество по парам: `52870 / 54320`;
- суммарный перетираж пар: `1450`;
- требуемое/полностью собранное количество файлов: `29225 / 30155`;
- перетираж готовых файлов: `930`.

Ручные тиражи монтажей являются контрольным входом. M4 не выполняет оптимизацию и не доказывает минимум бумаги.

### Текущая архитектура

- геометрия и заказы: `geometry.js`, `orders.js`;
- лицо/оборот: `orientation.js`, `front-layout.js`, `back-layout.js`;
- проверка схем: `imposition-validation.js`;
- производственная арифметика: `production-metrics.js`;
- проверка отчёта: `production-validation.js`;
- готовая модель отчёта: `production-report.js`;
- DOM-отрисовка: `scheme-renderer.js`, `production-report-renderer.js`;
- координатор контрольного примера: `m3-demo.js`;
- контрольные данные: `control-case.json`, `control-layout-m3.json`.

### Чего ещё нет

- автоматического подбора тиражей монтажей;
- генерации и сравнения альтернатив;
- смешанных ориентаций внутри сетки;
- PDF-экспорта;
- полного импорта/экспорта проекта и постоянного хранения отчёта.

### Следующий безопасный шаг — M5

После завершения PR №6 создать `m5/0.5.0-alpha`. Сначала реализовать чистую модель PDF-страниц и тесты порядка: восемь схем по одной на страницу плюс отдельный производственный отчёт. Затем подключать генерацию PDF.

</td>
<td width="50%" valign="top">

## English

### Version and branches

- `main`: `0.3.0-alpha`, verified M3 checkpoint;
- M4 release candidate: `m4/0.4.0-alpha`, PR #6;
- candidate version: **`0.4.0-alpha`**;
- completed functional milestones in the candidate: M0–M4;
- next milestone after merge: M5;
- next version: `0.5.0-alpha`;
- existing rollback points: `release/v0.1.0-alpha`, `release/v0.2.0-alpha`, `release/v0.3.0-alpha`;
- `release/v0.4.0-alpha` is created after merge.

### What actually works in the M4 candidate

All verified M1–M3 functionality plus pure pair production, explainable imposition contributions, underproduction and overrun, hard rejection of underproducing reports, complete-file totals, separate pair/file overrun, physical sheets, front/back forms, press passes, independent report validation, responsive summary tables, Node tests, and factual desktop/mobile Chromium scenarios.

### Verified M4 control result

20 files; 35 pairs; 4 impositions; physical sheets `3395`; forms `8`; press passes `6790`; underproduction `0`; pair overrun `1450`; complete-file overrun `930`.

The explicit run lengths remain manual control input. M4 does not optimize or prove a global paper minimum.

### Next safe step — M5

After PR #6 is complete, create `m5/0.5.0-alpha`. First implement and test a pure PDF-page model: eight schemes in deterministic order, one per page, plus a separate production report. Integrate PDF generation afterward.

</td>
</tr>
</table>
