# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Этот файл — первая точка входа для нового чата ChatGPT, нового устройства или нового разработчика.  
> This file is the first entry point for a new ChatGPT conversation, a new device, or a new developer.

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Как продолжается разработка

Разработка uImposition ведётся **через GitHub как единственный источник истины**.

Основной процесс не зависит от локального компьютера, терминала, локального клона или установленной среды разработки. ChatGPT читает файлы из GitHub, работает в отдельной ветке, открывает Pull Request и проверяет результат через GitHub Actions, настоящий Chromium и GitHub Pages.

Терминал или локальный компьютер используются только как дополнительная ручная проверка владельцем и не являются источником истины.

### Текущее состояние

- репозиторий: `sunpole/uImposition`;
- сайт: `https://sunpole.github.io/uImposition/`;
- основная ветка после объединения M3: `main`;
- текущая версия: **`0.3.0-alpha`**;
- завершённый этап: **M3 — лицо и автоматически зеркальный оборот**;
- следующая версия: **`0.4.0-alpha`**;
- следующий этап: **M4 — производственные итоги и отчёт**;
- точка отката M3: `release/v0.3.0-alpha`;
- M3 остаётся ручной контрольной раскладкой и не заявляет автоматический минимум бумаги.

### Что обязательно прочитать перед изменениями

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json` и `VERSION.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
6. `docs/ROADMAP.md`;
7. `docs/TECHNICAL_SPECIFICATION_RU.md`;
8. `docs/ARCHITECTURE.md`;
9. `src/config.js`;
10. `data/control-case.json`;
11. `data/control-layout-m3.json`;
12. последние Pull Request и GitHub Actions.

### Что реализовано в M3

- `src/front-layout.js` — лицо сплошными блоками row-major;
- `src/orientation.js` — внутренние направления и преобразование стрелок;
- `src/back-layout.js` — оборот только как зеркало готового лица;
- `src/imposition-validation.js` — независимая проверка соответствия;
- `src/scheme-renderer.js` — DOM-отрисовка проверенных схем;
- `src/m3-demo.js` — координация четырёх контрольных монтажей;
- 4 лица и 4 оборота по `4 × 4 = 16` позиций;
- desktop/mobile Chromium screenshots;
- новый патчноут и PNG через uNews.

### Главные правила

- Не угадывать состояние проекта по истории чата: сначала читать GitHub.
- Не менять `main` напрямую для функционального этапа.
- Одна задача — одна ветка и один понятный Pull Request.
- Производственные правила и значения не прятать внутри UI-кода.
- Новую расчётную логику оформлять отдельным чистым модулем и тестами.
- Не строить оборот самостоятельно: он всегда выводится из лица.
- Не принимать недопечатку.
- Не считать ручную контрольную раскладку доказанным глобальным минимумом.
- Не объявлять версию готовой до успешных Actions и проверки реального Chromium-скриншота.
- При изменении версии одновременно обновлять все источники версии.
- Alpha-веха получает recovery-ветку; стабильная версия — recovery-ветку, tag и настоящий GitHub Release.

### Точная точка продолжения

Начать M4 в новой отдельной ветке от проверенного `main` версии `0.3.0-alpha`.

Первый кодовый шаг M4: спроектировать и реализовать независимые чистые функции, которые для явных монтажей рассчитывают:

- напечатанное количество по каждой паре;
- недопечатку и перетираж;
- лицевые и оборотные формы;
- физическую бумагу;
- листопрогоны;
- проверяемую сводку без DOM.

Только после тестов подключать производственный отчёт к интерфейсу.

</td>
<td width="50%" valign="top">

## English

### How development continues

uImposition is developed with **GitHub as the single source of truth**.

The primary workflow does not depend on a local computer, terminal, local clone, or installed development environment. ChatGPT reads the repository through GitHub, works in a feature branch, opens a Pull Request, and verifies the result through GitHub Actions, factual Chromium screenshots, and GitHub Pages.

A terminal or local computer is optional owner-side verification only and is not a source of truth.

### Current state

- repository: `sunpole/uImposition`;
- website: `https://sunpole.github.io/uImposition/`;
- default branch after the M3 merge: `main`;
- current version: **`0.3.0-alpha`**;
- completed milestone: **M3 — front and automatically mirrored back**;
- next version: **`0.4.0-alpha`**;
- next milestone: **M4 — production totals and reporting**;
- M3 rollback checkpoint: `release/v0.3.0-alpha`;
- M3 remains a manual control layout and does not claim automatic paper minimisation.

### Required reading before any change

Read `AGENTS.md`, version sources, current state, roadmap, specifications, architecture, configuration, both control JSON files, and recent Pull Requests and Actions.

### Implemented in M3

M3 contains pure front assignment, orientation, mirrored-back derivation, independent validation, DOM-only rendering, four control fronts and four backs, factual desktop/mobile Chromium screenshots, and a uNews patchnote with a new PNG.

### Core rules

- Read GitHub before inferring state.
- Do not write functional milestones directly to `main`.
- Keep production rules out of UI code.
- Put new calculation logic in pure tested modules.
- Derive every back only from its front.
- Reject underproduction.
- Never treat the manual control layout as a proven global optimum.
- Synchronise all version sources together.
- An alpha milestone requires a recovery branch; a stable version requires a recovery branch, tag, and actual GitHub Release.

### Exact continuation point

Start M4 in a new branch from verified `main` at `0.3.0-alpha`. First create DOM-independent functions and tests for produced quantity, underproduction, overrun, plates, physical paper, press passes, and a validated summary. Integrate the report into the UI only after those tests pass.

</td>
</tr>
</table>

## Prompt для нового чата / Prompt for a new chat

```text
Открой репозиторий sunpole/uImposition через GitHub.

Сначала прочитай:
- START_HERE.md;
- AGENTS.md;
- VERSION.json и VERSION.md;
- docs/CURRENT_STATE.md;
- docs/GITHUB_ONLY_DEVELOPMENT.md;
- docs/ROADMAP.md;
- docs/TECHNICAL_SPECIFICATION_RU.md;
- docs/ARCHITECTURE.md;
- src/config.js;
- data/control-case.json;
- data/control-layout-m3.json;
- последние Pull Request и GitHub Actions.

Разработка ведётся GitHub-first и без обязательного терминала или локального ПК.
Перед изменениями дай краткий аудит фактического состояния GitHub.
Затем начни M4 в отдельной ветке от main версии 0.3.0-alpha: сначала чистые расчётные модули и тесты для напечатанного количества, недопечатки, перетиража, форм, бумаги и листопрогонов; затем UI, Pull Request, GitHub Actions, реальный Chromium-скриншот, uNews и recovery-ветка после merge.
```
