# M5 release evidence / Доказательства релиза M5

## Версия / Version

`0.5.0-alpha`

## Git history

- feature branch: `m5/0.5.0-alpha`;
- Pull Request: `#8`;
- verified full head: `b3ff6e68ce41d9cd01d694a590dbd6d85adc5805`;
- merge commit: `366ea45efd2566c7bb25ff14ff0cbc0df7472594`;
- rollback branch: `release/v0.5.0-alpha`;
- release-marker commit: `154a725d81429905ceec4f72f9c8de14c631a6ee`;
- pre-marker functional commit: `1ac9a450ab587d990a55195c0a7b1a3838ef2aca`.

## Финальные GitHub Actions / Final GitHub Actions

Для полного head `b3ff6e68ce41d9cd01d694a590dbd6d85adc5805`:

- Quality checks — success;
- Capture uImposition screenshots — success;
- Validate uNews patchnotes — success;
- Prepare uImposition release news — success.

### Финальный artifact / Final artifact

- workflow run: `30115025504`;
- artifact: `uimposition-screenshots-8-1`;
- artifact id: `8605081454`;
- artifact digest: `sha256:f88b7c48d8f0ae197bed9d73e9ce83d1836236022e51acd8809d970ad43439c2`;
- source commit: `b3ff6e68ce41d9cd01d694a590dbd6d85adc5805`.

Artifact содержит desktop/mobile PNG, оба PDF, `pdfinfo`, manifest, logs и PNG-render каждой PDF-страницы.

## PDF схем / Scheme PDF

- browser file name: `uImposition-schemes.pdf`;
- page count: `8`;
- default page size: A4;
- порядок: лицо, оборот для каждого из четырёх монтажей;
- одна страница содержит ровно одну схему;
- доступны A4, sheet-proportional и custom режимы;
- Poppler успешно создал `8` PNG.

## PDF отчёта / Production-report PDF

- browser file name: `uImposition-production-report.pdf`;
- page count: `6`;
- page size: A4;
- состав: 1 сводка, 2 страницы файлов, 3 страницы печатных пар;
- Poppler успешно создал `6` PNG.

## Ручная визуальная проверка / Manual visual review

Все `14` PDF-страниц просмотрены вручную.

Подтверждено:

- кириллица и стрелки читаются;
- знак `-` отображается корректно;
- схемы не обрезаны и не искажены;
- заголовки не пересекаются с номерами страниц;
- длинные вклады монтажей помещаются в таблицы;
- неполные последние страницы сохраняют нормальную высоту строк;
- чёрные квадраты, сломанные глифы и пустые страницы отсутствуют;
- desktop/mobile панель экспорта читаема, обе кнопки доступны.

## uNews

- patchnote/image commit: `9792ec33dde75a49344b568540b3e5b7dce26eed`;
- patchnote: `news/2026-07-24-uimposition-v0-5-0-alpha-separate-scheme-and-report-pdfs.md`;
- image: `news/2026-07-24-uimposition-v0-5-0-alpha-separate-scheme-and-report-pdfs.png`;
- image source: Playwright;
- image scenario: `m5-pdf-export-desktop`;
- release marker consumed and deleted.

## Проверенные производственные значения / Verified production totals

- physical sheets: `3395`;
- forms: `8`;
- press passes: `6790`;
- underproduction: `0`;
- pair overrun: `1450`;
- complete-file overrun: `930`.

## Граница / Boundary

Тиражи монтажей `1500`, `1100`, `450`, `345` являются ручным контрольным входом. M5 не генерирует альтернативы и не доказывает глобальный минимум бумаги. Это задача M6.

The explicit imposition run lengths remain manual control input. M5 does not generate alternatives or prove a global paper minimum; that begins in M6.