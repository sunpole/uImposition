# AGENTS.md — правила работы над uImposition

## Начало любой новой сессии

Первым прочитать `START_HERE.md`, затем `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md` и Issue `#64`. После этого прочитать `docs/CODEX_HANDOFF.md` для существующего расчётного ядра и release-процесса. Для навигации по остальным материалам использовать `docs/README.md`, а для карты каталогов и модулей — `docs/PROJECT_CATALOG.md`.

Новый чат, Codex Work или другой агент не должен опираться на память предыдущей сессии или предполагать состояние проекта. Перед изменениями нужно прочитать фактические файлы, ветки, Pull Request, issues, tags, Releases и GitHub Actions.

## Источники истины

Порядок приоритета:

1. фактическое состояние GitHub: `main`, PR, Actions, tags, Releases и issues;
2. `START_HERE.md` — краткая точка входа;
3. `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md` — обязательный продуктовый контракт нового пользовательского слоя;
4. Issue `#64` — активная программа R0–R5;
5. `docs/CODEX_HANDOFF.md` — полный handoff существующего production pipeline и границ search space;
6. `docs/CURRENT_STATE.md` — фактическое состояние функций;
7. `VERSION.json`, `VERSION.md`, `CHANGELOG.md` — опубликованная версия и история;
8. `docs/REMAINING_WORK.md` — расчётный и production backlog до 1.0;
9. `docs/TECHNICAL_SPECIFICATION_RU.md` — основной источник устойчивых производственных требований;
10. `docs/TECHNICAL_SPECIFICATION_EN.md` — профессиональная английская версия;
11. `docs/ARCHITECTURE.md` — архитектурные границы доменного ядра;
12. `src/config.js` — действующие производственные значения и limits;
13. `data/control-case.json` и milestone/regression fixtures;
14. `docs/GITHUB_ONLY_DEVELOPMENT.md` — процесс разработки;
15. активные milestone-документы;
16. `docs/NEWS_PUBLISHING.md` и `docs/SCREENSHOT_AUTOMATION.md`;
17. `docs/DEVELOPMENT_HISTORY_POLICY.md` — сохранение полезной истории и artifacts;
18. `docs/VERSIONING.md` — обязательный release checkpoint каждого законченного патча.

`docs/UI_UX_APPLICATION_REDESIGN.md` сохраняется как superseded-история UX-0–UX-5 и не задаёт дальнейшую UI-разработку.

При противоречии между чатом и GitHub действует GitHub. При противоречии между документацией и рабочим кодом нельзя молча выбирать одну сторону: расхождение нужно зафиксировать и исправить.

Важно различать:

- опубликованный version checkpoint;
- функциональность, уже объединённую в `main`, но ещё не выпущенную;
- экспериментальную feature branch;
- fixture/control case;
- общий solver;
- временный технический UI;
- целевой operator-first product layer.

## GitHub-only разработка

Основной процесс не зависит от терминала, локального клона или локального компьютера.

Агент должен:

- читать и изменять проект через GitHub connector/API или разрешённую Codex GitHub-среду;
- работать в отдельной ветке;
- открывать Pull Request;
- использовать GitHub Actions для тестов;
- использовать настоящий Chromium в GitHub Actions для пользовательских скриншотов;
- проверять результат в `main` и GitHub Pages;
- фиксировать решения в репозитории.

Терминал и локальный ПК допускаются как дополнительная проверка, но не являются единственным источником доказательства. Любой важный локальный результат должен быть перенесён в GitHub как test, issue, document, artifact или commit.

## Обязательные производственные правила

- Не менять производственные формулы молча.
- Не добавлять магические числа вне `src/config.js`.
- Не строить оборот независимо от лица.
- Не принимать вариант с недопечаткой.
- Не считать ручной контрольный вариант доказанным global minimum.
- Не считать feasible план доказанным minimum без lower-bound proof.
- Не выдавать bounded/truncated search за все технологически возможные варианты.
- Не удалять дорогие, доминируемые или нерекомендуемые допустимые варианты из catalog data.
- Фильтры меняют представление, а не исходный каталог.
- Явный выбор оператора не заменяется новой recommendation.
- Отсутствующая стоимость не превращается в ноль.
- Layout-формы сторон и цветовые пластины не смешиваются.
- Work-and-turn geometry не заменяет проверку конкретной машины, захвата и бокового упора.
- Любое изменение русского пользовательского текста отражать в профессиональной английской версии.
- Любую новую настройку добавлять в конфигурацию и справочник.
- Новую расчётную логику помещать в отдельный чистый модуль с unit-тестами.
- `src/app.js` использовать как координатор legacy DOM, а не как хранилище производственных формул.

## Обязательные правила нового product layer

- Не объединять и не продолжать PR `#62` как основу нового интерфейса.
- Не строить новый UI перестановкой существующих исторических DOM-панелей.
- Не добавлять очередной CSS override для сокрытия архитектурной проблемы.
- Не переносить milestone, roadmap, diagnostics и evidence в основной операторский workflow.
- Новая оболочка использует один versioned application state как источник пользовательского ввода.
- Доменные функции получают plain data и не читают DOM.
- UI render-слой отображает state и dispatch-ит действия, но не содержит production formulas.
- Один расчёт создаёт один согласованный immutable snapshot.
- Устаревший асинхронный результат не может перезаписать более новый.
- Ошибка чернового ввода не уничтожает последний корректный результат.
- Sheet/press presets имеют schemaVersion, deterministic serialization и явные migrations.
- Local persistence не смешивается с UI redesign в одном PR.
- Перед реализацией нового визуального workspace должно быть выбрано и зафиксировано визуальное направление.
- Mobile проектируется как самостоятельный сценарий `Заказ → Варианты → Схема`, а не как уменьшенный desktop.

