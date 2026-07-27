import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repositoryRoot = process.cwd();
const docsRoot = path.join(repositoryRoot, "docs");
const catalogPath = path.join(docsRoot, "README.md");
const errors = [];

function listMarkdownFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files;
}

function extractLocalTargets(markdown, sourcePath) {
  const targets = [];
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(linkPattern)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (
      rawTarget === "" ||
      rawTarget.startsWith("#") ||
      /^(?:https?:|mailto:|tel:|data:)/i.test(rawTarget)
    ) {
      continue;
    }

    const targetWithoutFragment = rawTarget.split("#", 1)[0].split("?", 1)[0];
    if (targetWithoutFragment === "") {
      continue;
    }

    const resolvedTarget = path.resolve(
      path.dirname(sourcePath),
      decodeURIComponent(targetWithoutFragment),
    );
    targets.push(resolvedTarget);
  }

  return targets;
}

if (!fs.existsSync(catalogPath)) {
  errors.push("Missing canonical documentation catalog: docs/README.md");
}

const markdownFiles = listMarkdownFiles(repositoryRoot);

for (const markdownPath of markdownFiles) {
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const localTargets = extractLocalTargets(markdown, markdownPath);

  for (const localTarget of localTargets) {
    const relativeTarget = path.relative(repositoryRoot, localTarget);
    if (
      relativeTarget.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativeTarget)
    ) {
      errors.push(
        `${path.relative(repositoryRoot, markdownPath)} links outside the repository: ${relativeTarget}`,
      );
      continue;
    }

    if (!fs.existsSync(localTarget)) {
      errors.push(
        `${path.relative(repositoryRoot, markdownPath)} has a broken local link: ${relativeTarget}`,
      );
    }
  }
}

if (fs.existsSync(catalogPath)) {
  const catalog = fs.readFileSync(catalogPath, "utf8");
  const catalogTargets = new Set(
    extractLocalTargets(catalog, catalogPath).map((target) =>
      path.normalize(target),
    ),
  );
  const uncataloguedDocs = markdownFiles
    .filter(
      (markdownPath) =>
        markdownPath.startsWith(`${docsRoot}${path.sep}`) &&
        markdownPath !== catalogPath,
    )
    .filter((markdownPath) => !catalogTargets.has(path.normalize(markdownPath)))
    .map((markdownPath) => path.relative(repositoryRoot, markdownPath))
    .sort();

  for (const uncataloguedDoc of uncataloguedDocs) {
    errors.push(`Documentation file is missing from docs/README.md: ${uncataloguedDoc}`);
  }
}

if (errors.length > 0) {
  console.error(`Documentation check failed with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  const documentedFiles = markdownFiles.filter((markdownPath) =>
    markdownPath.startsWith(`${docsRoot}${path.sep}`),
  ).length;
  console.log(
    `Documentation check passed: ${markdownFiles.length} Markdown files, ${documentedFiles} files under docs/, no broken local links, full catalog coverage.`,
  );
}
