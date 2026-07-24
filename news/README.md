# uImposition news

Эта папка является очередью патчноутов для `sunpole/uNews`.

Каждая готовая запись состоит минимум из:

```text
YYYY-MM-DD-uimposition-vX-Y-Z-short-title.md
YYYY-MM-DD-uimposition-vX-Y-Z-short-title.png
```

Новый патчноут обязан:

- описывать только реальные изменения текущей версии;
- ссылаться на новый реальный PNG/JPEG из этой папки;
- содержать `version`, `queued_at`, `repo_url`, `web_url`;
- содержать provenance: `image_source`, `image_target`, `image_commit`, `image_captured_at`;
- завершаться коротким русским текстом для Telegram;
- не содержать секреты, локальные пути и приватные данные.

Полные правила: [`docs/NEWS_PUBLISHING.md`](../docs/NEWS_PUBLISHING.md).
