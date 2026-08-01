# Research records

Этот каталог хранит исследовательские материалы, которые влияют на архитектуру проекта, но не являются готовой production-реализацией.

## Активное исследование 2026-08-01

- [`PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md`](PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md) — аудит 50 репозиториев по imposition, prepress, packing, cutting stock и optimization.
- [`SOLVER_ARCHITECTURE_DECISION_2026-08-01.md`](SOLVER_ARCHITECTURE_DECISION_2026-08-01.md) — архитектурное решение G/P/R/C/M/E, column generation и пересмотр роли draft PR #85.
- [`UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md`](UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md) — обязательная последовательность D1 → G0/G1 → P0/P1 → R0/R1/R2/R3 → benchmark → operator cases → machine constraints.

## Архивная точка

Состояние проекта до root cutover и universal-solver rebuild сохранено в ветке:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

Исходный commit: `b9d83855ff685bb38831670fb0c3975bbd1bdbc4`.

## Правила

- research-документ не делает код production-ready;
- внешняя лицензия проверяется до любого заимствования;
- benchmark и operator case не подставляются как ответ без повторной валидации;
- после утверждения решения устойчивые правила переносятся в канонические документы `docs/` отдельным PR;
- исторические research records не переписываются задним числом: новое исследование создаёт новый датированный документ;
- архивная ветка не удаляется до стабильного `1.0.0` и отдельного решения владельца.
