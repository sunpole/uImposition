# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.7.0-alpha.4</strong></p>
<p align="center"><strong><a href="START_HERE.md">Продолжить разработку с нового устройства / Continue development from a new device</a></strong></p>

<table>
<tr>
<td width="50%" valign="top">

## Русский

uImposition — статический браузерный инструмент для расчёта сложных сборных офсетных монтажей.

### Работает в M1–M6

- реальные и произвольные форматы листов;
- зачистка и непечатные поля как отдельные этапы;
- A4, A5, A6 и произвольный формат изделия;
- выпуск, общий рез и дополнительный зазор;
- сетки 0°/90° и выбор максимальной вместимости;
- точные пары страниц;
- проверенные лица и автоматически зеркальные обороты;
- напечатанное количество, недопечатка и перетираж;
- физическая бумага, layout-формы, цветовые пластины и листопрогоны;
- production report и отдельные PDF схем/отчёта;
- полный набор `8960` ограниченных контрольных кандидатов;
- доказанный минимум физической бумаги `3305` листов;
- производственные regression-кейсы.

### Добавлено в M7.1–M7.2

- 11 изменяемых целей и отдельные жёсткие ограничения;
- мгновенное лексикографическое ранжирование;
- прозрачная BYN-модель бумаги, пластин и подготовки layout-форм;
- единая guarded-модель `SolutionMetrics`;
- ввод рабочего прайса на основной странице;
- состояния `pricing incomplete / inputs ready / ready`;
- защита от недопечатки, `null → 0` и несовместимой денежной базы.

### Добавлено в M7.3

- строгий Pareto-frontier;
- compact display set существенно разных вариантов;
- реальные `compact manual` и доказанный `paper minimum`;
- paper-first / cost-first без повторной генерации;
- выбор базы сравнения;
- RU/EN-объяснения преимуществ и цены компромисса;
- component cost deltas;
- sanitized runtime и compact read-only панель.

### Добавлено в M7.4

- отдельные стратегии `чужой оборот` и `свой оборот / work-and-turn`;
- режимы `только чужой / сравнить оба / только свой`;
- одна симметричная общая форма для двух прогонов;
- обязательная проверка зеркальных пар страниц и направления переворота;
- независимый production report готовых изделий;
- mode-aware учёт одной или двух layout-форм;
- нулевая недопечатка как обязательное условие;
- sanitized runtime без raw reports/layouts/pagePairs;
- компактное RU/EN-сравнение и preview общей формы `4 × 4`;
- focused Chromium evidence.

### Дальше в M7

- M7.5: компактный редактор порядка приоритетов и рабочих цен;
- M7.6: итоговая таблица вариантов, детали выбранного решения и экспорт.

</td>
<td width="50%" valign="top">

## English

uImposition is a static browser tool for planning complex gang-run offset impositions.

### Working through M6

Sheet/product geometry, exact page pairs, validated front/back schemes, production totals, separate PDFs, complete bounded control candidates, a proven 3,305-sheet minimum, separate side-layout/color-plate metrics, and production regressions.

### Added in M7.1–M7.2

Eleven reorderable objectives, immutable hard constraints, instant lexicographic ranking, transparent production costing, guarded `SolutionMetrics`, main-page pricing inputs, explicit pricing states, and production-report-backed cost.

### Added in M7.3

A strict Pareto frontier, materially-different compact alternatives, real compact-manual and proven paper-minimum results, instant paper/cost re-ranking, selectable references, RU/EN tradeoff explanations, component cost deltas, a sanitized runtime, and a compact read-only panel.

### Added in M7.4

Separate front/back and work-and-turn strategies, three operator modes, one symmetric shared plate for two passes, mandatory mirrored-pair and turn-direction validation, an independent production report, mode-aware form metrics, zero-underproduction guards, a sanitized runtime, a compact RU/EN comparison, a factual 4×4 plate preview, and focused Chromium evidence.

