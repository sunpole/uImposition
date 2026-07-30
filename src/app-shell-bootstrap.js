for (const href of ["app-shell.css", "app-shell-overrides.css", "selected-plan-tabs.css"]) {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = href;
  stylesheet.setAttribute("data-app-shell-styles", href);
  document.head.append(stylesheet);
}

await import("./app-shell.js");
await import("./user-production-comparison-status-layout.js");
await import("./user-production-plan-tabs.js");
