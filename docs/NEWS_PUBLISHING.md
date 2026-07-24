# Публикация новостей через uNews / Publishing through uNews

<table>
<tr>
<td width="50%" valign="top">

## Русский

uImposition использует уже работающую GitHub-first очередь проекта **uNews**.

Канонический путь:

```text
изменение uImposition
↓
проверки и версия
↓
реальный screenshot artifact
↓
визуальная проверка
↓
news/*.md + новый PNG/JPEG
↓
main
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
version: 0.1.0-alpha
queued_at: 2026-07-24T12:00:00Z
repo_url: https://github.com/sunpole/uImposition
web_url: https://sunpole.github.io/uImposition/
image: 2026-07-24-uimposition-v0-1-0-alpha-m1.png
image_source: playwright
image_target: scenario/m1-trim-desktop
image_commit: exact-commit-sha
image_captured_at: 2026-07-24T12:00:00Z
---
```

### Главные правила

- один новый патчноут — одно новое реальное изображение;
- изображение показывает именно заявленное изменение;
- пользовательские изменения снимаются с настоящего сайта через Chromium;
- документационные изменения могут использовать реальный GitHub UI или document render;
- AI-картинка не считается доказательством функции;
- старую картинку нельзя повторно использовать;
- `queued_at` задаётся в UTC;
- короткий текст для Telegram пишется по-русски;
- uNews сам добавляет ссылку и хештеги;
- реальные локальные публикации запрещены: отправляет только GitHub Actions uNews.

### Хештеги

До отдельного явного mapping uNews безопасно создаёт generic footer по `series`:

```text
#uimposition #uNews #тыНовости #Sunpole
```

</td>
<td width="50%" valign="top">

## English

uImposition uses the existing GitHub-first **uNews** publication queue.

Canonical flow:

```text
uImposition change
↓
tests and version update
↓
real screenshot artifact
↓
visual review
↓
news/*.md + new PNG/JPEG
↓
main
↓
uNews GitHub Actions
↓
Telegram @uNewsLog
```

### Requirements

- every new patchnote has a new factual image;
- the image must visibly prove the announced change;
- user-visible features are captured from the real site in Chromium;
- documentation-only work may use a real GitHub UI or document render;
- generated artwork is not factual product evidence;
- old images must not be reused;
- `queued_at` uses exact UTC;
- Telegram copy is Russian-first;
- uNews appends the required link and hashtags;
- real publication is performed only by the uNews GitHub Actions workflow.

The generic safe footer for `series: uimposition` is:

```text
#uimposition #uNews #тыНовости #Sunpole
```

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
