# M7.6 — чистая модель сравнительной таблицы

Статус: **первый функциональный патч M7.6**.  
Версия проекта пока остаётся `0.7.0-alpha.5`; release checkpoint `0.7.0-alpha.6` создаётся только после завершения всего M7.6 UI/evidence цикла.

## Цель

Создать независимую от DOM модель одной строки на каждый допустимый пользовательский production plan.

Модель должна подготовить данные для будущей компактной desktop/mobile таблицы, но не должна:

- заново генерировать схемы;
- пересчитывать production report;
- менять recommendation;
- заменять selection оператора;
- удалять планы из lossless-каталога;
- расширять search space.

## Вход

`createUserProductionComparisonTable(planSet, options)` принимает существующий user production plan set:

- `plans` — полные проверенные plan-объекты;
- `catalog.entries` — ranks, Pareto, dominated и recommendation annotations;
- `catalog.summary.hiddenSolutionCount === 0`.

Каждая catalog entry обязана иметь ровно один исходный plan с тем же ID.

## Выход

Модель возвращает:

- `allRows` — одна строка на каждый catalog plan;
- `rows` — текущий filtered/sorted view;
- `columns` — все определения колонок с признаками `available`, `differs`, `visible`;
- `visibleColumns` — representation для режима `Только различия`;
- `referencePlanId` — выбранный plan, если он есть, иначе recommendation;
- exact numeric `deltas` относительно reference;
- summary `reusedPlanCount` и `regeneratedPlanCount`.

`allRows[].plan` хранит исходный plan по ссылке. Модель не клонирует и не перестраивает layouts/reports.

## Колонки первого патча

- label, rank и status;
- physical sheets;
- paper weight;
- layout forms;
- color plates;
- press passes;
- pair/file overrun;
- split orders;
- imposition count;
- paper cost;
- color plate cost;
- layout-form preparation cost;
- estimated total/unit cost;
- proof status;
- orientation и grid;
- plan-family;
- duplex mode.

Отсутствующая стоимость остаётся `null`. Таблица не подменяет её нулём.

## Filters и sorting

Поддерживаются view-only параметры:

- `all / pareto / recommended / dominated`;
- plan-family;
- duplex mode;
- sorting по любой известной колонке;
- `onlyDifferences`.

Filtering и sorting меняют только `rows`. `allRows`, исходный catalog и plan references остаются неизменными.

## Режим `Только различия`

Обязательные identity/status колонки остаются видимыми всегда.

Остальная колонка видима, только если её значения различаются среди текущих view rows. Если все денежные значения отсутствуют, денежные колонки не становятся различающимися и не получают ложный ноль.

## Proof status

Первый патч различает:

- `provenPaperMinimum` — lower bound действительно достигнут;
- `completeWithinFamily` — конструкция полна внутри заявленной plan-family;
- `feasible` — допустимый проверенный вариант без более сильного доказательства.

Эти статусы не означают глобальную полноту общего solver.

## Неприкосновенные правила

- underproduction по-прежнему запрещена upstream validation;
- recommendation является аннотацией;
- selected plan остаётся независимым;
- filters не удаляют catalog data;
- missing pricing не становится zero;
- bounded scope не выдаётся за глобально полный;
- `regeneratedPlanCount` для этой модели всегда `0`.

## Тесты

Unit tests обязаны доказать:

1. все планы и source object references сохранены;
2. filters/sorting меняют только view;
3. `Только различия` сохраняет обязательные колонки;
4. exact deltas считаются от selection/recommendation;
5. missing pricing остаётся `null` и сортируется после реальных чисел;
6. неполный catalog/plan mapping отклоняется.

## Следующий патч M7.6

После merge этой pure model:

1. добавить компактный table renderer;
2. подключить runtime selection и objective state;
3. добавить desktop/mobile controls для filters, sorting и `Только различия`;
4. переиспользовать существующую панель details/PDF выбранного плана;
5. добавить Chromium evidence;
6. только затем готовить `0.7.0-alpha.6` release checkpoint.
