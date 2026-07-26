# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.7.0-alpha.1</strong></p>
<p align="center"><strong><a href="START_HERE.md">Продолжить разработку с нового устройства / Continue development from a new device</a></strong></p>

<table>
<tr>
<td width="50%" valign="top">

## Русский

uImposition — статический браузерный инструмент для расчёта сложных сборных офсетных монтажей.

### Работает в M1–M6

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
- полный набор из `8960` контрольных кандидатов с одной или двумя парами;
- автоматическая конструкция варианта без недопечатки;
- доказанный минимум физической бумаги `3305` листов;
- отдельный учёт layout-форм и цветовых пластин 4+4;
- regression-тесты A6 landscape/portrait, mixed A4/A5/A6 и A5 `400/700/4200`.

### Добавлено в M7.1

- 11 изменяемых целей оптимизации;
- жёсткие ограничения, которые нельзя перемещать;
- мгновенное лексикографическое ранжирование без повторного перебора;
- независимые цели: бумага, расчётная стоимость, формы, пластины, перетираж и листопрогоны;
- вес закупаемого листа по исходному формату и плотности `г/м²`;
- стоимость бумаги по `BYN/кг`;
- стоимость цветовых печатных форм по цене за штуку;
- необязательная стоимость подготовки layout-форм;
- общая расчётная стоимость и себестоимость одного заказанного изделия;
- компактная demo-проверка `Бумага / Стоимость / Формы`;
- полный план из 17 release-патчей до `1.0.0`.

### Дальше в M7

- единая метрика всех вариантов;
- сравнение своего и чужого оборота;
- полный раскрываемый набор существенно разных Pareto-вариантов;
- точные дельты «что лучше / что хуже»;
- ввод рабочих цен и компактная таблица вариантов;
- контрольный кейс: четыре A6 1+1, 2 страницы, по 4000.

</td>
<td width="50%" valign="top">

## English

uImposition is a static browser tool for planning complex gang-run offset impositions.

### Working through M6

Sheet/product geometry, exact pairs, validated front/back schemes, production totals, separate PDFs, complete control candidate generation, a proven 3,305-sheet paper minimum, separate side-layout and color-plate metrics, and production regressions.

### Added in M7.1

Eleven reorderable objectives, immutable hard constraints, instant lexicographic re-ranking, source-sheet weight from size and gsm, BYN/kg paper cost, per-color-plate cost, optional layout preparation cost, total/unit cost, a focused Paper / Cost / Forms demo, and a 17-release roadmap to 1.0.

### Later M7 patches

Normalized metrics, work-and-back/work-and-turn comparison, exact better/worse deltas, production pricing inputs, and compact Pareto alternatives.

</td>
</tr>
</table>

## Открыть / Open

- GitHub Pages: `https://sunpole.github.io/uImposition/`
- [Демонстрация M7.1 / M7.1 decision demo](decision-profile-demo.html?demo=decision-profile)
- [Начать или продолжить разработку / Start or continue development](START_HERE.md)
- [Текущее состояние / Current state](docs/CURRENT_STATE.md)
- [Текущая версия / Current version](VERSION.md)
- [Полное ТЗ RU](docs/TECHNICAL_SPECIFICATION_RU.md)
- [Full specification EN](docs/TECHNICAL_SPECIFICATION_EN.md)

## Документация / Documentation

- [Что осталось до 1.0 / Remaining work to 1.0](docs/REMAINING_WORK.md)
- [План M7: приоритеты, свой оборот и варианты / M7 operator decision plan](docs/M7_IMPLEMENTATION_PLAN.md)
- [Денежная оценка производства / Production costing](docs/PRODUCTION_COSTING.md)
- [Архитектура / Architecture](docs/ARCHITECTURE.md)
- [Справочник конфигурации / Configuration](docs/CONFIG_REFERENCE.md)
- [План тестирования / Test plan](docs/TEST_PLAN.md)
- [Дорожная карта / Roadmap](docs/ROADMAP.md)
- [Автоматизация скриншотов и PDF / Screenshot and PDF verification](docs/SCREENSHOT_AUTOMATION.md)

## Разработка / Development model

GitHub — единственный источник истины. Каждый завершённый опубликованный патч получает:

```text
feature branch
→ PR и проверки
→ фокусный Chromium screenshot
→ news + uNews/Telegram
→ постоянный evidence-архив
→ merge в main
→ release/v{version}
→ immutable tag
→ GitHub prerelease/release
```

Локальный терминал необязателен и не является источником истины.

## Контрольные решения / Control solutions

### Ручной компактный вариант

- физическая бумага: `3395`;
- монтажи: `4`;
- layout-формы: `8`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- перетираж пар: `1450`.

### Доказанный минимум бумаги M6

- физическая бумага: `3305`;
- экономия: `90` листов (`2,65%`);
- монтажи: `56`;
- layout-формы: `112`;
- листопрогоны: `6610`;
- недопечатка: `0`;
- перетираж пар: `10`.

### Иллюстративная денежная проверка M7.1

При примере `620×450 мм`, `130 г/м²`, `4 BYN/кг` и `15 BYN` за цветовую форму:

- минимум бумаги: около `7199,49 BYN`;
- компактный вариант: около `972,55 BYN`.

Это **не рабочий прайс**. Реальные цены вводит оператор. Пример доказывает, что минимум бумаги и минимум денег могут выбирать разные решения.

## Границы

- автоматический mixed-format packing ещё не реализован;
- свой оборот пока только утверждён как контрольный кейс M7;
- 32-страничный regression проверяет последовательные пары, но не заявляет готовый фальцевальный спуск;
- основная страница ещё не содержит полного редактора приоритетов и цен — M7.1 использует отдельную проверочную demo-страницу.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
