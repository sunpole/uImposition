---
type: feature
project: uImposition
series: uimposition
title: Рабочая стоимость решения в BYN
version: 0.7.0-alpha.2
queued_at: 2026-07-26T17:05:00Z
repo_url: https://github.com/sunpole/uImposition
web_url: https://sunpole.github.io/uImposition/
image: 2026-07-26-uimposition-v0-7-0-alpha-2-pricing-ready.png
image_source: playwright
image_target: scenario/m7-pricing-inputs-ready
image_commit: 7f4130bded8f05d20af27a7238e9207dc1ec9402
image_captured_at: 2026-07-26T16:58:42Z
---

# uImposition 0.7.0-alpha.2 — рабочая стоимость решения

В M7.2 на главной странице появилась честная цепочка расчёта стоимости:

- оператор вводит плотность бумаги, цену бумаги BYN/кг и цену цветовой формы;
- пока цены пустые, решение остаётся `pricing incomplete`;
- после ввода цен и загрузки контрольного заказа production report подключается к `SolutionMetrics`;
- стоимость считается по реальным физическим листам, layout-формам и цветовым формам;
- контрольный сценарий показывает `pricing ready` и стоимость `972,55 BYN`.

Это ещё не Pareto-выбор и не несколько альтернатив. Это фундамент: теперь одно проверенное решение умеет получать реальную BYN-стоимость без выдуманных цен.

Telegram:

uImposition 0.7.0-alpha.2: подключил рабочий прайс к production report и SolutionMetrics. Теперь после ввода цен и загрузки контрольного заказа интерфейс показывает реальную стоимость решения — 972,55 BYN, без демонстрационных цен по умолчанию.