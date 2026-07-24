const button = document.querySelector("#languageButton");
let language = "ru";

function renderLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-lang]").forEach((element) => {
    element.hidden = element.dataset.lang !== language;
  });
  button.textContent = language === "ru" ? "EN" : "RU";
}

async function renderProjectVersion() {
  try {
    const response = await fetch("./VERSION.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`VERSION.json request failed: ${response.status}`);
    }

    const versionData = await response.json();
    if (typeof versionData.version !== "string" || versionData.version.trim() === "") {
      throw new Error("VERSION.json does not contain a valid version string");
    }

    document.querySelectorAll("[data-project-version]").forEach((element) => {
      element.textContent = versionData.version;
    });
  } catch (error) {
    console.warn("Could not load VERSION.json; using the HTML fallback version.", error);
  }
}

button.addEventListener("click", () => {
  language = language === "ru" ? "en" : "ru";
  renderLanguage();
});

renderLanguage();
renderProjectVersion();
