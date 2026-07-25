# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.6.0-alpha</strong></p>
<p align="center"><strong><a href="START_HERE.md">Продолжить разработку с нового устройства / Continue development from a new device</a></strong></p>

<table>
<tr>
<td width="50%" valign="top">

## Русский

uImposition — статический браузерный инструмент для расчёта сложных сборных офсетных монтажей.

### Уже работает в M6

- реальные и произвольные форматы листов;
- зачистка и непечатные поля как отдельные этапы;
- A4, A5, A6 и произвольный формат изделия;
- выпуск, общий рез и дополнительный зазор;
- сетки 0°/90° и выбор максимальной вместимости;
- точные пары страниц;
- проверенные лица и автоматически зеркальные обороты;
- напечатанное количество, недопечатка и перетираж;
- физическая бумага, layout-формы и листопрогоны;
- производственный отчёт по файлам и парам;
- отдельный PDF схем и отдельный PDF отчёта;
- чистая модель кандидатов и неизменяемого спроса;
- полный набор из `8960` контрольных кандидатов с одной или двумя парами;
- автоматическая конструкция варианта без недопечатки;
- доказанный минимум физической бумаги `3305` листов;
- объяснение нижней границы и сравнение с ручными `3395` листами;
- отдельный учёт layout-форм и цветовых пластин 4+4;
- regression-тесты A6 landscape/portrait, mixed A4/A5/A6 и A5 `400/700/4200`.

### Следующий этап

M7 / `0.7.0-alpha`:

- уменьшение числа форм;
- многокритериальный поиск;
- компактный набор Парето;
- компромисс между бумагой, формами и перетиражем.

</td>
<td width="50%" valign="top">

## English

uImposition is a static browser tool for planning complex gang-run offset impositions.

### Working in M6

- sheet/product geometry, trim, press margins, bleed, and spacing;
- 0°/90° capacity and exact page pairs;
- validated fronts and automatically mirrored backs;
- production totals and separate scheme/report PDFs;
- pure candidate and immutable-demand models;
- the complete 8,960-candidate one/two-pair control space;
- automatic valid run construction;
- a proven `3305`-sheet physical-paper minimum;
- explicit comparison with the `3395`-sheet manual reference;
- separate side-layout form and 4+4 color-plate metrics;
- A6 orientation, mixed-format, and variable-run A5 regression tests.

### Next milestone

M7 / `0.7.0-alpha`: reduce forms and present a compact multi-objective Pareto set across paper, forms, and overrun.

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

- [План M6 / M6 implementation plan](docs/M6_IMPLEMENTATION_PLAN.md)
- [План M5 / M5 implementation plan](docs/M5_IMPLEMENTATION_PLAN.md)
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
→ factual Chromium evidence
→ PDF structural check and Poppler rendering
→ uNews validation
→ merge to main
→ recovery branch
```

Локальный терминал необязателен и не является источником истины.

## Контрольный результат / Control result

### Ручная контрольная раскладка M3–M5

- 20 файлов → 35 пар;
- 4 монтажа / 8 layout-форм;
- физическая бумага: `3395`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- перетираж пар: `1450`;
- перетираж готовых файлов: `930`.

### Автоматический минимум бумаги M6

- универсальная нижняя граница: `ceil(52870 / 16) = 3305`;
- физическая бумага: `3305`;
- экономия: `90` листов (`2,65%`);
- 56 монтажей / 112 layout-форм;
- листопрогоны: `6610`;
- недопечатка: `0`;
- перетираж пар: `10`;
- перетираж готовых файлов: `0`.

Результат `3305` является доказанным минимумом физической бумаги, потому что допустимый вариант достигает универсальной нижней границы вместимости. Он не является минимумом форм: число layout-форм выросло с `8` до `112`.

## Дополнительные производственные тесты

- A6 landscape `148×105`, 32 страницы, 4+4, `4×4`;
- A6 portrait `105×148`, 32 страницы, 4+4, поворот 90°, `4×4`;
- ручной mixed duplex: `1×A4 + 2×A5 + 8×A6` на `608×431`;
- A5, 8 позиций, тиражи `400 / 700 / 4200`: минимум `663` листа, перетираж `4`;
- один монтаж 4+4: `2` layout-формы и `8` цветовых пластин.

32-страничный regression проверяет текущую модель последовательных пар, но не заявляет тетрадный фальцевальный спуск. Mixed-format regression проверяет заданную раскладку, а не автоматический rectangle packing.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
