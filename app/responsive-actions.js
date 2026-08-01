const style = document.createElement("style");
style.dataset.responsiveActions = "true";
style.textContent = `
  .product-import-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:7px; }
  .txt-import-status { width:100%; max-width:760px; margin:8px 0 0; padding:8px 10px; border-radius:7px; color:var(--muted); background:var(--surface-soft); font:11px/1.4 ui-monospace,monospace; white-space:pre-wrap; }
  .workspace-export-toolbar { display:grid; grid-template-columns:auto auto; gap:6px; align-items:center; }
  .workspace-export-toolbar .button { min-height:34px; padding:6px 9px; white-space:nowrap; }
  .workspace-export-status { grid-column:1 / -1; color:var(--muted); font-size:9px; line-height:1.2; text-align:center; }
  @media (max-width:860px) {
    .product-import-actions { width:100%; justify-content:stretch; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
    .product-import-actions .button { width:100%; min-width:0; }
    .screen--layout .screen-heading__actions { width:100%; display:grid!important; grid-template-columns:1fr; gap:7px; }
    .workspace-export-toolbar { width:100%; grid-template-columns:1fr 1fr; }
    .workspace-export-toolbar .button { width:100%; min-width:0; }
  }
  @media (max-width:360px) {
    .product-import-actions { grid-template-columns:1fr; }
    .workspace-export-toolbar { grid-template-columns:1fr; }
    .workspace-export-status { grid-column:1; }
  }
`;
document.head.append(style);
