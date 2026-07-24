const button = document.querySelector("#languageButton");
let language = "ru";

function renderLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-lang]").forEach((element) => {
    element.hidden = element.dataset.lang !== language;
  });
  button.textContent = language === "ru" ? "EN" : "RU";
}

button.addEventListener("click", () => {
  language = language === "ru" ? "en" : "ru";
  renderLanguage();
});

renderLanguage();
