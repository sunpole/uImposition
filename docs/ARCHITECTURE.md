# Архитектура / Architecture

## Русская версия

Первая версия должна оставаться простой статической системой без обязательного сервера и сборщика.

### Слои

1. **Конфигурация** — пресеты, правила и словари.
2. **Домен** — листы, заказы, пары страниц, монтажи и метрики.
3. **Расчёт** — геометрия, оптимизация, оборот и валидация.
4. **Представление** — формы ввода, отчёты и схемы.
5. **Экспорт** — JSON и PDF.
6. **Хранение** — localStorage.

### Планируемая структура

```text
uImposition/
├─ index.html
├─ styles.css
├─ site.js
├─ README.md
├─ AGENTS.md
├─ VERSION.md
├─ CHANGELOG.md
├─ LICENSE.md
├─ data/
│  └─ control-case.json
├─ docs/
│  ├─ TECHNICAL_SPECIFICATION_RU.md
│  ├─ TECHNICAL_SPECIFICATION_EN.md
│  ├─ ALGORITHM_AND_OPTIMIZATION.md
│  ├─ ARCHITECTURE.md
│  ├─ CONFIG_REFERENCE.md
│  ├─ TEST_PLAN.md
│  ├─ ROADMAP.md
│  └─ GITHUB_PAGES.md
├─ src/
│  ├─ config.js
│  ├─ app.js
│  ├─ geometry.js
│  ├─ orders.js
│  ├─ page-pairs.js
│  ├─ optimizer.js
│  ├─ imposition.js
│  ├─ reverse-side.js
│  ├─ orientation.js
│  ├─ validation.js
│  ├─ report.js
│  ├─ renderer.js
│  ├─ pdf-export.js
│  ├─ storage.js
│  └─ i18n.js
└─ tests/
```

### Правила зависимостей

- `config.js` не импортирует бизнес-модули;
- расчётные модули не зависят от DOM;
- `renderer.js` не выполняет оптимизацию;
- `pdf-export.js` получает уже готовую модель схем;
- оборот строится только после лица;
- валидация вызывается до отображения статуса «готово» и до PDF.

### Чистые функции

Геометрия, пары страниц, ориентация, зеркалирование и расчёт тиражей должны быть чистыми функциями. Это облегчает тестирование и исключает зависимость алгоритма от интерфейса.

---

## English version

The first release is a static browser application with no mandatory server or build step. The architecture separates configuration, domain models, calculation, presentation, export and persistence. Calculation modules must remain DOM-independent. The back form is derived only after the front form is finalized, and validation must complete before a solution can be marked ready or exported.
