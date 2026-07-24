# uImposition — расчёт офсетных монтажей / Offset Imposition Planner

**Основной язык проекта — русский. Все ключевые документы и интерфейс также имеют точную профессиональную английскую версию.**

**Primary project language: Russian. All key documentation and user-interface content also have a precise professional English version.**

## О проекте

uImposition — будущий браузерный инструмент для расчёта сложных сборных офсетных монтажей. Он должен:

- принимать список файлов, тиражей, страниц и форматов;
- рассчитывать геометрию размещения на листе;
- формировать лица и автоматически зеркальные обороты;
- показывать номер файла, номер страницы и стрелку ориентации в каждой ячейке;
- проверять закрытие всех тиражей без недопечатки;
- сравнивать варианты по бумаге, формам, перетиражу, листопрогонам и удобству сборки;
- выводить готовые схемы на сайте;
- экспортировать многостраничный PDF по правилу: **одна страница PDF = одна схема**.

## Project overview

uImposition is a planned browser-based tool for calculating complex gang-run offset impositions. It will:

- accept file identifiers, run lengths, page counts and finished sizes;
- calculate sheet geometry and placement capacity;
- generate front forms and automatically mirrored back forms;
- display the file number, source page number and head-direction arrow in every cell;
- verify that every required run is fully covered with zero underproduction;
- compare alternatives by paper usage, plate count, overrun, press passes and assembly convenience;
- render screenshot-ready schemes in the browser;
- export a multipage PDF where **each PDF page contains exactly one scheme**.

## Текущий статус / Current status

**Версия документации: 0.0.1-docs**

Сейчас репозиторий содержит утверждаемое техническое задание, архитектурный план, конфигурационную модель, тестовый набор и стартовую страницу GitHub Pages. Рабочий оптимизатор ещё не реализован.

The repository currently contains the specification, architecture plan, configuration model, control dataset and an initial GitHub Pages landing page. The production optimizer is not implemented yet.

## Главные документы / Key documents

- [Полное ТЗ на русском](docs/TECHNICAL_SPECIFICATION_RU.md)
- [Full technical specification in English](docs/TECHNICAL_SPECIFICATION_EN.md)
- [Алгоритм и оптимизация / Algorithm and optimization](docs/ALGORITHM_AND_OPTIMIZATION.md)
- [Архитектура / Architecture](docs/ARCHITECTURE.md)
- [Справочник конфигурации / Configuration reference](docs/CONFIG_REFERENCE.md)
- [План тестирования / Test plan](docs/TEST_PLAN.md)
- [Дорожная карта / Roadmap](docs/ROADMAP.md)
- [GitHub Pages](docs/GITHUB_PAGES.md)

## Рабочие форматы листов / Current working sheet presets

Размеры ниже считаются размерами монтажных шаблонов **после стандартной зачистки**:

- 616 × 446 мм
- 616 × 466 мм
- 636 × 448 мм
- 646 × 466 мм
- 650 × 313 мм
- 716 × 326 мм
- 716 × 336 мм
- 716 × 516 мм

These dimensions represent the current imposition-template sizes **after the standard sheet trim**.

## Базовые производственные правила / Core production rules

- основной режим: чужой оборот;
- переворот листа по умолчанию: слева направо;
- лицо заполняется слева направо, затем сверху вниз;
- оборот строится автоматически из лица;
- недопечатка запрещена;
- знак `-` допустим только на обороте отсутствующей чётной страницы;
- пользователь сам задаёт иерархию оптимизации;
- программа обязана показать несколько существенно отличающихся корректных вариантов.

## Планируемая технология / Planned technology

- HTML, CSS, JavaScript ES modules;
- без обязательной серверной части;
- без обязательного сборщика;
- работа локально и на GitHub Pages;
- единый модуль `src/config.js` как источник всех изменяемых настроек;
- автоматические тесты для геометрии, пар страниц, оборота, ориентации, тиражей и оптимизатора.

## GitHub Pages

После создания репозитория и включения Pages сайт должен быть доступен по адресу:

`https://sunpole.github.io/uImposition/`

## Лицензия / License

На стартовом этапе исходные материалы помечены как **All rights reserved**. Лицензию можно заменить перед публичным релизом.
