import { directionToGlyph } from "./orientation.js";

const TEXT = Object.freeze({
  ru: { front: "ЛИЦО", back: "ОБОРОТ", sheet: "ЛИСТ", runLength: "Тираж монтажа", valid: "Проверено" },
  en: { front: "FRONT", back: "BACK", sheet: "SHEET", runLength: "Imposition run", valid: "Validated" },
});

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function schemeTitle(layout, language) {
  const text = TEXT[language] ?? TEXT.ru;
  return `${text.sheet}-${layout.id}_${text[layout.side]}`;
}

function cellText(cell) {
  if (cell.page === null) return "-";
  return `${cell.file},${cell.page} ${directionToGlyph(cell.direction)}`;
}

function createSchemeCard(layout, validation, language) {
  const text = TEXT[language] ?? TEXT.ru;
  const article = createElement("article", "scheme-card");
  article.dataset.scheme = `${layout.id}-${layout.side}`;

  const heading = createElement("div", "scheme-card__heading");
  const title = createElement("h3", "scheme-card__title", schemeTitle(layout, language));
  const status = createElement("span", "scheme-card__status", validation.valid ? text.valid : "ERROR");
  status.classList.toggle("is-valid", validation.valid);
  heading.append(title, status);

  const meta = createElement("p", "scheme-card__meta");
  const formattedRunLength = Number(layout.runLength).toLocaleString(language);
  meta.textContent = `${text.runLength}: ${formattedRunLength} · ${layout.columns} × ${layout.rows} · ${layout.rotation}°`;

  const grid = createElement("div", "scheme-grid");
  grid.style.setProperty("--scheme-columns", layout.columns);
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", schemeTitle(layout, language));

  layout.cells.forEach((cell) => {
    const item = createElement("div", "scheme-cell", cellText(cell));
    item.setAttribute("role", "gridcell");
    item.title = cell.page === null
      ? `${cell.file}: no back page`
      : `${cell.file}, page ${cell.page}, position ${cell.position}`;
    grid.append(item);
  });

  article.append(heading, meta, grid);
  return article;
}

export function renderSchemePairs(container, records, { language = "ru" } = {}) {
  if (!(container instanceof Element)) throw new TypeError("A scheme container element is required");
  if (!Array.isArray(records)) throw new TypeError("records must be an array");

  const fragment = document.createDocumentFragment();
  records.forEach(({ front, back, validation }) => {
    const pair = createElement("section", "scheme-pair");
    pair.append(
      createSchemeCard(front, validation, language),
      createSchemeCard(back, validation, language),
    );
    fragment.append(pair);
  });

  container.replaceChildren(fragment);
}
