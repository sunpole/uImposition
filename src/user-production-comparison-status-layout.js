const STATUS_HEADER_LABELS = new Set(["Статус", "Status"]);

function compactComparisonStatusLayout(panel) {
  panel.querySelectorAll(".comparison-table__row[data-plan-id]").forEach((row) => {
    const labelCopy = row.querySelector(".comparison-plan-copy");
    const statusCell = row.querySelector(".comparison-table__cell--status");
    const statuses = statusCell?.querySelector(".comparison-statuses");
    if (labelCopy && statuses) labelCopy.append(statuses);
    statusCell?.remove();
  });

  panel.querySelectorAll(".comparison-table__heading").forEach((heading) => {
    if (STATUS_HEADER_LABELS.has(heading.textContent.trim())) heading.remove();
  });
}

function attachComparisonStatusLayout() {
  const panel = document.querySelector("#userProductionPlans");
  if (!panel) return;

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      compactComparisonStatusLayout(panel);
    });
  };

  new MutationObserver(schedule).observe(panel, {
    childList: true,
    subtree: true,
  });
  schedule();
}

attachComparisonStatusLayout();
