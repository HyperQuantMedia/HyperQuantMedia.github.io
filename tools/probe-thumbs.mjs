/* Which YouTube thumbnail files actually exist, per video.
 *
 * The credits page wants the biggest thumbnail it can get -- maxresdefault is
 * 1280x720 against hqdefault's 480x360, and the boxes it lands in run to 474px,
 * so 480 is soft on every phone above 1x. The catch is that maxresdefault is
 * NOT generated for every video: YouTube only produces it when the source was
 * uploaded at 720p or better, and it 404s otherwise. sddefault (640x480) has
 * the same "usually but not always" property on older uploads.
 *
 * A srcset candidate that 404s is a BROKEN IMAGE, not a fallback -- the browser
 * does not try the next candidate down. So the existence question has to be
 * settled before the markup is written, which is what this does: HEAD every
 * candidate once, record the answer, commit it.
 *
 * The result is committed rather than fetched at build time on purpose. The
 * build must not depend on i.ytimg.com being up or on the CI runner having
 * egress, and a deploy must not be able to silently change what the page ships
 * because a request timed out. Re-run this by hand (`npm run probe:thumbs`)
 * when a video id is added or a trailer is replaced; the diff is the review.
 *
 * A 200 alone is not proof. YouTube answers some missing thumbnails with a
 * small grey placeholder rather than a 404, so anything under MIN_BYTES is
 * treated as absent.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { credits } from '../src/data/credits.js';

const OUT = new URL('../src/data/thumb-variants.json', import.meta.url);
const CANDIDATES = [
  ['sd', 'sddefault.jpg'],
  ['max', 'maxresdefault.jpg'],
];
/* The grey placeholder is a couple of KB; a real 640 or 1280 thumbnail is tens
   of KB at minimum. 6 KB sits well clear of both. */
const MIN_BYTES = 6144;

const ids = [...new Set(credits.filter((c) => c.video).map((c) => c.video))];
if (!ids.length) {
  console.error('No video ids in credits.js — nothing to probe.');
  process.exit(1);
}

async function probe(id, file) {
  const url = `https://i.ytimg.com/vi/${id}/${file}`;
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!res.ok) return { ok: false, why: `HTTP ${res.status}` };
    const len = Number(res.headers.get('content-length') || 0);
    if (len && len < MIN_BYTES) return { ok: false, why: `${len}b placeholder` };
    return { ok: true, why: `${len || '?'}b` };
  } catch (e) {
    /* A network failure is NOT an absent thumbnail. Fail loud rather than
       quietly writing "no maxres" for the whole list because the wifi blipped. */
    return { ok: null, why: e.message };
  }
}

const out = {};
let errors = 0;
for (const id of ids) {
  const row = {};
  const notes = [];
  for (const [key, file] of CANDIDATES) {
    const r = await probe(id, file);
    if (r.ok === null) { errors++; notes.push(`${key}: ERROR ${r.why}`); continue; }
    if (r.ok) row[key] = true;
    notes.push(`${key}: ${r.ok ? 'yes' : 'no'} (${r.why})`);
  }
  out[id] = row;
  console.log(`${id}  ${notes.join('  ')}`);
}

if (errors) {
  console.error(`\n${errors} probe(s) failed on the network. Not writing — rerun.`);
  process.exit(1);
}

/* Sorted so the committed file has a stable diff whatever order credits.js is in. */
const sorted = Object.fromEntries(Object.keys(out).sort().map((k) => [k, out[k]]));
writeFileSync(OUT, JSON.stringify(sorted, null, 2) + '\n');

const max = Object.values(sorted).filter((v) => v.max).length;
const sd = Object.values(sorted).filter((v) => v.sd).length;
console.log(`\n${ids.length} videos — ${max} with maxresdefault, ${sd} with sddefault`);
console.log(`wrote ${OUT.pathname.split('/').pop()}`);
