# uImposition — передача разработки в Codex Work

Дата передачи: **27 июля 2026**  
Репозиторий: **https://github.com/sunpole/uImposition**  
GitHub — единственный источник истины.

## 1. Точная точка передачи

- актуальная ветка разработки: `main`;
- точный commit после объединения PR `#46`: `009451cce94d5cde05ee72305f30447aa65a646c`;
- опубликованный version checkpoint: `0.7.0-alpha.4` / M7.4;
- `main` уже содержит **неопубликованный функциональный объём M7.5**, поэтому код находится впереди VERSION-файлов;
- следующий обязательный release checkpoint: **`0.7.0-alpha.5` / M7.5**;
- до нового функционального milestone сначала нужно проверить и опубликовать M7.5 по правилам проекта.

Последние объединённые функциональные PR:

- `#44` — пользовательские uniform-grid production plans;
- `#45` — явный выбор любого плана, реальные схемы, production report и PDF выбранного плана;
- `#46` — полный редактор порядка целей без повторной генерации планов.

Проверенный head PR `#46`: `ca89cd0f6a7243fb78c3c5ec04a44635c8d75007`.

Проверки PR `#46`:

- Quality: `173/173` теста;
- Chromium/PDF workflow: success;
- uNews validation: success;
- desktop/mobile focused screenshots визуально проверены;
- merge commit в `main`: `009451cce94d5cde05ee72305f30447aa65a646c`.

## 2. Обязательный порядок чтения

Перед любыми изменениями прочитать:

1. `AGENTS.md`;
2. `START_HERE.md`;
3. `docs/CODEX_HANDOFF.md`;
4. `VERSION.json`, `VERSION.md`, `CHANGELOG.md`;
5. `docs/CURRENT_STATE.md`;
6. `docs/REMAINING_WORK.md`;
7. `docs/TECHNICAL_SPECIFICATION_RU.md`;
8. `docs/ARCHITECTURE.md`;
9. `docs/M7_4_WORK_AND_TURN.md`;
10. `docs/M7_5_USER_UNIFORM_PRODUCTION_PLANS.md`;
11. `docs/M7_5_USER_PLAN_SELECTION_EXPORT.md`;
12. `docs/M7_5_OBJECTIVE_PRIORITY_EDITOR.md`;
13. `docs/PRODUCTION_COSTING.md`;
14. `docs/TEST_PLAN.md`;
15. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
16. `docs/VERSIONING.md`;
17. `docs/NEWS_PUBLISHING.md`;
18. последние PR, Actions, branches, tags, Releases и открытые issues.

Если документация противоречит коду или GitHub-состоянию, нельзя молча выбирать удобную сторону. Нужно зафиксировать расхождение и исправить источник истины в том же PR либо отдельным документационным PR.

## 3. Назначение продукта

uImposition — статический браузерный калькулятор и планировщик монтажей для листовой офсетной печати.

Цель продукта:

- принять реальные параметры листа, изделия и заказов;
- определить, что технологически возможно в заданных условиях;
- построить **все допустимые варианты внутри явно описанной области поиска**;
- не удалять дорогие, доминируемые или невыгодные варианты;
- считать бумагу, формы, цветовые пластины, прогоны, перетираж и себестоимость;
- показывать компромиссы;
- позволять оператору менять цели и выбирать решение самостоятельно;
- выдавать реальные схемы, production report и PDF выбранного решения;
- никогда не принимать недопечатку.

Главный принцип продукта:

> Рекомендация — это метка, а не способ скрыть остальные допустимые варианты.

## 4. Технологическая основа

- статический GitHub Pages сайт;
- обычные HTML/CSS/JavaScript ES modules;
- без обязательного build step;
- расчёты выполняются локально в браузере;
- чистые доменные модули не используют DOM;
- Node built-in test runner;
- Playwright используется в GitHub Actions для реального Chromium evidence;
- PDF создаётся собственным dependency-free PDF-слоем;
- сервер и база данных пока не требуются.

## 5. Неприкосновенные производственные правила

Эти правила нельзя ослаблять ради прохождения теста или красивого UI:

