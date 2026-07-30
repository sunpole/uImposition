const stylesheet = document.createElement("link");
stylesheet.rel = "stylesheet";
stylesheet.href = "app-shell.css";
stylesheet.setAttribute("data-app-shell-styles", "");
document.head.append(stylesheet);

await import("./app-shell.js");
