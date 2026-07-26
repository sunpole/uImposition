# M7.3 — runtime state и компактный UI реальных альтернатив

## Статус

Функциональный подэтап будущего `0.7.0-alpha.3`. Он подключает уже проверенные manual/paper alternatives, Pareto/display set и RU/EN explanations к основной странице.

Видимая и опубликованная версия до отдельного release checkpoint остаётся `0.7.0-alpha.2`.

## Архитектурная граница

Поток данных разделён на три слоя:

1. `src/alternatives-runtime.js`
   - принимает production report, control case, pricing profile и decision profile;
   - подготавливает normalized `SolutionMetrics`;
   - строит `productionAlternativeSet` и explanation set;
   - не работает с DOM.
2. `src/alternatives-controller.js`
   - слушает production/pricing events;
   - кэширует подготовленное production-состояние и доказанный paper minimum;
   - применяет команды priority/reference;
   - публикует только очищенное runtime-состояние.
3. `src/alternatives-ui.js`
   - не получает production report, layouts, candidates или planned runs;
   - отображает только normalized metrics, Pareto/display metadata и готовые explanations;
   - отправляет команды controller-слою.

## События

### Входные

- `uimposition:production-report`
- `uimposition:pricing`
- `uimposition:alternatives-command`

Команды:

```js
{ type: "set-priority", objectiveId: "physicalSheets" }
{ type: "set-priority", objectiveId: "estimatedTotalCost" }
{ type: "set-reference", solutionId: "manual-compact" }
```

### Выходное

- `uimposition:alternatives`

Public state содержит:

- runtime status;
- текущий decision profile и первый priority objective;
- reference solution id;
- pricing compatibility;
- normalized production alternative set;
- localized explanation set;
- безопасное текстовое описание ошибки.

Public state не содержит:

- front/back layouts;
- candidate blocks;
- planned runs;
- raw paper solution;
- control-case orders;
- production report rows.

## Кэширование

После получения production report controller один раз подготавливает production state и paper minimum.

Смена:

- `paper-first / cost-first`;
- RU/EN;
- reference-варианта

не запускает повторную генерацию монтажей и paper minimizer. Пересчитываются только decision/Pareto/display/explanation слои поверх готовых данных.

Новый production report или изменение исходных настроек сбрасывает кэш.

## Состояния UI

### До production report

- статус: загрузить контрольный заказ;
- кнопки priority заблокированы;
- варианты не показываются.

### Production ready, pricing incomplete

- два реальных Pareto-варианта показываются;
- paper-first остаётся доступным;
- cost-first заблокирован;
- денежные значения и component deltas не подменяются нулями.

### Production ready, pricing ready

- доступны paper-first и cost-first;
- recommendation меняется мгновенно;
- пользователь может выбрать reference;
- показываются:
  - физические листы;
  - layout-формы;
  - цветовые пластины;
  - листопрогоны;
  - file/pair overrun;
  - split orders;
  - итоговая стоимость;
  - преимущество;
  - цена компромисса;
  - решающая цель;
  - component cost deltas.

### Ошибка

Частичный или геометрически неверный контрольный набор не создаёт неполный список альтернатив. UI получает безопасный error state.

## Проверенный контрольный результат

При общем прайсе:

- плотность: `130 г/м²`;
- бумага: `4 BYN/кг`;
- цветовая пластина: `15 BYN`;
- подготовка layout-формы: `0 BYN`.

### Paper first

Рекомендуется `paper-minimum`:

- `3305` физических листов;
- `112` layout-форм;
- `448` цветовых пластин;
- `7199.4894 BYN`.

### Cost first

Рекомендуется `manual-compact`:

- `3395` физических листов;
- `8` layout-форм;
- `32` цветовые пластины;
- `972.5466 BYN`.

Paper minimum относительно compact manual экономит `90` листов, но увеличивает расчётную стоимость на `6226.9428 BYN` при данном контрольном прайсе.

## Проверки

`tests/alternatives-runtime.test.js` подтверждает:

- ожидание production report;
- unpriced state без нулевой стоимости;
- priced paper-first;
- priced cost-first;
- смену reference;
- compactness из проверенной геометрии;
- error state при неверной геометрии.

Focused Chromium scenario:

- `tools/screenshots/scenarios/m7-real-alternatives-cost-first.json`.

Он:

1. вводит контрольный прайс;
2. загружает реальный контрольный заказ;
3. переключает cost-first;
4. проверяет recommendation `manual-compact`;
5. проверяет преимущество paper minimum по бумаге;
6. проверяет tradeoff по стоимости;
7. проверяет component delta `6226,94 BYN`;
8. сохраняет focused screenshot только новой панели.

## Следующий шаг

После успешных Quality и Chromium/PDF workflows:

1. объединить функциональный PR;
2. подготовить release news и uNews/Telegram payload;
3. сохранить focused evidence в постоянный archive;
4. синхронизировать `VERSION.json`, `VERSION.md`, package и видимую версию;
5. создать recovery branch `release/v0.7.0-alpha.3`;
6. создать immutable tag `v0.7.0-alpha.3`;
7. опубликовать GitHub prerelease.

Work-and-turn из M7.4 до завершения этого release checkpoint не начинается.
