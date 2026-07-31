import { CONFIG } from "./config.js";
import {
  normalizeApplicationState,
  replaceApplicationInput,
} from "./application-state.js";
import {
  addProductRow,
  duplicateProductRow,
  moveProductRow,
  normalizeProductRowCollection,
  removeProductRow,
  setProductRowEnabled,
  updateProductRow,
  validateProductRowCollection,
  validateProductRowsForUniformPipeline,
} from "./product-row-collection.js";

export function getApplicationProductRows(state, config = CONFIG) {
  const normalizedState = normalizeApplicationState(state, config);
  return normalizeProductRowCollection(normalizedState.input.products, config);
}

export function replaceApplicationProductRows(state, collection, config = CONFIG) {
  const normalizedState = normalizeApplicationState(state, config);
  const normalizedCollection = normalizeProductRowCollection(collection, config);
  return replaceApplicationInput(normalizedState, {
    ...normalizedState.input,
    products: normalizedCollection.rows,
  }, config);
}

function updateApplicationProductRows(state, operation, config) {
  const current = getApplicationProductRows(state, config);
  const next = operation(current);
  return replaceApplicationProductRows(state, next, config);
}

export function addApplicationProductRow(state, input = {}, config = CONFIG) {
  return updateApplicationProductRows(
    state,
    (collection) => addProductRow(collection, input, config),
    config,
  );
}

export function updateApplicationProductRow(state, id, patch, config = CONFIG) {
  return updateApplicationProductRows(
    state,
    (collection) => updateProductRow(collection, id, patch, config),
    config,
  );
}

export function duplicateApplicationProductRow(state, id, config = CONFIG) {
  return updateApplicationProductRows(
    state,
    (collection) => duplicateProductRow(collection, id, config),
    config,
  );
}

export function setApplicationProductRowEnabled(state, id, enabled, config = CONFIG) {
  return updateApplicationProductRows(
    state,
    (collection) => setProductRowEnabled(collection, id, enabled, config),
    config,
  );
}

export function removeApplicationProductRow(state, id, config = CONFIG) {
  return updateApplicationProductRows(
    state,
    (collection) => removeProductRow(collection, id, config),
    config,
  );
}

export function moveApplicationProductRow(state, id, targetIndex, config = CONFIG) {
  return updateApplicationProductRows(
    state,
    (collection) => moveProductRow(collection, id, targetIndex, config),
    config,
  );
}

export function validateApplicationProductRows(state, config = CONFIG) {
  return validateProductRowCollection(getApplicationProductRows(state, config), config);
}

export function validateApplicationProductRowsForUniformPipeline(state, config = CONFIG) {
  return validateProductRowsForUniformPipeline(getApplicationProductRows(state, config), config);
}