## Текущий обязательный порядок R0–R5

### R0

Старое UI-направление остановлено. Текущий `main` сохраняется как технический checkpoint.

### R1

Документировать operator-first contract и синхронизировать точки входа.

### R2

Отдельный pure-code PR:

- versioned project/application state;
- sheet/press preset model;
- built-in presets;
- local preset repository;
- migrations и serialization;
- unit tests;
- без нового визуального интерфейса.

### R3

Отдельный clean workspace PR после выбора визуального направления:

- preset switcher;
- строки продукции;
- live validation/calculation;
- подключение существующего uniform pipeline;
- без старых технических панелей в основном flow.

### R4

Сравнение paper/forms/cost, selection, layout preview и existing PDF.

### R5

Сложные multi-product/mixed-format возможности добавляются отдельными bounded solver PR.

## Правила патча

- Одна ветка/PR — одна измеримая цель.
- Не писать функциональный milestone напрямую в `main`.
- Сначала pure model/tests, затем runtime/UI.
- Не смешивать state/persistence, visual redesign, новый solver и release packaging.
- Не ослаблять validation ради прохождения тестов.
- После каждого патча запускать соответствующие GitHub Actions.
- Пользовательское изменение получает desktop/mobile Chromium evidence, когда это применимо.
- Draft PR остаётся draft до exact-head checks и визуального review artifacts.
- Merge выполнять по проверенному exact head.
- Не смешивать большой search solver, UI redesign, persistence и release packaging в одном PR.

## Version и release

- При изменении версии синхронно обновлять `VERSION.json`, `VERSION.md`, `CHANGELOG.md`, README, `START_HERE.md`, видимую версию сайта и screenshot assertions.
- Каждый законченный публикуемый патч получает уникальную версию, recovery-ветку `release/v{version}`, tag `v{version}` и настоящий GitHub Release.
- Alpha, beta и RC публикуются как GitHub prerelease; stable — как обычный Release.
- Нельзя перемещать уже опубликованный tag на другой commit.
- Не утверждать, что GitHub Release создан, если создана только ветка, tag или manifest.
- Не утверждать, что функция работает, пока нет кода, tests, успешного Action и доказательного screenshot для пользовательского изменения.
- Каждый законченный release сразу получает `news/*.md`, новое реальное изображение и короткий текст для очереди uNews/Telegram.
- Каждый release получает постоянный архив в `archive/development/{version}/` и evidence ZIP как asset GitHub Release.
- Документационный R1 и внутренний pure R2 не обязаны менять version, пока не публикуют новый пользовательский checkpoint.

## uNews и скриншоты

- Каждый законченный release получает новый patchnote в `news/` в том же цикле.
- Каждый patchnote получает новый реальный PNG/JPEG.
- Пользовательское изменение снимается с точного commit настоящим Chromium.
- Перед добавлением изображения в `news/` проверить artifact и manifest.
- Старое изображение нельзя переиспользовать как доказательство новой функции.
- AI-картинка не доказывает реальную функцию.
- Screenshot не должен показывать secrets, cookies, приватные данные и локальные пути.
- Реальная отправка Telegram выполняется только uNews через GitHub Actions.
- Длинные full-page screenshots сохраняются как техническое доказательство и история.
- Для Telegram используется отдельный крупный focused-кадр новой функции.
- Patchnote, image и release manifest должны войти в `main`, чтобы uNews получил их после merge.
- Исправление существующего Telegram media выполняется через uNews `edit:media`, если это возможно; не удалять пост без отдельной причины.

## История

- Не удалять полезные планы, evidence, screenshots, PDF-artifacts, workflows, tests, fixtures или корректные milestone-документы только потому, что они стали историческими.
- Удалять только заведомо неверное, небезопасное, повреждённое или вводящее в заблуждение содержимое; причину фиксировать в commit или PR.
- Массовую архивацию истории выполнять только по отдельному решению владельца.
- Старый UI можно сохранять как regression/reference, но он не должен диктовать новую product architecture.

## Предпочтительная технология

- HTML, CSS, JavaScript ES modules;
- без обязательного build step;
- чистые расчётные функции;
- versioned plain-data application state;
- reducer/actions или эквивалентный детерминированный update layer;
- Node built-in test runner;
- изолированный Playwright для Chromium evidence;
- GitHub Pages;
- конфигурация вместо скрытых констант;
- небольшие модули с одной ответственностью;
- Web Worker только когда тяжёлый search действительно требует изоляции.

## Формат отчёта агента

После задачи сообщить:

1. фактическую исходную version, branch и commit;
2. измеримую цель;
3. что изменено;
4. какие файлы затронуты;
5. какие архитектурные решения приняты;
6. фактический результат tests;
7. какие GitHub Actions выполнены;
8. какой реальный screenshot подтверждает изменение;
9. artifact IDs/digests;
10. какие search boundaries и риски остались;
11. изменилась ли version и синхронизированы ли источники;
12. объединён ли PR и какой merge commit;
13. создана ли recovery-ветка;
14. создан ли immutable tag;
15. создан ли настоящий GitHub Release/prerelease;
16. созданы ли release news, archive и очередь uNews/Telegram.

---

## English summary

Read `START_HERE.md`, `docs/OPERATOR_FIRST_PRODUCT_REBUILD.md`, and Issue `#64` before the historical handoff. Preserve the validated production core, but do not continue the previous app-shell/legacy-DOM direction or merge PR `#62`. The next code patch is R2: a versioned plain-data application state plus sheet/press preset persistence and tests, with no visual redesign in the same PR. Later build a clean operator-first workspace for presets, product rows, coherent live recalculation, paper/forms/cost comparison, explicit selection, layout preview and export.