// Rebuilds lang/<code>.json following the key order of lang/en.json.
// Existing translations are kept; missing keys are taken from a translation array (see /tmp/tr) in the order
// of the missing keys list. Placeholders ({x}) and HTML tags must match the English text.
// Usage: node tools/merge-lang.mjs <code> <translations.json>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const [code, trFile] = process.argv.slice(2);
const dir = `${path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'lang')}${path.sep}`;
const flat = (o, p = '', out = {}) => { for (const [k, v] of Object.entries(o)) { const kk = p ? `${p}.${k}` : k;
   if (v && typeof v === 'object') flat(v, kk, out); else out[kk] = v; } return out; };
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const en = flat(read(`${dir}en.json`));
const cur = flat(read(`${dir}${code}.json`));
const missing = Object.keys(en).filter((k) => !(k in cur));
const tr = trFile ? JSON.parse(fs.readFileSync(trFile, 'utf8')) : [];
if (missing.length && tr.length !== missing.length) { console.error(`${code}: ${missing.length} missing keys but ${tr.length} translations`); process.exit(1); }
const ph = (s) => (s.match(/\{[A-Za-z0-9_]+\}|<\/?[a-z]+>/g) || []).sort().join(',');
let bad = 0;
const all = { ...cur }; missing.forEach((k, i) => { all[k] = tr[i]; });
for (const k of Object.keys(en)) { if (ph(String(all[k])) !== ph(en[k])) { const isNew = missing.includes(k);
   console.error(`${code}: ${isNew ? 'ERROR' : 'warning (existing key)'} placeholder mismatch in ${k}: "${all[k]}" (en: "${en[k]}")`); if (isNew) bad++; } }
if (bad) process.exit(1);
const out = {};
for (const k of Object.keys(en)) { const ks = k.split('.'); let c = out; ks.slice(0, -1).forEach((p) => { c[p] ??= {}; c = c[p]; }); c[ks.at(-1)] = all[k]; }
fs.writeFileSync(`${dir}${code}.json`, `${JSON.stringify(out, null, 2)}\n`.replace(/\n/g, '\r\n'), 'utf8');
console.log(`${code}: ${missing.length} keys added, ${Object.keys(cur).length - Object.keys(cur).filter((k) => k in en).length} obsolete removed`);
