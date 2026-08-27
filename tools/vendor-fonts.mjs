/* Re-vendor the web fonts from Google Fonts into public/vendor/fonts/.
 *
 * The site used to load fonts from fonts.googleapis.com at runtime. Every
 * third-party runtime dependency is a page that can render wrong for reasons
 * that have nothing to do with this repo — and on this site that stopped being
 * theoretical: an audit run caught `ERR_CONNECTION_RESET` on the jsDelivr
 * Bootstrap CSS, and that page lost `d-none` and the collapse plugin entirely.
 * Same class of failure, same fix: serve it ourselves.
 *
 * Run it only when the font list in FAMILIES changes, or to pick up upstream
 * font revisions. It is not part of the build; the output is committed.
 *
 *   node tools/vendor-fonts.mjs           # rewrite public/vendor/fonts/
 *   node tools/vendor-fonts.mjs --dry     # report what would change
 *
 * What it does
 *
 *   1. Asks the css2 endpoint for the families below with a modern Chrome
 *      user-agent, because the response is UA-negotiated: an older or missing
 *      UA gets ttf/eot instead of woff2.
 *   2. Keeps the `latin` and `latin-ext` subsets and drops cyrillic, greek and
 *      vietnamese. The site is English; latin-ext carries the Western European
 *      accents. That is 12 files instead of 30-odd.
 *   3. Downloads each unique woff2 (Google repeats one variable-font URL across
 *      every requested weight, so the file count is far below the @font-face
 *      count) and writes fonts.css with local URLs.
 *
 * The @font-face blocks are kept verbatim apart from the URL — same
 * font-weight ranges, same unicode-range, same font-display. Rewriting them by
 * hand would mean guessing at variable-font weight ranges, and a guess here
 * shows up as the wrong weight on a real page.
 */

import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const DRY = process.argv.includes('--dry');

/* Must stay in step with the families actually referenced by --font-* in
 * src/styles/style.css. Weights listed here are the ones the stylesheet uses;
 * asking for fewer would silently synthesise the rest. */
const FAMILIES = [
  'Space+Grotesk:wght@400;500;600;700',
  'Space+Mono:wght@400;700',
  'JetBrains+Mono:wght@400;500;700;800',
  'Inter:ital,wght@0,300;0,400;0,500;0,600;1,400',
];
const CSS2 = `https://fonts.googleapis.com/css2?family=${FAMILIES.join('&family=')}&display=swap`;

/* Chrome on Windows. The css2 endpoint negotiates the format on this. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);
const outDir = path.join(import.meta.dirname, '..', 'public', 'vendor', 'fonts');
const PUBLIC_PREFIX = '/vendor/fonts';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/* ── Fetch the stylesheet ──────────────────────────────────── */
const res = await fetch(CSS2, { headers: { 'User-Agent': UA } });
if (!res.ok) {
  console.error(`css2 request failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const source = await res.text();

/* Google emits each face as `/* subset *\/` followed by an @font-face block. */
const blocks = [...source.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]
  .map(([, subset, block]) => ({ subset, block }));

if (!blocks.length) {
  console.error('No @font-face blocks parsed — the css2 response shape changed. Aborting rather than writing an empty stylesheet.');
  process.exit(1);
}

const wanted = blocks.filter((b) => KEEP_SUBSETS.has(b.subset));
if (!wanted.length) {
  console.error('No latin/latin-ext faces found. Aborting.');
  process.exit(1);
}

/* ── Name and dedupe the files ─────────────────────────────── */
const field = (block, name) => (block.match(new RegExp(`${name}:\\s*([^;]+);`)) || [, ''])[1].trim();

const byUrl = new Map();   // remote url -> local filename
const takenBy = new Map(); // local filename -> remote url
const faces = [];

for (const { subset, block } of wanted) {
  const url = (block.match(/url\(([^)]+)\)/) || [])[1];
  const family = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
  if (!url || !family) {
    console.error('A face had no url or family; the response shape changed. Aborting.');
    process.exit(1);
  }
  const style = field(block, 'font-style') || 'normal';
  const weight = field(block, 'font-weight') || '400';

  let file = byUrl.get(url);
  if (!file) {
    let base = `${slug(family)}-${style}-${subset}`;
    // Google hands the same variable file to several weights (one name is
    // right), but serves genuinely different files for a static family's
    // weights (Space Mono) — only then does the weight belong in the name.
    if (takenBy.has(base) && takenBy.get(base) !== url) base += `-${slug(weight)}`;
    file = `${base}.woff2`;
    byUrl.set(url, file);
    takenBy.set(base, url);
  }
  faces.push({ subset, family, style, weight, url, file, block });
}

/* ── Download ──────────────────────────────────────────────── */
if (!DRY) await mkdir(outDir, { recursive: true });

const downloads = [...byUrl.entries()];
let bytes = 0;
for (const [url, file] of downloads) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) {
    console.error(`failed ${r.status} ${url}`);
    process.exit(1);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  bytes += buf.length;
  if (!DRY) await writeFile(path.join(outDir, file), buf);
  console.log(`${DRY ? 'would fetch' : 'fetched'}  ${file.padEnd(38)} ${(buf.length / 1024).toFixed(1)} KB`);
}

/* ── Write the stylesheet ──────────────────────────────────── */
const header = `/* Vendored web fonts — GENERATED by tools/vendor-fonts.mjs. Do not hand-edit.
 *
 * Source: ${CSS2}
 * Subsets kept: ${[...KEEP_SUBSETS].join(', ')} (cyrillic, greek and vietnamese dropped —
 * the site is English and latin-ext carries the Western European accents).
 *
 * The @font-face blocks below are Google's own, unchanged except for the url:
 * the weight ranges and unicode-ranges are theirs, so a variable font keeps
 * the range it was built with rather than one guessed here. Several blocks
 * pointing at one file is normal and costs one download.
 *
 * Regenerate with:  node tools/vendor-fonts.mjs
 */\n\n`;

const body = faces.map(({ subset, family, style, weight, url, file, block }) => {
  const local = block.replace(
    /url\([^)]+\)/,
    `url('${PUBLIC_PREFIX}/${file}')`,
  );
  return `/* ${subset} · ${family} ${style} ${weight} */\n${local}`;
}).join('\n\n') + '\n';

const cssPath = path.join(outDir, 'fonts.css');
if (DRY) {
  console.log(`\nwould write ${cssPath}: ${faces.length} faces, ${downloads.length} files, ${(bytes / 1024).toFixed(0)} KB`);
} else {
  await writeFile(cssPath, header + body, 'utf8');

  // Anything left over from a previous run with a different family list would
  // otherwise sit in public/ forever and ship.
  const keep = new Set([...byUrl.values(), 'fonts.css']);
  for (const name of await readdir(outDir)) {
    if (keep.has(name)) continue;
    await rm(path.join(outDir, name));
    console.log(`removed stale  ${name}`);
  }

  const written = await readFile(cssPath, 'utf8');
  console.log(`\nwrote ${cssPath}`);
  console.log(`${faces.length} @font-face blocks · ${downloads.length} files · ${(bytes / 1024).toFixed(0)} KB of woff2 · ${(written.length / 1024).toFixed(1)} KB of CSS`);
}
