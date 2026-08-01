# Скриншоты и PDF-доказательства / Screenshot and PDF evidence

## Цель

Каждый пользовательский runtime/release PR получает фактическое доказательство exact commit. Для PDF одного DOM assertion недостаточно: документ скачивается, структурно проверяется и полностью рендерится.

## Workflow

```text
.github/workflows/capture-screenshots.yml
tools/screenshots/capture.spec.mjs
tools/screenshots/scenarios/
```

Workflow:

- использует exact checkout;
- поднимает локальный HTTP server;
- запускает реальный Chromium;
- проверяет desktop/mobile assertions;
- проверяет отсутствие горизонтального overflow;
- скачивает PDF через browser download;
- проверяет `%PDF`, `%%EOF`, имя и число Page-объектов;
- запускает `pdfinfo` и Poppler;
- сохраняет PNG, PDF, logs и manifest в artifact.

## Активные и исторические сценарии

После root cutover актуальным пользовательским runtime является `/app/`.

По умолчанию `capture.spec.mjs` запускает только сценарии, у которых:

```text
path начинается с /app/
```

Это текущая release/regression матрица.

Исторические M5–M7 и UX-сценарии сохранены в `tools/screenshots/scenarios/`, но не входят в default run после удаления legacy root shell. Их можно запустить:

```bash
INCLUDE_HISTORICAL_SCREENSHOTS=1 npx playwright test -c tools/screenshots/playwright.config.mjs
```

Или выбрать отдельный сценарий независимо от его lifecycle:

```bash
SCREENSHOT_SCENARIOS=m6-paper-minimum-desktop npx playwright test -c tools/screenshots/playwright.config.mjs
```

Полное pre-cutover состояние также находится в:

```text
archive/pre-universal-solver-rebuild-2026-08-01
```

## Текущая `/app/` матрица

Проверяются:

- order workspace desktop/mobile;
- 320/360/390/tablet widths;
- no horizontal page overflow;
- compact rows and control order;
- pricing dialog;
- alternatives and selection;
- front, mirrored back and combined layout;
- odd technical blank;
- work-and-turn shared plate;
- all generated impositions for selected plan;
- scheme PDF and production report PDF;
- downloaded file names and page counts.

## Root entrypoint

Корневой `index.html` проверяется Node-тестом:

```text
tests/root-entrypoint.test.js
```

Тест подтверждает переход в `/app/` и отсутствие подключений legacy root stylesheet/scripts.

## Ручная проверка artifacts

После зелёного workflow открыть focused PNG/PDF и проверить:

- отсутствие обрезки;
- отсутствие горизонтальной прокрутки страницы;
- читаемость mobile controls;
- правильные номера страниц;
- `1 2 3 4 → 4 3 2 1` для заявленного зеркального оборота;
- корректную техническую пустую сторону;
- соответствие selected plan, scheme, report и PDF;
- отсутствие чёрных квадратов и сломанных глифов;
- отсутствие secrets, cookies и приватных путей.

## Release evidence

Version/release gate отдельно проверяет:

1. exact commit в manifest;
2. focused desktop/mobile screenshots;
3. `pdfinfo`;
4. все Poppler PNG;
5. evidence archive и SHA-256;
6. recovery branch, immutable tag и GitHub Release assets.

Pure solver PR без runtime/export изменений может ограничиться Quality. Любое изменение `app/`, root routing, PDF или scenario harness требует Chromium/PDF workflow.
