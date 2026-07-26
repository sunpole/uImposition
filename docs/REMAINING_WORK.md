# uImposition — что осталось до 1.0 / Remaining work to 1.0

## Текущая точка

- последний завершённый release checkpoint: **`0.7.0-alpha.2` / M7.2**;
- `release/v0.7.0-alpha.2`, tag `v0.7.0-alpha.2` и GitHub prerelease проверены на точном commit `aafa7b3a7c2e83d00e9c54796593259e9ef147d8`;
- предыдущий checkpoint `0.7.0-alpha.1` восстановлен и проверен на commit `622248f9e38f811a02143b428e264176f848b0a4`;
- доказан минимум физической бумаги `3305` листов для контрольного uniform-grid набора;
- рабочая стоимость compact-контрольного решения после явного ввода тестовых цен: `972,55 BYN`;
- активный патч: **`0.7.0-alpha.3` / M7.3**;
- Pareto foundation объединён через PR `#20`;
- compact materially-different display set объединён через PR `#25`;
- real production alternatives объединены через PR `#26`;
- RU/EN explanations и component cost deltas объединены через PR `#27`;
- runtime state/event и compact read-only UI реализуются через PR `#28`;
- следующая задача: focused evidence и полный release checkpoint `0.7.0-alpha.3`.

Каждый пункт ниже является отдельным публикуемым патчем: PR, проверки, фокусный Chromium screenshot, news/uNews/Telegram, постоянный evidence-архив, recovery-ветка, tag и GitHub prerelease/release.

## Сводка объёма

Исходный план до стабильной `1.0.0` содержит **17 release-патчей**. M7.1 и M7.2 завершены; остаётся **15 release-патчей**:

- M7 — 4 оставшихся патча: M7.3–M7.6;
- M8 — 6 патчей: реальные смешанные заказы, хранение и полный рабочий цикл;
- beta/RC — 4 патча: производственная проверка и стабилизация;
- stable — 1 патч: `1.0.0`.

Это рабочая оценка. Новый реальный граничный случай может добавить патч, но уже утверждённая функция не должна исчезнуть из плана молча.

---

# M7 — система решений оператора

## M7.1 — `0.7.0-alpha.1`: модель целей, порядка и базовой стоимости

**Статус: завершено и опубликовано.**

- единый список изменяемых целей;
- отдельный список жёстких ограничений;
- неизменяемый decision profile;
- перемещение цели вверх/вниз без DOM;
- лексикографическое сравнение двух решений;
- детерминированная сортировка набора решений;
- денежная цель `estimatedTotalCost`;
- расчёт веса листа по исходному формату и плотности `г/м²`;
- стоимость бумаги по `BYN/кг`;
- стоимость цветовых печатных форм по цене за штуку;
- необязательная стоимость подготовки layout-форм;
- итоговая стоимость и себестоимость одного заказанного изделия;
- тест: приоритет `бумага` выбирает `3305/112`, а `формы` или `стоимость` выбирают compact `3395/8` в иллюстративном прайсе;
- отдельная demo-страница `Бумага / Стоимость / Формы`;
- exact recovery branch, immutable tag и GitHub prerelease.

## M7.2 — `0.7.0-alpha.2`: нормализованные метрики решения

**Статус: завершено и опубликовано.**

- единая модель `SolutionMetrics`;
- бумага, монтажи, layout-формы, цветовые пластины;
- листопрогоны;
- перетираж готовых файлов и печатных пар;
- разделённые заказы;
- фрагментация блоков и число разных заказов на листе;
- бумажная масса, стоимость бумаги, форм и итоговая BYN-стоимость;
- стоимость одного заказанного изделия;
- одинаковые метрики для ручного, бумажного и будущих вариантов;
- независимая повторная проверка production report;
- явный статус `pricing ready / pricing incomplete` без выдуманных цен;
- основной UI ввода плотности, `BYN/кг`, цены цветовой формы и необязательной подготовки layout-форм;
- guarded-переход production report → `SolutionMetrics`;
- защита от `null → 0`, недопечатки и несовпадения базы стоимости;
- exact recovery branch, immutable tag и GitHub prerelease.

## M7.3 — `0.7.0-alpha.3`: существенно разные альтернативы и Pareto