1. Недопечатка всегда запрещена.
2. Оборот строится только из проверенного лица, а не независимо.
3. Геометрия должна находиться внутри фактической печатной области.
4. Зачистка листа и непечатные поля машины — разные этапы.
5. Layout-формы сторон и цветовые пластины — разные метрики.
6. Рабочие цены вводит оператор; placeholder/demo не становятся defaults.
7. Отсутствующая стоимость не превращается в ноль.
8. Paper minimum не означает minimum forms, minimum cost или global best.
9. Ручной fixture не выдаётся за automatic solver.
10. Ограниченный search не выдаётся за полный глобальный перебор.
11. Явный выбор оператора не заменяется новой рекомендацией.
12. Все допустимые варианты сохраняются; фильтры меняют только представление.
13. Нельзя заявлять совместимость work-and-turn с машиной без технологической проверки оператора.
14. Новая расчётная логика создаётся как чистый модуль с unit-тестами.
15. `src/app.js` остаётся координатором интерфейса, а не местом производственных формул.

## 6. Что уже работает из пользовательского ввода

### Геометрия

Пользователь может задавать:

- произвольные ширину и высоту листа;
- стадию размера — до или после зачистки;
- зачистку одинаковую или раздельную по четырём сторонам;
- непечатные поля машины;
- ширину и высоту изделия;
- выпуск;
- общий или раздельный рез;
- дополнительный зазор.

Программа считает печатную область и fitting uniform-grid варианты `0°` и `90°`.

### Заказы

Пользователь вводит строки вида:

```text
файл | тираж | страниц | примечание
```

Программа:

- валидирует строки;
- разворачивает страницы в последовательные front/back pairs;
- считает потребность каждой пары;
- запрещает пользовательский duplex production plan для неполной последней пары, чтобы не создать ложную оборотную пластину.

### Пользовательские production plans

Для каждой fitting ориентации `0°/90°` сейчас строятся две plan-family:

1. `paperMinimum` — paper-focused результат minimizer;
2. `dedicatedPairForms` — отдельная полностью заполненная форма для каждой печатной пары.

Каждый план:

- materialize-ится в реальные front/back layouts;
- повторно проходит `validateImposition`;
- получает независимый production report;
- имеет нулевую недопечатку;
- считает physical sheets, layout forms, color plates, press passes и overrun;
- при готовом прайсе получает себестоимость BYN;
- попадает в lossless-каталог независимо от выгодности.

### Выбор и экспорт

Оператор может выбрать любой план, а не только рекомендованный.

Для выбранного плана работают:

- summary метрик;
- preview реальных front/back схем;
- динамический production report;
- file totals;
- print-pair details и contributions;
- PDF схем;
- PDF production report.

Preview ограничен первыми восемью монтажами, но PDF строится из полного выбранного плана. Интерактивный PDF схем имеет явный лимит 120 монтажей, чтобы не зависал браузер.

### Цели и рекомендации

При готовом прайсе доступны 11 целей:

1. physical sheets;
2. estimated total cost;
3. layout forms;
4. color plates;
5. file overrun;
6. pair overrun;
7. press passes;
8. split orders;
9. imposition count;
10. layout compactness;
11. distinct orders per imposition.

Оператор может:

- применять presets `По умолчанию / Бумага / Стоимость / Формы / Прогоны / Перетираж`;
- перемещать цели стрелками;
- использовать drag-and-drop на desktop;
- видеть фиксированные hard constraints отдельно.

Повторное ранжирование:

- использует те же plan-объекты;
- не перестраивает layouts и reports;
- меняет только objective order, ranks, recommendation и Pareto-аннотации;
- сохраняет выбранный оператором plan ID.

## 7. Фактическая граница поиска

Текущий пользовательский каталог полный только внутри следующей finite scope:

```text
один общий формат изделия
× uniform grid
× fitting rotation 0° или 90°
× две plan-family
× separate front/back forms
× одна общая duplex-цветность для всех строк
× полные front/back page pairs
```

Следовательно, сейчас нельзя утверждать, что программа нашла все технологически возможные монтажи для произвольного реального заказа.

## 8. Что ещё не реализовано

### Расширение пространства вариантов

- дополнительные plan-family;
- bounded search разных последовательностей форм и тиражей;
- комбинации частично заполненных форм;
- общий user-driven automatic work-and-turn search;
- вертикальный turn axis;
- mixed-format automatic rectangle packing;
- mixed rotations `0° + 90°` на одном листе;
- оценка резки и сборки;
- автоматическое доказательство полноты для расширенного search space.

