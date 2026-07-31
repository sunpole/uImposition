import { replaceApplicationInput } from "../src/application-state.js";
import { addApplicationProductRow } from "../src/application-product-rows.js";
import { createApplicationStateRepository } from "../src/local-state-repository.js";
import {
  createProductRowsTxtTemplate,
  parseProductRowsTxt,
} from "../src/product-row-txt.js";

const addButton = document.querySelector("#addProductButton");
const heading = addButton?.parentElement ?? null;
const repository = createApplicationStateRepository({ storage: window.localStorage });

function downloadText(text, fileName) {
  const blob = new Blob([`\uFEFF${text}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function issueSummary(issues) {
  return issues.slice(0, 6).map(({ line, field, message }) => (
    `Строка ${line}, ${field}: ${message}`
  )).join("\n");
}

function buildImportedState(rows) {
  const loaded = repository.load();
  if (!loaded) throw new Error("Текущий проект не найден в локальном хранилище.");
  let next = replaceApplicationInput(loaded, {
    ...loaded.input,
    products: [],
  });
  rows.forEach((row) => {
    next = addApplicationProductRow(next, row);
  });
  return next;
}

async function importFile(file, status) {
  if (!file) return;
  status.hidden = false;
  status.textContent = "Проверяем TXT…";
  try {
    const result = parseProductRowsTxt(await file.text());
    if (!result.valid) {
      status.textContent = `TXT не применён.\n${issueSummary(result.issues)}`;
      return;
    }
    const next = buildImportedState(result.rows);
    repository.save(next);
    status.textContent = `Импортировано строк: ${result.rows.length}. Обновляем рабочий экран…`;
    window.setTimeout(() => window.location.reload(), 80);
  } catch (error) {
    status.textContent = `TXT не применён: ${error.message}`;
  }
}

function installControls() {
  if (!heading || document.querySelector("[data-txt-import-controls]")) return;

  const controls = document.createElement("div");
  controls.dataset.txtImportControls = "true";
  controls.className = "product-import-actions";

  const templateButton = document.createElement("button");
  templateButton.type = "button";
  templateButton.className = "button button--quiet";
  templateButton.textContent = "Скачать шаблон TXT";
  templateButton.addEventListener("click", () => {
    downloadText(createProductRowsTxtTemplate(), "uImposition-products-template.txt");
  });

  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.className = "button";
  importButton.textContent = "Импорт TXT";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".txt,text/plain";
  fileInput.hidden = true;
  fileInput.addEventListener("change", () => importFile(fileInput.files?.[0], status));
  importButton.addEventListener("click", () => fileInput.click());

  const status = document.createElement("pre");
  status.className = "txt-import-status";
  status.hidden = true;
  status.setAttribute("aria-live", "polite");

  controls.append(templateButton, importButton, addButton, fileInput);
  heading.append(controls, status);
}

installControls();

window.__uimpositionR3TxtImport = Object.freeze({
  parse: parseProductRowsTxt,
  template: createProductRowsTxtTemplate,
  importText(text) {
    const result = parseProductRowsTxt(text);
    if (!result.valid) return result;
    repository.save(buildImportedState(result.rows));
    return result;
  },
});
