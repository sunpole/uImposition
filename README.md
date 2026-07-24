# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>
<p align="center"><strong>Текущая версия / Current version: 0.1.0-alpha</strong></p>

<table>
<tr>
<td width="50%" valign="top">

## Русский

<p><strong>Основной язык проекта — русский.</strong></p>

uImposition — браузерный инструмент для расчёта сложных сборных офсетных монтажей.

### Уже работает в M1

- выбор реального формата листа;
- произвольный размер;
- зачистка одинаково или отдельно по сторонам;
- защита от двойной зачистки;
- непечатные поля;
- фактический и печатный размер;
- ввод заказов;
- подсчёт печатных пар;
- контрольный заказ;
- реальные скриншоты для Telegram через uNews.

### Цель проекта

- рассчитывать бумагу, формы, перетираж и листопрогоны;
- строить точное лицо и зеркальный оборот;
- показывать файл, страницу и направление головы;
- сравнивать варианты по приоритетам пользователя;
- экспортировать схемы: одна страница PDF — одна схема.

</td>
<td width="50%" valign="top">

## English

<p><strong>Russian is the primary project language.</strong></p>

uImposition is a browser-based tool for planning complex gang-run offset impositions.

### Working in M1

- real sheet presets;
- custom size;
- uniform or per-side sheet trim;
- duplicate-trim protection;
- non-printable press margins;
- physical and printable dimensions;
- order input;
- print-pair totals;
- control dataset;
- factual Telegram screenshots through uNews.

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
- [Текущая версия / Current version](VERSION.md)
- [Полное ТЗ RU](docs/TECHNICAL_SPECIFICATION_RU.md)
- [Full specification EN](docs/TECHNICAL_SPECIFICATION_EN.md)

## Документация / Documentation

| Русский | English |
|---|---|
| [Алгоритм и оптимизация](docs/ALGORITHM_AND_OPTIMIZATION.md) | Algorithm and optimization — bilingual |
| [Архитектура](docs/ARCHITECTURE.md) | Architecture — bilingual |
| [Справочник конфигурации](docs/CONFIG_REFERENCE.md) | Configuration reference — bilingual |
| [План тестирования](docs/TEST_PLAN.md) | Test plan — bilingual |
| [Дорожная карта](docs/ROADMAP.md) | Roadmap — bilingual |
| [Публикация через uNews](docs/NEWS_PUBLISHING.md) | uNews publishing — bilingual |
| [Автоматизация скриншотов](docs/SCREENSHOT_AUTOMATION.md) | Screenshot automation — bilingual |
| [Монетизация](docs/BUSINESS_MODEL.md) | Monetization — bilingual |

## Рабочие форматы после зачистки / Current post-trim presets

`616×446` · `616×466` · `636×448` · `646×466` · `650×313` · `716×326` · `716×336` · `716×516` мм

Зачистка и непечатные поля считаются отдельными этапами. Пресет `afterTrim` нельзя уменьшать повторно.

Sheet trimming and non-printable press margins are separate stages. An `afterTrim` preset must never be trimmed twice.

## Проверка / Checks

```bash
npm run check
```

Скриншоты:

```bash
cd tools/screenshots
npm ci
npx playwright install --with-deps chromium
npm run capture
```

## Контрольный набор / Control dataset

`data/control-case.json`: 20 файлов, 35 печатных пар, ручной ориентир будущего оптимизатора — 4 монтажа / 8 форм / 3395 физических листов / 0 недопечатки.

## Коммерческое направление / Commercial direction

Проект нацелен на будущую монетизацию: публичная демонстрация, Pro-версия, лицензии для типографий, индивидуальное внедрение и поддержка. Точность расчёта никогда не должна зависеть от тарифа.

## Лицензия / License

**Proprietary / All rights reserved.** Коммерческое использование требует отдельного письменного разрешения. См. [`LICENSE.md`](LICENSE.md).
