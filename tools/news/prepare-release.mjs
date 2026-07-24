import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const markerPath = path.join(root, "news/.prepare-release.json");
const manifestPath = path.join(root, "artifacts/screenshots/manifest.json");

const marker = JSON.parse(await readFile(markerPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const entry = manifest.entries.find((item) => item.scenario === marker.scenario);

if (!entry) throw new Error(`Screenshot scenario not found: ${marker.scenario}`);
if (!entry.commit || entry.commit !== process.env.GITHUB_SHA) {
  throw new Error(`Screenshot commit ${entry.commit} does not match GITHUB_SHA ${process.env.GITHUB_SHA}`);
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

function bulletList(items) {
  return items.map((item) => `- ${item};`).join("\n").replace(/;$/, ".");
}

await mkdir(path.join(root, "news"), { recursive: true });
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
await rm(markerPath);
console.log(JSON.stringify({ imageName, patchnoteName, queuedAt, imageCommit: entry.commit }, null, 2));
