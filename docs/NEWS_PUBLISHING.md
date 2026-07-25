# Публикация новостей через uNews / Publishing through uNews

<table>
<tr>
<td width="50%" valign="top">

## Русский

uImposition использует GitHub-first очередь проекта **uNews**. Каждый законченный опубликованный патч получает release news сразу в том же цикле, что и GitHub Release.

### Канонический путь

```text
изменение uImposition
↓
версия, тесты и Chromium
↓
крупный screenshot новой функции
+ полный технический evidence
↓
news/*.md + новый PNG/JPEG
+ archive/development/{version}/
↓
merge в main
↓
rollback branch + tag + GitHub Release
↓
uNews GitHub Actions
↓
Telegram @uNewsLog
```

### Обязательный front matter

```yaml
---
type: feature
project: uImposition
series: uimposition
title: Русское название обновления
version: 0.6.0-alpha
queued_at: 2026-07-25T12:00:00Z
repo_url: https://github.com/sunpole/uImposition
web_url: https://sunpole.github.io/uImposition/
image: 2026-07-25-uimposition-v0-6-0-alpha-paper-minimum.png
image_source: playwright
image_target: scenario/m6-paper-minimum-telegram
image_commit: exact-commit-sha
image_captured_at: 2026-07-25T12:00:00Z
---
```

### Главные правила

- один завершённый patch/release — один новый патчноут;
- каждый патчноут получает новое реальное изображение;
- изображение показывает именно новую функцию крупным планом;
- длинный full-page screenshot сохраняется как техническая история, но не обязан идти в Telegram;
- пользовательские изменения снимаются с настоящего сайта через Chromium;
- документационные изменения могут использовать реальный GitHub UI или document render;
- AI-картинка не считается доказательством функции;
- старую картинку нельзя повторно использовать;
- `queued_at` задаётся в UTC;
- короткий текст для Telegram пишется по-русски и не дублирует весь CHANGELOG;
- uNews сам добавляет ссылку и хештеги;
- реальную публикацию выполняет только GitHub Actions uNews;
- патчноут и PNG должны войти в `main` вместе с release manifest;
- release archive сохраняется в репозитории и прикладывается к GitHub Release.

### Срок публикации

Release news создаётся до merge и попадает в очередь сразу после merge. Не откладывать новость до следующего milestone и не объединять несколько самостоятельных релизов в одну запоздалую публикацию.

### Хештеги

```text
#uimposition #uNews #тыНовости #Sunpole
```

</td>
<td width="50%" valign="top">

## English

Every completed published uImposition patch receives release news in the same cycle as its GitHub Release.

The Telegram image should be a focused factual Chromium capture of the feature that changed. Long full-page captures remain valuable technical evidence and are preserved in the repository archive, but they do not need to be used as the public Telegram image.

The patchnote, focused image, permanent evidence archive, rollback branch, tag, GitHub Release, and uNews queue are one release checkpoint. Actual Telegram publication remains the responsibility of the uNews GitHub Actions workflow.

</td>
</tr>
</table>

## Проверка / Validation

В uNews:

```bash
npm run publish:projects:check -- "../uImposition/news/<patchnote>.md"
npm run publish:all:check
npm test
```

Фактическая публикация остаётся ответственностью `sunpole/uNews/.github/workflows/publish-all-news.yml`.