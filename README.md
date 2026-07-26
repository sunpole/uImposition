# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.7.0-alpha.3</strong></p>
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
- выпуск, общий и раздельный рез;
- сетки 0°/90° и выбор вместимости;
- точные пары страниц;
- проверенные лица и зеркальные обороты;
- производственный отчёт по файлам и парам;
- отдельные PDF схем и отчёта;
- полный набор `8960` контрольных кандидатов;
- доказанный минимум бумаги `3305` листов;
- раздельный учёт layout-форм и цветовых пластин.

### Добавлено в M7.1–M7.2

- 11 изменяемых целей и неизменяемые жёсткие ограничения;
- лексикографическое ранжирование без повторного перебора;
- единая guarded-модель `SolutionMetrics`;
- вес закупаемого листа, `BYN/кг`, стоимость пластин и итоговая стоимость;
- рабочий ввод прайса без demo-defaults;
- состояния `pricing incomplete / inputs ready / ready`;
- production report → реальная BYN-стоимость.

### Добавлено в M7.3

- реальные compact manual и доказанный paper minimum в общей модели;
- удаление дублей и доминируемых решений;
- детерминированный Pareto-frontier;
- обязательные крайние решения и компактный materially-different набор;
- мгновенная смена `Сначала бумага / Сначала стоимость`;
- выбор базы сравнения;
- RU/EN-объяснения преимущества, цены компромисса и решающей цели;
- дельты бумаги, пластин, подготовки layout-форм и итога;
- денежное сравнение только при совместимом рабочем прайсе;
- compact read-only панель на основной странице;
- focused Chromium evidence реального пользовательского сценария.

### Следующий этап

M7.4 — технологически проверяемый свой оборот / work-and-turn и честное сравнение с отдельными формами лица и оборота.

</td>
<td width="50%" valign="top">

## English

uImposition is a static browser tool for planning complex gang-run offset impositions.

### Working through M6

Sheet/product geometry, exact page pairs, validated front/back schemes, production totals, separate PDFs, complete control candidate generation, a proven 3,305-sheet paper minimum, separate side-layout/color-plate metrics, and production regressions.

### Added in M7.1–M7.2

Eleven reorderable objectives, immutable hard constraints, instant lexicographic reranking, guarded `SolutionMetrics`, source-sheet weight, BYN production costing, production pricing inputs, and a production-report connection to real solution cost.

### Added in M7.3

Real compact-manual and paper-minimum alternatives, deterministic Pareto filtering, required extremes, a compact materially different display set, instant paper-first/cost-first reranking, reference selection, RU/EN advantage and tradeoff explanations, component cost deltas, strict pricing compatibility, and a compact main-page panel with focused Chromium evidence.

### Next stage

M7.4 — technologically validated work-and-turn and a transparent comparison with separate front and back forms.

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

- [Что осталось до 1.0 / Remaining work to 1.0](docs/REMAINING_WORK.md)
- [План M7 / M7 operator decision plan](docs/M7_IMPLEMENTATION_PLAN.md)
- [M7.3: compact display alternatives](docs/M7_3_DISPLAY_ALTERNATIVES.md)
- [M7.3: real production alternatives](docs/M7_3_PRODUCTION_ALTERNATIVES.md)
- [M7.3: alternative explanations](docs/M7_3_ALTERNATIVE_EXPLANATIONS.md)
- [M7.3: runtime and UI](docs/M7_3_RUNTIME_UI.md)
- [Денежная оценка производства / Production costing](docs/PRODUCTION_COSTING.md)
- [Архитектура / Architecture](docs/ARCHITECTURE.md)
- [План тестирования / Test plan](docs/TEST_PLAN.md)
- [Автоматизация evidence / Screenshot and PDF verification](docs/SCREENSHOT_AUTOMATION.md)

## Разработка / Development model

GitHub — единственный источник истины. Каждый завершённый опубликованный патч получает:

```text
feature branch
→ PR и проверки
→ фокусный Chromium screenshot
→ news + uNews/Telegram
→ постоянный evidence-архив
→ merge в main
→ release/v{version}
→ immutable tag
→ GitHub prerelease/release
```

## Контрольные решения / Control alternatives

| Метрика | Compact manual | Paper minimum |
|---|---:|---:|
| Физическая бумага | 3395 | 3305 |
| Монтажи | 4 | 56 |
| Layout-формы | 8 | 112 |
| Цветовые пластины | 32 | 448 |
| Листопрогоны | 6790 | 6610 |
| Недопечатка | 0 | 0 |
| Перетираж пар | 1450 | 10 |
| Иллюстративная стоимость | 972,55 BYN | 7199,49 BYN |

Контрольный прайс не является рабочим default. Реальные цены вводит оператор. Пример доказывает, что минимум бумаги и минимум денег могут выбирать разные решения.

## Границы

- автоматический work-and-turn ещё не реализован;
- automatic mixed-format packing ещё не реализован;
- 32-страничный regression проверяет последовательные пары, но не заявляет готовый фальцевальный спуск;
- полный редактор всех приоритетов и экспорт выбранного варианта относятся к M7.5–M7.6.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