### Полноценная строка заказа

Для каждого файла отдельно ещё нужны:

- ширина и высота;
- выпуск и зазор;
- режим резки;
- цветность лица и оборота;
- допустимая технология оборота;
- тип/плотность бумаги;
- редактирование, дублирование, удаление и сортировка.

### Другие типы работ

- односторонние работы;
- нечётные страницы и осознанно пустой оборот;
- тетрадный/фальцевальный спуск;
- доказанная пагинация 8/16/32-страничных изделий;
- машинные профили и технологическая совместимость.

### Экономика

Сейчас считается производственная себестоимость. Для понятия «убыточный вариант» ещё нужны:

- цена продажи или выручка;
- прибыль/убыток;
- маржа;
- минимальная допустимая маржа;
- стоимость резки, фальцовки и других операций.

Убыточный вариант должен оставаться в каталоге, но получать явную метку и объяснение.

### Рабочий цикл

- сохранение последнего проекта в browser storage;
- versioned JSON export/import;
- миграции старых проектов;
- сохранение pricing profile и выбранного решения;
- package export;
- тяжёлый search worker;
- progress, cancel, time/memory limits и безопасное восстановление.

### Интерфейс и стабильность

- единая компактная сравнительная таблица всех вариантов;
- режим `Только различия`;
- точные component deltas;
- фильтр duplex strategy;
- полная компактность всей страницы;
- клавиатурная навигация и accessibility audit;
- полная RU/EN parity;
- browser/GitHub Pages matrix;
- реальные beta production fixtures.

## 9. Архитектурная карта актуального M7.5

### Ввод и геометрия

- `src/config.js` — производственные пресеты и limits;
- `src/geometry.js` — лист, зачистка, поля и fitting grids;
- `src/orders.js` — строки заказа и page pairs;
- `src/orientation.js` — направления и повороты.

### Формирование и проверка монтажей

- `src/front-layout.js`;
- `src/back-layout.js`;
- `src/imposition-validation.js`;
- `src/imposition-candidate.js`;
- `src/candidate-generator.js`;
- `src/paper-minimizer.js`;
- `src/mixed-format-layout.js` — только validation заданного mixed fixture, не automatic packing.

### Duplex и work-and-turn

- `src/print-specification.js`;
- `src/duplex-strategies.js`;
- `src/work-and-turn-layout.js`;
- `src/work-and-turn-control-case.js`;
- `src/work-and-turn-runtime.js`;
- `src/work-and-turn-ui.js`.

### Производство и стоимость

- `src/production-metrics.js`;
- `src/production-validation.js`;
- `src/production-report.js`;
- `src/production-cost.js`;
- `src/solution-metrics.js`;
- `src/production-solution-metrics.js`.

### Альтернативы и решения

- `src/optimization-objectives.js`;
- `src/decision-profile.js`;
- `src/pareto-alternatives.js`;
- `src/feasible-solution-catalog.js`;
- `src/production-alternative-set.js`;
- `src/alternative-explanations.js`.

### Пользовательский M7.5 pipeline

- `src/user-uniform-production-plans.js` — создаёт пользовательские планы;
- `src/user-production-plans-ui.js` — lossless-каталог;
- `src/user-production-plans-runtime.js` — plan set, selection и objective preference;
- `src/user-production-plan-details-ui.js` — выбранные схемы/report/PDF;
- `src/user-objective-priority.js` — pure reranking;
- `src/user-objective-priority-ui.js` — desktop/mobile редактор целей.

### PDF

- `src/pdf-document-model.js`;
- `src/pdf-binary.js`;
- `src/pdf-scheme-renderer.js`;
- `src/pdf-report-renderer.js`;
- `src/pdf-export-ui.js`.

### Проверки

- `package.json` / `npm run check`;
- `tests/*.test.js`;
- `.github/workflows/quality.yml`;
- `.github/workflows/capture-screenshots.yml`;
- `tools/screenshots/scenarios/*.json`;
- `pdfinfo` и Poppler внутри Actions.

## 10. Первый обязательный этап для Codex

Не начинать новый большой solver сразу.

Сначала выполнить release checkpoint M7.5:

