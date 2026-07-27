# AGENTS.md — правила работы над uImposition

## Начало любой новой сессии

Первым прочитать `START_HERE.md`, затем `docs/CODEX_HANDOFF.md`.

Новый чат, Codex Work или другой агент не должен опираться на память предыдущей сессии или предполагать состояние проекта. Перед изменениями нужно прочитать фактические файлы, ветки, Pull Request, issues, tags, Releases и GitHub Actions.

## Источники истины

Порядок приоритета:

1. фактическое состояние GitHub: `main`, PR, Actions, tags, Releases и issues;
2. `START_HERE.md` — краткая точка входа;
3. `docs/CODEX_HANDOFF.md` — полный операционный handoff и границы текущего search space;
4. `docs/CURRENT_STATE.md` — фактическое состояние функций;
5. `VERSION.json`, `VERSION.md`, `CHANGELOG.md` — опубликованная версия и история;
6. `docs/REMAINING_WORK.md` — актуальный путь до 1.0;
7. `docs/TECHNICAL_SPECIFICATION_RU.md` — основной источник требований;
8. `docs/TECHNICAL_SPECIFICATION_EN.md` — профессиональная английская версия;
9. `docs/ARCHITECTURE.md` — архитектурные границы;
10. `src/config.js` — действующие производственные значения и limits;
11. `data/control-case.json` и milestone/regression fixtures;
12. `docs/GITHUB_ONLY_DEVELOPMENT.md` — процесс разработки;
13. активные milestone-документы;
14. `docs/NEWS_PUBLISHING.md` и `docs/SCREENSHOT_AUTOMATION.md`;
15. `docs/DEVELOPMENT_HISTORY_POLICY.md` — сохранение полезной истории и artifacts;
16. `docs/VERSIONING.md` — обязательный release checkpoint каждого законченного патча.

При противоречии между чатом и GitHub действует GitHub. При противоречии между документацией и рабочим кодом нельзя молча выбирать одну сторону: расхождение нужно зафиксировать и исправить.

Важно различать:

- опубликованный version checkpoint;
- функциональность, уже объединённую в `main`, но ещё не выпущенную;
- экспериментальную feature branch;
- fixture/control case;
- общий solver.

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
- `src/app.js` использовать как координатор DOM, а не как хранилище производственных формул.

## Правила патча

- Одна ветка/PR — одна измеримая цель.
- Не писать функциональный milestone напрямую в `main`.
- Сначала pure model/tests, затем runtime/UI.
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

## Предпочтительная технология

- HTML, CSS, JavaScript ES modules;
- без обязательного build step;
- чистые расчётные функции;
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

Read `START_HERE.md` and `docs/CODEX_HANDOFF.md` first, then verify the actual GitHub state. Keep calculation logic pure, derive backs from validated fronts, reject underproduction, preserve every feasible alternative inside the stated search scope, and never claim global completeness for a bounded solver. Use feature branches, exact-head PR checks, factual Chromium evidence, immutable release checkpoints, and immediate uNews publication assets.
