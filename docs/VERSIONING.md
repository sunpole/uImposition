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
- recovery-ветка `release/v{version}` — неизменяемая точка отката;
- tag `v{version}` — точное имя версии;
- GitHub Release — опубликованный checkpoint;
- `news/*.md` и изображение — release news для uNews/Telegram;
- `archive/development/{version}/` — постоянные доказательства и архивы разработки.

### Формат

`MAJOR.MINOR.PATCH[-CHANNEL[.N]]`

- `docs` — документация без рабочего продукта;
- `alpha` — работающая, но неполная версия;
- `beta` — основная функциональность собрана;
- `rc.N` — кандидат;
- без суффикса — стабильный релиз.

Если после уже опубликованной alpha-версии завершён отдельный небольшой патч, он получает новый уникальный номер, например `0.6.1-alpha` или `0.6.0-alpha.1`. Нельзя перемещать уже опубликованный tag на другой commit.

### Обязательная синхронизация

При изменении версии один патч обновляет:

1. `VERSION.json`;
2. `VERSION.md`;
3. `CHANGELOG.md`;
4. `package.json`;
5. README;
6. видимую версию сайта;
7. screenshot-сценарии версии;
8. release news и archive manifest.

### Обязательный checkpoint каждого завершённого патча

Каждый патч, признанный завершённым и публикуемый в `main`, получает:

1. успешные source checks и тесты;
2. реальный Chromium screenshot с точного commit;
3. ручную визуальную проверку;
4. новый патчноут и короткий текст для Telegram;
5. постоянный архив доказательств в репозитории;
6. recovery-ветку `release/v{version}`;
7. tag `v{version}`;
8. настоящий GitHub Release;
9. флаг prerelease для `alpha`, `beta` и `rc`;
10. обычный стабильный Release для версии без суффикса.

Создание ветки или tag отдельно не равно созданию Release. Нельзя сообщать, что релиз выпущен, пока объект GitHub Release фактически не существует.

### Автоматический цикл

```text
feature branch
→ PR и проверки
→ фокусный screenshot + полный технический evidence
→ news + archive/development/{version}
→ merge в main
→ release/v{version}
→ tag v{version}
→ GitHub prerelease/release
→ uNews queue
→ Telegram
```

`publish-version-release.yml` создаёт rollback-ветку, tag и GitHub Release только после того, как release manifest вошёл в `main`.

</td>
<td width="50%" valign="top">

## English

### Sources of truth

Machine and human version files, changelog, package metadata, immutable rollback branch, exact tag, GitHub Release, release news, and the permanent development archive all form the version checkpoint.

### Every completed published patch

Every completed patch merged to `main` receives passing checks, a factual Chromium screenshot, manual visual review, release news, a permanent evidence archive, `release/v{version}`, tag `v{version}`, and an actual GitHub Release. Alpha, beta, and RC versions are GitHub prereleases; stable versions are normal releases.

A later small patch must use a new unique version. Existing tags are immutable and must never be moved.

A branch or tag alone is not a GitHub Release. Never report a release as published until the GitHub Release object actually exists.

</td>
</tr>
</table>
