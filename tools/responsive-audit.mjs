/* Headless responsive / cross-engine audit for this site.
 *
 * The companion to tools/devview.html. devview is for looking: you scan a wall
 * of live viewports and spot what is wrong. This is for asserting: it walks
 * every page at every profile, measures the things that break, and exits
 * non-zero when it finds one — so it can gate a commit, not just inform a
 * glance.
 *
 * What it checks, per page per profile:
 *
 *   - horizontal overflow, and which element is causing it
 *   - tap targets under 24 CSS px on phone-class widths (WCAG 2.5.8)
 *   - the fixed header is fully opaque (no translucent bar over live content)
 *   - the header clears the status-bar inset, when the page opts into
 *     drawing behind it with viewport-fit=cover
 *   - the navbar collapses below 992px and expands above it
 *   - the OPEN collapse menu is readable: opaque ground, and either it fits
 *     the viewport or it scrolls
 *   - any request to a host other than the one under test (the guard that keeps
 *     a vendored dependency from quietly becoming a CDN dependency again)
 *   - uncaught script errors, console errors, and every request that failed or
 *     answered 4xx/5xx, reported WITH its URL (Vite's HMR chatter is filtered,
 *     and the /404 page's own 404 status is not treated as a fault)
 *
 * Usage
 *
 *   npm run audit                       # dark theme, chromium, every page
 *   npm run audit -- --light            # light theme
 *   npm run audit -- --both             # both themes
 *   npm run audit -- --pages home,cosmos   # a subset (bare names; 'home' is /)
 *   npm run audit -- --group phone      # phone | tablet | desktop | edges | all
 *   npm run audit -- --shots            # also write screenshots
 *   npm run audit -- --url http://127.0.0.1:4321
 *   npm run audit -- --engines chromium,webkit,firefox
 *   npm run audit -- --allow-third-party  # skip the off-origin request guard
 *
 * Engines
 *
 *   Chromium only by default, because that browser build is already cached
 *   locally. WebKit is what actually catches iOS Safari behaviour and is worth
 *   adding — but installing it downloads a browser into a machine-wide cache
 *   outside this workspace, so this script never does it for you. Ask for the
 *   engine and, if it is missing, it prints the one command to run.
 *
 * The dev server must already be running (npm run dev). Auditing the built
 * output instead is closer to production: npm run build && npm run preview,
 * then point --url at that.
 */

