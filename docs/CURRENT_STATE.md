# Текущее состояние / Current State

Последнее обновление: **26 июля 2026**  
Last updated: **26 July 2026**

## Версия и checkpoint

- функциональный M7.4 объединён через PR `#39`;
- functional merge commit: `20b17a8dd578be6777d50934f69c561b10363aca`;
- синхронизируемая версия: **`0.7.0-alpha.4`**;
- release-prep ветка: `release-prep/v0.7.0-alpha.4`;
- release manifest будет сохранён в `archive/development/0.7.0-alpha.4/release.json`;
- recovery branch, immutable tag и GitHub prerelease ещё должны быть созданы publication workflow;
- Release card и каждый asset должны быть проверены независимо;
- следующая функциональная цель после полного checkpoint: **M7.5 / `0.7.0-alpha.5`**.

## Стабильная основа M1–M7.3

- геометрия листа и изделия;
- точные page pairs, front/back и production report;
- PDF схем и отчёта;
- полный bounded uniform-grid search;
- доказанный minimum `3305` листов;
- guarded `SolutionMetrics` и operator pricing;
- реальные compact-manual / paper-minimum Pareto alternatives;
- RU/EN explanations, component deltas и sanitized alternatives runtime/UI.

## M7.4 — реализовано

### Стратегии

- `separateFrontBackForms`;
- `workAndTurn`;
- `separateOnly`;
- `compareBoth`;
- `workAndTurnOnly`.

### Геометрия и validation

- одна симметричная общая форма;
- чётное число колонок;
- front page и парная back page в зеркальных позициях;
- проверка файла, pair index, page role, grid coordinates и direction;
- только горизонтальный turn axis;
- повреждённая или асимметричная форма блокируется;
- materialization через существующий duplex validator.

### Производство

- separate: `frontForms=1`, `backForms=1`, `forms=2`;
- work-and-turn: `frontForms=1`, `backForms=0`, `forms=1`;
- оба режима проходят независимый production report;
- недопечатка всегда запрещена.

### Контрольный кейс

Четыре разных A6, 2 страницы, `1+1`, по `4000`:

| Метрика | Separate | Work-and-turn |
|---|---:|---:|
| Физические листы | 1000 | 1000 |
| Прогоны | 2000 | 2000 |
| Layout-формы | 2 | 1 |
| Цветовые пластины | 2 | 1 |
| Недопечатка | 0 | 0 |
| Перетираж | 0 | 0 |

Evidence pricing `130 г/м²`, `4 BYN/кг`, `15 BYN/plate`, `0 BYN/preparation`:

- separate: `175,08 BYN`;
- work-and-turn: `160,08 BYN`;
- saving: `15 BYN`.

Эти числа являются evidence, а не рабочими defaults.

### Runtime и UI

- сравнение подготавливается один раз на pricing state;
- режим фильтрует готовые варианты без перестроения геометрии;
- public state не содержит reports, raw layouts, pagePairs или halfRows;
- основной UI показывает две стратегии, exact metrics и preview формы `4 × 4`;
- технологическое предупреждение требует проверки захвата, бокового упора, приводки и машины.

## Проверки PR #39

- exact head: `2cfe73e469e0c1dae810d2f2f11904dd74747e10`;
- Quality checks: success;
- downloaded quality artifact: `146/146` tests;
- Chromium/PDF workflow: success;
- focused scenario: `m7-work-and-turn-control`;
- screenshot визуально проверен;
- все 10 Chromium scenarios прошли.

## Граница

M7.4 не является общим automatic work-and-turn solver для произвольных заказов, не поддерживает вертикальный turn axis и не определяет совместимость с конкретной печатной машиной.

## Что осталось до опубликованного `0.7.0-alpha.4`

1. Завершить version PR и получить exact-head checks.
2. Зафиксировать version merge commit как `releaseCommit`.
3. Подготовить patchnote и Telegram/uNews payload.
4. Создать permanent evidence ZIP и hashes.
5. Создать publication PR и пройти workflows.
6. Создать recovery branch и immutable tag на `releaseCommit`.
7. Создать GitHub prerelease с image/archive assets.
8. Независимо проверить Release card и assets.

## English summary

M7.4 is functionally merged through PR #39. The alpha4 version checkpoint is being prepared. The verified four-A6 control case keeps paper and passes equal at 1,000 sheets and 2,000 passes while reducing side-layout forms and 1+1 color plates from two to one with zero underproduction and overrun. The release is not complete until the version checkpoint, patchnote, uNews/Telegram payload, permanent evidence, recovery branch, immutable tag, GitHub prerelease, and release assets are independently verified.
