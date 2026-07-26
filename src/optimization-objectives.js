export const OBJECTIVE_DIRECTION = Object.freeze({
  MINIMIZE: "minimize",
  MAXIMIZE: "maximize",
});

function freezeDefinition(definition) {
  return Object.freeze({ ...definition });
}

export const OPTIMIZATION_OBJECTIVES = Object.freeze([
  freezeDefinition({
    id: "physicalSheets",
    metricKey: "physicalSheets",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Физическая бумага", en: "Physical sheets" }),
  }),
  freezeDefinition({
    id: "layoutForms",
    metricKey: "layoutForms",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Layout-формы", en: "Side-layout forms" }),
  }),
  freezeDefinition({
    id: "colorPlates",
    metricKey: "colorPlates",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Цветовые пластины", en: "Color plates" }),
  }),
  freezeDefinition({
    id: "fileOverrun",
    metricKey: "fileOverrun",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Перетираж готовых файлов", en: "Complete-file overrun" }),
  }),
  freezeDefinition({
    id: "pairOverrun",
    metricKey: "pairOverrun",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Перетираж печатных пар", en: "Print-pair overrun" }),
  }),
  freezeDefinition({
    id: "pressPasses",
    metricKey: "pressPasses",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Листопрогоны", en: "Press passes" }),
  }),
  freezeDefinition({
    id: "splitOrders",
    metricKey: "splitOrders",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Разделённые заказы", en: "Split orders" }),
  }),
  freezeDefinition({
    id: "impositionCount",
    metricKey: "impositionCount",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Количество монтажей", en: "Imposition count" }),
  }),
  freezeDefinition({
    id: "layoutCompactness",
    metricKey: "layoutCompactness",
    direction: OBJECTIVE_DIRECTION.MAXIMIZE,
    label: Object.freeze({ ru: "Компактность раскладки", en: "Layout compactness" }),
  }),
  freezeDefinition({
    id: "distinctOrdersPerImposition",
    metricKey: "distinctOrdersPerImposition",
    direction: OBJECTIVE_DIRECTION.MINIMIZE,
    label: Object.freeze({ ru: "Разных заказов на монтаже", en: "Distinct orders per imposition" }),
  }),
]);

export const OPTIMIZATION_OBJECTIVE_IDS = Object.freeze(
  OPTIMIZATION_OBJECTIVES.map((objective) => objective.id),
);

export const DEFAULT_OBJECTIVE_ORDER = Object.freeze([...OPTIMIZATION_OBJECTIVE_IDS]);

export const HARD_CONSTRAINTS = Object.freeze([
  freezeDefinition({
    id: "zeroUnderproduction",
    label: Object.freeze({ ru: "Недопечатка равна нулю", en: "Zero underproduction" }),
  }),
  freezeDefinition({
    id: "validPrintableGeometry",
    label: Object.freeze({ ru: "Геометрия внутри печатной области", en: "Valid printable geometry" }),
  }),
  freezeDefinition({
    id: "validFrontBackMapping",
    label: Object.freeze({ ru: "Правильные лицо и оборот", en: "Valid front/back mapping" }),
  }),
  freezeDefinition({
    id: "validOrientation",
    label: Object.freeze({ ru: "Правильные направления", en: "Valid orientation" }),
  }),
  freezeDefinition({
    id: "validDuplexStrategy",
    label: Object.freeze({ ru: "Допустимая технология оборота", en: "Valid duplex strategy" }),
  }),
  freezeDefinition({
    id: "validatedProductionReport",
    label: Object.freeze({ ru: "Проверенный производственный отчёт", en: "Validated production report" }),
  }),
]);

export const HARD_CONSTRAINT_IDS = Object.freeze(
  HARD_CONSTRAINTS.map((constraint) => constraint.id),
);

const OBJECTIVE_BY_ID = new Map(
  OPTIMIZATION_OBJECTIVES.map((objective) => [objective.id, objective]),
);
const HARD_CONSTRAINT_ID_SET = new Set(HARD_CONSTRAINT_IDS);

export function getOptimizationObjective(objectiveId) {
  const objective = OBJECTIVE_BY_ID.get(String(objectiveId ?? ""));
  if (!objective) throw new RangeError(`Unknown optimization objective: ${objectiveId}`);
  return objective;
}

export function normalizeObjectiveOrder(objectiveOrder = DEFAULT_OBJECTIVE_ORDER) {
  if (!Array.isArray(objectiveOrder)) {
    throw new TypeError("objectiveOrder must be an array");
  }
  if (objectiveOrder.length !== OPTIMIZATION_OBJECTIVES.length) {
    throw new RangeError(
      `objectiveOrder must contain exactly ${OPTIMIZATION_OBJECTIVES.length} objectives`,
    );
  }

  const seen = new Set();
  const normalized = objectiveOrder.map((objectiveId, index) => {
    const id = String(objectiveId ?? "").trim();
    if (HARD_CONSTRAINT_ID_SET.has(id)) {
      throw new RangeError(`Hard constraint cannot enter objective order: ${id}`);
    }
    getOptimizationObjective(id);
    if (seen.has(id)) {
      throw new RangeError(`Duplicate optimization objective at index ${index}: ${id}`);
    }
    seen.add(id);
    return id;
  });

  for (const requiredId of OPTIMIZATION_OBJECTIVE_IDS) {
    if (!seen.has(requiredId)) {
      throw new RangeError(`Missing optimization objective: ${requiredId}`);
    }
  }

  return Object.freeze(normalized);
}

export function compareObjectiveValues(leftValue, rightValue, direction) {
  const left = Number(leftValue);
  const right = Number(rightValue);
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    throw new TypeError("Objective values must be finite numbers");
  }
  if (left === right) return 0;
  if (direction === OBJECTIVE_DIRECTION.MINIMIZE) return left < right ? -1 : 1;
  if (direction === OBJECTIVE_DIRECTION.MAXIMIZE) return left > right ? -1 : 1;
  throw new RangeError(`Unknown objective direction: ${direction}`);
}
