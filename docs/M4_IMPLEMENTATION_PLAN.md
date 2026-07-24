# M4 — производственные итоги и отчёт / Production totals and report

## Статус / Status

Рабочий план для ветки `m4/0.4.0-alpha`. Версия проекта остаётся `0.3.0-alpha`, пока весь M4 не пройдёт расчётные, интерфейсные и Chromium-проверки.

Working plan for branch `m4/0.4.0-alpha`. The project remains at `0.3.0-alpha` until the complete M4 milestone passes calculation, interface, and Chromium verification.

## Цель / Goal

Для уже заданных и проверенных монтажей рассчитать производственный результат без DOM:

- напечатанное количество каждой печатной пары;
- недопечатку и перетираж каждой пары;
- перетираж готовых файлов;
- лицевые и оборотные формы;
- физическую бумагу;
- листопрогоны;
- проверяемую итоговую модель для будущего UI и PDF.

For explicit validated impositions, calculate pair production, underproduction, overrun, complete-file overrun, front/back forms, physical sheets, press passes, and a validated report model without DOM dependencies.

## Утверждённые формулы / Approved formulas

Для печатной пары `i` и монтажа `m`:

```text
producedPair_i = Σ(positionCount_i,m × runLength_m)
underproduction_i = max(0, required_i − producedPair_i)
overrun_i = max(0, producedPair_i − required_i)
```

Жёсткое ограничение:

```text
underproduction_i = 0 для каждой пары
```

Для файла с несколькими парами количество полностью собранных экземпляров определяется минимальным тиражом среди его пар:

```text
producedCompleteFile = min(producedPair_1 ... producedPair_n)
fileOverrun = max(0, producedCompleteFile − requiredFileQuantity)
```

Это не заменяет суммарный перетираж по парам. Главная оптимизационная метрика M4:

```text
totalPairOverrun = Σ(overrun_i)
```

Для режима `separateFrontBackForms`:

```text
physicalSheets = Σ(runLength_m)
frontForms = impositionCount
backForms = impositionCount
forms = frontForms + backForms
pressPasses = 2 × physicalSheets
```

The same formulas apply in English. Pair overrun is the primary aggregate waste metric. Complete-file overrun is reported separately and uses the minimum produced quantity across the file's page pairs.

## Модульные границы / Module boundaries

- `src/production-metrics.js` — чистые арифметические метрики пар, файлов и тиражей монтажей;
- `src/production-validation.js` — независимая проверка формул и жёсткого запрета недопечатки;
- `src/production-report.js` — повторная проверка лица/оборота и сборка итоговой модели;
- UI получает только готовый отчёт и не содержит производственных формул.

## Контрольный результат / Control result

Для `data/control-case.json` и `data/control-layout-m3.json`:

```text
print pairs: 35
impositions: 4
physical sheets: 3395
front forms: 4
back forms: 4
forms total: 8
press passes: 6790
underproduction: 0
total pair overrun: 1450
```

Ручные тиражи монтажей остаются контрольным входом, а не результатом оптимизатора.

The manual imposition run lengths remain control input, not optimizer output or a proven global minimum.

## Порядок реализации / Implementation order

1. Чистые метрики и проверки.
2. Интеграционные тесты полного контрольного набора.
3. Отдельный DOM-renderer производственного отчёта.
4. Desktop/mobile Chromium-сценарии.
5. Синхронизация версии `0.4.0-alpha`, документации и uNews.
6. Merge и recovery-ветка `release/v0.4.0-alpha`.

## Критерии первого патча / First-patch acceptance

- все 35 пар присутствуют в отчёте;
- вклад каждого монтажа объясним через число позиций и тираж;
- неизвестная пара или повреждённый монтаж блокируют расчёт;
- любая недопечатка делает отчёт неготовым к производству;
- контрольные суммы точно равны `3395 / 8 / 6790 / 0 / 1450`;
- расчётные модули не используют DOM и проходят Node built-in tests.
