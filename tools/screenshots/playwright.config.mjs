import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "capture.spec.mjs",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    locale: "ru-RU",
    colorScheme: "light",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  },
  webServer: {
    command: "python3 -m http.server 4173 --directory ../..",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
