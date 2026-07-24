# AGENTS.md — правила работы над uImposition

## Начало любой новой сессии

Первым прочитать `START_HERE.md`.

Новый чат не должен опираться на память предыдущего чата или предполагать состояние проекта. Перед изменениями нужно прочитать фактические файлы, ветки, Pull Request и GitHub Actions.

## Источники истины

Порядок приоритета:

1. `START_HERE.md` — точка входа и продолжение с нового устройства;
2. `docs/CURRENT_STATE.md` — фактическое состояние;
3. `VERSION.json`, `VERSION.md`, `CHANGELOG.md` — версия и история;
4. `docs/TECHNICAL_SPECIFICATION_RU.md` — основной источник требований;
5. `docs/TECHNICAL_SPECIFICATION_EN.md` — профессиональная английская версия;
6. `docs/ARCHITECTURE.md` — архитектурные границы;
7. `src/config.js` — действующие производственные значения;
8. `data/control-case.json` и milestone-контрольные данные;
9. `docs/GITHUB_ONLY_DEVELOPMENT.md` — процесс разработки;
10. активный milestone-план, например `docs/M3_IMPLEMENTATION_PLAN.md`;
11. последние Pull Request, commit и GitHub Actions;
12. `docs/NEWS_PUBLISHING.md` и `docs/SCREENSHOT_AUTOMATION.md`.

При противоречии между чатом и GitHub действует GitHub. При противоречии между документацией и рабочим кодом нельзя молча выбирать одну сторону: расхождение нужно зафиксировать и исправить.

## GitHub-only разработка

Основной процесс не зависит от терминала, локального клона или локального компьютера.

ChatGPT должен:

- читать и изменять проект через GitHub connector/API;
- работать в отдельной ветке;
- открывать Pull Request;
- использовать GitHub Actions для тестов;
- использовать настоящий Chromium в GitHub Actions для пользовательских скриншотов;
- проверять результат в `main` и GitHub Pages;
- фиксировать решения в репозитории.

Терминал и локальный ПК допускаются только как дополнительная проверка владельцем. Они не являются обязательным этапом и не являются источником истины. Любой важный локальный результат должен быть перенесён в GitHub как тест, issue, документ или commit.

## Обязательные правила

- Не менять производственные формулы молча.
- Не добавлять магические числа вне `src/config.js`.
- Не строить оборот независимо от лица.
- Не принимать вариант с недопечаткой.
- Не считать ручной контрольный вариант доказанным глобальным минимумом.
- Любое изменение русского текста отражать в профессиональной английской версии.
- Любую новую настройку добавлять в конфигурацию и справочник.
- Новую расчётную логику помещать в отдельный чистый модуль с тестами.
- `src/app.js` использовать как координатор DOM, а не как хранилище производственных формул.
- Не писать функциональный milestone напрямую в `main`.
- После каждого патча запускать соответствующие GitHub Actions.
- При изменении версии синхронно обновлять `VERSION.json`, `VERSION.md`, `CHANGELOG.md`, README и видимую версию сайта.
- После alpha-вехи создавать recovery-ветку `release/v{version}`.
- После достижения стабильной версии создавать recovery-ветку, tag и настоящий GitHub Release.
- Не утверждать, что GitHub Release создан, если создана только ветка.
- Не утверждать, что функция работает, пока нет кода, теста, успешного Action и доказательного screenshot для пользовательского изменения.

## uNews и скриншоты

- Каждая заметная новая версия получает новый патчноут в `news/`.
- Каждый патчноут получает новый реальный PNG/JPEG.
- Пользовательское изменение снимается с точного commit настоящим Chromium.
- Перед добавлением изображения в `news/` проверить artifact и manifest.
- Старое изображение нельзя переиспользовать.
- AI-картинка не доказывает реальную функцию.
- Скриншот не должен показывать secrets, cookies, приватные данные и локальные пути.
- Реальная отправка Telegram выполняется только uNews через GitHub Actions.

## Предпочтительная технология

- HTML, CSS, JavaScript ES modules;
- без обязательного build step;
- чистые расчётные функции;
- Node built-in test runner;
- изолированный Playwright только для скриншотов;
- GitHub Pages;
- конфигурация вместо скрытых констант;
- небольшие модули с одной ответственностью.

## Формат отчёта агента

После задачи сообщить:

1. фактическую исходную версию и ветку;
2. что изменено;
3. какие файлы затронуты;
4. какие GitHub Actions выполнены;
5. какой реальный screenshot подтверждает изменение;
6. какие ограничения и риски остались;
7. изменилась ли версия и синхронизированы ли источники;
8. объединён ли PR;
9. создана ли recovery-ветка;
10. создан ли настоящий GitHub Release.

---

## English summary

- Read `START_HERE.md` first.
- GitHub is the single source of truth.
- Do not rely on a previous chat, local clone, terminal, or local computer.
- Use a feature branch, Pull Request, GitHub Actions, factual Chromium screenshots, and GitHub Pages.
- Keep calculation logic in small pure modules with tests; keep `src/app.js` as a DOM coordinator.
- Never derive the back independently from the front.
- Never accept underproduction.
- Synchronise all version sources in one patch.
- An alpha milestone requires a recovery branch; a stable version requires a recovery branch, tag, and actual GitHub Release.
