"use strict";

function planTitle(plan) {
  const family = plan.family === "paperMinimum" ? "Минимум бумаги" : "Отдельные формы на пары";
  return `${family} · ${plan.grid.rotation}° · ${plan.grid.columns}×${plan.grid.rows}`;
}

function metricList(metrics) {
  return `
    <ul class="metric-list">
      <li><span>Физические листы</span><strong>${number(metrics.physicalSheets, 0)}</strong></li>
      <li><span>Layout-формы</span><strong>${number(metrics.layoutForms, 0)}</strong></li>
      <li><span>Цветовые пластины</span><strong>${number(metrics.colorPlates, 0)}</strong></li>
      <li><span>Прогоны</span><strong>${number(metrics.pressPasses, 0)}</strong></li>
      <li><span>Перетираж</span><strong>${number(metrics.pairOverrun, 0)}</strong></li>
      <li><span>Себестоимость</span><strong>${cost(metrics)}</strong></li>
    </ul>
  `;
}

function renderSummary() {
  if (!lastValidResult?.selectedPlan) {
    ui.summaryContext.textContent = "Введите корректный заказ.";
    ui.summaryContent.innerHTML = "";
    return;
  }
  const plan = lastValidResult.selectedPlan;
  ui.summaryContext.textContent = isCurrentResult()
    ? `${lastValidResult.summary.enabledRowCount} строк · результат актуален`
    : "Показан последний корректный результат.";
  ui.summaryContent.innerHTML = metricList(plan.metrics);
}

function renderQuickComparison() {
  const metrics = lastValidResult?.selectedPlan?.metrics;
  ui.quickComparison.innerHTML = metrics ? metricList(metrics) : "";
}

function renderAlternatives() {
  ui.alternativesList.innerHTML = "";
  if (!lastValidResult?.plans.length) {
    ui.alternativesList.innerHTML = '<div class="layout-empty">Нет корректного набора вариантов. Вернитесь к заказу и проверьте поля.</div>';
    ui.scopeNote.textContent = "Текущий расчёт не выполнен.";
    return;
  }

  ui.scopeNote.textContent = "Lossless-набор внутри текущей uniform-области. Mixed-format, simplex и произвольные последовательности форм не выдаются за рассчитанные.";
  const current = isCurrentResult();
  lastValidResult.plans.forEach((plan) => {
    const card = document.createElement("article");
    card.className = "alternative-card";
    card.classList.toggle("is-selected", plan.id === lastValidResult.selectedPlanId);
    card.dataset.planId = plan.id;
    card.innerHTML = `
      <div class="alternative-cell alternative-cell--title">
        <div class="alternative-card__badges">
          ${plan.recommended ? '<span class="badge badge--primary">Рекомендация</span>' : ""}
          ${plan.pareto ? '<span class="badge">Pareto</span>' : ""}
          ${plan.dominated ? '<span class="badge badge--muted">Доминируемый</span>' : ""}
          ${plan.id === lastValidResult.selectedPlanId ? '<span class="badge badge--warn">Выбран</span>' : ""}
        </div>
        <strong>${escapeHtml(planTitle(plan))}</strong>
        <span>Ранг ${plan.rank}</span>
      </div>
      <div class="alternative-cell" data-metric="paper"><span>Листы</span><strong>${number(plan.metrics.physicalSheets, 0)}</strong></div>
      <div class="alternative-cell" data-metric="forms"><span>Формы</span><strong>${number(plan.metrics.layoutForms, 0)}</strong></div>
      <div class="alternative-cell" data-metric="plates"><span>Пластины</span><strong>${number(plan.metrics.colorPlates, 0)}</strong></div>
      <div class="alternative-cell" data-metric="passes"><span>Прогоны</span><strong>${number(plan.metrics.pressPasses, 0)}</strong></div>
      <div class="alternative-cell" data-metric="cost"><span>Стоимость</span><strong>${escapeHtml(cost(plan.metrics))}</strong></div>
      <div class="alternative-action"><button class="button ${plan.id === lastValidResult.selectedPlanId ? "" : "button--primary"}" type="button" data-select-plan="${escapeHtml(plan.id)}" ${current ? "" : "disabled"}>${plan.id === lastValidResult.selectedPlanId ? "Выбран" : "Выбрать"}</button></div>
    `;
    ui.alternativesList.append(card);
  });
}

function renderLayout() {
  const preview = lastValidResult?.layoutPreview;
  const plan = lastValidResult?.selectedPlan;
  ui.layoutSheet.innerHTML = "";
  if (!preview || !plan) {
    ui.layoutSheet.style.display = "block";
    ui.layoutSheet.innerHTML = '<div class="layout-empty">Сначала получите корректный расчёт и выберите вариант.</div>';
    ui.layoutDetails.innerHTML = '<div class="layout-empty">Показатели выбранной схемы появятся здесь.</div>';
    return;
  }

  ui.layoutSheet.style.display = "grid";
  ui.layoutSheet.style.gridTemplateColumns = `repeat(${preview.columns}, minmax(0, 1fr))`;
  ui.layoutSheet.style.gridTemplateRows = `repeat(${preview.rows}, minmax(0, 1fr))`;
  const geometry = lastValidResult.geometry;
  ui.layoutSheet.style.aspectRatio = `${geometry.trimmed.width} / ${geometry.trimmed.height}`;
  preview.cells.forEach((cell) => {
    const node = document.createElement("div");
    node.className = "layout-cell";
    const page = layoutSide === "front" ? cell.frontPage : cell.backPage;
    node.innerHTML = `${escapeHtml(cell.file)}<small>${layoutSide === "front" ? "стр." : "обр."} ${escapeHtml(page ?? "—")}</small>`;
    ui.layoutSheet.append(node);
  });
  ui.layoutDetails.innerHTML = `
    <p class="kicker">Выбранный план</p>
    <h2>${escapeHtml(planTitle(plan))}</h2>
    <p class="muted">Первый монтаж · тираж ${number(preview.runLength, 0)} · вместимость ${preview.capacity}. Поворот ${preview.rotation}°.</p>
    ${metricList(plan.metrics)}
    <div class="scope-note" style="margin:12px 0 0">Оборот отображается из тех же проверенных печатных пар.</div>
  `;
}

function renderScreens() {
  const active = state.runtime.activeScreen;
  $$("[data-screen]").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === active));
  $$("[data-mobile-screen]").forEach((button) => button.classList.toggle("is-active", button.dataset.mobileScreen === active));
}

function renderResults() {
  renderStatus();
  renderProductIssues();
  renderSummary();
  renderQuickComparison();
  renderAlternatives();
  renderLayout();
  renderScreens();
  renderTopSummary();
  publishDebugSnapshot();
}

function renderAll() {
  renderPresets();
  renderSheetFacts();
  setDraftControlValues();
  renderProducts();
  renderResults();
}
