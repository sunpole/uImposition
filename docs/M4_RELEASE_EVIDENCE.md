# M4 release evidence / Доказательства релиза M4

## Версия и объединение / Version and merge

- version: `0.4.0-alpha`;
- Pull Request: `#6`;
- verified PR head: `b8efa6ef625bfffc8e135232220885b9898fc088`;
- merge commit: `67be7ba3441e4ab2c21eac22c2c4eee07d5f65f6`;
- rollback branch: `release/v0.4.0-alpha`;
- alpha milestone: no tag and no GitHub Release.

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

## Проверки полного head / Full-head checks

Для commit `b8efa6ef625bfffc8e135232220885b9898fc088`:

- Quality checks — success;
- Capture uImposition screenshots — success;
- Prepare uImposition release news — success;
- Validate uNews patchnotes — success.

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
