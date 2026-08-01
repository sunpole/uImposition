# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Первая точка входа для нового чата, устройства или разработчика.  
> GitHub — единственный источник истины.

## 1. Текущая точка

- репозиторий: `https://github.com/sunpole/uImposition`;
- рабочая ветка: `main`;
- фактический post-R0 checkpoint: `a0fe6edb8092e706572493f2534cc698b935262e`;
- опубликованный version checkpoint остаётся `0.7.0-alpha.5`;
- рабочее приложение: корневой GitHub Pages URL перенаправляет в `/app/`;
- состояние до universal-solver rebuild сохранено в `archive/pre-universal-solver-rebuild-2026-08-01`;
- основной backlog: Issue `#83`;
- PR `#85`, `#96` и `#98` закрыты без merge как superseded; полезные идеи перенесены в новые слои;
- version/release не обновляются автоматически вместе с pure solver PR.

Последний доказательный gate:

- PR `#103` — random-small differential validation;
- exact-head Quality: `405/405` Node tests;
- simplex и separate-duplex master results совпали с независимым exhaustive oracle.

## 2. Главное архитектурное решение

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
14. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
15. Issue `#83`, open PR, latest Actions, branches, tags и Releases.

Если документация противоречит фактическому GitHub, сначала исправить канонический документ.

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

## 5. Что работает в пользовательском runtime

- versioned application state, local persistence и sheet/press presets;
- product rows, простой/расширенный TXT и контрольный заказ;
- current uniform `0°/90°` calculation;
- page pairs и odd technical blank;
- validated front и mirrored back;
- separate duplex и ограниченная user work-and-turn family;
- production metrics, pricing, alternatives, priorities и explicit selection;
- schemes, report и selected-plan PDF;
- desktop/mobile Chromium/PDF regression.

Runtime пока не переключён на новый G/P/R/C pipeline. Старые проверенные модули являются regression foundation и не удаляются без migration parity.

## 6. Что уже реализовано в новом solver foundation

### G — geometry

- PR `#89`: immutable GeometryPattern и exact uniform grids `0°/90°`;
- PR `#90`: adapter текущих sheet/trim/press inputs;
- PR `#91`: generalized uniform/mixed-strip geometry contract;
- PR `#92`: exact bounded horizontal/vertical mixed-strip generation.

### P — production assignment

- PR `#93`: single-product simplex/separate-duplex pattern;
- PR `#94`: horizontal work-and-turn через реальные slot orbits;
- PR `#95`: exact all-positive multi-product simplex allocations на одной форме;
- PR `#97`: exact simplex candidate columns с нулевыми subsets;
- PR `#100`: exact separate-duplex candidate columns с derived mirrored back.

### R0 — exact small oracle

- PR `#99`: bounded exact simplex small master;
- PR `#102`: общий exact production master для simplex и separate-duplex families;
- PR `#103`: independent random-small differential validation.

Ключевые свойства:

- exact BigInt state counts;
- explicit bounded completeness;
- zero underproduction;
- immutable structural signatures;
- lossless feasible plans;
- Pareto как аннотация без удаления;
- фактические forms/plates/passes из column contract;
- запрет смешивания несовместимых print strategies.

## 7. Честная граница текущего нового solver

Новый foundation пока не является large-order runtime и не умеет полностью:

- restricted-master relaxation и bounds/gap;
- pricing subproblem и column generation;
- большие заказы без полного static column catalog;
- mixed physical formats;
- arbitrary MaxRects/Skyline/general packing;
- multi-product work-and-turn/work-and-tumble/perfecting;
- machine defect zones и placement compatibility;
- operator case memory;
- pricing/cost objectives внутри нового master;
- подключение нового master к `/app/`, report и PDF;
- доказанный global optimum произвольного заказа.

Сохранённые benchmark layouts не являются production answers.

## 8. Следующий обязательный кодовый этап

### R1-A — restricted master contract

Создать pure, solver-agnostic contract поверх существующих production columns:

- canonical coefficient matrix `a[p,i]`;
- compatible print-family identity;
- demand vector;
- initial selected column set;
- integer/relaxed solution models;
- objective vector и production metrics projection;
- lower/upper bounds, gap и solver status;
- explicit complete/truncated/unsupported state;
- no DOM, pricing UI или PDF dependency.

Acceptance:

- simplex и separate-duplex catalogs преобразуются в одинаковую master matrix;
- every coefficient equals exact `positionsPerSheet`;
- incompatible family/geometry/demand catalogs rejected;
- dedicated/mixed columns retained losslessly;
- small fixture solution can be checked against R0 exact oracle;
- no claim that a restricted column set proves global optimum.

После R1-A:

1. relaxed/integer restricted-master backend;
2. external OR-Tools/SCIP/Cbc differential fixtures;
3. R2 pricing request/response contract;
4. bounded master → pricing loop;
5. historical 20-file benchmark;
6. operator case memory;
7. machine constraints.

## 9. Неприкосновенные правила

- недопечатка запрещена;
- back выводится только из validated front/transform;
- geometry не содержит тиражей и цен;
- production assignment ссылается на реальные slots;
- layout forms и color plates различаются;
- missing cost не равна нулю;
- operator selection независим от recommendation;
- case memory — warm start/benchmark, а не подстановка ответа;
- heuristic/restricted result не называется proven global optimum;
- truncation, bounds и coverage всегда видимы;
- одна ветка/PR — одна измеримая цель;
- version/release work отделены от solver work.

## 10. Проверки

```bash
npm run check
```

Pure solver/test PR требуют exact-head Quality. Runtime/UI/PDF изменения дополнительно требуют полного Chromium/PDF workflow и визуального просмотра artifacts.

## Prompt для следующей сессии

```text
Открой https://github.com/sunpole/uImposition и работай только по фактическому GitHub. Прочитай AGENTS.md, START_HERE.md, docs/CURRENT_STATE.md, docs/CODEX_HANDOFF.md, docs/ARCHITECTURE.md, docs/ALGORITHM_AND_OPTIMIZATION.md, docs/TEST_PLAN.md и docs/REMAINING_WORK.md. Архив до rebuild находится в archive/pre-universal-solver-rebuild-2026-08-01. G0, G1, P0, P1 и R0 exact small oracle завершены через PR #89–#103; последний proof gate — 405/405 tests. Следующая кодовая цель — pure R1 restricted-master contract и canonical coefficient matrix поверх существующих simplex/separate-duplex production columns, без UI и без ложного global-optimum claim.
```
