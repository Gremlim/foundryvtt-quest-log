// Compares lang/*.json against lang/en.json and finds keys used/unused in src, templates and database.
// Usage: node tools/check-lang.mjs [--used]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flat = (o, p = '', out = {}) => { for (const [k, v] of Object.entries(o)) { const kk = p ? `${p}.${k}` : k;
   if (v && typeof v === 'object') flat(v, kk, out); else out[kk] = v; } return out; };
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const langDir = path.join(root, 'lang');
const en = flat(read(path.join(langDir, 'en.json')));
const enKeys = Object.keys(en);

console.log(`en.json: ${enKeys.length} keys\n`);
for (const f of fs.readdirSync(langDir).filter((n) => n.endsWith('.json') && n !== 'en.json').sort()) {
   const l = flat(read(path.join(langDir, f)));
   const missing = enKeys.filter((k) => !(k in l));
   const extra = Object.keys(l).filter((k) => !(k in en));
   const same = enKeys.filter((k) => k in l && l[k] === en[k] && /[A-Za-z]{4,}/.test(en[k]));
   console.log(`${f.padEnd(12)} total ${String(Object.keys(l).length).padStart(4)}  missing ${String(missing.length).padStart(4)}  extra ${String(extra.length).padStart(3)}  identical-to-en ${same.length}`);
}

// Used keys
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
   const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.(js|html|hbs|json)$/.test(e.name)) out.push(p); } return out; };
const files = ['src', 'templates', 'database'].flatMap((d) => walk(path.join(root, d)));
const text = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const used = new Set(); const dynamic = new Set();
for (const m of text.matchAll(/QuestLog\.[A-Za-z0-9_.]+/g)) used.add(m[0].replace(/\.$/, ''));
for (const m of text.matchAll(/['"`](QuestLog\.[A-Za-z0-9_.]*)\$\{|\{\{localize\s+\(concat\s+['"](QuestLog\.[A-Za-z0-9_.]+)['"]/g)) dynamic.add(m[1] || m[2]);
const unused = enKeys.filter((k) => !used.has(k) && ![...dynamic].some((d) => k.startsWith(d)) && ![...used].some((u) => k.startsWith(`${u}.`)));
const ignore = /^QuestLog\.(Lifecycle|Open|Run)\.|^QuestLog\.(_|js$|setPosition|getGroupBy|GROUP_BY)/;
const undefinedKeys = [...used].filter((k) => !ignore.test(k) && !(k in en) && !enKeys.some((e) => e.startsWith(`${k}.`)) && !k.endsWith('.'));
console.log(`\nDynamic prefixes: ${[...dynamic].join(', ') || '-'}`);
console.log(`\nKeys in en.json not referenced (${unused.length}):\n${unused.join('\n')}`);
console.log(`\nKeys referenced but missing in en.json (${undefinedKeys.length}):\n${undefinedKeys.join('\n')}`);
const esKeys = Object.keys(flat(read(path.join(langDir, 'es.json'))));
const esMissing = enKeys.filter((k) => !esKeys.includes(k));
if (undefinedKeys.length || unused.length || esMissing.length) { console.log('\nFAIL (en/es out of sync or unused/undefined keys)'); process.exitCode = 1; } else { console.log('\nOK: en and es are in sync and every key is used'); }
