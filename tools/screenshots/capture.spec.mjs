import { test, expect } from "@playwright/test";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const scenarioDir = path.join(here, "scenarios");
const outputDir = path.resolve(here, "../../artifacts/screenshots");
const scenarioFilter = new Set(
  String(process.env.SCREENSHOT_SCENARIOS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const scenarioFiles = (await readdir(scenarioDir))
  .filter((name) => name.endsWith(".json"))
  .sort();

const scenarios = [];
for (const fileName of scenarioFiles) {
  const scenario = JSON.parse(await readFile(path.join(scenarioDir, fileName), "utf8"));
  if (scenarioFilter.size === 0 || scenarioFilter.has(scenario.id)) scenarios.push(scenario);
}

if (scenarios.length === 0) throw new Error("No screenshot scenarios selected");

for (const scenario of scenarios) {
  test(`capture ${scenario.id}`, async ({ page }) => {
    await page.setViewportSize(scenario.viewport);
    await page.goto(scenario.path, { waitUntil: "networkidle" });

    for (const assertion of scenario.assertions) {
      const locator = page.locator(assertion.selector);
      await expect(locator).toBeVisible();
      await expect(locator).toContainText(assertion.text);
    }

    const screenshotPath = path.join(outputDir, scenario.screenshot);
    await page.screenshot({ path: screenshotPath, fullPage: Boolean(scenario.fullPage) });

    const entry = {
      scenario: scenario.id,
      commit: process.env.SCREENSHOT_COMMIT || "local-uncommitted",
      capturedAt: new Date().toISOString(),
      url: page.url(),
      viewport: scenario.viewport,
      screenshot: scenario.screenshot,
      assertions: scenario.assertions,
    };

    await writeFile(
      path.join(outputDir, "entries", `${scenario.id}.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      "utf8",
    );
  });
}

test.afterAll(async () => {
  const entryFiles = (await readdir(path.join(outputDir, "entries")))
    .filter((name) => name.endsWith(".json"))
    .sort();
  const entries = [];
  for (const fileName of entryFiles) {
    entries.push(JSON.parse(await readFile(path.join(outputDir, "entries", fileName), "utf8")));
  }

  const manifest = {
    project: "uImposition",
    generatedAt: new Date().toISOString(),
    commit: process.env.SCREENSHOT_COMMIT || "local-uncommitted",
    entries,
  };

  await writeFile(
    path.join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
});
