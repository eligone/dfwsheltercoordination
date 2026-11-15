#!/usr/bin/env node
// UI rule checker: the automatic part of .claude/skills/ui/SKILL.md.
// Run: npm run check:ui   (CI runs it on every pull request to main)
// Each error names the SKILL.md rule it breaks.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url)); // frontend/
const src = join(root, 'src');
const skill = join(root, '..', '.claude', 'skills', 'ui', 'SKILL.md');

const errors = [];
const fail = (file, rule, msg) => errors.push(`  ${relative(root, file)}\n    [Rule ${rule}] ${msg}`);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

if (!existsSync(skill)) errors.push('  .claude/skills/ui/SKILL.md is missing. Do not delete the UI skill.');

// Only these places may hold source files (Rule 2: no components outside components/ui).
// ADR-0009 added services/, features/ and test/ for Assignment 4 (implementation + tests).
const ALLOWED_TOP = ['components/ui/', 'mock/', 'viewer/', 'wireframes/', 'services/', 'features/', 'test/', 'main.jsx', 'index.css'];

const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black';
const DEFAULT_COLOR_CLASS = new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|placeholder|accent|caret)-(?:${PALETTE})(?:-\\d{2,3})?\\b`);
const RAW_COLOR = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\b(?:rgba?|hsla?|oklch|oklab)\(/;
const ARBITRARY_COLOR = /\b(?:bg|text|border|fill|stroke|ring|from|via|to|outline|shadow|decoration)-\[(?:#|rgb|hsl|okl|color:|var\()/;

for (const file of walk(src)) {
  const rel = relative(src, file).split(sep).join('/');
  if (rel.endsWith('.gitkeep')) continue;

  if (!ALLOWED_TOP.some((p) => rel === p || rel.startsWith(p))) {
    fail(file, 2, 'Files may only live in components/ui, mock, viewer, wireframes, services, features or test. New shared components go in components/ui (ask the team first).');
    continue;
  }
  if (!/\.(jsx?|css)$/.test(rel)) continue;

  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // Rule 3: colors come from tokens only (index.css is where tokens are defined).
  if (rel !== 'index.css' && /\.(jsx|css)$/.test(rel)) { // plain .js files (services, tests) can hold words like "red" in text
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return; // skip comments
      if (RAW_COLOR.test(line)) fail(file, 3, `line ${i + 1}: raw color value. Use a token class (bg-fill, text-muted, ...).`);
      if (ARBITRARY_COLOR.test(line)) fail(file, 3, `line ${i + 1}: arbitrary color class like bg-[...]. Use a token class.`);
      if (DEFAULT_COLOR_CLASS.test(line)) fail(file, 3, `line ${i + 1}: Tailwind default palette color. Only token colors exist.`);
    });
  }

  // Rule 6 (ADR-0009): feature code lives in features/<owner>/ and never imports another owner's folder.
  if (rel.startsWith('features/')) {
    const fparts = rel.split('/');
    if (fparts.length < 3) {
      fail(file, 6, 'Feature files must be inside features/<your-name>/ (e.g. features/hoang/UpdateCapacity.jsx).');
      continue;
    }
    const owner = fparts[1];
    for (const m of text.matchAll(/(?:import|from)\s+['"]([^'"]+)['"]/g)) {
      if (!m[1].startsWith('.')) continue; // packages are fine
      const target = relative(src, join(file, '..', m[1])).split(sep).join('/');
      const mm = target.match(/^features\/([\w-]+)(\/|$)/);
      if (mm && mm[1] !== owner) fail(file, 6, `import "${m[1]}" reaches into another owner's folder. Share code through services/ instead.`);
    }
  }

  if (!rel.startsWith('wireframes/')) continue;

  // Rule 1: wireframes/<owner>/<file>, one level deep.
  const parts = rel.split('/');
  if (parts.length !== 3) {
    fail(file, 1, 'Wireframe files must be directly inside wireframes/<your-name>/ (no deeper folders).');
    continue;
  }
  const owner = parts[1];

  // Rule 4: wireframes import only react, components/ui, mock, or files in their own folder.
  for (const m of text.matchAll(/(?:import|from)\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    const ok =
      spec === 'react' ||
      /^\.\.\/\.\.\/components\/ui(\/[\w.-]+)?$/.test(spec) ||
      /^\.\.\/\.\.\/mock\/[\w.-]+$/.test(spec) ||
      /^\.\/[\w.-]+$/.test(spec) ||
      spec === `../${owner}` || spec.startsWith(`../${owner}/`);
    if (!ok) fail(file, 4, `import "${spec}" is not allowed. Use react, ../../components/ui, ../../mock/*, or files in your own folder.`);
    if (/\.css$/.test(spec)) fail(file, 3, 'No CSS files in wireframes. Style with token classes.');
  }

  // Rule 3: no inline styles in wireframes.
  if (/\sstyle=\{/.test(text)) fail(file, 3, 'No inline style={...} in wireframes. Use Tailwind token classes.');

  // Rule 5: every *.wf.jsx exports meta and a default component.
  if (rel.endsWith('.wf.jsx')) {
    const metaMatch = text.match(/export const meta\s*=\s*\{([\s\S]*?)\n\};?/);
    if (!metaMatch) fail(file, 5, 'Missing `export const meta = { ... }`.');
    else {
      for (const key of ['uc', 'title', 'owner', 'states']) {
        if (!new RegExp(`\\b${key}\\s*:`).test(metaMatch[1])) fail(file, 5, `meta is missing "${key}".`);
      }
      if (!/\bstates\s*:\s*\[\s*['"]/.test(metaMatch[1])) fail(file, 5, 'meta.states must be a list of state names, e.g. ["default", "error"].');
    }
    if (!/export default function/.test(text)) fail(file, 5, 'Missing `export default function YourWireframe({ state }) { ... }`.');
  }
}

if (errors.length) {
  console.error(`\n✗ UI check failed (${errors.length} problem${errors.length > 1 ? 's' : ''}). See .claude/skills/ui/SKILL.md\n`);
  console.error(errors.join('\n'));
  console.error('');
  process.exit(1);
}
console.log('✓ UI check passed');
