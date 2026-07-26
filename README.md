# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.7.0-alpha.3</strong></p>
<p align="center"><strong><a href="START_HERE.md">Продолжить разработку с нового устройства / Continue development from a new device</a></strong></p>

## Что работает

- реальные и произвольные форматы листов;
- зачистка и непечатные поля как разные этапы;
- A4/A5/A6/custom, выпуск, общий/раздельный рез;
- uniform-grid 0°/90° и расчёт вместимости;
- точные пары страниц, проверенные лица и зеркальные обороты;
- production report и отдельные PDF схем/отчёта;
- полный набор `8960` контрольных кандидатов;
- доказанный минимум бумаги `3305` листов;
- отдельные layout-формы и цветовые пластины;
- 11 изменяемых целей и неизменяемые hard constraints;
- guarded `SolutionMetrics` и рабочий прайс без demo-defaults;
- BYN-стоимость бумаги, пластин, подготовки layout-форм и итога.

## M7.3 — реальные варианты и Pareto

Версия `0.7.0-alpha.3` добавляет:

- реальные compact manual и доказанный paper minimum в общей модели;
- удаление полных дублей и доминируемых решений;
- deterministic Pareto frontier;
- обязательные крайние решения и compact materially-different display set;
- paper-first / cost-first без повторной генерации;
- выбор базы сравнения;
- RU/EN-объяснения преимущества, цены компромисса и решающей цели;
- дельты бумаги, пластин, подготовки layout-форм и итоговой стоимости;
- денежное сравнение только при совместимом рабочем прайсе;
- compact read-only main-page UI;
- focused Chromium evidence.

## Контрольные решения

| Метрика | Compact manual | Paper minimum |
|---|---:|---:|
| Физические листы | 3395 | 3305 |
| Монтажи | 4 | 56 |
| Layout-формы | 8 | 112 |
| Цветовые пластины | 32 | 448 |
| Листопрогоны | 6790 | 6610 |
| Перетираж пар | 1450 | 10 |
| Разделённые заказы | 2 | 19 |
| Иллюстративная стоимость | 972,55 BYN | 7199,49 BYN |

Paper-first рекомендует минимум бумаги. Cost-first рекомендует compact manual. Оба решения остаются видимыми, а исходные монтажи не пересчитываются.

Контрольный прайс является regression fixture. Реальные цены вводит оператор.

## Следующий этап

M7.4 — технологически проверяемый свой оборот / work-and-turn и честное сравнение с отдельными формами лица и оборота.

## Открыть / Open

- GitHub Pages: `https://sunpole.github.io/uImposition/`
- [START_HERE.md](START_HERE.md)
- [Текущее состояние / Current state](docs/CURRENT_STATE.md)
- [Версия / Version](VERSION.md)
- [Остаток до 1.0 / Remaining work](docs/REMAINING_WORK.md)
- [M7 plan](docs/M7_IMPLEMENTATION_PLAN.md)
- [M7.3 display alternatives](docs/M7_3_DISPLAY_ALTERNATIVES.md)
- [M7.3 production alternatives](docs/M7_3_PRODUCTION_ALTERNATIVES.md)
- [M7.3 explanations](docs/M7_3_ALTERNATIVE_EXPLANATIONS.md)
- [M7.3 runtime/UI](docs/M7_3_RUNTIME_ALTERNATIVES_UI.md)
- [Production costing](docs/PRODUCTION_COSTING.md)

## Release model

```text
feature branch
→ PR и проверки
→ focused Chromium evidence
→ news + uNews/Telegram
→ permanent evidence archive
→ main
→ release/v{version}
→ immutable tag
→ GitHub prerelease/release
```

## Границы

- work-and-turn ещё не реализован;
- automatic mixed-format packing относится к M8;
- последовательные пары не заявляются как готовый фальцевальный спуск;
- полный редактор приоритетов и экспорт выбранного решения относятся к M7.5–M7.6.

## License

**Proprietary / All rights reserved.** См. [`LICENSE.md`](LICENSE.md).
