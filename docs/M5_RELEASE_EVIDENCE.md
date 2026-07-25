# M5 release evidence / Доказательства релиз-кандидата M5

## Версия / Version

`0.5.0-alpha`

## Функциональный commit / Functional commit

- release-marker commit: `154a725d81429905ceec4f72f9c8de14c631a6ee`;
- предрелизный commit без маркера / pre-marker commit: `1ac9a450ab587d990a55195c0a7b1a3838ef2aca`;
- branch: `m5/0.5.0-alpha`;
- Pull Request: `#8`.

## GitHub Actions

Для marker commit `154a725d81429905ceec4f72f9c8de14c631a6ee`:

- Quality checks — success;
- Capture uImposition screenshots — success;
- Validate uNews patchnotes — success;
- Prepare uImposition release news — release files created and committed.

### Основной artifact / Primary artifact

- workflow run: `30114927307`;
- artifact: `uimposition-screenshots-8-1`;
- artifact id: `8605225707`;
- artifact digest: `sha256:7db355f07590f563268944f694716ddc4b49de266b2f3972f4d9d91a5d6bcd7f`;
- source commit: `154a725d81429905ceec4f72f9c8de14c631a6ee`.

Artifact содержит desktop/mobile PNG, оба PDF, `pdfinfo`, manifest, logs и PNG-render каждой PDF-страницы.

## PDF схем / Scheme PDF

- browser file name: `uImposition-schemes.pdf`;
- artifact file: `uimposition-v0-5-0-alpha-control-schemes.pdf`;
- page count: `8`;
- page size: A4, приблизительно `595.276 × 841.89 pt`;
- порядок: лицо, оборот для каждого из четырёх монтажей;
- одна страница содержит ровно одну схему;
- Poppler успешно создал 8 PNG.

## PDF отчёта / Production-report PDF

- browser file name: `uImposition-production-report.pdf`;
- artifact file: `uimposition-v0-5-0-alpha-production-report.pdf`;
- page count: `6`;
- page size: A4;
- состав: 1 сводка, 2 страницы файлов, 3 страницы печатных пар;
- Poppler успешно создал 6 PNG.

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

- release workflow run: `30114926864`;
- patchnote/image commit: `9792ec33dde75a49344b568540b3e5b7dce26eed`;
- patchnote: `news/2026-07-24-uimposition-v0-5-0-alpha-separate-scheme-and-report-pdfs.md`;
- image: `news/2026-07-24-uimposition-v0-5-0-alpha-separate-scheme-and-report-pdfs.png`;
- image source: Playwright;
- image scenario: `m5-pdf-export-desktop`;
- image source commit: `154a725d81429905ceec4f72f9c8de14c631a6ee`;
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
