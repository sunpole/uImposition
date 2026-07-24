function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function addMismatch(errors, label, actual, expected) {
  if (actual !== expected) errors.push(`${label}: expected ${expected}, received ${actual}`);
}

export function validateProductionReport(report) {
  const errors = [];
  const pairMetrics = Array.isArray(report?.pairMetrics) ? report.pairMetrics : [];
  const fileMetrics = Array.isArray(report?.fileMetrics) ? report.fileMetrics : [];
  const runMetrics = report?.runMetrics;
  const totals = report?.totals;

  if (pairMetrics.length === 0) errors.push("Production report has no pair metrics");
  if (fileMetrics.length === 0) errors.push("Production report has no file metrics");
  if (!runMetrics || !Array.isArray(runMetrics.impositions)) errors.push("Production report has no run metrics");
  if (!totals) errors.push("Production report has no totals");

  let requiredPairQuantity = 0;
  let producedPairQuantity = 0;
  let pairUnderproduction = 0;
  let pairOverrun = 0;

  pairMetrics.forEach((metric, index) => {
    const prefix = `Pair metric ${index + 1}`;
    if (!String(metric?.file ?? "").trim()) errors.push(`${prefix} has no file`);
    if (!isPositiveInteger(metric?.pairIndex)) errors.push(`${prefix} has invalid pairIndex`);
    if (!isPositiveInteger(metric?.requiredQuantity)) errors.push(`${prefix} has invalid requiredQuantity`);
    if (!isNonNegativeInteger(metric?.producedQuantity)) errors.push(`${prefix} has invalid producedQuantity`);
    if (!isNonNegativeInteger(metric?.underproduction)) errors.push(`${prefix} has invalid underproduction`);
    if (!isNonNegativeInteger(metric?.overrun)) errors.push(`${prefix} has invalid overrun`);

    const contributionTotal = Array.isArray(metric?.contributions)
      ? metric.contributions.reduce((sum, contribution) => sum + Number(contribution?.producedQuantity ?? 0), 0)
      : 0;
    addMismatch(errors, `${prefix} contribution total`, contributionTotal, metric?.producedQuantity);

    const expectedUnderproduction = Math.max(0, Number(metric?.requiredQuantity ?? 0) - Number(metric?.producedQuantity ?? 0));
    const expectedOverrun = Math.max(0, Number(metric?.producedQuantity ?? 0) - Number(metric?.requiredQuantity ?? 0));
    addMismatch(errors, `${prefix} underproduction`, metric?.underproduction, expectedUnderproduction);
    addMismatch(errors, `${prefix} overrun`, metric?.overrun, expectedOverrun);

    requiredPairQuantity += Number(metric?.requiredQuantity ?? 0);
    producedPairQuantity += Number(metric?.producedQuantity ?? 0);
    pairUnderproduction += Number(metric?.underproduction ?? 0);
    pairOverrun += Number(metric?.overrun ?? 0);
  });

  let requiredFileQuantity = 0;
  let producedCompleteFileQuantity = 0;
  let fileUnderproduction = 0;
  let fileOverrun = 0;

  fileMetrics.forEach((metric, index) => {
    const prefix = `File metric ${index + 1}`;
    const matchingPairs = pairMetrics.filter((pair) => pair.file === metric?.file);
    if (matchingPairs.length !== metric?.pairCount) {
      errors.push(`${prefix} pair count does not match pair metrics`);
    }

    if (matchingPairs.length > 0) {
      const expectedProduced = Math.min(...matchingPairs.map((pair) => pair.producedQuantity));
      const expectedMaximum = Math.max(...matchingPairs.map((pair) => pair.producedQuantity));
      addMismatch(errors, `${prefix} producedQuantity`, metric?.producedQuantity, expectedProduced);
      addMismatch(errors, `${prefix} maximumPairQuantity`, metric?.maximumPairQuantity, expectedMaximum);
      addMismatch(
        errors,
        `${prefix} unevenPairProduction`,
        metric?.unevenPairProduction,
        expectedMaximum - expectedProduced,
      );
    }

    const expectedUnderproduction = Math.max(0, Number(metric?.requiredQuantity ?? 0) - Number(metric?.producedQuantity ?? 0));
    const expectedOverrun = Math.max(0, Number(metric?.producedQuantity ?? 0) - Number(metric?.requiredQuantity ?? 0));
    addMismatch(errors, `${prefix} underproduction`, metric?.underproduction, expectedUnderproduction);
    addMismatch(errors, `${prefix} overrun`, metric?.overrun, expectedOverrun);

    requiredFileQuantity += Number(metric?.requiredQuantity ?? 0);
    producedCompleteFileQuantity += Number(metric?.producedQuantity ?? 0);
    fileUnderproduction += Number(metric?.underproduction ?? 0);
    fileOverrun += Number(metric?.overrun ?? 0);
  });

  if (runMetrics && Array.isArray(runMetrics.impositions)) {
    const physicalSheets = runMetrics.impositions.reduce(
      (sum, metric) => sum + Number(metric?.physicalSheets ?? 0),
      0,
    );
    addMismatch(errors, "Run metrics physicalSheets", runMetrics.physicalSheets, physicalSheets);
    addMismatch(errors, "Run metrics frontForms", runMetrics.frontForms, runMetrics.impositions.length);
    addMismatch(errors, "Run metrics backForms", runMetrics.backForms, runMetrics.impositions.length);
    addMismatch(errors, "Run metrics forms", runMetrics.forms, runMetrics.frontForms + runMetrics.backForms);
    addMismatch(errors, "Run metrics pressPasses", runMetrics.pressPasses, physicalSheets * 2);
  }

  if (totals) {
    addMismatch(errors, "Totals pairCount", totals.pairCount, pairMetrics.length);
    addMismatch(errors, "Totals fileCount", totals.fileCount, fileMetrics.length);
    addMismatch(errors, "Totals requiredPairQuantity", totals.requiredPairQuantity, requiredPairQuantity);
    addMismatch(errors, "Totals producedPairQuantity", totals.producedPairQuantity, producedPairQuantity);
    addMismatch(errors, "Totals underproduction", totals.underproduction, pairUnderproduction);
    addMismatch(errors, "Totals overrun", totals.overrun, pairOverrun);
    addMismatch(errors, "Totals requiredFileQuantity", totals.requiredFileQuantity, requiredFileQuantity);
    addMismatch(
      errors,
      "Totals producedCompleteFileQuantity",
      totals.producedCompleteFileQuantity,
      producedCompleteFileQuantity,
    );
    addMismatch(errors, "Totals fileUnderproduction", totals.fileUnderproduction, fileUnderproduction);
    addMismatch(errors, "Totals fileOverrun", totals.fileOverrun, fileOverrun);

    if (runMetrics) {
      addMismatch(errors, "Totals impositionCount", totals.impositionCount, runMetrics.impositionCount);
      addMismatch(errors, "Totals physicalSheets", totals.physicalSheets, runMetrics.physicalSheets);
      addMismatch(errors, "Totals frontForms", totals.frontForms, runMetrics.frontForms);
      addMismatch(errors, "Totals backForms", totals.backForms, runMetrics.backForms);
      addMismatch(errors, "Totals forms", totals.forms, runMetrics.forms);
      addMismatch(errors, "Totals pressPasses", totals.pressPasses, runMetrics.pressPasses);
    }
  }

  if (pairUnderproduction > 0) {
    errors.push(`Underproduction is forbidden: ${pairUnderproduction}`);
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  });
}

export function assertProductionReady(report) {
  const validation = report?.validation ?? validateProductionReport(report);
  if (!validation.valid) {
    throw new Error(`Production report is not ready: ${validation.errors.join("; ")}`);
  }
  return report;
}
