# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.2.0-alpha</strong></p>
<p align="center"><strong><a href="START_HERE.md">Продолжить разработку с нового устройства / Continue development from a new device</a></strong></p>

<table>
<tr>
<td width="50%" valign="top">

## Русский

<p><strong>Основной язык проекта — русский.</strong></p>

uImposition — браузерный инструмент для расчёта сложных сборных офсетных монтажей.

### Уже работает в M2

- реальные и произвольные форматы листов;
- зачистка и непечатные поля как отдельные этапы;
- A4, A5, A6 и произвольный формат изделия;
- выпуск, общий рез и дополнительный зазор;
- сравнение сеток 0° и 90°;
- выбор максимального количества позиций;
- визуальная схема вместимости;
- точные пары исходных страниц;
- контрольный заказ из 20 файлов и 35 пар;
- реальные скриншоты для Telegram через uNews.

### Следующий этап

M3 / `0.3.0-alpha`:

- заполнение лицевых позиций сплошными блоками;
- `ЛИСТ-N_ЛИЦО`;
- автоматически зеркальный `ЛИСТ-N_ОБОРОТ`;
- точные страницы и стрелки;
- рамочные схемы для скриншотов.

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

### Working in M2

- real and custom sheet sizes;
- separate sheet-trim and press-margin stages;
- A4, A5, A6 and custom finished-product sizes;
- bleed, common cut and additional gap;
- comparison of 0° and 90° grids;
- maximum-position selection;
- visual capacity scheme;
- exact source page pairs;
- 20-file / 35-pair control dataset;
- factual Telegram screenshots through uNews.

### Next milestone

M3 / `0.3.0-alpha`:

- contiguous front-position blocks;
- `SHEET-N_FRONT`;
- automatically mirrored `SHEET-N_BACK`;
- exact pages and direction arrows;
- bordered screenshot-ready schemes.

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

Основной цикл / Primary cycle:

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

Основная проверка выполняется автоматически в GitHub Actions. Локальные команды являются необязательными и не должны быть условием продолжения разработки.

Primary verification runs in GitHub Actions. Local commands are optional and must not be a prerequisite for continued development.

Необязательная локальная проверка / Optional local verification:

```bash
npm run check
```

Необязательные локальные скриншоты / Optional local screenshots:

```bash
cd tools/screenshots
npm install --package-lock=false --ignore-scripts --no-audit --no-fund
npx playwright install --with-deps chromium
npm run capture
```

## Контрольный результат M2 / M2 control result

`data/control-case.json`: печатная область `608×431`, A6 `105×148`, выпуск `0`, общий рез.

- 0° → `5×2 = 10`;
- 90° → `4×4 = 16`;
- выбран вариант 90°;
- 20 файлов → 35 точных пар страниц.

Ручной ориентир будущего оптимизатора остаётся отдельным и ещё не считается доказанным глобальным минимумом.

The manual future-optimizer reference remains separate and is not treated as a proven global optimum.

## Коммерческое направление / Commercial direction

Проект нацелен на будущую монетизацию: публичная демонстрация, Pro-версия, лицензии для типографий, индивидуальное внедрение и поддержка. Точность расчёта никогда не должна зависеть от тарифа.

The project targets future monetisation through a public demo, a Pro edition, print-shop licensing, custom deployment, and support. Calculation correctness must never depend on the pricing tier.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
