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
    const locator = page.locator(assertion.selector).first();
    if (assertion.hidden) {
      await expect(locator).toBeHidden();
      continue;
    }
    await expect(locator).toBeVisible();
    if (Object.hasOwn(assertion, "value")) {
      await expect(locator).toHaveValue(String(assertion.value));
    }
    if (Object.hasOwn(assertion, "text")) {
      await expect(locator).toContainText(assertion.text);
    }
  }
}

async function runPageAssertions(page, assertions = {}) {
  if (assertions.noHorizontalOverflow) {
    const metrics = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  }

  if (assertions.layoutFitsCanvas) {
    const metrics = await page.evaluate(() => {
      const canvas = document.querySelector(".layout-canvas");
      const sheet = document.querySelector(".layout-pair__sheet");
      if (!canvas || !sheet) return null;
      return {
        canvasClientWidth: canvas.clientWidth,
        canvasScrollWidth: canvas.scrollWidth,
        sheetWidth: sheet.getBoundingClientRect().width,
      };
    });
    expect(metrics).not.toBeNull();
    expect(metrics.canvasScrollWidth).toBeLessThanOrEqual(metrics.canvasClientWidth + 1);
    expect(metrics.sheetWidth).toBeLessThanOrEqual(metrics.canvasClientWidth + 1);
  }

  if (assertions.mirroredBackDom) {
    const sequences = await page.evaluate(() => {
      const preview = window.__uimpositionR3?.getSnapshot?.()?.lastValidResult?.layoutPreview;
      const expected = (preview?.backCells ?? []).map((cell) => {
        const pageValue = cell.page ?? cell.backPage;
        return pageValue === null || pageValue === undefined ? "blank" : String(pageValue);
      });
      const actual = [...document.querySelectorAll("[data-layout-side='back']")]
        .map((cell) => cell.dataset.layoutPage);
      return { expected, actual };
    });
    expect(sequences.expected.length).toBeGreaterThan(0);
    expect(sequences.actual).toEqual(sequences.expected);
  }
}

async function runBeforeScreenshotActions(page, actions = []) {
  for (const action of actions) {
    if (action.action === "click") {
      const locator = page.locator(action.selector).first();
      await expect(locator).toBeVisible();
      await locator.click();
      continue;
    }
    if (action.action === "fill") {
      const locator = page.locator(action.selector).first();
      await expect(locator).toBeVisible();
      await locator.fill(String(action.value ?? ""));
      continue;
    }
    if (action.action === "hide") {
      const locator = page.locator(action.selector).first();
      await locator.evaluate((element) => {
        element.style.setProperty("display", "none", "important");
      });
      continue;
    }
    if (action.action === "style") {
      const locator = page.locator(action.selector).first();
      await expect(locator).toBeVisible();
      const styles = action.styles;
      if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
        throw new Error("Style action requires a styles object");
      }
      await locator.evaluate((element, styleEntries) => {
        Object.entries(styleEntries).forEach(([property, value]) => {
          element.style.setProperty(property, String(value), "important");
        });
      }, styles);
      continue;
    }
    if (action.action === "waitForHidden") {
      await page.locator(action.selector).first().waitFor({ state: "hidden", timeout: action.timeoutMs ?? 10000 });
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
    await runBeforeScreenshotActions(page, scenario.beforeDownload);

    let downloadEntry = null;
    if (scenario.download) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 120000 }),
        page.locator(scenario.download.selector).first().click(),
      ]);
      const failure = await download.failure();
      if (failure) throw new Error(`Download failed: ${failure}`);

      const suggestedFileName = download.suggestedFilename();
      if (scenario.download.fileName) {
        expect(suggestedFileName).toBe(scenario.download.fileName);
      } else if (scenario.download.fileNamePattern) {
        expect(suggestedFileName).toMatch(new RegExp(scenario.download.fileNamePattern));
      } else {
        throw new Error("Download scenario requires fileName or fileNamePattern");
      }
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
    await runPageAssertions(page, scenario.pageAssertions);

    const screenshotPath = path.join(outputDir, scenario.screenshot);
    if (scenario.screenshotSelector) {
      const target = page.locator(scenario.screenshotSelector).first();
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
      beforeDownload: scenario.beforeDownload ?? [],
      beforeScreenshot: scenario.beforeScreenshot ?? [],
      beforeScreenshotAssertions: scenario.beforeScreenshotAssertions ?? [],
      assertions: scenario.assertions,
      pageAssertions: scenario.pageAssertions ?? {},
      download: downloadEntry,
    };

    const manifestPath = path.join(outputDir, "manifest.ndjson");
    await writeFile(manifestPath, `${JSON.stringify(entry)}\n`, { flag: "a" });
  });
}
