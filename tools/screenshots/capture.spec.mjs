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

function countPdfPages(bytes) {
  const text = Buffer.from(bytes).toString("latin1");
  if (!text.startsWith("%PDF-")) throw new Error("Downloaded file is not a PDF");
  if (!text.includes("%%EOF")) throw new Error("Downloaded PDF has no EOF marker");
  return (text.match(/\/Type\s*\/Page\b/g) ?? []).length;
}

async function runAssertions(page, assertions = []) {
  for (const assertion of assertions) {
    const locator = page.locator(assertion.selector);
    await expect(locator).toBeVisible();
    await expect(locator).toContainText(assertion.text);
  }
}

async function runBeforeScreenshotActions(page, actions = []) {
  for (const action of actions) {
    if (action.action === "click") {
      const locator = page.locator(action.selector);
      await expect(locator).toBeVisible();
      await locator.click();
      continue;
    }
    if (action.action === "hide") {
      const locator = page.locator(action.selector);
      await locator.evaluate((element) => {
        element.style.setProperty("display", "none", "important");
      });
      continue;
    }
    if (action.action === "waitForHidden") {
      await page.locator(action.selector).waitFor({ state: "hidden", timeout: action.timeoutMs ?? 10000 });
      continue;
    }
    if (action.action === "wait") {
      await page.waitForTimeout(action.timeoutMs ?? 250);
      continue;
    }
    throw new Error(`Unsupported beforeScreenshot action: ${action.action}`);
  }
}

for (const scenario of scenarios) {
  test(`capture ${scenario.id}`, async ({ page }) => {
    await page.setViewportSize(scenario.viewport);
    await page.goto(scenario.path, { waitUntil: "networkidle" });

    await runAssertions(page, scenario.assertions);

    let downloadEntry = null;
    if (scenario.download) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 120000 }),
        page.locator(scenario.download.selector).click(),
      ]);
      const failure = await download.failure();
      if (failure) throw new Error(`Download failed: ${failure}`);

      const suggestedFileName = download.suggestedFilename();
      expect(suggestedFileName).toBe(scenario.download.fileName);
      const artifactFileName = scenario.download.artifact || suggestedFileName;
      const artifactPath = path.join(outputDir, artifactFileName);
      await download.saveAs(artifactPath);

      const bytes = await readFile(artifactPath);
      const pageCount = countPdfPages(bytes);
      expect(pageCount).toBe(scenario.download.expectedPages);

      downloadEntry = {
        suggestedFileName,
        artifact: artifactFileName,
        sizeBytes: bytes.length,
        pageCount,
      };

      await runAssertions(page, scenario.afterDownloadAssertions);
    }

    await runBeforeScreenshotActions(page, scenario.beforeScreenshot);
    await runAssertions(page, scenario.beforeScreenshotAssertions);

    const screenshotPath = path.join(outputDir, scenario.screenshot);
    if (scenario.screenshotSelector) {
      const target = page.locator(scenario.screenshotSelector);
      await expect(target).toBeVisible();
      await target.screenshot({ path: screenshotPath });
    } else {
      await page.screenshot({ path: screenshotPath, fullPage: Boolean(scenario.fullPage) });
    }

    const entry = {
      scenario: scenario.id,
      commit: process.env.SCREENSHOT_COMMIT || "local-uncommitted",
      capturedAt: new Date().toISOString(),
      url: page.url(),
      viewport: scenario.viewport,
      screenshot: scenario.screenshot,
      screenshotSelector: scenario.screenshotSelector || null,
      beforeScreenshot: scenario.beforeScreenshot ?? [],
      beforeScreenshotAssertions: scenario.beforeScreenshotAssertions ?? [],
      assertions: scenario.assertions,
      download: downloadEntry,
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