**Статус: в работе. PR `#20` завершил Pareto foundation; PR `#25` — compact display set; PR `#26` — реальные production alternatives; PR `#27` — RU/EN explanations и component deltas; PR `#28` — runtime/controller и compact read-only UI. Новый release ещё не создан.**

Уже реализовано:

- [x] удаление полных дублей по нормализованным метрикам;
- [x] сравнение по каждой цели с учётом minimize/maximize;
- [x] определение доминирования;
- [x] построение Pareto-frontier;
- [x] детерминированная сортировка frontier;
- [x] обязательные крайние варианты по бумаге, стоимости, формам, пластинам, перетиражу и прогонам;
- [x] `visibleFrontier`, display limit и явный `hiddenFrontierCount`;
- [x] структурированные metric deltas;
- [x] unit-тесты дублей, доминирования, frontier, extrema и дельт;
- [x] чистая модель компактного отображаемого набора поверх frontier;
- [x] обязательное закрепление рекомендованного и уникальных крайних решений даже при малом display limit;
- [x] устранение повторов, когда одно решение является лучшим по нескольким категориям;
- [x] прозрачное расширение слишком малого лимита;
- [x] выбор дополнительных materially-different tradeoff-вариантов методом maximin range-normalized distance;
- [x] причины включения `recommended / extreme / diverseTradeoff`;
- [x] точные преимущества, компромиссы и дельты относительно reference-варианта;
- [x] явные omitted IDs и факт усечения;
- [x] запрет coercion `null`, `undefined` и строк в нулевые Pareto-метрики;
- [x] работа без денежной цели при `pricing incomplete`;
- [x] отдельная документация `docs/M7_3_DISPLAY_ALTERNATIVES.md`;
- [x] реальные normalized alternatives из существующих manual production report и paper-minimizer pipelines;
- [x] граница raw layouts/candidates → `SolutionMetrics` → decision/Pareto/display;
- [x] реальные `distinctOrdersPerImposition`, `splitOrders` и `fragmentedBlocks`;
- [x] отдельный `paperSolution → SolutionMetrics` adapter;
- [x] current decision profile → objective order → recommendation/frontier/display set;
- [x] проверка совместимости валюты, листа, плотности, веса и явных операторских ставок;
- [x] состояния pricing comparison `ready / incomplete / incompatible`;
- [x] реальный integration test: `3395/8/972.5466 BYN` против `3305/112/7199.4894 BYN`;
- [x] paper-first и cost-first reranking без повторной генерации;
- [x] отдельная документация `docs/M7_3_PRODUCTION_ALTERNATIVES.md`;
- [x] чистая RU/EN модель человеческих объяснений преимущества, цены компромисса и решающей цели;
- [x] смена reference-варианта без повторной генерации alternatives;
- [x] component deltas по бумаге, цветовым пластинам, подготовке layout-форм и итогу;
- [x] денежные фразы только при совместимом `pricing ready`;
- [x] полное скрытие денежных значений при `pricing incomplete / incompatible`;
- [x] локализованное форматирование `ru-RU / en-US`;
- [x] regression tests paper-first, cost-first, reference override, incomplete/incompatible pricing;
- [x] отдельная документация `docs/M7_3_ALTERNATIVE_EXPLANATIONS.md`;
- [x] runtime state с real alternative set и explanation set;
- [x] отдельный controller для production/pricing events и priority/reference commands;
- [x] очищенный event `uimposition:alternatives` без raw layouts/candidates/planned runs;
- [x] компактная read-only RU/EN панель двух реальных вариантов;
- [x] интерактивная смена paper-first / cost-first без повторной генерации;
- [x] интерактивная смена reference-варианта;
- [x] корректный UI при `pricing incomplete`;
- [x] runtime tests ожидания, priced/unpriced, reference и invalid geometry;
- [x] focused Chromium scenario `m7-real-alternatives-cost-first`;
- [x] отдельная документация `docs/M7_3_RUNTIME_ALTERNATIVES_UI.md`.

Остаётся:

- [ ] завершить и проверить focused Chromium/PDF artifact PR `#28`;
- [ ] объединить PR `#28`;
- [ ] сохранить focused screenshot, manifest и hashes в permanent archive;
- [ ] подготовить news/uNews/Telegram payload;
- [ ] синхронизировать version sources на `0.7.0-alpha.3`;
- [ ] создать recovery-ветку, immutable tag и GitHub prerelease `0.7.0-alpha.3`.

## M7.4 — `0.7.0-alpha.4`: свой оборот / work-and-turn

