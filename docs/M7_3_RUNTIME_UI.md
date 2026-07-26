# M7.3 — runtime state и панель реальных альтернатив

## Статус

Документ фиксирует пользовательский подэтап M7.3 из PR `#28`.

- опубликованная версия до release checkpoint остаётся `0.7.0-alpha.2`;
- панель относится к `Unreleased — M7.3 development`;
- полный release `0.7.0-alpha.3` создаётся только после успешного focused Chromium evidence.

## Цель

Подключить уже проверенные расчётные слои M7.3 к основной странице:

```text
production report + control case
→ подготовленный production state
→ SolutionMetrics
→ decision profile
→ Pareto frontier
→ compact display set
→ RU/EN explanations
→ read-only UI
```

UI не получает сырые candidate/layout структуры и не выполняет отдельные производственные формулы.

## Чистый runtime

`src/alternatives-runtime.js`

Экспортирует:

- `prepareAlternativesProductionState()`;
- `createAlternativesRuntimeState()`;
- `calculateControlLayoutCompactness()`;
- runtime/prepared kind и status constants.

### Подготовка один раз

Из уже опубликованного состояния основной страницы используются:

- проверенный production report;
- control case;
- source-sheet geometry;
- operator pricing profile, если он введён.

На этапе подготовки:

- из `pairMetrics.contributions` восстанавливается фактическое распределение файлов по ручным монтажам;
- paper minimum строится один раз из control case и сохраняется в prepared state;
- вычисляется проверяемая compactness контрольной сетки;
- сохраняются source sheet и реальные distribution metrics.

При смене приоритета или reference prepared state используется повторно. Генератор монтажей и paper minimizer заново не запускаются.

## Runtime statuses

- `waiting-production` — report/control case ещё не загружены;
- `ready-without-pricing` — варианты доступны, но денежная цель исключена;
- `ready` — оба решения имеют общий совместимый pricing basis;
- `error` — входные production data не прошли строгую проверку.

Ошибочное или неполное состояние не выдаёт частичные альтернативы за готовый результат.

## Runtime event

`src/alternatives-ui.js` публикует:

```text
window.__uimpositionAlternativesState
CustomEvent("uimposition:alternatives")
```

Событие содержит готовый runtime state, включая:

- текущий decision profile;
- первый приоритет;
- pricing comparison;
- production alternative set;
- explanation set;
- recommendation и reference.

## Панель основной страницы

`#productionAlternatives`

Панель создаётся после существующих M3–M6 production/paper panels и перед roadmap.

Показывает:

- compact manual;
- paper minimum;
- recommendation;
- comparison reference;
- листы;
- layout-формы;
- цветовые пластины;
- листопрогоны;
- перетираж файлов и пар;
- split orders;
- итоговую стоимость, если доступна;
- причину включения;
- решающую цель;
- преимущество;
- цену компромисса;
- component cost deltas.

## Интерактивность без повторной генерации

### Приоритет

Кнопки:

- `Сначала бумага`;
- `Сначала стоимость`.

Приоритет стоимости заблокирован, пока pricing comparison несовместим или неполон.

Изменение приоритета:

- не меняет схемы;
- не строит report заново;
- не запускает paper minimizer;
- только пересортировывает готовые normalized alternatives.

### База сравнения

Каждая строка/карточка имеет действие `Сравнивать с этим`.

Смена reference:

- не меняет recommendation;
- пересчитывает advantage/tradeoff и денежные дельты;
- не перегенерирует alternatives.

## RU/EN

Панель синхронизируется с языком документа:

- названия и служебные тексты локализованы;
- числа используют `ru-RU` или `en-US`;
- explanation set пересоздаётся только как представление существующих данных.

## Адаптивность

Desktop:

- два реальных варианта рядом;
- основные метрики видны без раскрытия;
- причины и cost breakdown остаются внутри карточки.

Mobile/tablet:

- карточки переходят в одну колонку;
- метрики переходят в сетку 2×N;
- priority controls остаются кнопками, drag-and-drop не требуется.

## Проверки

`tests/alternatives-runtime.test.js`:

- ожидание полного production state;
- реальные alternatives без прайса;
- priced paper-first;
- cost-first без повторной production generation;
- reference override;
- compactness из verified geometry;
- invalid geometry → error state.

Focused Chromium scenario:

`tools/screenshots/scenarios/m7-real-alternatives-cost-first.json`

Он фактически:

1. вводит `130 г/м²`, `4 BYN/кг`, `15 BYN/пластина`, `0 BYN/layout preparation`;
2. загружает контрольный заказ;
3. ждёт production report и alternatives runtime;
4. переключает `Сначала стоимость`;
5. подтверждает `2 Pareto · pricing ready`;
6. подтверждает recommendation `manual-compact`;
7. проверяет advantage/tradeoff paper minimum;
8. проверяет component total delta `6226,94 BYN`;
9. сохраняет screenshot только панели M7.3.

## Проверенный пользовательский результат

При cost-first:

- compact manual рекомендован;
- paper minimum остаётся видимым;
- paper minimum лучше на `90` листов;
- paper minimum хуже по итоговой иллюстративной стоимости на `6226,94 BYN`;
- оператор видит обе стороны компромисса и оставляет окончательный выбор за собой.

## Следующая граница

После объединения PR `#28`:

1. зафиксировать итоговый focused screenshot в permanent evidence archive;
2. синхронизировать `VERSION.json`, `VERSION.md`, package и visible version на `0.7.0-alpha.3`;
3. оформить changelog release section;
4. подготовить news Markdown и изображение для uNews/Telegram;
5. создать release manifest;
6. проверить recovery branch, immutable tag и настоящий GitHub prerelease;
7. только после полного checkpoint переходить к M7.4 work-and-turn.