1. проверить `main` на commit `009451cce94d5cde05ee72305f30447aa65a646c`;
2. проверить последние PR `#44`, `#45`, `#46` и их Actions;
3. провести documentation/version audit;
4. синхронизировать `VERSION.json`, `VERSION.md`, `CHANGELOG.md`, README, `START_HERE.md`, видимую версию сайта и screenshot assertions до `0.7.0-alpha.5`;
5. создать focused release screenshot реальной новой функции;
6. создать patchnote и uNews/Telegram payload;
7. создать permanent evidence archive и release manifest;
8. пройти exact-head Quality и Chromium/PDF;
9. объединить version/publication PR;
10. создать recovery branch `release/v0.7.0-alpha.5`;
11. создать immutable tag `v0.7.0-alpha.5`;
12. создать настоящий GitHub prerelease с image и evidence ZIP;
13. независимо проверить Release card и каждый asset;
14. только после этого начинать M7.6.

## 11. Следующий функциональный этап после alpha.5

Рекомендуемый M7.6:

### Цель

Завершить операторское сравнение и подготовить архитектуру к расширению search space.

### Минимальный состав

- компактная таблица: одна строка на каждый допустимый вариант;
- `Все / Pareto / Рекомендуемые / Доминируемые`;
- `Только различия`;
- сортировка без удаления вариантов;
- точные колонки: sheets, weight, layout forms, plates, passes, pair/file overrun, paper cost, form cost, total cost, unit cost;
- duplex strategy и plan-family;
- раскрытие схем/report только выбранного варианта;
- desktop/mobile evidence;
- отсутствие повторной генерации при фильтрах и сортировке.

После M7.6 переходить к отдельным небольшим патчам расширения plan-family, а не пытаться реализовать весь mixed solver одним гигантским PR.

## 12. Правильный процесс работы Codex

Для каждого патча:

1. определить одну измеримую цель;
2. создать отдельную ветку;
3. сначала добавить/уточнить pure model и tests;
4. затем подключить runtime/UI;
5. не ослаблять validation ради теста;
6. добавить desktop/mobile Chromium scenario для пользовательского изменения;
7. открыть draft PR;
8. исправить все exact-head сбои;
9. скачать quality/screenshot artifacts;
10. визуально проверить focused screenshots;
11. обновить документацию и PR body фактическими числами;
12. перевести PR в ready и merge только по exact head;
13. не менять version в обычном feature PR, если release checkpoint выделен отдельно;
14. законченный публикуемый патч обязательно провести через полный release cycle.

## 13. Запрещённые shortcuts

- не писать формулы в DOM renderer;
- не добавлять «временный» hardcoded ответ для одного fixture как рабочий solver;
- не удалять доминируемые решения из catalog data;
- не выбирать автоматически вариант вместо оператора;
- не называть feasible результат доказанным минимумом без lower-bound proof;
- не применять `null` cost как `0`;
- не генерировать back layout независимо;
- не пропускать browser evidence;
- не считать release готовым только по tag или manifest;
- не перемещать опубликованный tag;
- не раскрывать secrets в screenshot, logs или patchnote;
- не требовать локальный компьютер как обязательное условие.

## 14. Известный неблокирующий долг

Открытый issue `#40`: заменить некорректное изображение существующего Telegram-поста `0.7.0-alpha.2`, сообщение `@uNewsLog/76`, через функцию uNews `edit:media`. Пост не удалять и не публиковать заново.

## 15. Требуемый отчёт Codex после каждого патча

Codex должен сообщить:

1. исходную ветку, version и точный commit;
2. цель патча;
3. изменённые файлы;
4. архитектурные решения;
5. фактический результат тестов;
6. Actions и artifact IDs/digests;
7. визуально проверенный screenshot;
8. ограничения search scope;
9. оставшиеся риски;
10. PR и merge commit;
11. изменялась ли version;
12. создан ли полный release checkpoint, если патч публикуется.

---

## English operational summary

Start from `main` commit `009451cce94d5cde05ee72305f30447aa65a646c`. The published checkpoint is still `0.7.0-alpha.4`, while `main` contains unreleased M7.5 user-plan generation, explicit selection/export, and an accessible objective-priority editor. First publish a complete `0.7.0-alpha.5` checkpoint. Then implement M7.6 as a compact lossless comparison table before expanding plan families, general work-and-turn search, mixed-format packing, per-row order parameters, persistence, profitability, and heavy-search workers. Never hide feasible alternatives, never accept underproduction, and never claim global completeness outside an explicitly bounded search space.
