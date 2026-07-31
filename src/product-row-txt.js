export const PRODUCT_ROW_TXT_SCHEMA_VERSION = 1;
export const PRODUCT_ROW_TXT_DELIMITER = ";";

export const PRODUCT_ROW_TXT_COLUMNS = Object.freeze([
  "name",
  "width_mm",
  "height_mm",
  "quantity",
  "variants",
  "pages",
  "front_colors",
  "back_colors",
  "bleed_mm",
  "cut_mode",
  "gap_mm",
  "rotation",
  "duplex_preference",
  "notes",
]);

const CUT_MODES = new Set(["commonCut", "separated"]);
const ROTATIONS = new Set(["auto", "0", "90"]);
const DUPLEX_PREFERENCES = new Set(["auto", "separateFrontBackForms", "workAndTurn"]);

function issue(line, field, code, message) {
  return Object.freeze({ line, field, code, message });
}

function splitLines(text) {
  return String(text ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => value && !value.startsWith("#"));
}

function parsePositiveNumber(value, line, field, issues) {
  const number = Number(String(value).replace(",", "."));
  if (!Number.isFinite(number) || number <= 0) {
    issues.push(issue(line, field, "positiveNumberRequired", "Нужно положительное число."));
    return null;
  }
  return number;
}

function parseNonNegativeNumber(value, line, field, issues) {
  const number = Number(String(value).replace(",", "."));
  if (!Number.isFinite(number) || number < 0) {
    issues.push(issue(line, field, "nonNegativeNumberRequired", "Нужно число не меньше нуля."));
    return null;
  }
  return number;
}

function parsePositiveInteger(value, line, field, issues) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    issues.push(issue(line, field, "positiveIntegerRequired", "Нужно положительное целое число."));
    return null;
  }
  return number;
}

function parseColorCount(value, line, field, issues) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 16) {
    issues.push(issue(line, field, "colorCountOutOfRange", "Красочность должна быть целым числом от 1 до 16."));
    return null;
  }
  return number;
}

function parseEnum(value, allowed, line, field, issues) {
  const normalized = String(value ?? "").trim();
  if (!allowed.has(normalized)) {
    issues.push(issue(line, field, "unsupportedValue", `Недопустимое значение: ${normalized || "пусто"}.`));
    return null;
  }
  return normalized;
}

function parseRow(values, line, issues) {
  if (values.length !== PRODUCT_ROW_TXT_COLUMNS.length) {
    issues.push(issue(
      line,
      "row",
      "columnCountMismatch",
      `Ожидалось ${PRODUCT_ROW_TXT_COLUMNS.length} столбцов, получено ${values.length}.`,
    ));
    return null;
  }

  const row = Object.fromEntries(PRODUCT_ROW_TXT_COLUMNS.map((column, index) => [column, values[index].trim()]));
  if (!row.name) issues.push(issue(line, "name", "nameRequired", "Укажите название или имя файла."));

  const widthMm = parsePositiveNumber(row.width_mm, line, "width_mm", issues);
  const heightMm = parsePositiveNumber(row.height_mm, line, "height_mm", issues);
  const quantityPerVariant = parsePositiveInteger(row.quantity, line, "quantity", issues);
  const variantCount = parsePositiveInteger(row.variants, line, "variants", issues);
  const pages = parsePositiveInteger(row.pages, line, "pages", issues);
  const frontColors = parseColorCount(row.front_colors, line, "front_colors", issues);
  const backColors = parseColorCount(row.back_colors, line, "back_colors", issues);
  const bleedMm = parseNonNegativeNumber(row.bleed_mm, line, "bleed_mm", issues);
  const cutMode = parseEnum(row.cut_mode, CUT_MODES, line, "cut_mode", issues);
  const gapMm = parseNonNegativeNumber(row.gap_mm, line, "gap_mm", issues);
  const rotationPolicy = parseEnum(row.rotation, ROTATIONS, line, "rotation", issues);
  const duplexPreference = parseEnum(
    row.duplex_preference,
    DUPLEX_PREFERENCES,
    line,
    "duplex_preference",
    issues,
  );

  return Object.freeze({
    name: row.name,
    finished: Object.freeze({ widthMm, heightMm }),
    quantityPerVariant,
    variantCount,
    pages,
    print: Object.freeze({
      mode: "duplex",
      frontColors,
      backColors,
      duplexPreference,
    }),
    bleed: Object.freeze({ mode: "uniform", uniformMm: bleedMm }),
    cut: Object.freeze({ mode: cutMode, gapMm }),
    rotationPolicy,
    notes: row.notes,
  });
}

export function createProductRowsTxtTemplate() {
  return [
    `# uImposition product rows TXT schema v${PRODUCT_ROW_TXT_SCHEMA_VERSION}`,
    `# UTF-8; разделитель — точка с запятой; красочность лица и оборота задаётся отдельно.`,
    PRODUCT_ROW_TXT_COLUMNS.join(PRODUCT_ROW_TXT_DELIMITER),
    [
      "Листовка А6",
      "105",
      "148",
      "1000",
      "1",
      "2",
      "4",
      "1",
      "0",
      "commonCut",
      "0",
      "auto",
      "auto",
      "пример 4+1",
    ].join(PRODUCT_ROW_TXT_DELIMITER),
  ].join("\n");
}

export function parseProductRowsTxt(text) {
  const lines = splitLines(text);
  const issues = [];
  if (lines.length === 0) {
    return Object.freeze({ valid: false, rows: Object.freeze([]), issues: Object.freeze([
      issue(1, "file", "emptyFile", "Файл не содержит данных."),
    ]) });
  }

  const header = lines[0].split(PRODUCT_ROW_TXT_DELIMITER).map((value) => value.trim());
  const expected = PRODUCT_ROW_TXT_COLUMNS;
  const headerValid = header.length === expected.length
    && header.every((value, index) => value === expected[index]);
  if (!headerValid) {
    return Object.freeze({ valid: false, rows: Object.freeze([]), issues: Object.freeze([
      issue(1, "header", "invalidHeader", `Первая строка должна быть: ${expected.join(PRODUCT_ROW_TXT_DELIMITER)}`),
    ]) });
  }

  const rows = lines.slice(1).map((lineText, index) => (
    parseRow(lineText.split(PRODUCT_ROW_TXT_DELIMITER), index + 2, issues)
  ));

  if (rows.length === 0) {
    issues.push(issue(2, "file", "noDataRows", "Добавьте хотя бы одну строку продукции."));
  }

  if (issues.length > 0) {
    return Object.freeze({ valid: false, rows: Object.freeze([]), issues: Object.freeze(issues) });
  }

  return Object.freeze({ valid: true, rows: Object.freeze(rows), issues: Object.freeze([]) });
}
