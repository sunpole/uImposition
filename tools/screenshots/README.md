# Реальные скриншоты uImposition / Factual screenshots

## Русский

Инструменты в этой папке запускают настоящий Chromium через Playwright и создают доказательные изображения интерфейса из точного checkout проекта.

Правила:

1. workflow имеет только `contents: read`;
2. сайт открывается из точного commit через локальный HTTP-сервер;
3. каждый сценарий сначала проверяет обязательный видимый текст;
4. PNG сохраняются только после успешных assertions;
5. artifact и `manifest.json` сначала проверяются человеком;
6. в `news/` копируется только выбранный и проверенный новый PNG;
7. старое изображение нельзя переиспользовать для нового патчноута;
8. скриншот не должен содержать секреты, cookies или приватные данные.

Локальная проверка:

```bash
cd tools/screenshots
npm ci
npx playwright install --with-deps chromium
SCREENSHOT_COMMIT="$(git rev-parse HEAD)" npm run capture
```

Результат:

```text
artifacts/screenshots/
├── manifest.json
├── entries/
├── uimposition-v0-1-0-alpha-m1-desktop.png
└── uimposition-v0-1-0-alpha-m1-mobile.png
```

## English

This isolated package launches a real Chromium browser and captures factual UI evidence from the exact project checkout.

Every scenario asserts visible expected content before capture. Generated artifacts are read-only workflow output and require visual approval before a selected new PNG is copied into `news/`.
