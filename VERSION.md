# uImposition — версия / Version

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Текущая версия

**`0.0.2-docs`**  
Дата: **24 июля 2026**  
Этап: **M0 — документация и подготовка репозитория**

### Текущее состояние

Готово:

- публичный двуязычный репозиторий;
- полное техническое задание RU/EN;
- архитектура, алгоритм, конфигурационная модель и тест-план;
- контрольный набор из 20 файлов;
- GitHub Pages;
- проприетарная лицензия и коммерческое направление;
- единая система версий.

Ещё не реализовано:

- рабочий калькулятор;
- автоматический оптимизатор;
- генерация монтажных схем;
- экспорт PDF.

### Следующая целевая версия

**`0.1.0-alpha` — M1**

- центральный `src/config.js`;
- интерфейс ввода заказов;
- выбор формата листа;
- настройка зачистки;
- расчёт размера листа после зачистки.

</td>
<td width="50%" valign="top">

## English

### Current version

**`0.0.2-docs`**  
Date: **24 July 2026**  
Stage: **M0 — documentation and repository bootstrap**

### Current state

Completed:

- public bilingual repository;
- full RU/EN technical specification;
- architecture, algorithm, configuration model and test plan;
- 20-file control dataset;
- GitHub Pages;
- proprietary licensing and commercial direction;
- centralized versioning system.

Not implemented yet:

- production calculator;
- automatic optimizer;
- imposition-scheme generation;
- PDF export.

### Next target version

**`0.1.0-alpha` — M1**

- central `src/config.js`;
- order-entry interface;
- sheet preset selection;
- sheet-trim settings;
- post-trim sheet-size calculation.

</td>
</tr>
</table>

## Источники версии / Version sources

- `VERSION.json` — машинный источник текущей версии;
- `VERSION.md` — понятное человеку состояние проекта;
- `CHANGELOG.md` — история изменений по версиям;
- `docs/VERSIONING.md` — правила повышения и синхронизации версий.

## Обязательное правило / Mandatory rule

При изменении версии в одном патче одновременно обновляются:

1. `VERSION.json`;
2. `VERSION.md`;
3. `CHANGELOG.md`.

Whenever the project version changes, the same patch must update all three files above.