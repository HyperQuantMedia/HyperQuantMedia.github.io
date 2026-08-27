/* The device / viewport / path table, defined once.
 *
 * Both halves of the local debug kit read this file:
 *
 *   - tools/devview.html      imports it as a module (the dev server serves it
 *                             at /devview/devices.mjs)
 *   - tools/responsive-audit  imports it directly from node
 *
 * Keeping one table is the point. A harness that shows nine viewports while
 * the headless audit checks a different seven is a harness that lies.
 *
 * Widths are CSS pixels, which is what layout responds to. `pw` names the
 * Playwright device descriptor to use when one exists, so the headless run
 * gets the real user-agent, device pixel ratio and touch flags rather than a
 * bare resized window. A profile with no `pw` is emulated from its width.
 *
 * `inset` is the status-bar / notch band in CSS px. devview paints it as an
 * overlay so anything that would hide under it is visible; the audit uses it
 * to check the fixed header clears it.
 */

export const DEVICES = [
  // ── Phones ────────────────────────────────────────────────
  { g: 'phone', n: 'small-320',      w: 320,  h: 568,  inset: 20, note: 'smallest width still in the wild' },
  { g: 'phone', n: 'iphone-se',      w: 375,  h: 667,  inset: 20, pw: 'iPhone SE' },
  { g: 'phone', n: 'iphone-13',      w: 390,  h: 844,  inset: 47, pw: 'iPhone 13', on: true },
  { g: 'phone', n: 'iphone-15-pro',  w: 393,  h: 852,  inset: 59, pw: 'iPhone 15 Pro' },
  { g: 'phone', n: 'pixel-7',        w: 412,  h: 915,  inset: 40, pw: 'Pixel 7', on: true },
  { g: 'phone', n: 'iphone-max',     w: 430,  h: 932,  inset: 59, pw: 'iPhone 15 Pro Max' },
  { g: 'phone', n: 'galaxy-s24u',    w: 480,  h: 1068, inset: 40 },

  // ── Tablets ───────────────────────────────────────────────
  { g: 'tablet', n: 'ipad-mini',     w: 744,  h: 1133, inset: 24, pw: 'iPad Mini' },
  { g: 'tablet', n: 'ipad-10.9',     w: 820,  h: 1180, inset: 24, on: true },
  { g: 'tablet', n: 'ipad-pro-11',   w: 834,  h: 1194, inset: 24, pw: 'iPad Pro 11' },
  { g: 'tablet', n: 'ipad-pro-12.9', w: 1024, h: 1366, inset: 24 },

  // ── Desktop ───────────────────────────────────────────────
  { g: 'desktop', n: 'laptop-1280',  w: 1280, h: 800,  inset: 0, on: true },
  { g: 'desktop', n: 'laptop-1366',  w: 1366, h: 768,  inset: 0 },
  { g: 'desktop', n: 'macbook-1512', w: 1512, h: 982,  inset: 0 },
  { g: 'desktop', n: 'desktop-1920', w: 1920, h: 1080, inset: 0, on: true },
  { g: 'desktop', n: 'qhd-2560',     w: 2560, h: 1440, inset: 0 },
  { g: 'desktop', n: 'ultrawide',    w: 3440, h: 1440, inset: 0 },
];

/* Breakpoint edges. Layouts break at a boundary far more often than in the
 * middle of a range, and these are this site's own boundaries: Bootstrap's lg
 * (992) is where the navbar collapses into the toggler, and style.css also
 * branches at 576 / 768 / 992 / 1200. One pixel either side of each. */
export const EDGE_WIDTHS = [575, 576, 767, 768, 991, 992, 1199, 1200];

export const EDGES = EDGE_WIDTHS.map((w) => ({
  g: 'edges', n: 'edge-' + w, w, h: 900, inset: 0,
}));

export const ALL = DEVICES.concat(EDGES);

/* Every route the site serves. /404 is included deliberately -- it carries its
 * own script (js/lost.js) and is the page least likely to get looked at. */
export const PATHS = [
  '/', '/vision', '/services', '/cosmos', '/studio', '/credits',
  '/compendium', '/contact', '/404',
];

/* Phone-class widths. Below this, tap-target and collapsed-nav checks apply. */
export const PHONE_MAX = 500;

/* The width at which the navbar is expected to collapse into the toggler.
 * Bootstrap's lg breakpoint, mirrored from .navbar-expand-lg in Nav.astro. */
export const NAV_COLLAPSE_BELOW = 992;
