const SIMPLE_HEADER = "название;тираж;страницы;виды";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function dataLines(text) {
  return String(text ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((value, index) => ({ value: value.trim(), line: index + 1 }))
    .filter(({ value }) => value && !value.startsWith("#"));
}

function integer(value, field, line, { min = 1 } = {}) {
  const normalized = String(value ?? "").replace(/\s+/g, "").trim();
  const number = Number(normalized);
  if (!Number.isInteger(number) || number < min) {
    return {
      value: null,
      issue: Object.freeze({ line, field, message: `нужно целое число не меньше ${min}` }),
    };
  }
  return { value: number, issue: null };
}

function cloneBase(baseRow) {
  if (!baseRow || typeof baseRow !== "object") {
    throw new TypeError("Для простого TXT нужна базовая строка текущего заказа");
  }
  return {
    finished: { ...baseRow.finished },
    print: { ...baseRow.print },
    bleed: {
      ...baseRow.bleed,
      sidesMm: { ...baseRow.bleed?.sidesMm },
    },
    cut: { ...baseRow.cut },
    rotationPolicy: baseRow.rotationPolicy ?? "auto",
  };
}

export function createSimpleProductRowsTxtTemplate() {
  return [
    "# Простой импорт uImposition",
    "# Формат, цветность, выпуск и рез берутся из первой строки текущего заказа.",
    "# Обязательные поля: название;тираж. Страницы и виды можно не указывать.",
    SIMPLE_HEADER,
    "Листовка 001;1000;2;1",
    "Листовка 002;500;3;1",
  ].join("\n");
}

export function looksLikeExtendedProductRowsTxt(text) {
  const first = dataLines(text)[0]?.value.toLowerCase() ?? "";
  return first.startsWith("name;width_mm;") || first.split(";").length >= 14;
}

export function parseSimpleProductRowsTxt(text, { baseRow } = {}) {
  const base = cloneBase(baseRow);
  const source = dataLines(text);
  const lines = source[0]?.value.toLowerCase().startsWith("название;")
    ? source.slice(1)
    : source;
  const rows = [];
  const issues = [];

  lines.forEach(({ value, line }) => {
    const delimiter = value.includes(";") ? ";" : "\t";
    const columns = value.split(delimiter).map((entry) => entry.trim());
    if (columns.length < 2 || columns.length > 4) {
      issues.push(Object.freeze({
        line,
        field: "строка",
        message: "ожидается название;тираж;страницы;виды",
      }));
      return;
    }
    const [name, quantityText, pagesText = "2", variantsText = "1"] = columns;
    if (!name) {
      issues.push(Object.freeze({ line, field: "название", message: "название не может быть пустым" }));
      return;
    }
    const quantity = integer(quantityText, "тираж", line);
    const pages = integer(pagesText || "2", "страницы", line);
    const variants = integer(variantsText || "1", "виды", line);
    [quantity, pages, variants].forEach(({ issue }) => {
      if (issue) issues.push(issue);
    });
    if (quantity.issue || pages.issue || variants.issue) return;

    rows.push(deepFreeze({
      name,
      sourceFileName: null,
      finished: { ...base.finished },
      quantityPerVariant: quantity.value,
      variantCount: variants.value,
      pages: pages.value,
      print: { ...base.print },
      bleed: {
        ...base.bleed,
        sidesMm: { ...base.bleed.sidesMm },
      },
      cut: { ...base.cut },
      rotationPolicy: base.rotationPolicy,
      notes: "",
    }));
  });

  if (lines.length === 0) {
    issues.push(Object.freeze({ line: 1, field: "TXT", message: "нет строк заказа" }));
  }

  return deepFreeze({
    kind: "simpleProductRowsTxt",
    valid: issues.length === 0,
    rows,
    issues,
  });
}
