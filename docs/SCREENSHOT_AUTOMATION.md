# Скриншоты для релизов / Release screenshot automation

## Цель

Каждый заметный релиз uImposition должен иметь новый скриншот, который показывает реальное изменение на точном commit проекта.

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

## Перед публикацией

1. Запустить workflow или получить artifact из Pull Request.
2. Открыть `manifest.json`.
3. Проверить exact commit.
4. Открыть выбранный PNG.
5. Убедиться, что кадр показывает заявленную функцию.
6. Проверить отсутствие секретов, cookies, приватных путей и старого кеша.
7. Скопировать только выбранный PNG в `news/`.
8. Перенести commit и UTC-время в front matter патчноута.
9. Прогнать проверки проекта и dry-run uNews.

## Имена

```text
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.md
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.png
```

Каждый PDF- или интерфейсный релиз должен показывать наиболее важную пользовательскую новинку, а не общий декоративный баннер.
