# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.5.0-alpha</strong></p>
<p align="center"><strong><a href="START_HERE.md">Продолжить разработку с нового устройства / Continue development from a new device</a></strong></p>

<table>
<tr>
<td width="50%" valign="top">

## Русский

uImposition — статический браузерный инструмент для расчёта сложных сборных офсетных монтажей.

### Уже работает в M5

- реальные и произвольные форматы листов;
- зачистка и непечатные поля как отдельные этапы;
- A4, A5, A6 и произвольный формат изделия;
- выпуск, общий рез и дополнительный зазор;
- сетки 0°/90° и выбор максимальной вместимости;
- точные пары страниц;
- четыре лица и четыре автоматически зеркальных оборота;
- файл, страница и направление головы в каждой позиции;
- напечатанное количество, недопечатка и перетираж;
- физическая бумага, формы и листопрогоны;
- производственный отчёт по 20 файлам и 35 парам;
- отдельный PDF схем: 8 страниц, одна схема на страницу;
- отдельный PDF отчёта: 6 страниц A4;
- A4, пропорциональный и пользовательский режимы страниц схем;
- проверка PDF через Chromium, `pdfinfo` и Poppler.

### Следующий этап

M6 / `0.6.0-alpha`:

- генерация альтернативных монтажей;
- автоматический подбор тиражей;
- минимум физической бумаги без недопечатки;
- объяснение разделённых заказов и выбранного варианта.

</td>
<td width="50%" valign="top">

## English

uImposition is a static browser tool for planning complex gang-run offset impositions.

### Working in M5

- real/custom sheet and product sizes;
- separate trim and press-margin stages;
- 0°/90° capacity and exact page pairs;
- four validated fronts and automatically mirrored backs;
- produced quantity, underproduction, overrun, paper, forms, and press passes;
- a production report for 20 files and 35 pairs;
- a separate eight-page scheme PDF, one scheme per page;
- a separate six-page A4 report PDF;
- A4, proportional, and custom scheme page modes;
- Chromium, `pdfinfo`, and Poppler verification.

### Next milestone

M6 / `0.6.0-alpha`: generate alternatives, assign run lengths automatically, and minimise physical paper without underproduction.

</td>
</tr>
</table>

## Открыть / Open

- GitHub Pages: `https://sunpole.github.io/uImposition/`
- [Начать или продолжить разработку / Start or continue development](START_HERE.md)
- [Текущее состояние / Current state](docs/CURRENT_STATE.md)
- [Текущая версия / Current version](VERSION.md)
- [Полное ТЗ RU](docs/TECHNICAL_SPECIFICATION_RU.md)
- [Full specification EN](docs/TECHNICAL_SPECIFICATION_EN.md)

## Документация / Documentation

- [План M5 / M5 implementation plan](docs/M5_IMPLEMENTATION_PLAN.md)
- [План M4 / M4 implementation plan](docs/M4_IMPLEMENTATION_PLAN.md)
- [Архитектура / Architecture](docs/ARCHITECTURE.md)
- [Справочник конфигурации / Configuration](docs/CONFIG_REFERENCE.md)
- [План тестирования / Test plan](docs/TEST_PLAN.md)
- [Дорожная карта / Roadmap](docs/ROADMAP.md)
- [Автоматизация скриншотов и PDF / Screenshot and PDF verification](docs/SCREENSHOT_AUTOMATION.md)

## Разработка / Development model

GitHub — единственный источник истины. Основной цикл:

```text
GitHub audit
→ feature branch
→ pure modules and tests
→ UI integration
→ draft Pull Request
→ GitHub Actions
→ Chromium downloads
→ PDF structural check and Poppler rendering
→ uNews validation
→ merge to main
→ recovery branch
```

Локальный терминал необязателен и не является источником истины.

## Контрольный результат / Control result

- печатная область: `608×431`;
- изделие: A6 `105×148`, выпуск `0`, общий рез;
- 20 файлов → 35 пар;
- 4 лица + 4 оборота;
- физическая бумага: `3395`;
- формы: `8`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- перетираж пар: `1450`;
- перетираж готовых файлов: `930`;
- PDF схем: `8` страниц;
- PDF отчёта: `6` страниц;
- Poppler успешно рендерит все `14` страниц.

Тиражи монтажей `1500`, `1100`, `450`, `345` — ручной контрольный вход, не результат оптимизатора.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
