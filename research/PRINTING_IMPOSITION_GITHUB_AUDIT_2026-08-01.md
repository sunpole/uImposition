# GitHub-аудит полиграфических и оптимизационных решений

Дата исследования: 2026-08-01  
Проект: `sunpole/uImposition`  
Статус: исследовательский источник истины перед продолжением M7.6

## 1. Цель

Проверить, существует ли в открытом GitHub готовое решение, которое можно непосредственно использовать для задачи uImposition:

- геометрическое размещение прямоугольных изделий на печатном листе;
- произвольные стандартные и нестандартные форматы;
- повороты 0°/90° и смешанные ориентации;
- несколько видов и разные тиражи;
- simplex, separate duplex, work-and-turn;
- зеркальный оборот;
- подбор нескольких монтажей и целочисленных прогонов;
- отсутствие недопечатки;
- сравнение бумаги, форм, пластин, прогонов, перетиража и стоимости;
- поздние ограничения машины и дефектных зон;
- сохранение подтверждённых оператором случаев как benchmark и warm start.

## 2. Как проводился аудит

Аудит не означает чтение каждой строки каждого проекта. Для всех 50 выбранных репозиториев проверялись:

1. README и заявленная предметная область;
2. дерево файлов и наличие реального ядра;
3. наличие тестов, examples, fixtures, benchmarks или datasets;
4. используемая математическая или геометрическая модель;
5. поддержка rotation, margins/gaps, defects, duplex/imposition;
6. лицензия и риск прямого переноса кода;
7. практическая роль для uImposition.

Для наиболее сильных проектов дополнительно проверялись конкретные core-файлы, тестовые каталоги и алгоритмические реализации. В эту углублённую группу вошли `pdfcpu`, `Laidout`, `pdfcook`, `rectpack`, `PackingSolver`, `pyckingsolver`, `RectangleBinPack`, `binpackingjs`, `maxrects-packer`, `rectpack2D`, `opcut`, `ColumnGenerationForCutStockProblem`, `Bin_packing_scheduling`, `OR-Tools`, `SCIP` и `Cbc`.

Уровни доказательности:

- **A** — проверены архитектура, core-код/структура алгоритма, тесты или datasets и лицензия;
- **B** — проверены README, исходное дерево и назначение, но проект не является главным алгоритмическим кандидатом;
- **C** — слабый, удалённый, узкий или отрицательный пример; полезен для определения границ, но не как основа.

## 3. Итог в одном абзаце

Готового открытого аналога uImposition не найдено. Открытые проекты хорошо решают отдельные слои: перестановку PDF-страниц, booklet/signature imposition, двумерную упаковку, cutting stock, integer programming или производственное расписание. Ни один из просмотренных репозиториев одновременно не моделирует полиграфические пары страниц, зеркальный оборот, work-and-turn, разные тиражи, несколько монтажей, цветовые пластины и полную стоимость. Однако найдено достаточно зрелых компонентов и научных моделей, чтобы больше не проектировать solver вслепую.

## 4. Матрица 50 репозиториев

### 4.1. Imposition, booklet, PDF и prepress

