import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const markerPath = path.join(root, "news/.prepare-release.json");
const manifestJsonPath = path.join(root, "artifacts/screenshots/manifest.json");
const manifestNdjsonPath = path.join(root, "artifacts/screenshots/manifest.ndjson");

async function readScreenshotEntries() {
  try {
    const manifest = JSON.parse(await readFile(manifestJsonPath, "utf8"));
    if (Array.isArray(manifest)) return manifest;
    if (Array.isArray(manifest.entries)) return manifest.entries;
    throw new TypeError("Screenshot manifest.json must contain an entries array");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const ndjson = await readFile(manifestNdjsonPath, "utf8");
  return ndjson
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new SyntaxError(`Invalid screenshot manifest.ndjson line ${index + 1}: ${error.message}`);
      }
    });
}

const marker = JSON.parse(await readFile(markerPath, "utf8"));
const entries = await readScreenshotEntries();
const entry = entries.find((item) => item.scenario === marker.scenario);
const expectedCommit = process.env.SCREENSHOT_COMMIT || process.env.GITHUB_SHA;

if (!entry) throw new Error(`Screenshot scenario not found: ${marker.scenario}`);
if (!expectedCommit) throw new Error("Expected screenshot commit is not available");
if (!entry.commit || entry.commit !== expectedCommit) {
  throw new Error(`Screenshot commit ${entry.commit} does not match expected commit ${expectedCommit}`);
}

const queuedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const date = queuedAt.slice(0, 10);
const safeVersion = marker.version.replace(/[^0-9A-Za-z]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const baseName = `${date}-uimposition-v${safeVersion}-${marker.slug}`;
const imageName = `${baseName}.png`;
const patchnoteName = `${baseName}.md`;
const sourceImage = path.join(root, "artifacts/screenshots", entry.screenshot);
const targetImage = path.join(root, "news", imageName);
const targetPatchnote = path.join(root, "news", patchnoteName);
const releaseDirectory = path.join(root, "archive", "development", marker.version);
const archiveName = `uimposition-v${safeVersion}-evidence.zip`;
const releaseManifestPath = path.join(releaseDirectory, "release.json");

function bulletList(items) {
  return items.map((item) => `- ${item};`).join("\n").replace(/;$/, ".");
}

await mkdir(path.join(root, "news"), { recursive: true });
await mkdir(releaseDirectory, { recursive: true });
await copyFile(sourceImage, targetImage);

const frontMatter = `---
type: ${marker.type}
project: uImposition
series: uimposition
title: ${marker.title}
version: ${marker.version}
queued_at: ${queuedAt}
repo_url: https://github.com/sunpole/uImposition
web_url: https://sunpole.github.io/uImposition/
image: ${imageName}
image_text: ${marker.imageText}
image_source: playwright
image_target: scenario/${entry.scenario}
image_commit: ${entry.commit}
image_captured_at: ${entry.capturedAt}
---`;

const body = `${frontMatter}

# ${marker.title}

${marker.summary}

Что добавлено:

${bulletList(marker.features)}

Проверенный контрольный результат:

${bulletList(marker.controlFacts)}

${marker.nextStep}

Короткий текст для Telegram:

${marker.telegramText}
`;

await writeFile(targetPatchnote, body, "utf8");

const prerelease = /-(alpha|beta|rc(?:\.|$))/i.test(marker.version);
const releaseManifest = {
  schemaVersion: 1,
  project: "uImposition",
  version: marker.version,
  tag: `v${marker.version}`,
  title: `uImposition v${marker.version}`,
  prerelease,
  sourceCommit: entry.commit,
  createdAt: queuedAt,
  patchnote: path.relative(root, targetPatchnote).replaceAll("\\", "/"),
  image: path.relative(root, targetImage).replaceAll("\\", "/"),
  archive: path.relative(root, path.join(releaseDirectory, archiveName)).replaceAll("\\", "/"),
  screenshotScenario: entry.scenario,
  archiveScenarios: Array.isArray(marker.archiveScenarios) && marker.archiveScenarios.length > 0
    ? marker.archiveScenarios
    : [marker.scenario],
  historicalArtifacts: Array.isArray(marker.historicalArtifacts) ? marker.historicalArtifacts : [],
  telegramText: marker.telegramText,
};

await writeFile(releaseManifestPath, `${JSON.stringify(releaseManifest, null, 2)}\n`, "utf8");
await rm(markerPath);
console.log(JSON.stringify({
  imageName,
  patchnoteName,
  queuedAt,
  imageCommit: entry.commit,
  releaseManifest: path.relative(root, releaseManifestPath),
  archive: releaseManifest.archive,
}, null, 2));
