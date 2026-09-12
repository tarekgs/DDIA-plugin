#!/usr/bin/env node
// Structural check for the DDIA plugin — rerunnable proof that the package is coherent.
// Verifies: every skill dir has a valid SKILL.md with name+description frontmatter;
// every path referenced from SKILL.md / README exists; the router lists exactly the
// real skills; manifests parse.
// Usage: node evals/check-plugin.mjs   (exit 0 = clean)
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const fail = (msg) => { failures++; console.error(`FAIL  ${msg}`); };
const ok = (msg) => console.log(`ok    ${msg}`);

// --- manifests parse ---
for (const m of ['plugin.json', '.claude-plugin/plugin.json', '.cursor-plugin/plugin.json', '.devin-plugin/plugin.json']) {
  const p = join(root, m);
  if (!existsSync(p)) { fail(`missing manifest ${m}`); continue; }
  try { JSON.parse(readFileSync(p, 'utf8')); ok(`manifest ${m} parses`); }
  catch (e) { fail(`manifest ${m} invalid JSON: ${e.message}`); }
}

// --- skills ---
const skillsDir = join(root, 'skills');
const skills = readdirSync(skillsDir).filter(d => statSync(join(skillsDir, d)).isDirectory());
if (skills.length === 0) fail('no skills found');

const skillNames = new Set();
for (const s of skills) {
  const p = join(skillsDir, s, 'SKILL.md');
  if (!existsSync(p)) { fail(`skills/${s}/SKILL.md missing`); continue; }
  const text = readFileSync(p, 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { fail(`skills/${s}: no YAML frontmatter`); continue; }
  const name = fm[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const desc = fm[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name) fail(`skills/${s}: frontmatter missing name`);
  if (!desc || desc.length < 20) fail(`skills/${s}: description missing or too short (${desc?.length ?? 0} chars)`);
  if (desc && desc.length > 1024) fail(`skills/${s}: description >1024 chars (${desc.length})`);
  skillNames.add(name ?? s);
  ok(`skills/${s} valid (name=${name ?? s})`);

  // referenced paths exist
  for (const m2 of text.matchAll(/\]\(([^)]+)\)|`(\.\.\/[^`\s]+)`/g)) {
    const ref = m2[1] ?? m2[2];
    if (!ref || /^https?:/.test(ref)) continue;
    const target = resolve(dirname(p), ref);
    if (!existsSync(target)) fail(`skills/${s}/SKILL.md references missing path ${ref}`);
  }
}

// --- router lists every skill ---
const router = join(skillsDir, 'ddia-engineer', 'SKILL.md');
if (existsSync(router)) {
  const rt = readFileSync(router, 'utf8');
  for (const s of skills) {
    if (s === 'ddia-engineer') continue;
    if (!rt.includes(`\`${s}\``)) fail(`router does not route to skill ${s}`);
  }
  ok('router coverage checked');
}

// --- principles referenced exist ---
for (const s of skills) {
  const p = join(skillsDir, s, 'SKILL.md');
  if (!existsSync(p)) continue;
  const text = readFileSync(p, 'utf8');
  for (const m of text.matchAll(/principles\/([a-z0-9-]+\.md)/g)) {
    if (!existsSync(join(root, 'principles', m[1]))) fail(`${s} references missing principle ${m[1]}`);
  }
}

console.log(`\n${failures} failure(s), ${skills.length} skills checked`);
process.exit(failures ? 1 : 0);
