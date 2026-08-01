# uImposition — текущее фактическое состояние

Последнее обновление: **1 августа 2026**.

## 1. Repository checkpoint

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- архитектурный baseline universal-solver rebuild: merge PR `#87`, commit `b9d83855ff685bb38831670fb0c3975bbd1bdbc4`;
- опубликованный prerelease остаётся `0.7.0-alpha.5`;
- release commit: `195d6496a291095a69cc9089a64154561ffbb1fa`;
- recovery branch/tag: `release/v0.7.0-alpha.5`, `v0.7.0-alpha.5`;
- `VERSION.json` намеренно остаётся на последнем опубликованном checkpoint;
- `productionReady` остаётся `false`;
- GitHub — единственный источник истины.

## 2. Архивная точка до rebuild

Создана постоянная ветка:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

Она указывает на commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

Ветка сохраняет прежний root UI, operator `/app/`, pure calculation modules, tests, fixtures и документацию. Её нельзя удалять до стабильного `1.0.0` и отдельного решения владельца.

## 3. Рабочий пользовательский маршрут

Актуальное приложение находится в `app/`. Корневой GitHub Pages URL должен переходить в `/app/`.

Рабочий поток:

```text
выбрать sheet/press preset
→ добавить виды продукции
→ получить live calculation
→ сравнить варианты
→ выбрать план
→ проверить лицо/зеркальный оборот или общую форму
→ открыть production metrics
→ экспортировать PDF
```

Поддерживаются:

- local application state и presets;
- product rows и TXT import;
- текущие uniform `0°/90°` grids;
- odd technical blank;
- verified front и mirrored back;
- separate duplex;
- ограниченная user work-and-turn family;
- alternatives, priorities, selection и costing;
- schemes, report и PDF;
- responsive desktop/mobile interface.

## 4. Исследование и новое архитектурное решение

PR `#86` объединил:

- аудит 50 GitHub-репозиториев;
- матрицу page-imposition, prepress, packing, cutting-stock и integer-optimization проектов;
- лицензионные и архитектурные риски;
- решение использовать внешние проекты как research/differential oracles.

PR `#87` перенёс устойчивые выводы в:

- `docs/ARCHITECTURE.md`;
- `docs/ALGORITHM_AND_OPTIMIZATION.md`;
- `docs/TEST_PLAN.md`;
- `docs/REMAINING_WORK.md`.

Основной implementation contract:

- `research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`.

## 5. Целевая solver architecture

```text
N — normalized demand and machine input
G — geometry patterns with explicit slots
P — product/page/side assignment
R — integer run lengths
C — restricted master and pricing/column generation
M — machine/operator constraints
E — explanation, export and case memory
```

### Малые задачи

- полный перебор;
- deterministic exhaustive catalog;
- brute-force oracle;
- exact proof внутри заявленной области.

### Большие задачи

- начальные допустимые patterns;
- restricted master;
- pricing subproblem;
- on-demand generation полезных колонок;
- final integer solve;
- explicit coverage/truncation.

Нельзя решать большие заказы простым увеличением static candidate limits.

## 6. Статус draft PR #85

PR `#85` остаётся черновым и не является будущим large-order solver.

Полезные части:

- BigInt candidate count;
- deterministic candidate signatures;
- exact small bounded catalog;
- coverage/truncation contracts.

Допустимая будущая роль:

- переработанный exhaustive oracle для малых задач R0.

Перед merge PR должен быть пересобран на актуальном `main` и соответствовать новой G/P/R архитектуре.

## 7. Честная граница текущего production solver

Текущий runtime не доказывает полный поиск для:

- mixed physical sizes;
- mixed rotations внутри одного листа;
- произвольного числа production patterns;
- целочисленного multi-pattern master problem;
- generalized work-and-turn/work-and-tumble;
- machine defects и zone compatibility;
- operator case memory;
- global cost optimum произвольного реального заказа.

Исторический control layout остаётся oracle/benchmark и не читается solver как готовый ответ.

## 8. Следующий кодовый этап

### G0-A

Pure modules без UI:

```text
src/geometric-pattern.js
src/uniform-grid-patterns.js
```

Тесты:

```text
tests/geometric-pattern.test.js
tests/uniform-grid-patterns.test.js
```

Acceptance:

- explicit slots `{xMm,yMm,widthMm,heightMm,rotation,row,column}`;
- uniform patterns 0° и 90°;
- printable boundaries;
- bleed/gap/cut rules;
- no overlap;
- deterministic structural signature;
- orientation and monotonicity property tests;
- agreement with current capacity calculation for equivalent inputs;
- no DOM/pricing/plan recommendation changes.

### После G0-A

1. G0-B adapter к application geometry;
2. G1 mixed guillotine strips;
3. P0/P1 product allocation;
4. R0 exhaustive small oracle;
5. restricted master;
6. pricing/column generation;
7. control benchmark;
8. operator cases;
9. machine constraints.

## 9. Quality state

Текущие обязательные проверки:

```text
npm run check:docs
npm run check:source
npm test
```

Runtime/UI/PDF изменения дополнительно проходят полный Chromium/PDF workflow и visual artifact review.

## 10. Release status

- root/application restructuring не меняет опубликованный version checkpoint автоматически;
- `0.7.0-alpha.6` не выпускается только из-за документационного или pure-geometry PR;
- version, recovery branch, tag, Release и uNews создаются отдельным release gate;
- root cutover не означает production-ready или stable.

## 11. Неприкосновенные правила

- zero underproduction;
- back derived only from validated front;
- geometry separated from demand and pricing;
- layout forms separated from color plates;
- missing cost remains unavailable;
- operator selection remains explicit;
- fixtures/cases are never trusted without recalculation;
- heuristic result is not called proven optimum;
- search limits and coverage are visible;
- archive branch remains recoverable.
