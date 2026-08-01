import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_COMMIT = '2ab958093e83e0ec752e6c1c5932da465bf23e0c';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const upstreamRoot = join(repoRoot, '.agent-vendor', 'mattpocock-skills');
const projectSkillsRoot = join(repoRoot, 'agent-skills');
const installRootIndex = process.argv.indexOf('--install-root');
const installRoot = installRootIndex >= 0 ? resolve(process.argv[installRootIndex + 1] ?? '') : null;

const requiredSkills = new Set([
  'ask-matt',
  'code-review',
  'codebase-design',
  'diagnosing-bugs',
  'domain-modeling',
  'grill-me',
  'grill-with-docs',
  'grilling',
  'handoff',
  'implement',
  'improve-codebase-architecture',
  'prototype',
  'research',
  'resolving-merge-conflicts',
  'setup-matt-pocock-skills',
  'tdd',
  'to-spec',
  'to-tickets',
  'triage',
  'uimposition-product-gate',
  'wayfinder',
]);

function fail(message) {
  console.error(`agent-skills check failed: ${message}`);
  process.exitCode = 1;
}

function walkSkillFiles(root, { excludeDeprecated = false } = {}) {
  if (!existsSync(root)) return [];
  const result = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (excludeDeprecated && full.split(/[\\/]/).includes('deprecated')) continue;
      const stat = statSync(full);
      if (stat.isDirectory()) stack.push(full);
      else if (entry === 'SKILL.md') result.push(full);
    }
  }
  return result.sort();
}

if (!existsSync(upstreamRoot)) {
  fail('pinned submodule is missing; run git submodule update --init --recursive');
} else {
  const actualCommit = execFileSync('git', ['-C', upstreamRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (actualCommit !== EXPECTED_COMMIT) {
    fail(`upstream commit mismatch: expected ${EXPECTED_COMMIT}, got ${actualCommit}`);
  }
}

const upstreamSkillFiles = walkSkillFiles(join(upstreamRoot, 'skills'), { excludeDeprecated: true });
const projectSkillFiles = walkSkillFiles(projectSkillsRoot);
const allSkillFiles = [...upstreamSkillFiles, ...projectSkillFiles];
const names = [];

for (const file of allSkillFiles) {
  const directoryName = basename(dirname(file));
  const source = readFileSync(file, 'utf8');
  const match = source.match(/^---\s*[\s\S]*?^name:\s*([^\s]+)\s*$/m);
  if (!match) {
    fail(`${file} has no frontmatter name`);
    continue;
  }
  const declaredName = match[1];
  if (declaredName !== directoryName) {
    fail(`${file} declares ${declaredName}, expected directory name ${directoryName}`);
  }
  names.push(directoryName);
}

const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
if (duplicateNames.length) fail(`duplicate skill names: ${[...new Set(duplicateNames)].join(', ')}`);

const nameSet = new Set(names);
for (const required of requiredSkills) {
  if (!nameSet.has(required)) fail(`required skill is missing: ${required}`);
}

const gatePath = join(projectSkillsRoot, 'uimposition-product-gate', 'SKILL.md');
if (existsSync(gatePath)) {
  const gate = readFileSync(gatePath, 'utf8');
  for (const phrase of ['Ask exactly one question per message', 'Do not write production code', 'explicitly confirms shared understanding']) {
    if (!gate.includes(phrase)) fail(`product gate lost required rule: ${phrase}`);
  }
}

for (const configPath of [
  'docs/AGENT_SKILLS.md',
  'docs/agents/issue-tracker.md',
  'docs/agents/triage-labels.md',
  'docs/agents/domain.md',
]) {
  if (!existsSync(join(repoRoot, configPath))) fail(`configuration file is missing: ${configPath}`);
}

function checkInstalledDestination(destination) {
  const manifest = join(destination, '.matt-pocock-skills-uimposition');
  if (!existsSync(manifest)) {
    fail(`installation manifest is missing: ${manifest}`);
    return;
  }
  const manifestLines = readFileSync(manifest, 'utf8').trim().split(/\r?\n/);
  if (manifestLines[0] !== `source=${EXPECTED_COMMIT}`) fail(`invalid manifest source in ${manifest}`);
  const installedNames = new Set(manifestLines.slice(1));
  for (const name of nameSet) {
    if (!installedNames.has(name)) fail(`${destination} manifest is missing ${name}`);
    if (!existsSync(join(destination, name, 'SKILL.md'))) fail(`${destination} is missing ${name}/SKILL.md`);
  }
  if (installedNames.size !== nameSet.size) {
    fail(`${destination} manifest count ${installedNames.size} differs from source count ${nameSet.size}`);
  }
}

if (installRoot) {
  checkInstalledDestination(join(installRoot, '.agents', 'skills'));
  checkInstalledDestination(join(installRoot, '.claude', 'skills'));
}

if (!process.exitCode) {
  console.log(`agent-skills check passed: ${upstreamSkillFiles.length} upstream + ${projectSkillFiles.length} project skills`);
}
