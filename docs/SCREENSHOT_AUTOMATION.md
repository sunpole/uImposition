# Скриншоты для релизов / Release screenshot automation

## Цель

Каждый заметный релиз uImposition должен иметь новый скриншот, который показывает реальное изменение на точном commit проекта.

Every user-visible release must have a new factual screenshot captured from the exact project commit.

## Источники изображения

- `playwright` — предпочтительный источник для интерфейса сайта;
- `manual-browser` — допустимый ручной снимок настоящего сайта;
- `github-ui` — Issue, Pull Request, Release или Actions;
- `document-render` — фактическая документация из точного commit.

## Постоянный workflow

```text
.github/workflows/capture-screenshots.yml
```

Он:

- имеет только `contents: read`;
- не коммитит и не пушит;
- устанавливает зафиксированную версию Playwright;
- запускает точный checkout локальным HTTP-сервером;
- выполняет проверяемые сценарии;
- создаёт desktop и mobile PNG;
- сохраняет provenance в `entries/*.json` и `manifest.json`;
- загружает результат как GitHub Actions artifact.

## Сценарии M3 / M3 scenarios

```text
tools/screenshots/scenarios/m3-imposition-desktop.json
tools/screenshots/scenarios/m3-imposition-mobile.json
```

Оба сценария открывают `/?demo=control` и подтверждают:

- видимую версию `0.3.0-alpha`;
- печатную область и сетку `4 × 4`;
- 35 точных пар страниц;
- статус четырёх лиц и четырёх оборотов;
- конкретные данные на лицевых и зеркальных оборотных схемах;
- присутствие полной пары `119,4` на обороте.

Both scenarios assert the version, control geometry, pair count, validated eight-scheme status, and specific front/back cell content. A successful screenshot therefore proves the M3 feature rather than only the surrounding page.

## Перед публикацией

1. Запустить workflow или получить artifact из Pull Request.
2. Открыть `manifest.json`.
3. Проверить exact commit.
4. Открыть desktop и mobile PNG.
5. Убедиться, что кадр показывает заявленную функцию.
6. Проверить отсутствие секретов, cookies, приватных путей и старого кеша.
7. Скопировать только выбранный новый PNG в `news/`.
8. Перенести commit и UTC-время в front matter патчноута.
9. Прогнать проверки проекта и dry-run uNews.

## Имена

```text
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.md
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.png
```

Каждый PDF- или интерфейсный релиз должен показывать наиболее важную пользовательскую новинку, а не общий декоративный баннер.
