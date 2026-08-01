# uImposition

<p align="center"><strong>Расчёт и оптимизация офсетных монтажей · Offset Imposition Planning</strong></p>
<p align="center"><strong>Опубликованный checkpoint: 0.7.0-alpha.5 · рабочая разработка продолжается в main</strong></p>
<p align="center"><strong><a href="https://sunpole.github.io/uImposition/">Открыть программу</a> · <a href="START_HERE.md">Начать разработку</a> · <a href="docs/README.md">Документация</a></strong></p>

## Назначение

uImposition — браузерная система для расчёта листовых офсетных монтажей. Цель проекта — не подставлять один шаблонный ответ, а строить и проверять реальные производственные планы:

- геометрически размещать стандартные и нестандартные изделия;
- учитывать поворот `0°/90°`, выпуск, рез, поля и рабочую область листа;
- рассчитывать simplex, separate duplex и допустимые варианты своего оборота;
- подбирать несколько монтажей и целочисленные длины прогонов без недопечатки;
- считать физические листы, layout-формы, цветовые пластины, листопрогоны, перетираж и стоимость;
- сохранять конструктивно разные допустимые решения;
- показывать рекомендацию, но оставлять окончательный выбор оператору;
- запоминать подтверждённые человеком случаи как benchmarks и warm starts, а не как непроверяемые готовые ответы.

## Рабочее приложение

GitHub Pages открывает актуальный operator-first интерфейс из каталога [`app/`](app/). Корневой `index.html` выполняет только стабильный переход в рабочее приложение.

Состояние до этого переключения полностью сохранено в ветке:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

Архивная ветка содержит прежнюю корневую оболочку, старые UI-модули, расчётное ядро, тесты и документацию на commit `b9d83855ff685bb38831670fb0c3975bbd1bdbc4`.

## Что уже работает

- application state и локальные пресеты листа/машины;
- строки продукции, импорт TXT и контрольный заказ;
- uniform geometry `0°/90°`;
- последовательные пары страниц и технически пустая сторона нечётной пары;
- проверяемые лицо и зеркальный оборот;
- separate front/back и ограниченная пользовательская family своего оборота;
- несколько plan-family, lossless catalog, Pareto и приоритеты оператора;
- стоимость бумаги, пластин и подготовки;
- выбор любого варианта;
- схемы, производственный отчёт и PDF;
- desktop/mobile Chromium regression.

Текущий solver остаётся ограниченным. Он ещё не является универсальным оптимизатором произвольных многовидовых заказов.

## Новая архитектура универсального solver

После аудита 50 GitHub-репозиториев проект разделён на независимые слои:

```text
N — нормализация заказа
G — геометрические patterns и реальные slots
P — назначение видов, страниц и сторон
R — целочисленные длины прогонов
C — restricted master + pricing/column generation
M — ограничения машины и зон листа
E — экспорт, объяснение и operator case memory
```

Для маленьких задач используется полный перебор как математический oracle. Для больших заказов нельзя заранее хранить все возможные монтажи: основной путь — restricted master и on-demand pricing/column generation.

Ключевые документы:

- [Аудит 50 репозиториев](research/PRINTING_IMPOSITION_GITHUB_AUDIT_2026-08-01.md)
- [Архитектурное решение после аудита](research/SOLVER_ARCHITECTURE_DECISION_2026-08-01.md)
- [Порядок реализации universal solver](research/UNIVERSAL_SOLVER_IMPLEMENTATION_PLAN.md)
- [Актуальная архитектура](docs/ARCHITECTURE.md)
- [Алгоритм и оптимизация](docs/ALGORITHM_AND_OPTIMIZATION.md)
- [План доказательных тестов](docs/TEST_PLAN.md)
- [Оставшиеся работы](docs/REMAINING_WORK.md)

## Внешние опоры

Мы не копируем один чужой проект целиком. Разные проекты используются по своим сильным сторонам:

- `pdfcpu`, `Laidout`, `pdfcook` — page imposition, signatures и PDF transformations;
- `rectpack`, `PackingSolver`, `RectangleBinPack`, `binpackingjs` — geometry packing и rotation;
- OR-Tools, SCIP, Cbc и cutting-stock examples — integer master problem;
- column-generation repositories — restricted master/pricing cycle;
- printing-industry scheduling research — производственные benchmarks;
- Ghostscript, qpdf и Poppler — независимая проверка PDF.

Полная матрица, лицензии и ограничения находятся в research-аудите.

## Следующий кодовый порядок

1. `G0`: точные uniform grids `0°/90°` с явными координатами slots.
2. `G1`: смешанные guillotine strips `0°+90°`.
3. `P0/P1`: один и несколько видов на одном pattern.
4. Малый полный run-length solver и brute-force oracle.
5. Restricted master.
6. Pricing subproblem и column generation.
7. Differential tests против внешних solvers.
8. Исторический заказ на 20 файлов как поздний benchmark.
9. Operator case memory.
10. Machine-zone constraints и ручные технологические предпочтения.

## Неприкосновенные правила

- недопечатка запрещена;
- оборот выводится только из проверенного лица;
- геометрия и производственные назначения разделены;
- layout-формы и цветовые пластины считаются отдельно;
- отсутствующая стоимость не равна нулю;
- ручной fixture не выдаётся за automatic solver;
- сохранённый case всегда повторно валидируется и пересчитывается;
- ограниченный поиск не называется глобально полным;
- filters и recommendation не удаляют допустимые планы;
- root cutover, version bump и release — разные операции.

## Разработка и проверки

```text
feature branch
→ draft PR
→ exact-head Quality
→ Chromium/PDF, когда затронут runtime или экспорт
→ visual review
→ merge
```

Основная команда:

```bash
npm run check
```

GitHub остаётся единственным источником истины.
