# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> GitHub — единственный источник истины.

## 1. Текущая точка

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- последний архитектурный merge перед rebuild: PR `#87`, commit `b9d83855ff685bb38831670fb0c3975bbd1bdbc4`;
- опубликованный version checkpoint остаётся `0.7.0-alpha.5`;
- рабочее приложение: `https://sunpole.github.io/uImposition/` → `/app/`;
- прежнее состояние сохранено в `archive/pre-universal-solver-rebuild-2026-08-01`;
- основной universal-solver backlog: Issue `#83`;
- draft PR `#85` не является будущим large-order solver и сохраняется только как материал для small-space exhaustive oracle;
- production code, version и release не обновляются автоматически вместе с архитектурными PR.

## 2. Главное решение

После аудита 50 GitHub-репозиториев solver строится слоями:

```text
N — нормализация заказа
G — геометрические patterns и slots
P — назначение изделий, страниц и сторон
R — целочисленные прогоны
C — restricted master + pricing/column generation
M — machine/operator constraints
E — explanation, export и case memory
```

Большие заказы нельзя решать предварительным хранением всех возможных монтажей. Полный перебор используется только как точный oracle для малых задач. Основной large-order путь — restricted master и on-demand pricing.

## 3. Что читать перед изменениями

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `README.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/CODEX_HANDOFF.md`;
6. `docs/ARCHITECTURE.md`;
7. `docs/ALGORITHM_AND_OPTIMIZATION.md`;
8. `docs/TEST_PLAN.md`;
9. `docs/REMAINING_WORK.md`;
10. `research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`;
11. `research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`;
12. `research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`;
13. `docs/PROJECT_CATALOG.md`;
14. Issue `#83`, open PR, latest Actions, branches, tags и Releases.

Если документация противоречит фактическому GitHub, сначала исправить источник истины.

## 4. Рабочее приложение и архив

Корневой GitHub Pages URL открывает operator-first приложение из `app/`.

Ветка:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

сохраняет прежнюю корневую оболочку, legacy UI, расчётные модули, тесты и документацию на commit:

```text
b9d83855ff685bb38831670fb0c3975bbd1bdbc4
```

Архив не удалять до стабильного `1.0.0` и отдельного решения владельца.

## 5. Что уже работает

- application state, local persistence и sheet/press presets;
- product rows, простой/расширенный TXT и контрольный заказ;
- current uniform `0°/90°` geometry;
- page pairs, odd technical blank, front и mirrored back;
- separate duplex и ограниченный user work-and-turn;
- production metrics, pricing, alternatives, priorities и selection;
- schemes, report и PDF;
- desktop/mobile Chromium/PDF regression.

Эти модули являются regression foundation. Их нельзя удалять только потому, что они были созданы раньше.

## 6. Честная граница текущего solver

Текущий runtime не умеет полностью:

- mixed physical formats;
- mixed `0°+90°` slots на одной форме;
- общий multi-pattern run-length search;
- column generation;
- все simplex/duplex/work-and-turn combinations;
- machine defect zones;
- operator case memory;
- доказанный global optimum произвольного заказа.

Сохранённые benchmark layouts не являются production answers.

## 7. Следующий обязательный кодовый этап

### G0-A — pure geometry

Создать:

```text
src/geometric-pattern.js
src/uniform-grid-patterns.js
tests/geometric-pattern.test.js
tests/uniform-grid-patterns.test.js
```

Требования:

- реальные slot coordinates;
- patterns 0° и 90°;
- printable bounds;
- gap/bleed/cut rules;
- deterministic signatures;
- no overlap;
- property tests;
- comparison с текущим `calculatePlacementOptions()`;
- никаких UI, pricing или recommendation изменений.

После G0-A — adapter G0-B, затем mixed strips G1.

## 8. Неприкосновенные правила

- недопечатка запрещена;
- back выводится только из validated front;
- geometry не содержит тиражей и цен;
- production pattern ссылается на реальные slots;
- layout forms и color plates различаются;
- missing cost не равна нулю;
- operator selection независим от recommendation;
- case memory — warm start/benchmark, а не подстановка ответа;
- heuristic result не называется proven optimum;
- truncation и coverage всегда видимы;
- одна ветка/PR — одна измеримая цель.

## 9. Проверки

```bash
npm run check
```

Runtime/UI/PDF изменения дополнительно требуют полного Chromium/PDF workflow и визуального просмотра artifacts.

## Prompt для следующей сессии

```text
Открой https://github.com/sunpole/uImposition и работай только по фактическому GitHub. Прочитай AGENTS.md, START_HERE.md, docs/CURRENT_STATE.md, docs/ARCHITECTURE.md, docs/ALGORITHM_AND_OPTIMIZATION.md, docs/TEST_PLAN.md и research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md. Состояние до rebuild находится в archive/pre-universal-solver-rebuild-2026-08-01. Не развивай draft PR #85 как large-order solver. Следующая кодовая цель — pure G0 uniform geometry patterns с реальными slots, строгой validation и тестами, без UI-изменений.
```
