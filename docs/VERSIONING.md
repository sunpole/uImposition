# Версионирование / Versioning Policy

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Источники истины

- `VERSION.json` — машинная версия и статус;
- `VERSION.md` — состояние для человека;
- `CHANGELOG.md` — история;
- `package.json` — техническая версия JavaScript-проекта;
- recovery-ветка `release/v{version}` — точка отката;
- GitHub Release и tag — публичная стабильная версия.

### Формат

`MAJOR.MINOR.PATCH[-CHANNEL]`

- `docs` — документация без рабочего продукта;
- `alpha` — работающая, но неполная версия;
- `beta` — основная функциональность собрана;
- `rc.N` — кандидат;
- без суффикса — стабильный релиз.

### Обязательная синхронизация

При изменении версии один патч обновляет:

1. `VERSION.json`;
2. `VERSION.md`;
3. `CHANGELOG.md`;
4. `package.json`;
5. видимую версию сайта.

### Стабильная точка

Каждая версия, признанная стабильной для отката, получает:

1. успешные тесты;
2. ручную проверку сайта;
3. новый реальный screenshot;
4. recovery-ветку `release/v{version}`;
5. tag `v{version}`;
6. GitHub Release с кратким описанием и ссылкой на патчноут.

Создание ветки не равно созданию Release. Нельзя сообщать о релизе, пока GitHub Release фактически не существует.

</td>
<td width="50%" valign="top">

## English

### Sources of truth

- `VERSION.json` — machine-readable version and status;
- `VERSION.md` — human-readable state;
- `CHANGELOG.md` — history;
- `package.json` — JavaScript package version;
- `release/v{version}` — rollback branch;
- GitHub Release and tag — public stable release.

### Format

`MAJOR.MINOR.PATCH[-CHANNEL]`

- `docs` — documentation-only setup;
- `alpha` — working but incomplete;
- `beta` — core functionality assembled;
- `rc.N` — release candidate;
- no suffix — stable release.

### Mandatory synchronization

A version change updates in one patch:

1. `VERSION.json`;
2. `VERSION.md`;
3. `CHANGELOG.md`;
4. `package.json`;
5. the visible website version.

### Stable checkpoint

Every version accepted as a rollback-safe stable checkpoint receives:

1. passing tests;
2. manual website review;
3. a new factual screenshot;
4. `release/v{version}` recovery branch;
5. `v{version}` tag;
6. GitHub Release with concise notes and patchnote link.

A branch is not a GitHub Release. Never report a release as created until it actually exists.

</td>
</tr>
</table>
