# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.7.0-alpha.3</strong></p>
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

### Добавлено в M7.1–M7.2

- 11 изменяемых целей и отдельные жёсткие ограничения;
- мгновенное лексикографическое ранжирование;
- вес листа и прозрачная BYN-модель бумаги, цветовых форм и подготовки layout-форм;
- единая guarded-модель `SolutionMetrics`;
- ввод рабочего прайса на основной странице;
- статусы `pricing incomplete / pricing inputs ready / pricing ready`;
- production report → реальная стоимость решения;
- защита от недопечатки, `null → 0` и несовместимой денежной базы.

### Добавлено в M7.3

- строгий Pareto-frontier с удалением дублей и доминируемых решений;
- compact display set существенно разных вариантов;
- реальные `compact manual` и доказанный `paper minimum` в общей модели метрик;
- paper-first / cost-first без повторной генерации монтажей;
- выбор базы сравнения;
- RU/EN-объяснения преимущества, цены компромисса и решающей цели;
- покомпонентные дельты стоимости;
- денежные сравнения только при совместимом прайсе;
- очищенный runtime event без сырых layouts/candidates/planned runs;
- компактная read-only панель двух реальных вариантов на основной странице;
- focused Chromium evidence реального cost-first результата.

### Дальше в M7

- M7.4: проверяемый свой оборот / work-and-turn;
- M7.5: полный компактный редактор приоритетов и цен;
- M7.6: итоговая таблица вариантов, раскрытие выбранных схем и экспорт выбранного решения.

</td>
<td width="50%" valign="top">

## English

uImposition is a static browser tool for planning complex gang-run offset impositions.

### Working through M6

Sheet/product geometry, exact pairs, validated front/back schemes, production totals, separate PDFs, complete control candidate generation, a proven 3,305-sheet paper minimum, separate side-layout and color-plate metrics, and production regressions.

### Added in M7.1–M7.2

Eleven reorderable objectives, immutable hard constraints, instant lexicographic ranking, transparent paper/plate/layout-preparation costing, guarded `SolutionMetrics`, main-page production pricing inputs, explicit pricing states, and production-report-backed solution cost.

### Added in M7.3

A strict Pareto frontier, materially-different compact alternatives, the real compact-manual and proven paper-minimum solutions, instant paper/cost re-ranking, selectable comparison references, RU/EN benefit and tradeoff explanations, compatible component cost deltas, a sanitized runtime event, a compact read-only main-page panel, and focused Chromium evidence.

### Later M7 patches

Validated work-and-turn, the full priority/pricing editor, and the final alternatives table with selected-solution detail and export.

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
- [M7.3 runtime и UI альтернатив / M7.3 alternatives runtime and UI](docs/M7_3_RUNTIME_ALTERNATIVES_UI.md)
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
- цветовые пластины: `32`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- перетираж пар: `1450`;
- контрольная стоимость: `972,55 BYN`.

### Доказанный минимум бумаги

- физическая бумага: `3305`;
- экономия: `90` листов (`2,65%`);
- монтажи: `56`;
- layout-формы: `112`;
- цветовые пластины: `448`;
- листопрогоны: `6610`;
- недопечатка: `0`;
- перетираж пар: `10`;
- контрольная стоимость: `7199,49 BYN`.

### Проверенный компромисс M7.3

При примере `620×450 мм`, `130 г/м²`, `4 BYN/кг` и `15 BYN` за цветовую форму:

- paper-first выбирает минимум бумаги;
- cost-first выбирает компактный ручной вариант;
- минимум бумаги экономит `90` листов;
- минимум бумаги дороже на `6226,94 BYN`.

Это **не рабочий прайс**. Реальные цены вводит оператор. Пример доказывает, что минимум бумаги и минимум денег могут выбирать разные решения.

## Границы

- свой оборот / work-and-turn начинается в M7.4;
- полный редактор всех приоритетов и цен относится к M7.5;
- итоговая таблица и экспорт выбранного варианта относятся к M7.6;
- автоматический mixed-format packing ещё не реализован;
- 32-страничный regression проверяет последовательные пары, но не заявляет готовый фальцевальный спуск;
- полный импорт/экспорт проекта и постоянное хранение относятся к M8.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
