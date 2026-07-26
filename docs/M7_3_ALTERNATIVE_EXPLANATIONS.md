# M7.3 — alternative explanations and component cost deltas

## Статус

Этот документ описывает чистый функциональный подэтап M7.3 после реальных production alternatives.

- опубликованная версия остаётся `0.7.0-alpha.2`;
- код относится к `Unreleased — M7.3 development`;
- DOM/UI, focused screenshot и release checkpoint `0.7.0-alpha.3` ещё не добавляются;
- модель работает только поверх уже проверенного `productionAlternativeSet`.

## Цель

Оператор должен видеть не только числа, но и понятное объяснение каждого показанного варианта:

1. почему вариант включён в компактный набор;
2. в чём его главное преимущество;
3. какова основная цена компромисса;
4. какая цель первой определила рекомендацию;
5. из каких денежных компонентов складывается разница.

Выбор вариантов, вычисление Pareto-frontier и форматирование текста остаются разными слоями.

## Результат модели

`createAlternativeExplanationSet()` возвращает для каждого display entry:

- `reasonKinds` и локализованные `reasonTexts`;
- reference-вариант, относительно которого выполнено сравнение;
- все structured metric deltas;
- primary advantage;
- primary tradeoff;
- deciding objective;
- ID варианта, предпочитаемого по первой различающейся цели;
- component cost deltas;
- готовые RU/EN фразы для будущего UI.

## Осмысленная база сравнения

Каждый показанный вариант получает реальную базу сравнения:

- обычный вариант сравнивается с выбранным reference;
- если reference не является рекомендацией, сам reference сравнивается с рекомендованным;
- если reference и recommendation совпадают, рекомендуемый вариант сравнивается со следующим решением в текущем лексикографическом ранге.

Поэтому рекомендуемый вариант больше не сравнивается сам с собой и также имеет собственные преимущество, компромисс, решающую цель и денежный breakdown.

## Локализация

Поддерживаются:

- `ru` → `ru-RU`;
- `en` → `en-US`.

Локализуются:

- названия целей;
- причины показа;
- преимущество и цена компромисса;
- решающая цель;
- денежные компоненты;
- количество показанных и скрытых Pareto-вариантов.

Структурированные числовые значения сохраняются отдельно от текста.

## Денежные компоненты

При совместимом `pricing ready` возвращаются точные дельты:

- `paperCost`;
- `colorPlateCost`;
- `layoutFormPreparationCost`;
- `estimatedTotalCost`.

Для каждого компонента сохраняются:

- стоимость текущего варианта;
- стоимость reference-варианта;
- signed delta;
- absolute delta;
- кто лучше;
- локализованные значения.

Для реального paper-first сравнения compact manual против paper minimum:

| Компонент | Compact manual − Paper minimum |
|---|---:|
| Бумага | `+13.0572 BYN` |
| Цветовые пластины | `−6240 BYN` |
| Подготовка layout-форм | `0 BYN` |
| Итого | `−6226.9428 BYN` |

То есть compact manual использует немного более дорогую бумагу, но экономит `6240 BYN` на цветовых пластинах и `6226.9428 BYN` в общей сумме.

## Pricing guard

Денежные объяснения доступны только когда `productionAlternativeSet.pricingComparison` имеет:

```text
status = ready
comparable = true
```

При `incomplete` или `incompatible`:

- component deltas отсутствуют;
- currency не подставляется;
- нулевая стоимость не выдумывается;
- текст явно сообщает, что денежное сравнение недоступно.

## Проверки

Regression-набор покрывает:

- русский paper-first результат;
- английский cost-first результат;
- осмысленное объяснение рекомендуемого варианта;
- смену reference-варианта;
- точные BYN component deltas;
- incomplete pricing;
- incompatible pricing;
- неизвестный язык;
- неизвестный reference ID.

## Что ещё не входит

Этот подэтап не добавляет:

- runtime event/state с alternative/explanation set;
- карточки или таблицу вариантов;
- переключатель RU/EN в новом UI;
- focused Chromium screenshot нового результата;
- news/uNews/Telegram;
- evidence archive;
- recovery branch, tag и prerelease `0.7.0-alpha.3`.

Следующий безопасный подэтап — подключить уже готовые real alternatives и explanations к runtime state приложения и компактной read-only демонстрации.
