# Скриншоты и PDF-доказательства / Screenshot and PDF evidence

## Цель / Goal

Каждый пользовательский релиз получает фактическое доказательство точного commit. Для PDF одного скриншота недостаточно: документ скачивается, структурно проверяется и полностью рендерится.

Every user-visible release receives evidence from the exact commit. A PDF screenshot alone is insufficient: the document is downloaded, structurally checked, and fully rendered.

## Workflow

```text
.github/workflows/capture-screenshots.yml
```

Workflow:

- имеет только `contents: read`;
- устанавливает закреплённый Playwright/Chromium;
- запускает точный checkout через локальный HTTP-сервер;
- выполняет desktop/mobile assertions;
- скачивает PDF через настоящий браузер;
- проверяет `%PDF`, `%%EOF`, имя и число Page-объектов;
- запускает `pdfinfo`;
- рендерит каждую страницу через Poppler `pdftoppm`;
- сравнивает количество PDF-страниц и PNG;
- сохраняет PNG, PDF, `pdfinfo`, manifest и diagnostics в artifact.

## Сценарии M5 / M5 scenarios

```text
tools/screenshots/scenarios/m5-pdf-export-desktop.json
tools/screenshots/scenarios/m5-report-pdf-export-desktop.json
tools/screenshots/scenarios/m5-pdf-export-mobile.json
```

### PDF схем

- версия `0.5.0-alpha`;
- файл `uImposition-schemes.pdf`;
- ровно `8` страниц;
- одна схема на страницу;
- A4 и сохранение пропорций;
- порядок лицо/оборот;
- после скачивания статус «PDF схем создан: 8 страниц».

### PDF отчёта

- файл `uImposition-production-report.pdf`;
- ровно `6` страниц A4;
- сводка, 2 страницы файлов, 3 страницы пар;
- после скачивания статус «PDF отчёта создан: 6 страниц».

### Mobile

Мобильный сценарий подтверждает видимость обеих кнопок, статуса готовности и адаптивную компоновку панели экспорта.

## Ручная проверка / Manual review

Обязательно открыть PNG всех страниц и проверить:

- отсутствие обрезки;
- отсутствие пересечений заголовков и номеров страниц;
- читаемую кириллицу и стрелки;
- отсутствие чёрных квадратов и сломанных глифов;
- читаемость таблиц и вкладов монтажей;
- корректный порядок страниц;
- отдельность PDF схем и PDF отчёта.

## Перед публикацией / Before publishing

1. Проверить exact commit в `manifest.json`.
2. Открыть desktop и mobile PNG интерфейса.
3. Открыть `pdfinfo` обоих документов.
4. Просмотреть все 14 PNG PDF-страниц.
5. Убедиться в отсутствии secrets, cookies, приватных путей и старого кеша.
6. Скопировать только новый релизный PNG в `news/`.
7. Выполнить Quality checks и dry-run uNews.

## Имена / Naming

```text
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.md
news/YYYY-MM-DD-uimposition-vX-Y-Z-short-title.png
```
