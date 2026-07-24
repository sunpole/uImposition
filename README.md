# uImposition

<p align="center"><strong>Расчёт офсетных монтажей · Offset Imposition Planner</strong></p>

<table>
<tr>
<td width="50%" valign="top">

<h2>Русский</h2>

<p><strong>Основной язык проекта — русский.</strong></p>

<p>uImposition — будущий браузерный инструмент для расчёта сложных сборных офсетных монтажей.</p>

<h3>Программа должна</h3>
<ul>
<li>принимать файлы, тиражи, страницы и форматы;</li>
<li>рассчитывать геометрию размещения;</li>
<li>формировать лица и зеркальные обороты;</li>
<li>показывать номер файла, страницу и стрелку в каждой ячейке;</li>
<li>не допускать недопечатку;</li>
<li>сравнивать варианты по бумаге, формам, перетиражу и листопрогонам;</li>
<li>выводить схемы с рамками для скриншотов;</li>
<li>экспортировать PDF: одна страница — одна схема.</li>
</ul>

<h3>Основные правила</h3>
<ul>
<li>основной режим — чужой оборот;</li>
<li>переворот по умолчанию — слева направо;</li>
<li>лицо заполняется построчно;</li>
<li>оборот строится только из утверждённого лица;</li>
<li>знак <code>-</code> разрешён только на обороте;</li>
<li>пользователь задаёт иерархию оптимизации;</li>
<li>по умолчанию важнее всего минимум бумаги.</li>
</ul>

</td>
<td width="50%" valign="top">

<h2>English</h2>

<p><strong>Russian is the primary project language.</strong></p>

<p>uImposition is a planned browser-based tool for calculating complex gang-run offset impositions.</p>

<h3>The application will</h3>
<ul>
<li>accept files, run lengths, page counts and sizes;</li>
<li>calculate placement geometry;</li>
<li>generate front forms and mirrored back forms;</li>
<li>show file, source page and head-direction arrow in every cell;</li>
<li>reject all underproducing solutions;</li>
<li>compare paper, plates/forms, overrun and press passes;</li>
<li>render bordered screenshot-ready schemes;</li>
<li>export PDF with exactly one scheme per page.</li>
</ul>

<h3>Core rules</h3>
<ul>
<li>separate front/back forms are the primary mode;</li>
<li>the default sheet turn is left-to-right;</li>
<li>front cells use row-major filling;</li>
<li>the back is derived only from the approved front;</li>
<li><code>-</code> is allowed only on back schemes;</li>
<li>the user controls the optimization hierarchy;</li>
<li>minimum physical paper is the default top priority.</li>
</ul>

</td>
</tr>
</table>

## Текущий статус / Current status

**0.0.1-docs** — репозиторий, двуязычное ТЗ, архитектура, конфигурационная модель, контрольный набор и стартовая страница GitHub Pages. Рабочий оптимизатор ещё не реализован.

**0.0.1-docs** — repository bootstrap, bilingual specification, architecture, configuration model, control dataset and initial GitHub Pages landing page. The production optimizer is not implemented yet.

## Документация / Documentation

| Русский | English |
|---|---|
| [Полное техническое задание](docs/TECHNICAL_SPECIFICATION_RU.md) | [Full technical specification](docs/TECHNICAL_SPECIFICATION_EN.md) |
| [Алгоритм и оптимизация](docs/ALGORITHM_AND_OPTIMIZATION.md) | Algorithm and optimization — bilingual document |
| [Архитектура](docs/ARCHITECTURE.md) | Architecture — bilingual document |
| [Справочник конфигурации](docs/CONFIG_REFERENCE.md) | Configuration reference — bilingual document |
| [План тестирования](docs/TEST_PLAN.md) | Test plan — two-column document |
| [Дорожная карта](docs/ROADMAP.md) | Roadmap — two-column document |
| [GitHub Pages](docs/GITHUB_PAGES.md) | GitHub Pages — two-column document |

## Рабочие форматы после зачистки / Current post-trim presets

`616×446` · `616×466` · `636×448` · `646×466` · `650×313` · `716×326` · `716×336` · `716×516` мм

Зачистка и непечатные поля считаются отдельными этапами. Пресет со стадией `afterTrim` нельзя уменьшать повторно.

Sheet trimming and non-printable press margins are separate stages. An `afterTrim` preset must never be trimmed twice.

## Конфигурация / Configuration

Все изменяемые значения должны поступать из единого `src/config.js`. Стартовая модель находится в [`src/config.example.js`](src/config.example.js).

All editable values must come from a central `src/config.js`. The initial model is documented in [`src/config.example.js`](src/config.example.js).

## Контрольный набор / Control dataset

[`data/control-case.json`](data/control-case.json): 20 файлов, 35 печатных пар, ручной ориентир 4 монтажа / 8 форм / 3395 физических листов / 0 недопечатки.

[`data/control-case.json`](data/control-case.json): 20 files, 35 print pairs, manual reference of 4 impositions / 8 plates / 3395 physical sheets / zero underproduction.

## GitHub Pages

`https://sunpole.github.io/uImposition/`

## Лицензия / License

Copyright © 2026 Anton Magomedov. All rights reserved. См. [`LICENSE.md`](LICENSE.md).
