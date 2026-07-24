# M4 release evidence / Доказательства релиз-кандидата M4

## Версия / Version

`0.4.0-alpha`

## Функциональный снимок / Functional capture

- source commit: `fcfa1fc2913779fb047931a1032c92e2ae832ec6`;
- workflow: `Capture uImposition screenshots`;
- workflow run: `30110416777`;
- artifact: `uimposition-screenshots-6-1`;
- artifact id: `8603305685`;
- manifest generated: `2026-07-24T16:48:09.673Z`;
- desktop scenario: `m4-production-report-desktop`;
- mobile scenario: `m4-production-report-mobile`.

## Проверенные значения / Verified values

- версия / version: `0.4.0-alpha`;
- печатные пары / print pairs: `35`;
- физическая бумага / physical sheets: `3395`;
- формы / forms: `8`;
- листопрогоны / press passes: `6790`;
- недопечатка / underproduction: `0`;
- перетираж пар / pair overrun: `1450`;
- перетираж готовых файлов / complete-file overrun: `930`;
- файл 119 сохраняет оборотную страницу `4`;
- контрольные строки файлов 33 и 119 присутствуют в отчёте.

Desktop и mobile PNG просмотрены вручную: сводка, восемь схем и таблица файлов читаемы; широкие таблицы на мобильном экране доступны через горизонтальную прокрутку.

The desktop and mobile PNG files were reviewed manually. The summary, eight schemes, and file table are readable; wide mobile tables remain accessible through horizontal scrolling.

## uNews

- patchnote commit: `e1d71ee6f98226ef7cabbd8ea161c4e1f7a4ec9e`;
- patchnote: `news/2026-07-24-uimposition-v0-4-0-alpha-production-totals-and-report.md`;
- image: `news/2026-07-24-uimposition-v0-4-0-alpha-production-totals-and-report.png`;
- image source: Playwright;
- image source commit: `fcfa1fc2913779fb047931a1032c92e2ae832ec6`;
- release marker consumed and deleted.

## Ограничение / Boundary

Тиражи монтажей `1500`, `1100`, `450`, `345` являются ручным контрольным входом. `0.4.0-alpha` не заявляет автоматический подбор тиражей или доказанный глобальный минимум бумаги.

The imposition run lengths are verified manual input. `0.4.0-alpha` does not claim automatic run assignment or a proven global paper minimum.
