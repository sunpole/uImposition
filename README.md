# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.4.0-alpha</strong></p>
<p align="center"><strong><a href="START_HERE.md">Продолжить разработку с нового устройства / Continue development from a new device</a></strong></p>

<table>
<tr>
<td width="50%" valign="top">

## Русский

<p><strong>Основной язык проекта — русский.</strong></p>

uImposition — браузерный инструмент для расчёта сложных сборных офсетных монтажей.

### Уже работает в M4

- реальные и произвольные форматы листов;
- зачистка и непечатные поля как отдельные этапы;
- A4, A5, A6 и произвольный формат изделия;
- выпуск, общий рез и дополнительный зазор;
- сравнение сеток 0° и 90° и выбор максимальной вместимости;
- точные пары исходных страниц;
- заполнение лицевых позиций сплошными блоками;
- `ЛИСТ-N_ЛИЦО` и автоматически зеркальный `ЛИСТ-N_ОБОРОТ`;
- точные страницы и стрелки направления головы;
- независимая проверка лица и оборота;
- напечатанное количество по 35 парам;
- недопечатка и перетираж по парам и файлам;
- физическая бумага, формы и листопрогоны;
- адаптивный производственный отчёт;
- реальные desktop/mobile Chromium-скриншоты и очередь uNews.

### Следующий этап

M5 / `0.5.0-alpha`:

- одна схема на одну PDF-страницу;
- A4 и пропорциональный режим;
- отдельный PDF производственного отчёта;
- проверка количества и порядка PDF-страниц.

### Цель проекта

- рассчитывать бумагу, формы, перетираж и листопрогоны;
- строить точное лицо и зеркальный оборот;
- показывать файл, исходную страницу и направление головы;
- сравнивать варианты по приоритетам пользователя;
- экспортировать схемы: одна страница PDF — одна схема.

</td>
<td width="50%" valign="top">

## English

<p><strong>Russian is the primary project language.</strong></p>

uImposition is a browser-based tool for planning complex gang-run offset impositions.

### Working in M4

- real and custom sheet sizes;
- separate sheet-trim and press-margin stages;
- A4, A5, A6 and custom finished-product sizes;
- bleed, common cut and additional gap;
- 0°/90° grid comparison and maximum-capacity selection;
- exact source page pairs;
- contiguous front-position blocks;
- `SHEET-N_FRONT` and automatically mirrored `SHEET-N_BACK`;
- exact pages and head-direction arrows;
- independent front/back validation;
- produced quantity for all 35 print pairs;
- underproduction and overrun by pair and file;
- physical sheets, forms, and press passes;
- a responsive production report;
- factual desktop/mobile Chromium screenshots and the uNews queue.

### Next milestone

M5 / `0.5.0-alpha`:

- one imposition scheme per PDF page;
- A4 and proportional modes;
- a separate production-report PDF;
- page-count and ordering verification.

### Project goal

- calculate paper, plates/forms, overrun and press passes;
- generate exact fronts and mirrored backs;
- show file, source page and head direction;
- compare alternatives using user priorities;
- export one imposition scheme per PDF page.

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

| Русский | English |
|---|---|
| [GitHub-only разработка](docs/GITHUB_ONLY_DEVELOPMENT.md) | GitHub-only development — bilingual |
| [План M4](docs/M4_IMPLEMENTATION_PLAN.md) | M4 implementation plan — bilingual |
| [План M3](docs/M3_IMPLEMENTATION_PLAN.md) | M3 implementation plan — bilingual |
| [Алгоритм и оптимизация](docs/ALGORITHM_AND_OPTIMIZATION.md) | Algorithm and optimization — bilingual |
| [Архитектура](docs/ARCHITECTURE.md) | Architecture — bilingual |
| [Справочник конфигурации](docs/CONFIG_REFERENCE.md) | Configuration reference — bilingual |
| [План тестирования](docs/TEST_PLAN.md) | Test plan — bilingual |
| [Дорожная карта](docs/ROADMAP.md) | Roadmap — bilingual |
| [Публикация через uNews](docs/NEWS_PUBLISHING.md) | uNews publishing — bilingual |
| [Автоматизация скриншотов](docs/SCREENSHOT_AUTOMATION.md) | Screenshot automation — bilingual |
| [Монетизация](docs/BUSINESS_MODEL.md) | Monetization — bilingual |

## Как ведётся разработка / Development model

GitHub — единственный источник истины. Основная разработка выполняется через ветки, Pull Request и GitHub Actions. Терминал, локальный clone и локальный ПК не обязательны и используются только для дополнительной проверки владельцем.

GitHub is the single source of truth. Primary development uses branches, Pull Requests, and GitHub Actions. A terminal, local clone, and local computer are optional and may only be used by the owner for additional verification.

```text
GitHub audit
→ feature branch
→ pure modules and tests
→ UI integration
→ draft Pull Request
→ GitHub Actions
→ factual Chromium screenshots
→ uNews validation
→ merge to main
→ Pages verification
→ recovery branch
```

Подробно / Details: [`docs/GITHUB_ONLY_DEVELOPMENT.md`](docs/GITHUB_ONLY_DEVELOPMENT.md)

## Рабочие форматы после зачистки / Current post-trim presets

`616×446` · `616×466` · `636×448` · `646×466` · `650×313` · `716×326` · `716×336` · `716×516` мм

Зачистка и непечатные поля считаются отдельными этапами. Пресет `afterTrim` нельзя уменьшать повторно.

Sheet trimming and non-printable press margins are separate stages. An `afterTrim` preset must never be trimmed twice.

## Проверка / Verification

Основная проверка выполняется автоматически в GitHub Actions. Локальные команды являются необязательными.

```bash
npm run check
```

## Контрольный результат M4 / M4 control result

`data/control-case.json` и `data/control-layout-m3.json`:

- печатная область `608×431`;
- A6 `105×148`, выпуск `0`, общий рез;
- выбранная сетка `4×4 = 16`, поворот `90°`;
- 20 файлов → 35 точных пар страниц;
- четыре лица и четыре автоматически зеркальных оборота;
- ручные тиражи монтажей: `1500`, `1100`, `450`, `345`;
- физическая бумага: `3395`;
- формы: `8`;
- листопрогоны: `6790`;
- недопечатка: `0`;
- суммарный перетираж пар: `1450`;
- перетираж готовых файлов: `930`.

Тиражи монтажей являются ручным проверочным входом. Автоматическая оптимизация начинается на более позднем этапе.

The imposition run lengths are verified manual input. Automatic optimization starts in a later milestone.

## Коммерческое направление / Commercial direction

Проект нацелен на будущую монетизацию: публичная демонстрация, Pro-версия, лицензии для типографий, индивидуальное внедрение и поддержка. Точность расчёта никогда не должна зависеть от тарифа.

The project targets future monetisation through a public demo, a Pro edition, print-shop licensing, custom deployment, and support. Calculation correctness must never depend on the pricing tier.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
