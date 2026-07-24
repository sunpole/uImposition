# uImposition — START HERE / НАЧАТЬ ЗДЕСЬ

> Этот файл — первая точка входа для нового чата ChatGPT, нового устройства или нового разработчика.  
> This file is the first entry point for a new ChatGPT conversation, a new device, or a new developer.

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Как продолжается разработка

Разработка uImposition ведётся **через GitHub как единственный источник истины**.

Основной рабочий процесс не зависит от локального компьютера, терминала, локального клона или установленной среды разработки. ChatGPT должен читать файлы из GitHub, создавать отдельную ветку, вносить изменения через GitHub-инструменты, открывать Pull Request и проверять результат через GitHub Actions и GitHub Pages.

Терминал или локальный компьютер могут использоваться только как дополнительная ручная проверка владельцем проекта. Они не являются обязательными для разработки и не являются источником истины.

### Текущее состояние

- репозиторий: `sunpole/uImposition`;
- сайт: `https://sunpole.github.io/uImposition/`;
- основная ветка: `main`;
- текущая версия в `main`: **`0.2.0-alpha`**;
- завершённый этап: **M2 — вместимость изделия и точные пары страниц**;
- следующая версия: **`0.3.0-alpha`**;
- следующий этап: **M3 — лицо, зеркальный оборот, стрелки и рамочные схемы**;
- рабочая ветка M3 уже создана: `m3/0.3.0-alpha`;
- на момент создания этого handoff реализация M3 ещё не начата;
- точка отката M2: `release/v0.2.0-alpha`.

### Что обязательно прочитать перед изменениями

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json` и `VERSION.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
6. `docs/M3_IMPLEMENTATION_PLAN.md`;
7. `docs/TECHNICAL_SPECIFICATION_RU.md`;
8. `docs/ARCHITECTURE.md`;
9. `src/config.js`;
10. `data/control-case.json`;
11. последние Pull Request и проверки GitHub Actions.

### Главные правила

- Не угадывать состояние проекта по истории чата: сначала читать GitHub.
- Не менять `main` напрямую для функционального этапа.
- Одна задача — одна ветка и один понятный Pull Request.
- Производственные правила и значения не прятать внутри UI-кода.
- Новую расчётную логику оформлять отдельным чистым модулем и тестами.
- Не строить оборот самостоятельно: он всегда выводится из лица.
- Не принимать недопечатку.
- Не объявлять версию готовой до успешных GitHub Actions и проверки реального Chromium-скриншота.
- При изменении версии одновременно обновлять `VERSION.json`, `VERSION.md`, `CHANGELOG.md`, README и видимую версию сайта.
- Стабильная версия получает recovery-ветку, tag и GitHub Release. Alpha-веха получает как минимум recovery-ветку.

### Точная точка продолжения

Продолжить в ветке `m3/0.3.0-alpha` по плану `docs/M3_IMPLEMENTATION_PLAN.md`.

Первый кодовый шаг M3: добавить независимые модули для назначения позиций лицу, преобразования ориентации, построения зеркального оборота и проверки взаимного соответствия. Только после тестов подключать их к DOM-интерфейсу.

</td>
<td width="50%" valign="top">

## English

### How development continues

uImposition is developed with **GitHub as the single source of truth**.

The primary workflow does not depend on a local computer, terminal, local clone, or locally installed development environment. ChatGPT must read the repository through GitHub, create a feature branch, write changes through GitHub tools, open a Pull Request, and verify the result through GitHub Actions and GitHub Pages.

A terminal or local computer may be used only as an additional manual verification method by the project owner. They are not required for development and are not a source of truth.

### Current state

- repository: `sunpole/uImposition`;
- website: `https://sunpole.github.io/uImposition/`;
- default branch: `main`;
- current version in `main`: **`0.2.0-alpha`**;
- completed milestone: **M2 — product capacity and exact source-page pairs**;
- next version: **`0.3.0-alpha`**;
- next milestone: **M3 — front, mirrored back, direction arrows, and bordered schemes**;
- M3 working branch already exists: `m3/0.3.0-alpha`;
- M3 implementation had not started when this handoff was created;
- M2 rollback checkpoint: `release/v0.2.0-alpha`.

### Required reading before any change

1. `START_HERE.md`;
2. `AGENTS.md`;
3. `VERSION.json` and `VERSION.md`;
4. `docs/CURRENT_STATE.md`;
5. `docs/GITHUB_ONLY_DEVELOPMENT.md`;
6. `docs/M3_IMPLEMENTATION_PLAN.md`;
7. `docs/TECHNICAL_SPECIFICATION_RU.md`;
8. `docs/ARCHITECTURE.md`;
9. `src/config.js`;
10. `data/control-case.json`;
11. recent Pull Requests and GitHub Actions checks.

### Core rules

- Never infer repository state from chat history; read GitHub first.
- Do not write functional milestones directly to `main`.
- One task must use one branch and one clear Pull Request.
- Production rules and values must not be hidden in UI code.
- New calculation logic must be a separate pure module with tests.
- Never design the back independently: derive it from the front.
- Never accept underproduction.
- Do not declare a version complete before successful GitHub Actions and a factual Chromium screenshot review.
- A version change must synchronise `VERSION.json`, `VERSION.md`, `CHANGELOG.md`, README, and the visible site version.
- A stable version requires a recovery branch, tag, and GitHub Release. An alpha milestone requires at least a recovery branch.

### Exact continuation point

Continue on `m3/0.3.0-alpha` according to `docs/M3_IMPLEMENTATION_PLAN.md`.

The first M3 coding step is to add independent modules for front-position assignment, orientation transformation, mirrored-back derivation, and front/back validation. Connect those modules to the DOM interface only after their tests pass.

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
- docs/M3_IMPLEMENTATION_PLAN.md;
- docs/TECHNICAL_SPECIFICATION_RU.md;
- docs/ARCHITECTURE.md;
- src/config.js;
- data/control-case.json;
- последние Pull Request и GitHub Actions.

Разработка ведётся GitHub-first и без обязательного терминала или локального ПК.
Не проси локальный клон и не основывай работу на локальных файлах.
Терминал допускается только как дополнительная проверка, но не как обязательный этап и не как источник истины.

Перед изменениями дай короткий аудит фактического состояния GitHub.
Затем продолжи M3 в ветке m3/0.3.0-alpha строго модульно: чистые расчётные модули, отдельные тесты, затем UI, Pull Request, GitHub Actions, реальный Chromium-скриншот, uNews и recovery-ветка после merge.
```
