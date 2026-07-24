# Версионирование / Versioning Policy

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Назначение

Система версий должна в любой момент ясно отвечать на четыре вопроса:

1. какая версия является текущей;
2. что в ней уже работает;
3. что ещё не реализовано;
4. какой этап разрабатывается следующим.

### Источники истины

- `VERSION.json` — машинный источник текущей версии и статуса;
- `VERSION.md` — краткое понятное человеку описание;
- `CHANGELOG.md` — полная история изменений;
- Git-тег — зафиксированный публичный релиз.

### Формат версии

Используется формат:

`MAJOR.MINOR.PATCH[-CHANNEL]`

Примеры:

- `0.0.2-docs` — документационная подготовка;
- `0.1.0-alpha` — первая неполная рабочая версия;
- `0.1.0-beta` — функциональность собрана, продолжается проверка;
- `0.1.0-rc.1` — кандидат в релиз;
- `1.0.0` — первый стабильный производственный релиз.

### Когда повышать номер

- `PATCH` — исправления, документация и небольшие совместимые улучшения;
- `MINOR` — новый законченный функциональный этап;
- `MAJOR` — несовместимое изменение формата данных, расчётов или публичного API.

Исправление опечатки без изменения смысла может не повышать версию, но должно попасть в историю коммитов. Изменение требований, алгоритма, структуры данных или пользовательского поведения требует повышения версии.

### Каналы

- `docs` — ТЗ и подготовка проекта без рабочего продукта;
- `alpha` — функциональность неполная и может изменяться;
- `beta` — основная функциональность готова, требуется широкая проверка;
- `rc.N` — кандидат на стабильный релиз;
- без суффикса — стабильный релиз.

### Обязательная синхронизация

При каждом изменении версии один патч должен обновить:

1. `VERSION.json`;
2. `VERSION.md`;
3. `CHANGELOG.md`;
4. видимую версию сайта, когда она появится;
5. `package.json`, если он будет добавлен;
6. релиз и тег, если версия публикуется как релиз.

### Проверка перед завершением патча

- версии во всех файлах совпадают;
- дата и этап совпадают;
- `VERSION.md` не обещает неготовую функцию;
- `CHANGELOG.md` описывает фактические изменения;
- `VERSION.json` является корректным JSON;
- следующая целевая версия указана явно.

</td>
<td width="50%" valign="top">

## English

### Purpose

The versioning system must always answer four questions clearly:

1. which version is current;
2. what already works;
3. what is not implemented yet;
4. which milestone comes next.

### Sources of truth

- `VERSION.json` — machine-readable current version and status;
- `VERSION.md` — concise human-readable project state;
- `CHANGELOG.md` — complete version history;
- Git tag — immutable public release marker.

### Version format

The project uses:

`MAJOR.MINOR.PATCH[-CHANNEL]`

Examples:

- `0.0.2-docs` — documentation bootstrap;
- `0.1.0-alpha` — first incomplete working version;
- `0.1.0-beta` — feature-complete milestone under validation;
- `0.1.0-rc.1` — release candidate;
- `1.0.0` — first stable production release.

### Version increments

- `PATCH` — fixes, documentation and small compatible improvements;
- `MINOR` — a completed new functional milestone;
- `MAJOR` — incompatible changes to data formats, calculation rules or public API.

A wording-only typo correction may keep the same version, but remains visible in commit history. Changes to requirements, algorithms, data structures or user-visible behavior require a version increment.

### Channels

- `docs` — specification and setup without a working product;
- `alpha` — incomplete and changeable functionality;
- `beta` — core functionality complete but still under broad validation;
- `rc.N` — release candidate;
- no suffix — stable release.

### Mandatory synchronization

Whenever the version changes, one patch must update:

1. `VERSION.json`;
2. `VERSION.md`;
3. `CHANGELOG.md`;
4. the visible website version once implemented;
5. `package.json` if introduced;
6. the release and tag when publishing a formal release.

### Patch completion check

- all version values match;
- date and milestone match;
- `VERSION.md` does not claim unfinished functionality;
- `CHANGELOG.md` describes actual changes;
- `VERSION.json` is valid JSON;
- the next target version is explicit.

</td>
</tr>
</table>
