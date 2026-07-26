# Текущее состояние / Current State

Последнее обновление: **26 июля 2026**  
Last updated: **26 July 2026**

## Версия и checkpoint

- текущая версия: **`0.7.0-alpha.3` / M7.3**;
- release manifest: `archive/development/0.7.0-alpha.3/release.json`;
- recovery-ветка, immutable tag и GitHub prerelease проверяются непосредственно в GitHub;
- предыдущие точные checkpoints:
  - `v0.7.0-alpha.1` → `622248f9e38f811a02143b428e264176f848b0a4`;
  - `v0.7.0-alpha.2` → `aafa7b3a7c2e83d00e9c54796593259e9ef147d8`;
- следующий этап: **M7.4 / `0.7.0-alpha.4` — work-and-turn**;
- полный план до `1.0.0`: `docs/REMAINING_WORK.md`.

## Что работает

### M1–M6

- геометрия листа и изделия;
- зачистка и поля машины как разные этапы;
- точные пары страниц;
- проверенные лица и зеркальные обороты;
- production report;
- отдельные PDF схем и отчёта;
- полный набор `8960` контрольных кандидатов;
- доказанный минимум бумаги `3305` листов;
- нулевая недопечатка;
- отдельные layout-формы и цветовые пластины.

### M7.1–M7.2

- 11 изменяемых целей и жёсткие ограничения;
- immutable decision profile;
- лексикографическое мгновенное ранжирование;
- единая guarded-модель `SolutionMetrics`;
- вес листа, стоимость бумаги, пластин и layout preparation;
- рабочий прайс без demo-defaults;
- состояния `pricing incomplete / inputs ready / ready`;
- production report → реальная BYN-стоимость.

### M7.3

PR `#20`, `#25`, `#26`, `#27`, `#28` добавили:

- удаление полных дублей;
- Pareto-доминирование и deterministic frontier;
- обязательные крайние варианты;
- compact materially-different display set;
- реальные compact manual и paper minimum через общие `SolutionMetrics`;
- реальные split orders, fragmentation и число разных заказов на монтаже;
- строгую совместимость валюты, листа, плотности и операторских ставок;
- RU/EN-объяснения преимущества, цены компромисса и решающей цели;
- component deltas бумаги, пластин, подготовки layout-форм и итога;
- runtime state/event и отдельный controller;
- compact read-only UI на основной странице;
- paper-first / cost-first без повторной генерации;
- смену reference без изменения recommendation;
- focused Chromium evidence.

## Проверенный реальный результат

| Метрика | Compact manual | Paper minimum |
|---|---:|---:|
| Физические листы | 3395 | 3305 |
| Монтажи | 4 | 56 |
| Layout-формы | 8 | 112 |
| Цветовые пластины | 32 | 448 |
| Листопрогоны | 6790 | 6610 |
| Перетираж файлов | 930 | 0 |
| Перетираж пар | 1450 | 10 |
| Разделённые заказы | 2 | 19 |
| Иллюстративная стоимость | 972.5466 BYN | 7199.4894 BYN |

- paper-first рекомендует `paper-minimum`;
- cost-first рекомендует `manual-compact`;
- оба решения остаются видимыми;
- изменение приоритета или reference не запускает повторную генерацию;
- без совместимого прайса стоимость полностью исключается из сравнения и не превращается в `0`.

Контрольные цены используются только в regression/evidence. Реальные цены вводит оператор.

## Чего ещё нет

- автоматического work-and-turn;
- полного редактора всех целей — M7.5;
- полной таблицы и экспорта выбранного варианта — M7.6;
- automatic mixed-format packing — M8;
- тетрадного/фальцевального спуска;
- полного сохранения и переноса проекта.

## Следующая безопасная задача — M7.4

После проверки полного checkpoint `0.7.0-alpha.3`:

1. создать отдельную M7.4-ветку от окончательного `main`;
2. реализовать чистую модель work-and-turn;
3. проверить симметрию, направление переворота и повторное использование формы;
4. не смешивать work-and-turn с текущим separate-front/back режимом;
5. контрольный кейс: четыре A6, 2 страницы, 1+1, по 4000;
6. оба режима: `1000` физических листов и `2000` прогонов;
7. work-and-turn: layout-формы и пластины `2 → 1`;
8. показать технологическое предупреждение и оба варианта;
9. не начинать M7.5 до отдельного checkpoint `0.7.0-alpha.4`.

## English summary

`0.7.0-alpha.3` completes M7.3: real compact-manual and paper-minimum alternatives, deterministic Pareto filtering, compact display selection, compatible pricing, RU/EN explanations, component cost deltas, runtime events, and a focused main-page UI. Paper-first and cost-first rerank the same prepared production alternatives without regeneration. The next isolated milestone is M7.4 work-and-turn.