import { chromium, firefox, webkit, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { ALL, PATHS, PHONE_MAX, NAV_COLLAPSE_BELOW } from './devices.mjs';

/* ── Arguments ─────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const flag = (name) => argv.includes('--' + name);
const value = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const base = value('url', 'http://127.0.0.1:4321').replace(/\/$/, '');
const themes = flag('both') ? ['dark', 'light'] : [flag('light') ? 'light' : 'dark'];
/* Entries may be written with or without the leading slash, and 'home'
 * means '/'. That is not sugar: a bare '/' argument is rewritten to a
 * Windows path by MSYS shells (Git Bash), so `--pages home,cosmos` is the
 * form that survives every shell. */
const normalisePath = (raw) => {
  const t = raw.trim();
  if (!t || t === 'home' || t === '/') return '/';
  return t.startsWith('/') ? t : '/' + t;
};
const pages = value('pages', '')
  ? value('pages').split(',').map(normalisePath)
  : PATHS;
const group = value('group', 'device');   // 'device' = phone+tablet+desktop, no edges
const engineNames = value('engines', 'chromium').split(',').map((s) => s.trim());
const wantShots = flag('shots');

const profiles = ALL.filter((d) => {
  if (group === 'all') return true;
  if (group === 'device') return d.g !== 'edges';
  return d.g === group;
});

if (!profiles.length) {
  console.error(`No profiles match --group ${group}. Use phone | tablet | desktop | edges | device | all.`);
  process.exit(2);
}

const checkThirdParty = !flag('allow-third-party');
let baseHost = '';
try { baseHost = new URL(base).host; } catch (e) { /* reported on first goto */ }

/* Hosts a page is *meant* to reach at runtime. Everything else is a finding.
 *
 * The test this list encodes is not "is it third-party" but "can losing it
 * break the page". Bootstrap and three.js failed that test — one dropped
 * request took out `d-none` and the collapse plugin — so they were vendored.
 * What is left either cannot affect layout or cannot be vendored at all:
 *
 *   cloud.umami.is    the analytics tag, gated on a website id in
 *   gateway.umami.is  src/data/site.js; its beacon host. Nothing renders from
 *                     it, and emptying the id stops both requests entirely.
 *   i.ytimg.com       trailer thumbnails on the Star Chart. Vendoring would
 *                     mean committing YouTube's own artwork and watching it go
 *                     stale; the <img> carries explicit width/height and sits
 *                     under the play glyph, so a failed fetch costs a picture
 *                     and holds the layout.
 *
 * www.youtube-nocookie.com is deliberately ABSENT: the lite embed builds that
 * iframe on a click, so it must never appear in an untouched page load, and if
 * it does that is a finding worth seeing. */
const THIRD_PARTY_ALLOWED = ['cloud.umami.is', 'gateway.umami.is', 'i.ytimg.com'];

const ENGINES = { chromium, firefox, webkit };
const shotDir = path.join(import.meta.dirname, '..', 'scratchpad', 'audit');
if (wantShots) await mkdir(shotDir, { recursive: true });

/* ── The in-page measurement ───────────────────────────────────
 * One evaluate per page load. Everything it needs to know about the
 * viewport it reads from the page itself, so the same function serves a real
 * device descriptor and a bare width. */
function measure({ inset, phoneMax, navCollapseBelow }) {
  const vw = window.innerWidth;
  const doc = document;
  const label = (n) => {
    const id = n.id ? '#' + n.id : '';
    const cls = typeof n.className === 'string' && n.className.trim()
      ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return n.tagName.toLowerCase() + id + cls;
  };

  // Horizontal overflow, named.
  const wide = [];
  doc.querySelectorAll('body *').forEach((n) => {
    const r = n.getBoundingClientRect();
    if (r.height <= 0) return;
    if (r.right > vw + 1 || r.left < -1) {
      wide.push(`${label(n)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
    }
  });

  // Tap targets, phone widths only.
  const small = [];
  if (vw <= phoneMax) {
    doc.querySelectorAll('a[href], button, input, select, textarea, [role="button"]').forEach((n) => {
      const r = n.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const p = n.parentElement;
      // WCAG 2.5.8 exempts a link inline in running prose.
      if (p && /^(P|LI|SPAN|EM|STRONG)$/.test(p.tagName) && p.textContent.trim() !== n.textContent.trim()) return;
      if (r.width < 24 || r.height < 24) {
        const name = (n.getAttribute('aria-label') || n.textContent || '').trim().slice(0, 22);
        small.push(`${label(n)} "${name}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });
  }

  // The fixed header.
  const nav = doc.getElementById('mainNav');
  let navBg = null, navOpaque = null, navTop = null, navBottom = null;
  if (nav) {
    const cs = getComputedStyle(nav);
    navBg = cs.backgroundColor;
    const m = navBg.match(/rgba?\(([^)]+)\)/);
    const parts = m ? m[1].split(',').map((s) => parseFloat(s)) : [];
    navOpaque = parts.length < 4 || parts[3] >= 0.999;
    const r = nav.getBoundingClientRect();
    navTop = Math.round(r.top);
    navBottom = Math.round(r.bottom);
  }

  /* Does the bar clear the status bar / notch band?
   *
   * Only meaningful when the page opts into drawing behind the system UI with
   * `viewport-fit=cover`. Without it the browser hands the page a viewport
   * that already starts below the notch, so a bar at y=0 is not under
   * anything -- checking unconditionally flags every notched phone forever. */
  const vpMeta = doc.querySelector('meta[name="viewport"]');
  const coversInset = !!vpMeta && /viewport-fit\s*=\s*cover/.test(vpMeta.content || '');
  const underInset = nav && inset && coversInset ? Math.max(0, inset - navTop) : 0;

  // Collapse mode.
  const toggler = doc.querySelector('.navbar-toggler');
  const desktopSocial = doc.querySelector('.brand-social.d-lg-flex');
  const visible = (n) => !!n && n.getBoundingClientRect().height > 0;
  const expectCollapsed = vw < navCollapseBelow;

  return {
    vw,
    overflow: Math.max(0, doc.documentElement.scrollWidth - vw),
    wide: [...new Set(wide)].slice(0, 6),
    small: [...new Set(small)].slice(0, 8),
    navBg, navOpaque, navTop, navBottom, underInset, coversInset,
    togglerVisible: visible(toggler),
    desktopSocialVisible: visible(desktopSocial),
    expectCollapsed,
    navModeOk: visible(toggler) === expectCollapsed && visible(desktopSocial) === !expectCollapsed,
  };
}

/* The open collapse menu, checked separately because it needs a click. */
function measureMenu() {
  const nav = document.getElementById('mainNav');
  const menu = document.getElementById('navbarNav');
  if (!nav || !menu) return null;
  const ncs = getComputedStyle(nav);
  const mcs = getComputedStyle(menu);
  const nb = nav.getBoundingClientRect();
  const m = ncs.backgroundColor.match(/rgba?\(([^)]+)\)/);
  const parts = m ? m[1].split(',').map((s) => parseFloat(s)) : [];
  return {
    open: menu.classList.contains('show'),
    navOpaque: parts.length < 4 || parts[3] >= 0.999,
    navBg: ncs.backgroundColor,
    navBottom: Math.round(nb.bottom),
    innerHeight: window.innerHeight,
    scrollable: /(auto|scroll)/.test(mcs.overflowY),
    clipped: menu.scrollHeight > menu.clientHeight + 1,
  };
}

/* ── Run ───────────────────────────────────────────────────── */
const findings = [];
/* Collected across the whole run, not per page: one off-origin host is one
 * finding however many pages and profiles asked for it. */
const thirdParty = new Set();
let checks = 0;

for (const engineName of engineNames) {
  const engine = ENGINES[engineName];
  if (!engine) {
    console.error(`Unknown engine "${engineName}". Use chromium, firefox or webkit.`);
    process.exit(2);
  }

  let browser;
  try {
    browser = await engine.launch();
  } catch (err) {
    // Almost always a missing browser build. Say what to run; do not run it —
    // the download lands in a machine-wide cache outside this workspace.
    console.error(`\n[${engineName}] could not launch.`);
    console.error(`  ${String(err).split('\n')[0]}`);
    console.error(`  If the browser build is missing, install it yourself with:`);
    console.error(`      npx playwright install ${engineName}`);
    console.error(`  (that writes into the shared Playwright cache, not into this repo)\n`);
    process.exitCode = 2;
    continue;
  }

  for (const theme of themes) {
    for (const prof of profiles) {
      // A real device descriptor where one exists (true user-agent, device
      // pixel ratio, touch); a plain viewport otherwise.
      const descriptor = prof.pw && devices[prof.pw] ? devices[prof.pw] : null;
      const ctxOpts = descriptor
        ? { ...descriptor, colorScheme: theme }
        : {
            viewport: { width: prof.w, height: prof.h },
            isMobile: prof.w <= PHONE_MAX,
            hasTouch: prof.w <= PHONE_MAX,
            colorScheme: theme,
          };
      if (prof.pw && !devices[prof.pw]) {
        findings.push(`${engineName}/${theme}/${prof.n}: playwright has no device descriptor "${prof.pw}" — audited as a plain viewport`);
      }
      // WebKit and Firefox reject isMobile; only Chromium implements it.
      if (engineName !== 'chromium') delete ctxOpts.isMobile;

      const ctx = await browser.newContext(ctxOpts);
      const page = await ctx.newPage();
      /* Failures are collected per page load, and a bare "500" is useless --
       * the URL is the whole finding. Chromium's console line for a failed
       * subresource omits it, so responses and failed requests are watched
       * directly and the console is used only for what the page's own scripts
       * actually say.
       *
       * `current` is the path being loaded, so the /404 page's own 404 status
       * (which is correct, not a fault) can be told apart from a 404 on
       * something a page asked for. */
      const scriptErrors = [];
      let current = '/';

      /* Vite's HMR client is dev-server plumbing, not the site. It goes noisy
       * whenever the server restarts under a parallel run and says nothing
       * about the page. Nothing from the site's own scripts is suppressed. */
      const isDevServerNoise = (text) =>
        /\[vite\]|__vite|vite-hmr|\/@vite\/|\?token=|Failed to send error to Vite server/.test(text);

      page.on('pageerror', (e) => {
        const line = String(e).split('\n')[0].slice(0, 200);
        if (!isDevServerNoise(line)) scriptErrors.push(line);
      });
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        const text = m.text();
        if (isDevServerNoise(text)) return;
        // Chromium's generic subresource line carries no URL; the response
        // handler below reports those with one, so drop the duplicate.
        if (/^Failed to load resource:/.test(text)) return;
        scriptErrors.push('console.error: ' + text.slice(0, 200));
      });
      page.on('response', (res) => {
        if (res.status() < 400) return;
        const url = res.url();
        if (isDevServerNoise(url)) return;
        // The not-found page is *supposed* to answer 404.
        let samePath = false;
        try {
          samePath = new URL(url).pathname.replace(/\/$/, '') === current.replace(/\/$/, '');
        } catch (e) { /* opaque url; treat as a subresource */ }
        if (samePath && res.request().resourceType() === 'document'
            && current === '/404' && res.status() === 404) return;
        scriptErrors.push(`HTTP ${res.status()} ${url}`);
      });
      page.on('requestfailed', (req) => {
        const url = req.url();
        if (isDevServerNoise(url)) return;
        scriptErrors.push(`request failed ${req.failure()?.errorText || '?'} ${url}`);
      });

      /* Third-party runtime dependencies, flagged by default.
       *
       * Bootstrap, three.js and the fonts were vendored into public/vendor/
       * precisely because a CDN can drop a render-critical file and take the
       * layout with it — one audit run caught ERR_CONNECTION_RESET on the
       * jsdelivr Bootstrap CSS and that page lost `d-none` and the collapse
       * plugin entirely. This is the guard that keeps a new one from creeping
       * back in. Pass --allow-third-party to silence it. */
      page.on('request', (req) => {
        if (checkThirdParty === false) return;
        const url = req.url();
        let host;
        try { host = new URL(url).host; } catch (e) { return; }   // data:, blob:
        if (host === baseHost || !host) return;
        if (THIRD_PARTY_ALLOWED.some((h) => host === h || host.endsWith('.' + h))) return;
        thirdParty.add(`${host}${new URL(url).pathname}`);
      });

      let worst = 0, navOk = true, navOpaqueOk = true;

      for (const p of pages) {
        const where = `${engineName}/${theme}/${prof.n} ${p}`;
        scriptErrors.length = 0;
        current = p;

        try {
          await page.goto(base + p, { waitUntil: 'load', timeout: 60000 });
        } catch (err) {
          findings.push(`${where}: navigation failed — ${String(err).split('\n')[0]}`);
          continue;
        }
        await page.waitForTimeout(700);
        checks += 1;

        const r = await page.evaluate(measure, {
          inset: prof.inset || 0, phoneMax: PHONE_MAX, navCollapseBelow: NAV_COLLAPSE_BELOW,
        });

        if (r.overflow > 0) {
          findings.push(`${where}: horizontal overflow ${r.overflow}px — ${r.wide.join(' ; ') || 'source not identified'}`);
          worst = Math.max(worst, r.overflow);
        }
        if (r.small.length) findings.push(`${where}: tap target under 24px — ${r.small.join(' ; ')}`);
        if (r.navOpaque === false) {
          findings.push(`${where}: fixed header is translucent (${r.navBg}) — content reads through the bar`);
          navOpaqueOk = false;
        }
        if (r.underInset > 0) findings.push(`${where}: page uses viewport-fit=cover and the header sits ${r.underInset}px under the status-bar inset`);
        if (!r.navModeOk) {
          findings.push(`${where}: nav mode wrong — toggler=${r.togglerVisible} desktopSocial=${r.desktopSocialVisible}, expected collapsed=${r.expectCollapsed}`);
          navOk = false;
        }
        scriptErrors.forEach((e) => findings.push(`${where}: ${e}`));

        // The open collapse menu, once per profile (the nav is identical on
        // every page, so checking it eight times only repeats itself).
        if (p === pages[0] && r.expectCollapsed) {
          const tog = await page.$('.navbar-toggler');
          if (tog) {
            await tog.click();
            await page.waitForTimeout(600);
            const m = await page.evaluate(measureMenu);
            if (m) {
              if (!m.open) {
                findings.push(`${where}: the toggler did not open the collapse menu`);
              } else {
                if (!m.navOpaque) findings.push(`${where}: open menu ground is translucent (${m.navBg}) — the page shows through the menu`);
                if (m.navBottom > m.innerHeight && !m.scrollable) {
                  findings.push(`${where}: open menu runs ${m.navBottom - m.innerHeight}px past the viewport and cannot scroll`);
                }
                if (m.clipped && !m.scrollable) findings.push(`${where}: open menu content is clipped with no scroll`);
              }
              if (wantShots) {
                await page.screenshot({ path: path.join(shotDir, `${engineName}-${theme}-${prof.n}-menu.png`) });
              }
            }
            await tog.click().catch(() => {});
            await page.waitForTimeout(300);
          }
        }

        if (wantShots && p === pages[0]) {
          await page.screenshot({ path: path.join(shotDir, `${engineName}-${theme}-${prof.n}.png`) });
        }
      }

      const state = [
        worst ? `overflow=${worst}` : 'overflow=0',
        `nav=${navOk ? 'ok' : 'WRONG'}`,
        `header=${navOpaqueOk ? 'opaque' : 'TRANSLUCENT'}`,
      ].join('  ');
      console.log(`${engineName.padEnd(9)} ${theme.padEnd(5)} ${prof.n.padEnd(15)} ${String(prof.w).padStart(4)}px  ${state}`);

      await ctx.close();
    }
  }
  await browser.close();
}

/* ── Report ────────────────────────────────────────────────── */
for (const ref of [...thirdParty].sort()) {
  findings.push(`third-party runtime request: ${ref} — vendor it into public/vendor/ or add the host to THIRD_PARTY_ALLOWED with a reason`);
}

const unique = [...new Set(findings)];
console.log(`\n${checks} page-loads checked across ${engineNames.join('+')} · ${themes.join('+')} · ${profiles.length} profiles`);
if (unique.length) {
  console.log(`\nPROBLEMS (${unique.length}):`);
  unique.forEach((f) => console.log('  ' + f));
  if (wantShots) console.log(`\nScreenshots: ${shotDir}`);
  process.exit(1);
}
console.log('\nClean: no overflow, no undersized tap target, no translucent header, no nav-mode error, no script error.');
if (wantShots) console.log(`Screenshots: ${shotDir}`);
