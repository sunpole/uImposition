# Скриншоты для релизов / Release screenshot automation

## Цель / Goal

Каждый заметный пользовательский релиз получает новый фактический скриншот точного commit. AI-изображение или старый PNG не являются доказательством функции.

Every user-visible release receives a new factual screenshot of the exact commit. AI imagery and reused screenshots are not functional evidence.

## Workflow

```text
.github/workflows/capture-screenshots.yml
```

Workflow имеет только `contents: read`, устанавливает закреплённый Playwright/Chromium, запускает точный checkout через локальный HTTP-сервер, выполняет утверждения, создаёт desktop/mobile PNG, сохраняет provenance и загружает artifact.

## Сценарии M4 / M4 scenarios

```text
tools/screenshots/scenarios/m4-production-report-desktop.json
tools/screenshots/scenarios/m4-production-report-mobile.json
```

Они открывают `/?demo=control` и подтверждают:

- видимую версию `0.4.0-alpha`;
- печатную область `608 × 431` и сетку `4 × 4`;
- 35 пар страниц и восемь корректных схем;
- наличие полной оборотной страницы `119,4`;
- статус «Недопечатки нет»;
- физическую бумагу `3395`;
- формы `8`;
- листопрогоны `6790`;
- недопечатку `0`;
- перетираж пар `1450`;
- перетираж готовых файлов `930`;
- контрольные строки файлов 33 и 119.

The scenarios verify the exact M4 version, M3 scheme integrity, all six production totals, and representative file rows. A successful PNG therefore proves the report rather than only the surrounding page.

## Перед публикацией / Before publishing

1. Получить artifact точного release-candidate commit.
2. Открыть `manifest.json` и проверить SHA.
3. Открыть desktop и mobile PNG.
4. Проверить заявленные числа, читаемость и мобильную прокрутку таблиц.
5. Убедиться, что нет secrets, cookies, приватных данных и локальных путей.
6. Скопировать только новый выбранный PNG в `news/`.
7. Перенести commit и UTC-время в front matter патчноута.
8. Выполнить Quality checks и dry-run uNews.

## Имена / Naming

```text
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.md
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.png
```

Скриншот должен показывать главную пользовательскую новинку релиза, а не декоративный баннер.