| № | Репозиторий | Уровень | Что фактически даёт | Решение для uImposition |
|---:|---|:---:|---|---|
| 1 | [`pdfcpu/pdfcpu`](https://github.com/pdfcpu/pdfcpu) | A | Зрелое Go-ядро PDF, команды `nup` и `booklet`, тесты API/CLI/core, rotation, resize, crop, validation, Apache-2.0 | Эталон PDF-перестановки, blank pages и экспортного тестирования; не решает тиражи и стоимость |
| 2 | [`con-f-use/bookletimposer`](https://github.com/con-f-use/bookletimposer) | B | Старое базовое booklet-imposition, GPL-3.0, rehost | Исторический пример; не копировать код и не считать production optimizer |
| 3 | [`HornPenguin/Booklet`](https://github.com/HornPenguin/Booklet) | B | Поддержка booklet/signatures и нескольких размеров сигнатур | Полезен для формул книжного спуска; вне текущего gang-run solver |
| 4 | [`boris42/booklet`](https://github.com/boris42/booklet) | B | macOS-инструмент booklet PDF | Подтверждает узкий класс page-reordering, не production planning |
| 5 | [`cosmix/imposer`](https://github.com/cosmix/imposer) | B | CLI-перестановка страниц для двусторонней печати и складывания | Эталон простого детерминированного порядка страниц |
| 6 | [`brunoscherrer/imposition`](https://github.com/brunoscherrer/imposition) | C | Небольшой booklet-imposition проект | Узкий пример без общей оптимизации |
| 7 | [`gabrielefalcinelli/pdf-imposition-tool`](https://github.com/gabrielefalcinelli/pdf-imposition-tool) | B | Лёгкий браузерный booklet tool | Подтверждает возможность полностью клиентского PDF-процесса |
| 8 | [`do-me/pdf-booklet-imposition`](https://github.com/do-me/pdf-booklet-imposition) | B | Малый статический браузерный инструмент | Полезен как UX/reference, не как solver |
| 9 | [`selwynorren/PDFBooklet`](https://github.com/selwynorren/PDFBooklet) | B | PyQt6: booklet, calendar, single-page, rotation/scale/mirror, live preview, pytest, MIT | Хороший пример разделения UI/core и тестируемых преобразований |
| 10 | [`quickbulletins/bookletize`](https://github.com/quickbulletins/bookletize) | B | Saddle/tri-fold, fold guides, press-ready PDF | Источник правил сгиба и контрольных меток, не gang-run optimization |
| 11 | [`tilacog/booklet-imposition`](https://github.com/tilacog/booklet-imposition) | C | README описывает bleed/signatures, но прежняя реализация удалена | Нельзя считать алгоритмической опорой |
| 12 | [`skfirojali/imposition-studio`](https://github.com/skfirojali/imposition-studio) | C | Один HTML-файл, booklet/zine/crop/bleed; duplex optimization только roadmap | UX-идея, но не доказанное ядро |
| 13 | [`J-code-2/pdf2booklet`](https://github.com/J-code-2/pdf2booklet) | B | Явные формулы cut-stack, blank при нечётном N, margins/gap | Полезный простой fixture для blank/page pairing |
| 14 | [`kimografico/ImposePDF_A5`](https://github.com/kimografico/ImposePDF_A5) | B | A4→A5 saddle-stitch; core выделен отдельно и заявлен как testable | Пример правильного отделения UI от imposition core |
| 15 | [`kiere/imposition_booklet_page_reorder`](https://github.com/kiere/imposition_booklet_page_reorder) | C | Узкий legacy page-reorder проект, документация неполна | Только исторический отрицательный пример |
| 16 | [`ksharindam/pdfcook`](https://github.com/ksharindam/pdfcook) | A | C++ prepress DSL: scale, margin, rotate, flip, move, booklet, 2-up/4-up; GPL-2.0 | Сильный reference для цепочек трансформаций; код не переносить напрямую |
| 17 | [`hanggrian/prepress-adobe-scripts`](https://github.com/hanggrian/prepress-adobe-scripts) | B | Практические Illustrator/Photoshop scripts для коммерческой типографии | Источник операторских правил и автоматизации, не математический solver |
| 18 | [`arajcany/PrePressTricks`](https://github.com/arajcany/PrePressTricks) | B | Набор prepress-задач и скриптов | Поздний источник preflight/production automation |
| 19 | [`rodlie/cyanpdf`](https://github.com/rodlie/cyanpdf) | B | PDF/X converter и prepress pipeline | Полезен для будущего PDF/X/preflight слоя |
| 20 | [`scribusproject/scribus`](https://github.com/scribusproject/scribus) | B | Большой DTP-код и print/PDF ecosystem | Не содержит готового универсального gang-run optimizer; полезен для форматов и prepress-интеграции |
| 21 | [`Laidout/laidout`](https://github.com/Laidout/laidout) | A | DTP, созданный вокруг imposition; отдельные signature/imposition классы, произвольные схемы, GPL-3.0 | Главный reference доменной модели спуска, но не источник кода для текущей лицензии и не optimizer тиражей |
| 22 | [`pdfarranger/pdfarranger`](https://github.com/pdfarranger/pdfarranger) | B | Интерактивная перестановка, crop/rotate и booklet-related тесты | Эталон ручного контроля результата и regression UI |
| 23 | [`torakiki/pdfsam`](https://github.com/torakiki/pdfsam) | B | Зрелые split/merge/mix/rotate PDF операции | Полезен для устойчивого document pipeline, не imposition search |
| 24 | [`qpdf/qpdf`](https://github.com/qpdf/qpdf) | A | Content-preserving PDF transformer с крупной тестовой базой | Надёжный reference для низкоуровневой обработки PDF |
| 25 | [`ArtifexSoftware/ghostpdl`](https://github.com/ArtifexSoftware/ghostpdl) | A | Ghostscript/PDF/PS rendering pipeline | Oracle для рендера и совместимости PDF, не производственный optimizer |

### 4.2. Геометрическое packing/nesting ядро

| № | Репозиторий | Уровень | Что фактически даёт | Решение для uImposition |
|---:|---|:---:|---|---|
| 26 | [`secnot/rectpack`](https://github.com/secnot/rectpack) | A | MaxRects, Skyline, Guillotine, rotation, сортировки, несколько bin-стратегий, тесты, Apache-2.0 | Основной независимый oracle для G0/G1 и сравнения heuristics |
| 27 | [`fontanf/packingsolver`](https://github.com/fontanf/packingsolver) | A | Rectangle/guillotine/irregular solvers, trims, cut thickness, defects, rotations, time limits, large datasets, MIT | Самый сильный внешний geometry oracle; особенно важен для mixed formats и machine defects |
| 28 | [`HamzaYslmn/pyckingsolver`](https://github.com/HamzaYslmn/pyckingsolver) | A | Python/Shapely interface для irregular nesting, holes, spacing, bundled solver, тесты | Удобный experimental oracle; перед заимствованием отдельно проверить противоречивую license metadata |
| 29 | [`juj/RectangleBinPack`](https://github.com/juj/RectangleBinPack) | A | Reference-реализации MaxRects, Guillotine, Shelf и Skyline | Алгоритмический первоисточник для сравнительных тестов и терминологии |
| 30 | [`jakesgordon/bin-packing`](https://github.com/jakesgordon/bin-packing) | B | Простой binary-tree 2D packing | Минимальный baseline; не использовать как доказательство оптимума |
| 31 | [`olragon/binpackingjs`](https://github.com/olragon/binpackingjs) | A | Современный TypeScript MaxRects, 4 heuristics, rotation control, browser-ready, tests, MIT | Практический кандидат для экспериментального JS-backend, но результат heuristic |
| 32 | [`solomon-b/greedypacker`](https://github.com/solomon-b/greedypacker) | A | Несколько 2D packing algorithms, tests/docs/demo; archived | Полезен для differential tests, не как активная зависимость |
| 33 | [`aslamhus/RectanglePacker`](https://github.com/aslamhus/RectanglePacker) | B | Итеративная укладка прямоугольников фиксированного aspect ratio | Узкий baseline для одинаковых изделий |
| 34 | [`bozokopic/opcut`](https://github.com/bozokopic/opcut) | A | Практический cutting-stock optimizer с визуализацией/интерфейсом | Полезен для UX и pattern-output; проверить качество heuristics независимо |
| 35 | [`fabiofdsantos/2d-cutting-stock-problem`](https://github.com/fabiofdsantos/2d-cutting-stock-problem) | B | Genetic algorithm для 2D cutting stock | Источник heuristic/warm-start идей, не completeness proof |
| 36 | [`emadehsan/csp`](https://github.com/emadehsan/csp) | B | Cutting stock на Google OR-Tools | Малый пример связи patterns и integer solver |
| 37 | [`fzsun/cutstock-gurobi`](https://github.com/fzsun/cutstock-gurobi) | B | Cutting-stock model на Gurobi/Python | Reference математической постановки, но коммерческий solver не подходит как обязательная зависимость |
| 38 | [`MasumBhuiyan/2D-Irregular-Cutting-Stock-Algorithm`](https://github.com/MasumBhuiyan/2D-Irregular-Cutting-Stock-Algorithm) | B | Irregular cutting и минимизация отходов | Поздний reference для нестандартных контуров, не текущих прямоугольников |
| 39 | [`mses-bly/2D-Bin-Packing`](https://github.com/mses-bly/2D-Bin-Packing) | B | Irregular piece packing library | Подтверждает необходимость отдельного general nesting layer |
| 40 | [`mapbox/shelf-pack`](https://github.com/mapbox/shelf-pack) | A | Очень быстрый Shelf Best Height Fit для online/dynamic packing; tests; archived | Подходит для preview/warm start, но принципиально не oracle качества печатной раскладки |
| 41 | [`soimy/maxrects-packer`](https://github.com/soimy/maxrects-packer) | A | TypeScript MaxRects, multiple bins, padding, rotation, tests, MIT | Хороший browser differential oracle и источник padding/grouping API |
| 42 | [`TeamHypersomnia/rectpack2D`](https://github.com/TeamHypersomnia/rectpack2D) | A | Быстрая header-only 2D packing library, tests и научные ссылки | Высокопроизводительный oracle; C++/WASM возможен позднее, но не нужен первой версии |
| 43 | [`urraka/texpack`](https://github.com/urraka/texpack) | B | CLI MaxRects, padding и rotation | Ещё один независимый reference для координат и rotation |
| 44 | [`devanandR/CuttingStockProblem`](https://github.com/devanandR/CuttingStockProblem) | B | Учебная реализация cutting stock | Полезна для прозрачных первых fixtures, не production solver |

### 4.3. Pattern selection, integer optimization и печатное расписание

| № | Репозиторий | Уровень | Что фактически даёт | Решение для uImposition |
|---:|---|:---:|---|---|
| 45 | [`mingcaixiao/ColumnGenerationForCutStockProblem`](https://github.com/mingcaixiao/ColumnGenerationForCutStockProblem) | A | Master LP, pricing/subproblem и финальная integer-задача на OR-Tools; C++/Java/C#/Python; MIT | Ключевой архитектурный вывод: не перечислять все patterns заранее, а генерировать выгодные колонки по dual prices |
| 46 | [`mahdims/Bin_packing_scheduling`](https://github.com/mahdims/Bin_packing_scheduling) | A | Два hybrid GA для guillotine cutting + production scheduling именно в printing industry; raw company data и 335 instances; GPL-3.0 | Ближайший предметный benchmark; GA использовать как warm-start/upper bound, данные — как внешний stress corpus |
| 47 | [`google/or-tools`](https://github.com/google/or-tools) | A | CP-SAT, LP/MIP wrappers, bin packing/knapsack, крупные examples/tests, Apache-2.0 | Главный внешний oracle для маленьких и средних master-задач; не обязательная browser dependency |
| 48 | [`scipopt/scip`](https://github.com/scipopt/scip) | A | MIP/MINLP, branch-cut-and-price, exact solving mode, Apache-2.0 | Научный oracle для branch-price и доказуемых bounded-задач |
| 49 | [`coin-or/Cbc`](https://github.com/coin-or/Cbc) | A | Open-source branch-and-cut MILP solver, EPL-2.0 | Альтернативный независимый master oracle |
| 50 | [`chongchonghe/booklet-creator`](https://github.com/chongchonghe/booklet-creator) | B | Простая перестановка PDF для booklet | Дополнительный page-order fixture; не влияет на solver architecture |

## 5. Что обнаружено нового

### 5.1. Предварительное перечисление всех монтажей не масштабируется

Количество допустимых patterns растёт экспоненциально с числом видов и распределений позиций. Это прямо отражено в cutting-stock проектах: полный список колонок быстро становится непрактичным. Следовательно, `buildBoundedCandidateImpositionCatalog()` из draft PR #85 полезен для малых exact-пространств, brute-force oracle и тестирования, но не должен быть главным механизмом больших заказов.

### 5.2. Нужна column-generation архитектура

Правильный большой solver разделяется на:

- **restricted master problem** — выбирает уже известные production patterns и целые длины прогонов;
- **pricing problem** — по dual prices ищет новый геометрически и полиграфически допустимый pattern, который способен улучшить master;
- повторение до отсутствия улучшающих колонок или до честного budget/truncation;
- финальный integer solve или bounded branch-and-price.

Это лучше соответствует работе технолога: не рассматривать все мыслимые формы, а последовательно добавлять только перспективные.

### 5.3. Геометрия должна быть pluggable

Нельзя объявлять один heuristic «правильной формулой». Нужны независимые backend-классы:

1. exact uniform grid 0°;
2. exact uniform grid 90°;
3. exact/bounded mixed-orientation strips;
4. MaxRects/Skyline/Guillotine heuristics;
5. внешний PackingSolver oracle для regression и сложных случаев.

Каждый найденный pattern должен хранить координаты slots, rotation, ограничения реза и coverage/proof status.

### 5.4. PDF-imposition и production optimization — разные подсистемы

Booklet/N-up проекты хорошо решают порядок страниц и рендер PDF, но не знают тиражей, пластин и стоимости. uImposition должен сохранить независимые слои:

- solver формирует production structure;
- page/duplex mapping проверяет лицо и оборот;
- PDF renderer только материализует уже выбранную структуру.

### 5.5. Work-and-turn остаётся собственной полиграфической моделью

Среди просмотренных открытых проектов почти нет полноценного соединения work-and-turn с gang-run quantities. Поэтому преобразование slots, involution, fixed positions, shared plate, красочность и стоимость остаются доменным ядром uImposition.

### 5.6. Дефекты машины имеют готовый математический аналог

PackingSolver уже моделирует defects, forbidden cutting through defects и quality/spacing constraints. Поздние требования владельца — плохая зона листа, дефект барабана, размещение слабозаливочных макетов сверху — должны добавляться как ограничения/штрафы на slots, а не как специальная ветка основного packing-кода.

### 5.7. Heuristics и человеческий опыт нужны, но не доказывают правильность

Genetic algorithms, MaxRects и подтверждённые оператором cases дают хорошие warm starts и верхние границы. Они ускоряют поиск, но каждый план обязан заново пройти:

- zero-underproduction validation;
- geometry/overlap validation;
- front/back/work-and-turn validation;
- production metrics and cost validation.

## 6. Лицензионное решение

- Код MIT/Apache/ISC может рассматриваться для адаптации после проверки конкретных файлов и сохранения notices.
- GPL/AGPL проекты используются как исследовательские references, fixtures или внешние oracles; их код нельзя переносить в uImposition без отдельного лицензионного решения.
- У `pyckingsolver` обнаружено расхождение: текст README заявляет MIT, а GitHub metadata показывает AGPL-3.0. До выяснения лицензии код не переносится.
- Коммерческие solver-зависимости не должны становиться обязательным условием работы браузерного приложения.

## 7. Решение по draft PR #85

PR #85 остаётся draft.

Сохраняется полезная часть:

- exact BigInt count;
- deterministic signatures;
- bounded enumeration малых spaces;
- complete/truncated coverage;
- small brute-force test oracle.

До merge требуется переработка роли модуля:

- переименовать его в small-space/exhaustive candidate oracle;
- не выдавать статический каталог за основной universal solver;
- подключать после geometric pattern interface;
- использовать в differential tests нового pricing subproblem;
- не продолжать large-order development через увеличение `maxDistinctPairs` и `maxCandidates`.

## 8. Чего мы всё ещё не знаем полностью

Аудит существенно уменьшил неопределённость, но не означает, что предметная область закончена. Требуют отдельных исследований и operator fixtures:

- точные производственные правила work-and-tumble/perfecting для конкретных машин;
- ограничения захвата, клапана, реза и расположения меток;
- цветовые/заливочные compatibility constraints;
- многоформатные gang-run patterns с общим резом;
- оценка setup time и смены красок;
- критерии, когда технолог сознательно выбирает больше бумаги ради меньшего риска;
- folding/signature imposition, которое остаётся отдельной product family.

## 9. Обязательные следующие действия

1. Не сливать PR #85 в текущем виде.
2. Зафиксировать новую G/P/R/C/M архитектуру отдельным decision document.
3. Создать устойчивый corpus простых fixtures и property tests.
4. Реализовать exact uniform geometry и mixed-strip generator.
5. Создать малый brute-force production oracle.
6. Реализовать restricted master и pricing interface.
7. Differential-test против `rectpack`/PackingSolver/OR-Tools на малых задачах.
8. Только после этого возвращаться к benchmark 20 файлов и плану `4 impositions / 8 layout forms`.

## 10. Финальный ответ исследования

Мы не «уже знаем всё», но теперь знаем достаточно, чтобы выбрать правильную архитектуру и не тратить месяцы на тупиковое полное перечисление форм. Наиболее важная новая информация — column generation, pluggable geometry backends, использование внешних solvers как regression oracles и строгая роль человеческих cases как warm starts/benchmarks, а не подставных ответов.