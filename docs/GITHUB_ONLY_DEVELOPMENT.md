# Разработка только через GitHub / GitHub-Only Development

<table>
<tr>
<td width="50%" valign="top">

## Русский

### Основной принцип

GitHub является единственным источником истины для кода, документации, версии, тестов, скриншотов и истории решений.

Разработка должна быть возможна из нового чата ChatGPT и с нового устройства без доступа к прежнему компьютеру, локальной папке или терминалу.

### Что использует ChatGPT

- GitHub connector/API для чтения и изменения файлов;
- ветки для изоляции этапов;
- Pull Request для отчёта и проверки изменений;
- GitHub Actions для расчётных тестов;
- Playwright в GitHub Actions для реальных Chromium-скриншотов;
- GitHub Pages для проверки опубликованного интерфейса;
- uNews для подготовки и публикации патчноутов.

### Что не является обязательным

- локальный clone;
- Git Bash, PowerShell, zsh или Linux terminal;
- VS Code или другая локальная IDE;
- локальный Node.js;
- локальный Playwright;
- ручная загрузка файлов с компьютера.

Владелец проекта может использовать компьютер и терминал для дополнительной проверки, но ChatGPT не должен строить рабочий процесс так, будто без них разработка невозможна.

### Обязательный цикл функционального этапа

1. Прочитать GitHub-документацию и фактические файлы.
2. Проверить текущую версию, `main`, активные ветки, PR и Actions.
3. Создать или продолжить отдельную milestone-ветку.
4. Сначала изменить чистые расчётные модули и тесты.
5. Затем подключить UI отдельным слоем.
6. Обновить двуязычную документацию.
7. Синхронизировать версию, если этап завершён.
8. Открыть draft Pull Request.
9. Дождаться GitHub Actions:
   - Quality checks;
   - Chromium screenshots;
   - release-news preparation;
   - uNews validation.
10. Проверить реальный screenshot artifact.
11. Обновить PR точным отчётом и известными ограничениями.
12. Перевести PR из draft и объединить в `main`.
13. Проверить `main` и GitHub Pages.
14. Создать recovery-ветку `release/v{version}`.
15. Для стабильной версии создать tag и настоящий GitHub Release.

### Правила записи файлов

- Функциональные изменения не писать прямо в `main`.
- Большую связанную правку предпочтительно фиксировать одним атомарным commit или squash-merge.
- Не создавать десятки мелких бессодержательных commit в `main`.
- Не менять один файл параллельными write-вызовами.
- Перед заменой существующего файла сначала прочитать актуальную версию и SHA.
- После merge повторно читать файлы из `main`, а не считать PR автоматическим доказательством.

### Разделение ответственности

`src/app.js` не должен становиться монолитом.

Он отвечает за:

- получение значений DOM;
- вызов чистых модулей;
- хранение минимального UI-state;
- вызов renderer;
- показ ошибок пользователю.

Он не должен содержать:

- формулы оптимизации;
- зеркалирование оборота;
- преобразование стрелок;
- проверку тиражей;
- генерацию PDF;
- скрытые производственные значения.

### Доказательство готовности

Фраза «работает» допустима только когда есть одновременно:

- код в GitHub;
- тест или проверяемое правило;
- успешный GitHub Action;
- реальный Chromium-скриншот для пользовательского изменения;
- документированное ограничение, если функция ещё неполная.

### Роль локального компьютера

Локальный компьютер владельца применяется только для:

- необязательной визуальной проверки;
- сравнения с реальным производственным опытом;
- будущих тестов с InDesign/PDF и типографским процессом;
- диагностики, которую нельзя выполнить через GitHub.

Результат локальной проверки должен быть перенесён обратно в GitHub как issue, документ, тест или commit. Пока этого нет в GitHub, новый чат не может считать такое знание частью проекта.

</td>
<td width="50%" valign="top">

## English

### Core principle

GitHub is the single source of truth for code, documentation, versions, tests, screenshots, and decision history.

Development must remain possible from a new ChatGPT conversation and a new device without access to the previous computer, local directory, or terminal.

### What ChatGPT uses

- GitHub connector/API to read and modify files;
- branches to isolate milestones;
- Pull Requests for reports and review;
- GitHub Actions for calculation tests;
- Playwright in GitHub Actions for factual Chromium screenshots;
- GitHub Pages for the published interface;
- uNews for patchnote preparation and publishing.

### What is not required

- a local clone;
- Git Bash, PowerShell, zsh, or a Linux terminal;
- VS Code or another local IDE;
- local Node.js;
- local Playwright;
- manual file uploads from a computer.

The project owner may use a computer and terminal for additional verification, but ChatGPT must not design a workflow that depends on them.

### Required functional-milestone cycle

1. Read repository documentation and actual GitHub files.
2. Verify the current version, `main`, active branches, PRs, and Actions.
3. Create or continue a dedicated milestone branch.
4. Change pure calculation modules and tests first.
5. Connect the UI as a separate layer.
6. Update bilingual documentation.
7. Synchronise the version when the milestone is complete.
8. Open a draft Pull Request.
9. Wait for GitHub Actions:
   - Quality checks;
   - Chromium screenshots;
   - release-news preparation;
   - uNews validation.
10. Review the factual screenshot artifact.
11. Update the PR with an exact report and known limitations.
12. Mark the PR ready and merge it into `main`.
13. Verify `main` and GitHub Pages.
14. Create `release/v{version}` as a recovery branch.
15. For a stable version, create a tag and an actual GitHub Release.

### File-write rules

- Do not write functional changes directly to `main`.
- Prefer one atomic commit or a squash merge for one coherent change.
- Do not create many meaningless commits in `main`.
- Never issue parallel writes to the same file.
- Read the current file and SHA before replacing an existing file.
- After merge, read the result from `main`; do not treat the PR as automatic proof.

### Separation of responsibilities

`src/app.js` must not become a monolith.

It owns:

- reading DOM values;
- calling pure modules;
- maintaining minimal UI state;
- invoking a renderer;
- presenting errors.

It must not contain:

- optimisation formulas;
- back-side mirroring;
- direction-arrow transformations;
- run validation;
- PDF generation;
- hidden production values.

### Evidence of completion

The phrase “it works” is valid only when all of the following exist:

- code in GitHub;
- a test or verifiable rule;
- a successful GitHub Action;
- a factual Chromium screenshot for a user-facing change;
- a documented limitation if the feature is incomplete.

### Role of a local computer

The owner's local computer is used only for:

- optional visual verification;
- comparison with real production experience;
- future InDesign/PDF and print-production tests;
- diagnostics unavailable through GitHub.

Any local finding must be transferred back to GitHub as an issue, document, test, or commit. Until it is in GitHub, a new chat cannot treat it as project knowledge.

</td>
</tr>
</table>