- чистая модель своего оборота;
- технологические проверки симметрии и переворота;
- независимый расчёт готовых изделий после двух прогонов;
- режимы `только чужой / сравнить оба / только свой`;
- контрольный кейс: 4 разных A6, 2 страницы, 1+1, по 4000;
- ожидаемо: оба режима дают 1000 листов и 2000 прогонов, свой оборот уменьшает формы и пластины `2 → 1`;
- при одинаковой бумаге денежная модель показывает экономию одной цветовой формы.

## M7.5 — `0.7.0-alpha.5`: компактный редактор приоритетов и цен

- desktop drag-and-drop;
- доступные кнопки вверх/вниз;
- мобильное управление без обязательного drag-and-drop;
- жёсткие ограничения визуально отделены и недоступны для перемещения;
- изменение порядка мгновенно пересортировывает готовые варианты;
- повторная генерация не запускается, если изменился только порядок целей;
- ввод валюты, плотности, цены бумаги за кг и цены формы;
- краткая проверка веса одного листа перед применением;
- рабочие цены не подменяются demo-значениями.

## M7.6 — `0.7.0-alpha.6`: таблица вариантов и завершение M7

- одна компактная строка на вариант;
- рекомендованный вариант по текущей иерархии;
- переключатель `Только различия`;
- точные дельты «что лучше / что хуже»;
- отдельные колонки: бумага, формы, пластины, вес, стоимость бумаги, стоимость форм, итог BYN и цена изделия;
- раскрытие схем и вкладов только выбранного варианта;
- фильтр способа оборота;
- экспорт выбранного варианта в существующие отчёт/PDF;
- desktop/mobile Chromium evidence;
- полный M7 release checkpoint.

---

# M8 — реальные неоднородные заказы и полный рабочий цикл

## M8.1 — `0.8.0-alpha.1`: автоматический mixed-format packing

- автоматическое размещение прямо из неоднородных заказов;
- общая система допустимых ориентаций и bleed/gap;
- независимая валидация каждого смешанного монтажа;
- production metrics и report для mixed-format набора;
- сравнение mixed-format вариантов с uniform-grid решениями;
- desktop/mobile evidence и release checkpoint.

## M8.2 — `0.8.0-alpha.2`: пользовательские форматы и ограничения

- произвольные форматы изделий;
- разные bleed и технологические зазоры;
- разрешённые/запрещённые повороты;
- отдельные ограничения по файлам и заказам;
- понятные причины, почему вариант исключён.

## M8.3 — `0.8.0-alpha.3`: сохранение рабочего проекта

- стабильная schema проекта;
- local storage с версионированием;
- export/import JSON;
- безопасная миграция старых проектов;
- восстановление после закрытия браузера.

## M8.4 — `0.8.0-alpha.4`: рабочий список заказов

- добавление/удаление/редактирование строк без ручного текста;
- импорт CSV/таблицы;
- валидация строк и точные сообщения ошибок;
- фильтры и поиск по файлам;
- large-order performance tests.

## M8.5 — `0.8.0-alpha.5`: выбор и фиксация решения

- оператор выбирает окончательный вариант;
- выбранный вариант становится частью сохранённого проекта;
- повторный расчёт не стирает выбор без предупреждения;
- сравнение старого и нового выбора после изменения заказа.

## M8.6 — `0.8.0-alpha.6`: полный рабочий экспорт

- PDF выбранных схем;
- production report выбранного решения;
- machine-readable JSON/CSV metrics;
- единый пакет экспорта;
- проверка открытия файлов вне браузера.

---

# Beta / RC / Stable

## `0.9.0-beta.1`

- производственная проверка на реальных заказах;
- сбор и классификация ошибок;
- accessibility и keyboard pass;
- performance budget.

## `0.9.0-beta.2`

- исправления по полевым данным;
- защита от больших и необычных заказов;
- cross-browser pass;
- documentation freeze candidate.

## `1.0.0-rc.1`

- feature freeze;
- полный regression suite;
- release/recovery drill;
- финальные инструкции оператора.

## `1.0.0-rc.2`

- только blocking fixes;
- повторный production validation;
- окончательная проверка archive/news/version consistency.

## `1.0.0`

- стабильный публичный release;
- immutable tag и recovery branch;
- финальный evidence archive;
- полный операторский workflow и ограничения проекта.
