# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> First entry point for a new conversation, device, or developer.

## Текущее состояние

- репозиторий: `sunpole/uImposition`;
- текущий release checkpoint: **`0.7.0-alpha.3` / M7.3**;
- release manifest: `archive/development/0.7.0-alpha.3/release.json`;
- recovery-ветка, immutable tag, GitHub prerelease, news/uNews/Telegram и evidence проверяются непосредственно в GitHub;
- следующий этап: **M7.4 — свой оборот / work-and-turn**;
- полный остаток до `1.0.0`: `docs/REMAINING_WORK.md`;
- GitHub остаётся единственным источником истины.

## Что обязательно прочитать

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/REMAINING_WORK.md`;
6. `docs/M7_IMPLEMENTATION_PLAN.md`;
7. `docs/M7_3_DISPLAY_ALTERNATIVES.md`;
8. `docs/M7_3_PRODUCTION_ALTERNATIVES.md`;
9. `docs/M7_3_ALTERNATIVE_EXPLANATIONS.md`;
10. `docs/M7_3_RUNTIME_ALTERNATIVES_UI.md`;
11. `docs/PRODUCTION_COSTING.md`;
12. `docs/TECHNICAL_SPECIFICATION_RU.md`;
13. `docs/ARCHITECTURE.md`;
14. `docs/TEST_PLAN.md`;
15. `docs/DEVELOPMENT_HISTORY_POLICY.md`;
16. `data/control-case.json`;
17. `data/production-regression-cases.json`;
18. `data/m7-decision-cases.json`;
19. последние PR, Actions, branches, tags и Releases.

## Что завершено к M7.3

### M1–M6

- геометрия листа и изделия;
- точные пары страниц;
- проверенные лица и зеркальные обороты;
- production report;
- отдельные PDF схемы и отчёта;
- полный набор `8960` ограниченных кандидатов;
- доказанный минимум бумаги `3305` листов;
- нулевая недопечатка;
- раздельные layout-формы и цветовые пластины.

### M7.1–M7.2

- `11` изменяемых целей и жёсткие ограничения;
- immutable decision profile и лексикографическое ранжирование;
- guarded `SolutionMetrics`;
- ввод рабочих цен без demo-defaults;
- стоимость бумаги, пластин, подготовки layout-форм и итога;
- `pricing incomplete / inputs ready / ready`;
- production report → реальная BYN-стоимость.

### M7.3

- Pareto-frontier, удаление дублей и доминируемых вариантов;
- обязательные крайние решения;
- compact materially-different display set;
- реальные compact manual и paper minimum;
- строгая совместимость валюты, листа, плотности и ставок;
- RU/EN advantage/tradeoff/deciding-objective explanations;
- component cost deltas;
- runtime state/event и controller;
- compact read-only main-page UI;
- paper-first / cost-first без повторной генерации;
- reference selection;
- focused Chromium evidence.

Контрольный результат:

| Метрика | Compact manual | Paper minimum |
|---|---:|---:|
| Физические листы | 3395 | 3305 |
| Layout-формы | 8 | 112 |
| Цветовые пластины | 32 | 448 |
| Листопрогоны | 6790 | 6610 |
| Перетираж пар | 1450 | 10 |
| Разделённые заказы | 2 | 19 |
| Иллюстративная стоимость | 972.5466 BYN | 7199.4894 BYN |

Рабочие цены вводит оператор. Контрольные значения используются только для regression/evidence.

## Следующая безопасная задача — M7.4

1. Подтвердить фактический checkpoint `0.7.0-alpha.3`: `release/v0.7.0-alpha.3`, tag `v0.7.0-alpha.3`, GitHub prerelease, news и archive.
2. Создать отдельную M7.4-ветку от окончательного `main`.
3. Реализовать чистую модель work-and-turn без DOM.
4. Проверить геометрическую симметрию, направление переворота и повторное использование формы.
5. Контрольный кейс: четыре A6 1+1, 2 страницы, по 4000.
6. Ожидаемо: оба режима дают 1000 листов и 2000 прогонов; work-and-turn уменьшает layout-формы и пластины `2 → 1`.
7. Не начинать M7.5 до отдельного release checkpoint M7.4.

## Главные правила

- недопечатка всегда запрещена;
- минимум бумаги не равен минимуму денег или форм;
- стоимость — прозрачная отдельная цель;
- layout-формы и цветовые пластины не смешиваются;
- программа показывает компромиссы и оставляет выбор оператору;
- mixed-format manual fixture не выдаётся за automatic packing;
- последовательные пары не выдаются за готовый фальцевальный спуск;
- полезная история и архивы сохраняются;
- каждый опубликованный патч получает PR, проверки, Chromium evidence, news/uNews/Telegram, archive, recovery-ветку, immutable tag и настоящий GitHub release.

## Prompt для нового чата

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай START_HERE.md, AGENTS.md, VERSION.json, VERSION.md, CHANGELOG.md, docs/CURRENT_STATE.md, docs/REMAINING_WORK.md, docs/M7_IMPLEMENTATION_PLAN.md, docs/M7_3_DISPLAY_ALTERNATIVES.md, docs/M7_3_PRODUCTION_ALTERNATIVES.md, docs/M7_3_ALTERNATIVE_EXPLANATIONS.md, docs/M7_3_RUNTIME_ALTERNATIVES_UI.md, docs/PRODUCTION_COSTING.md, docs/TECHNICAL_SPECIFICATION_RU.md, docs/ARCHITECTURE.md, docs/TEST_PLAN.md, docs/DEVELOPMENT_HISTORY_POLICY.md, data/control-case.json, data/production-regression-cases.json и data/m7-decision-cases.json. Проверь последние PR, Actions, branches, tags и Releases.

GitHub — единственный источник истины. Не требуй локальный клон.

Подтверди полный release checkpoint 0.7.0-alpha.3. Затем продолжай только M7.4: чистая модель work-and-turn и контрольный кейс четырёх A6 1+1 по 4000. Не начинай M7.5 раньше завершения и выпуска M7.4.
```