### Later M7 patches

M7.5 adds the compact priority/pricing editor. M7.6 adds the final alternatives table, selected-solution details, and export.

</td>
</tr>
</table>

## Открыть / Open

- GitHub Pages: `https://sunpole.github.io/uImposition/`
- [Демонстрация M7.1 / M7.1 decision demo](decision-profile-demo.html?demo=decision-profile)
- [Начать или продолжить разработку / Start or continue development](START_HERE.md)
- [Текущее состояние / Current state](docs/CURRENT_STATE.md)
- [Текущая версия / Current version](VERSION.md)
- [Полное ТЗ RU](docs/TECHNICAL_SPECIFICATION_RU.md)
- [Full specification EN](docs/TECHNICAL_SPECIFICATION_EN.md)

## Документация / Documentation

- [Что осталось до 1.0 / Remaining work](docs/REMAINING_WORK.md)
- [План M7 / M7 implementation plan](docs/M7_IMPLEMENTATION_PLAN.md)
- [M7.4 свой оборот / M7.4 work-and-turn](docs/M7_4_WORK_AND_TURN.md)
- [M7.3 runtime и UI альтернатив](docs/M7_3_RUNTIME_ALTERNATIVES_UI.md)
- [Денежная оценка производства / Production costing](docs/PRODUCTION_COSTING.md)
- [Архитектура / Architecture](docs/ARCHITECTURE.md)
- [Справочник конфигурации / Configuration](docs/CONFIG_REFERENCE.md)
- [План тестирования / Test plan](docs/TEST_PLAN.md)
- [Дорожная карта / Roadmap](docs/ROADMAP.md)
- [Автоматизация скриншотов и PDF](docs/SCREENSHOT_AUTOMATION.md)

## Разработка / Development model

GitHub — единственный источник истины. Каждый завершённый опубликованный патч получает:

```text
feature branch
→ PR и проверки
→ focused Chromium evidence
→ version checkpoint
→ patchnote + uNews/Telegram
→ permanent evidence archive
→ recovery/v{version}
→ immutable tag
→ GitHub prerelease/release с assets
```

Локальный терминал необязателен и не является источником истины.

## Контрольные решения / Control solutions

### M7.3 — бумага против стоимости

| Вариант | Листы | Layout-формы | Пластины | Evidence cost |
|---|---:|---:|---:|---:|
| Compact manual | 3395 | 8 | 32 | 972,55 BYN |
| Paper minimum | 3305 | 112 | 448 | 7199,49 BYN |

При evidence-профиле `620×450 мм`, `130 г/м²`, `4 BYN/кг` и `15 BYN` за цветовую пластину минимум бумаги экономит `90` листов, но дороже на `6226,94 BYN`. Это не рабочий прайс.

### M7.4 — чужой оборот против своего

Четыре разных A6, 2 страницы, `1+1`, по `4000`:

| Метрика | Чужой оборот | Свой оборот |
|---|---:|---:|
| Листы | 1000 | 1000 |
| Прогоны | 2000 | 2000 |
| Layout-формы | 2 | 1 |
| Пластины | 2 | 1 |
| Недопечатка | 0 | 0 |
| Перетираж | 0 | 0 |

При evidence-прайсе `15 BYN` за пластину и нулевой подготовке свой оборот экономит ровно `15 BYN`. Бумага и прогоны не меняются.

## Границы

- M7.4 подтверждает горизонтальный work-and-turn для фиксированного контрольного кейса, но ещё не общий автоматический solver;
- совместимость с захватом, боковым упором и конкретной машиной проверяет оператор;
- полный редактор приоритетов и цен относится к M7.5;
- итоговая таблица и экспорт выбранного решения относятся к M7.6;
- automatic mixed-format packing относится к M8;
- 32-страничный regression проверяет последовательные пары, но не заявляет готовый фальцевальный спуск;
- полный импорт/экспорт проекта и постоянное хранение относятся к M8.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
