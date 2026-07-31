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
    addMismatch(
      errors,
      `${prefix} underproduction`,
      metric?.underproduction,
      Math.max(0, Number(metric?.requiredQuantity ?? 0) - Number(metric?.producedQuantity ?? 0)),
    );
    addMismatch(
      errors,
      `${prefix} overrun`,
      metric?.overrun,
      Math.max(0, Number(metric?.producedQuantity ?? 0) - Number(metric?.requiredQuantity ?? 0)),
    );

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
    if (matchingPairs.length !== metric?.pairCount) errors.push(`${prefix} pair count does not match pair metrics`);
    if (matchingPairs.length > 0) {
      const expectedProduced = Math.min(...matchingPairs.map((pair) => pair.producedQuantity));
      const expectedMaximum = Math.max(...matchingPairs.map((pair) => pair.producedQuantity));
      addMismatch(errors, `${prefix} producedQuantity`, metric?.producedQuantity, expectedProduced);
      addMismatch(errors, `${prefix} maximumPairQuantity`, metric?.maximumPairQuantity, expectedMaximum);
      addMismatch(errors, `${prefix} unevenPairProduction`, metric?.unevenPairProduction, expectedMaximum - expectedProduced);
    }
    requiredFileQuantity += Number(metric?.requiredQuantity ?? 0);
    producedCompleteFileQuantity += Number(metric?.producedQuantity ?? 0);
    fileUnderproduction += Number(metric?.underproduction ?? 0);
    fileOverrun += Number(metric?.overrun ?? 0);
  });

  if (runMetrics && Array.isArray(runMetrics.impositions)) {
    if (report?.duplexMode !== runMetrics.duplexMode) errors.push("Production report duplexMode does not match run metrics");
    runMetrics.impositions.forEach((metric, index) => {
      const prefix = `Run metric ${index + 1}`;
      if (!isPositiveInteger(metric?.runLength)) errors.push(`${prefix} has invalid runLength`);
      const expectedBackForms = metric?.backPrinted ? 1 : 0;
      const expectedPrintedSideCount = metric?.backPrinted ? 2 : 1;
      addMismatch(errors, `${prefix} physicalSheets`, metric?.physicalSheets, metric?.runLength);
      addMismatch(errors, `${prefix} frontForms`, metric?.frontForms, 1);
      addMismatch(errors, `${prefix} backForms`, metric?.backForms, expectedBackForms);
      addMismatch(errors, `${prefix} forms`, metric?.forms, 1 + expectedBackForms);
      addMismatch(errors, `${prefix} printedSideCount`, metric?.printedSideCount, expectedPrintedSideCount);
      addMismatch(
        errors,
        `${prefix} pressPasses`,
        metric?.pressPasses,
        Number(metric?.runLength ?? 0) * expectedPrintedSideCount,
      );
    });

    for (const field of ["physicalSheets", "frontForms", "backForms", "forms", "pressPasses"]) {
      const expected = runMetrics.impositions.reduce((sum, metric) => sum + Number(metric?.[field] ?? 0), 0);
      addMismatch(errors, `Run metrics ${field}`, runMetrics[field], expected);
    }
  }

  if (totals) {
    addMismatch(errors, "Totals pairCount", totals.pairCount, pairMetrics.length);
    addMismatch(errors, "Totals fileCount", totals.fileCount, fileMetrics.length);
    addMismatch(errors, "Totals requiredPairQuantity", totals.requiredPairQuantity, requiredPairQuantity);
    addMismatch(errors, "Totals producedPairQuantity", totals.producedPairQuantity, producedPairQuantity);
    addMismatch(errors, "Totals underproduction", totals.underproduction, pairUnderproduction);
    addMismatch(errors, "Totals overrun", totals.overrun, pairOverrun);
    addMismatch(errors, "Totals requiredFileQuantity", totals.requiredFileQuantity, requiredFileQuantity);
    addMismatch(errors, "Totals producedCompleteFileQuantity", totals.producedCompleteFileQuantity, producedCompleteFileQuantity);
    addMismatch(errors, "Totals fileUnderproduction", totals.fileUnderproduction, fileUnderproduction);
    addMismatch(errors, "Totals fileOverrun", totals.fileOverrun, fileOverrun);
    if (runMetrics) {
      addMismatch(errors, "Totals impositionCount", totals.impositionCount, runMetrics.impositionCount);
      for (const field of ["physicalSheets", "frontForms", "backForms", "forms", "pressPasses"]) {
        addMismatch(errors, `Totals ${field}`, totals[field], runMetrics[field]);
      }
    }
  }

  if (pairUnderproduction > 0) errors.push(`Underproduction is forbidden: ${pairUnderproduction}`);
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function assertProductionReady(report) {
  const validation = report?.validation ?? validateProductionReport(report);
  if (!validation.valid) {
    throw new Error(`Production report is not ready: ${validation.errors.join("; ")}`);
  }
  return report;
}
