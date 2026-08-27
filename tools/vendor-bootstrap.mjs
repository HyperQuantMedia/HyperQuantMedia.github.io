/* Compile the custom Bootstrap build, and refuse to ship one that is missing a
 * class the site actually uses.
 *
 * Input:  tools/bootstrap-custom.scss  (the import list — edit that, not this)
 * Output: public/vendor/bootstrap/bootstrap.custom.min.css
 *
 *   node tools/vendor-bootstrap.mjs          # compile, verify, write
 *   node tools/vendor-bootstrap.mjs --dry    # compile and verify, write nothing
 *
 * The verification step is the reason this is a script rather than a one-off
 * command. Trimming Bootstrap's `$utilities` map is a silent operation: drop
 * the wrong family and `mt-4` simply stops existing, the page shifts by a few
 * pixels, and nothing errors. So after compiling, this reads every class token
 * out of dist/**\/*.html, works out which of them Bootstrap is supposed to own,
 * and asserts each one has a selector in the output. A missing class fails the
 * run with its name.
 *
 * That check needs a build to read, so run `npm run build` first (npm run
 * vendor does). It warns rather than failing if dist/ is absent — the compile
 * is still useful on a clean checkout.
 */

import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import * as sass from 'sass';

const DRY = process.argv.includes('--dry');
const root = path.join(import.meta.dirname, '..');
const entry = path.join(import.meta.dirname, 'bootstrap-custom.scss');
const outPath = path.join(root, 'public', 'vendor', 'bootstrap', 'bootstrap.custom.min.css');
const distDir = path.join(root, 'dist');

/* Bootstrap's own class families, as they appear in markup. Anything matching
 * one of these is Bootstrap's to provide; everything else is this site's own
 * CSS and none of Bootstrap's business.
 *
 * Deliberately NOT a catch-all: `btn-primary-custom` and `nav-cta` look
 * Bootstrap-shaped but are defined in src/styles/style.css, so they are
 * excluded by name rather than by a loose pattern that would demand Bootstrap
 * provide them. */
const BOOTSTRAP_OWNED = [
  /^container(-(sm|md|lg|xl|xxl|fluid))?$/,
  /^row$/,
  /^col(-(sm|md|lg|xl|xxl))?(-(auto|\d{1,2}))?$/,
  /^offset-(sm|md|lg|xl|xxl)-\d{1,2}$/,
  /^g[xy]?-\d$/,
  /^d-(sm|md|lg|xl|xxl-)?[a-z-]+$/,
  /^flex-(sm|md|lg|xl|xxl-)?[a-z-]+$/,
  /^justify-content-(sm|md|lg|xl|xxl-)?[a-z]+$/,
  /^align-(items|self)-(sm|md|lg|xl|xxl-)?[a-z]+$/,
  /^gap-(sm|md|lg|xl|xxl-)?\d$/,
  /^[mp][txbylrse]?-((sm|md|lg|xl|xxl)-)?(\d|auto)$/,
  /^text-(start|end|center|(sm|md|lg|xl|xxl)-(start|end|center))$/,
  /^(fixed|sticky)-(top|bottom)$/,
  /^visually-hidden(-focusable)?$/,
  /^navbar(-brand|-nav|-collapse|-toggler|-toggler-icon|-text|-expand(-(sm|md|lg|xl|xxl))?)?$/,
  /^nav(-item|-link)?$/,
  /^collapse|^collapsing$/,
];
const NOT_BOOTSTRAP = new Set(['nav-cta', 'btn-primary-custom', 'btn-ghost-custom']);

/* Classes applied at RUNTIME, so they never appear in dist/**\/*.html and the
 * token scan below cannot see them. Without this list the trim could silently
 * drop `.collapse:not(.show)` and the navbar menu would sit permanently open —
 * which is precisely the kind of failure a class scan is supposed to catch.
 * public/js/app.js adds `show` and `collapsing`. */
const RUNTIME_CLASSES = ['show', 'collapsing'];

/* ── Compile ───────────────────────────────────────────────── */
let css;
try {
  const result = sass.compile(entry, {
    style: 'compressed',
    // Bootstrap 5.3 predates modern Sass and emits hundreds of deprecation
    // warnings from its own files. Warnings are silenced; errors still throw,
    // so a mistake in bootstrap-custom.scss still fails the run loudly.
    quietDeps: true,
    logger: sass.Logger.silent,
  });
  css = result.css.toString();
} catch (err) {
  console.error('Sass compile failed:\n' + (err.message || err));
  process.exit(1);
}

/* ── Verify every Bootstrap class the site uses survived the trim ── */
async function htmlFiles(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    if ((await stat(full)).isDirectory()) out.push(...await htmlFiles(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

let verified = false;
let missing = [];
let wanted = [];
try {
  await stat(distDir);
  const files = await htmlFiles(distDir);
  const tokens = new Set();
  for (const f of files) {
    const html = await readFile(f, 'utf8');
    for (const m of html.matchAll(/class="([^"]*)"/g)) {
      for (const t of m.group?.(1)?.split(/\s+/) ?? m[1].split(/\s+/)) if (t) tokens.add(t);
    }
  }
  wanted = [...new Set([
    ...[...tokens]
      .filter((t) => !NOT_BOOTSTRAP.has(t))
      .filter((t) => BOOTSTRAP_OWNED.some((re) => re.test(t))),
    ...RUNTIME_CLASSES,
  ])].sort();
  // A class is present if the compiled sheet contains a selector for it. The
  // escaped form matters: Bootstrap writes `.g-4` plainly but `.col-lg-10`
  // plainly too, so a literal `.<token>` followed by a selector boundary is
  // the right test.
  missing = wanted.filter((t) => {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return !new RegExp(`\\.${esc}(?![\\w-])`).test(css);
  });
  verified = true;
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`compiled  ${kb(css.length)}  from tools/bootstrap-custom.scss`);

if (!verified) {
  console.log('SKIPPED the class check: no dist/ to read. Run `npm run build` then re-run this.');
} else if (missing.length) {
  console.error(`\n${missing.length} Bootstrap class(es) used in dist/ but ABSENT from the build:`);
  missing.forEach((m) => console.error('  .' + m));
  console.error('\nAdd the layer or utility family that provides them to tools/bootstrap-custom.scss.');
  console.error('Nothing was written.');
  process.exit(1);
} else {
  console.log(`verified  all ${wanted.length} Bootstrap classes used in dist/ are present`);
}

if (DRY) {
  console.log('\n--dry: nothing written.');
} else {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, css, 'utf8');
  console.log(`wrote     public/vendor/bootstrap/bootstrap.custom.min.css  ${kb(css.length)}`);
}
