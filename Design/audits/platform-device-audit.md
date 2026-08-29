# Platform & Device Audit — blind adversarial pass

**Pass:** whole-website experience across platforms, devices, input methods, and capability degradation.
**Date:** 2026-08-29.
**Build tested:** commit `832c82d` ("stop rendering the Liked/Watching chips"), `npm run build` → `dist/`, served by `astro preview` at `127.0.0.1:4321`. All dynamic tests ran against the **built output**, not the dev server.
**Harness:** Playwright 1.62.1 — Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5 (all headless). Headless Chromium renders WebGL through SwiftShader (software), which makes its numbers a fair proxy for machines with blocklisted or weak GPUs.
**Blindness:** `WAYPOINT.md` and everything under `Design/` were not read. Source, `tools/`, config, and git log were.

**What was actually measured** (real browsers, numbers below): layout at 17 viewports × 9 pages × content-clipping pass; JS-disabled rendering; a 28-navigation client-router soak with listener/heap instrumentation; WebGL-blocked behaviour; FPS with and without the starfield at 1×/6×/10×/20× CPU throttle; `prefers-reduced-motion` behaviour incl. the 404 game and anchor scrolling; forced-colors (Windows High Contrast) rendering; print-media computed styles (system theme and stored-dark); slow-3G load timing and page weight; Firefox/WebKit smoke across all pages; tap-target sizes on Pixel 7 emulation; phone-landscape (844×390) menu; keyboard tab walk and focus indicators; anchor/hash/focus behaviour; year-rail occlusion with hit-testing; DPR 2.625 canvas backing; localStorage-blocked theme behaviour; 404 fallback; redirect pages.

**What is reasoned, not measured** (no real hardware available): everything specific to real iOS Safari (zoom-on-input-focus, autoplay policy, URL-bar/vh dynamics on device), real screen readers (VoiceOver/TalkBack/NVDA), pre-2020 browsers, real battery-saver/thermal behaviour, and real print dialogs. Each such finding is marked **reasoned, not measured**.

---

## Executive summary

1. **The site has a single point of failure: `js/app.js`.** If JavaScript is off, blocked, stripped by a proxy, fails to load on a flaky connection, or fails to *parse* (the file ships optional chaining as a classic script, a hard syntax error on pre-2020 browsers), then 58–90% of the visible text on six of nine pages is permanently invisible (`.fade-in-*` rests at `opacity: 0` and only JS ever reveals it), the hamburger menu is dead below 992px, and the theme toggle and all filters are inert. This is the finding that matters most; everything else is smaller. (PD-01)
2. **On common laptop windows (1200–1260px and 1400–1443px wide) the Credits year rail sits on top of the third column of cards and steals their clicks.** Measured 33px of occlusion at 1200 and 23px at 1400; hit-testing confirms the rail intercepts pointer events over card content. (PD-02)
3. **The starfield never throttles itself.** On a weak-CPU profile (10× throttle, software GL) it drags the page from ~59fps to 37fps with 69 long frames in 3s, on every page, forever. There is no FPS floor, no pause-when-weak, no `saveData`/battery heuristic — only `prefers-reduced-motion` (which is handled well) and tab-hidden (also handled well). (PD-03)
4. **Client-side navigation leaks listeners**: every page swap adds one `document` click listener, one `document` keydown listener, and one MediaQueryList listener that are never removed (28 navigations → 4→32 click, 2→30 keydown, 2→30 MQL). Heap stays flat; the cost is per-event work and slow degradation in long sessions. (PD-04)
5. **Reduced-motion users still get animated scrolling** for every in-page anchor (year rail, constellation stars): measured smooth interpolation over ~800ms under `prefers-reduced-motion: reduce`. (PD-05)
6. **Printing is broken in three independent ways**: sections not yet scrolled into view print as blank space (`opacity: 0` carries into print); a visitor with a stored dark theme prints near-white text (backgrounds are stripped by default print settings); the fixed navbar overlays every printed page. (PD-06)
7. Below those: anchors never update the URL or move focus (PD-07), the Studio pull-quote is invisible on browsers older than ~Feb 2023 due to `color-mix` inside a `@supports` block that doesn't test for it (PD-08), and the Compendium search input's 13.6px font will trigger iOS Safari's zoom-on-focus (PD-09).

The good news is real and worth stating: **no horizontal overflow or clipped content at any width from 320 to 3440 in any of the three engines; zero console/page errors in Firefox and WebKit across all nine pages; WebGL-blocked degrades cleanly to the CSS star wash; the rAF loop provably stops in hidden tabs; slow-3G first paint is 2.6s with ~350KB total; forced-colors mode renders fully legibly; the phone-landscape menu caps and scrolls correctly; Escape closes the menu and returns focus.** The team's own gate (`tools/responsive-audit.mjs`) covers overflow, tap targets, header opacity, collapse behaviour, and third-party requests — every finding below is in a dimension that gate does not measure by construction: no-JS rendering, time (leaks, animation cost), reduced-motion behaviour of JS scrolling, print, occlusion by fixed elements, URL/focus state, and old-browser syntax floors.

---

## Findings

### PD-01 — All `.fade-in-*` content is invisible unless `app.js` runs — and `app.js` has no old-browser floor
**Severity: Critical** (for the no-JS / JS-failed / old-browser visitor; the page is otherwise a normal marketing site that should degrade to static HTML)
**Platforms:** any visitor with JS disabled or blocked (privacy tools, corporate proxies, Lynx-class agents), any visitor whose `app.js` request fails mid-page-load, and **every pre-2020 browser** (iOS Safari ≤ 13.0, Chrome ≤ 79, old Android WebView), where the script dies at parse time.
**Cause:**
- `src/styles/style.css:3429` — `.fade-in-up, .fade-in-left, .fade-in-right { opacity: 0; … }` with reveal only via `public/js/app.js:375-388` (IntersectionObserver adds `.visible`). There is **no `<noscript>` rule anywhere in `src/`** (grep-verified) and no CSS-only fallback.
- `public/js/app.js:116,141,155,442,443,465` — optional chaining (`?.`) in a **classic** (non-module) script. A browser that predates the syntax throws `SyntaxError` for the whole file: reveal, navbar collapse, theme toggle, filters, smooth scroll — all gone at once.
- The hamburger (`.navbar-collapse`, hidden below 992px) is driven solely by this script; the theme toggles and Compendium search are also dead without it.
**Measured:** Chromium context with `javaScriptEnabled: false`, 390×844, all pages. Share of body text characters inside permanently-invisible blocks: **/services 90% (4430/4925), /cosmos 87%, /studio 86%, /vision 85%, / 71%, /contact 58%**; /compendium 8%, /credits 3%. `#navbarNav` computed `display: none`; both theme toggles present but inert.
**Repro:** disable JavaScript, open `/services/`. Hero renders; almost everything below it is blank. On a phone width the top navigation cannot be opened at all (footer links are the only navigation).
**Impact:** a visitor in this state sees a header, a hero, and acres of nothing, and on a phone cannot navigate from the top of the page. Note the pre-2020-browser case is **reasoned, not measured** (no such engine available), but the parse failure is deterministic from the shipped syntax; the JS-off case is fully measured.

### PD-02 — Credits year rail overlays the card grid and steals clicks at 1200–1260px and 1400–1443px
**Severity: High**
**Platforms:** desktop/laptop windows in two very common width bands (1200–1260 includes half-snapped 2560 monitors and many small laptops; 1400–1443 includes 1440×900 windows minus scrollbar and near-1400 sizes). Not visible at 1280, 1366, 1512, or 1920 — which are the widths in the project's own device table.
**Cause:** `src/styles/style.css:3090-3101` — `.year-rail { position: fixed; right: 22px; z-index: 900; }`, shown from `min-width: 1200px`, while the Bootstrap container is 1140px wide at 1200 (30px side margin < rail width) and 1320px at 1400 (40px margin < rail width).
**Measured (Chromium):** rail-left vs grid-right: **1200px → 33px overlap; 1400px → 23px overlap; 1440px → 3px**; 1280/1366/1500/1600/1920 → clear. `document.elementFromPoint()` inside the overlap returns `year-rail-link`, i.e. the rail intercepts clicks aimed at card content (platform tags, trailer buttons sit in that band on third-column cards). Screenshot evidence: rail labels rendered on top of a trailer thumbnail at 1200.
**Repro:** open `/credits/` in a 1200×800 window, scroll to any year with 3 cards in a row; the YEARS labels sit on the rightmost card, and clicking the card's right edge navigates to a year anchor instead.
**Impact:** misdirected clicks and text-on-text collision on a page whose whole job is scannable proof of work.

### PD-03 — The starfield costs a weak device its frame rate and never backs off
**Severity: High** (Medium on paper, High because it is every page, all the time, on exactly the hardware least able to afford it)
**Platforms:** low-end Android, older laptops, machines on software WebGL (blocklisted GPU drivers), battery-saver users whose OS does **not** map the setting to `prefers-reduced-motion`.
**Cause:** `src/scripts/scene.js:471-475` — unconditional `requestAnimationFrame` loop; per frame it rewrites the full position buffer, runs the O(n²) link pass, and uploads three geometries (`scene.js:492-584`). There is no FPS measurement, no degradation path (fewer stars, lower tick rate, stop-after-idle), and no `navigator.deviceMemory`/`saveData` gate. `dpr` is capped at 2 (good), and the tab-hidden and reduced-motion paths are genuinely well done — but a struggling foreground tab is neither hidden nor reduced.
**Measured (Chromium headless = SwiftShader WebGL, 390×844, home page):** with scene vs without scene (scene chunk request aborted), same CPU throttle:
- 6× throttle: **58fps / 6 long frames** with scene, 60fps / 0 without.
- 10× throttle: **37fps / 69 frames >33ms in 3s** with scene, **59fps / 4** without.
- 20× throttle: 15fps with scene.
Transfer cost is also real but reasonable: the scene chunk is 471KB raw / **117KB gzip**, deferred to idle (loads at ~8s on emulated slow 3G, after content).
**Repro:** `Emulation.setCPUThrottlingRate 10` on any page; compare scrolling smoothness with `/_astro/scene.*.js` blocked.
**Impact:** on a budget phone the whole site scrolls at two-thirds speed and burns battery for a decorative background, with no way for the visitor to stop it short of the OS-level reduce-motion switch.

### PD-04 — Every client-side navigation leaks one document click listener, one keydown listener, and one MediaQueryList listener
**Severity: Medium**
**Platforms:** all JS-enabled visitors who browse more than a few pages in one session; worst on long sessions and slow CPUs.
**Cause:** `public/js/app.js:361-372` — inside `init()` (which runs on **every** `astro:page-load`): `document.addEventListener('click', …)`, `document.addEventListener('keydown', …)`, and `wideNav.addEventListener('change', …)` on a freshly created `matchMedia` object. `document` and `window` survive the swap; nothing removes the previous bindings. The file's own header states the doctrine ("bind ONCE: listeners on window/document") that these three violate.
**Measured (Chromium, 28 navigations through the navbar):** document `click` listeners 4 → **32**; `keydown` 2 → **30**; MQL listeners 2 → **30**. JS heap flat at 9.5MB after GC (closures are small), zero errors.
**Impact:** functionally idempotent (all 30 keydown handlers do the same submenu-close), so nothing breaks visibly — but every click and keypress on the page runs N duplicate scans after N navigations, and it grows without bound. On the 10×-throttle class of device from PD-03 this compounds.

### PD-05 — `prefers-reduced-motion` users still get ~800ms animated scrolls on every in-page anchor
**Severity: Medium**
**Platforms:** all engines; users who set reduce-motion for vestibular reasons are the audience harmed.
**Cause:** `public/js/app.js:469-481` — the delegated anchor handler calls `target.scrollIntoView({ behavior: 'smooth', block: 'start' })` unconditionally. The CSS override (`style.css:3488-3491`, `html { scroll-behavior: auto }` under reduce) cannot help: an explicit `behavior: 'smooth'` argument wins over CSS. The adjacent back-to-top handler (`app.js:266-269`) checks the media query correctly — the anchor path just doesn't.
**Measured:** Chromium context with `reducedMotion: 'reduce'`, `/credits/`, click last year-rail link: scrollY sampled every 50ms interpolates 0 → 9 → 100 → 273 → 621 → … → 4562 (still moving at 800ms). Identical curve without the preference set.
**Impact:** the exact motion these users opted out of, on the year rail and every constellation-star link.

### PD-06 — Printing: blank sections, and white-on-white for stored-dark visitors
**Severity: Medium**
**Platforms:** anyone printing any page (or saving to PDF) from any browser.
**Cause:** no `@media print` rules exist in `src/styles/style.css` (grep-verified; only Bootstrap's utility stubs ship). Three consequences:
1. `.fade-in-*` blocks that were never scrolled into view carry `opacity: 0` into print. **Measured:** `emulateMedia({media:'print'})` on a freshly loaded `/services/` reports `.fade-in-up` computed opacity `0`.
2. A stored dark theme (`data-theme="dark"` on `<html>`) beats the light `prefers-color-scheme` fallback in print. **Measured:** with `hqm-theme=dark` stored, print-media body color is `rgb(238,241,255)` (near-white) and the background that would justify it is `rgb(4,4,12)` — which default print settings strip. Near-white text on white paper. (The final strip step is the browser's default "no background graphics" behaviour — **reasoned, not measured**; the computed colors are measured.) With no stored theme, Chromium forces the light palette in print and output is fine — measured.
3. `#mainNav` stays `position: fixed` in print media (measured), which repeats/overlays it on printed pages in Chromium's fixed-element handling.
**Impact:** a printed services page for a meeting comes out with blank gaps wherever the visitor didn't scroll, and completely unreadable if they had chosen dark mode.

### PD-07 — In-page anchors never update the URL and never move focus
**Severity: Medium**
**Platforms:** all JS-enabled visitors; keyboard and screen-reader users hardest hit.
**Cause:** `public/js/app.js:469-481` — `e.preventDefault()` then `scrollIntoView`, with no `history.pushState`/`location.hash` update and no `target.focus()`/`tabindex="-1"` management. Applies to the Credits year rail and every star in the Cosmos constellation (`ConstellationField.astro` anchors `href="#slug"`).
**Measured:** after clicking a year-rail link, `location.hash === ""` and `document.activeElement` is still the rail link. Same under reduced motion.
**Impact:** a visitor cannot copy a link to a year or a tool card; Back does not return them to where they were; a screen-reader user who activates "Pulsar" on the constellation scrolls visually but their reading position never moves — the page appears to do nothing.

### PD-08 — Studio pull-quote text is invisible on browsers without `color-mix()` (Safari ≤ 16.1, Chrome ≤ 110, Firefox ≤ 112)
**Severity: Medium** — **reasoned, not measured** (no pre-2023 engine available to run)
**Platforms:** iOS/macOS Safari 15.x–16.1, Chromium 80–110 (old Android WebView is the realistic population), Firefox 74–112.
**Cause:** `src/styles/style.css:1872-1884` — inside `@supports (background-clip: text) or (-webkit-background-clip: text)`, `.belief-quote` sets `color: transparent` and a `background-image` whose middle stop uses `color-mix()`. The `@supports` condition passes on every browser back to ~2016 (`-webkit-background-clip: text` is ancient), but on a browser without `color-mix()` the *gradient declaration alone* is invalid and dropped, while `color: transparent` survives → transparent text over no gradient.
**Repro (reasoned):** open `/studio/` in Safari 16.0. The quotation block renders its star and attribution but no quote text.
**Fix-shaped observation (not a fix):** the hazard is that the `@supports` test and the feature actually used diverge; the hero title's identical technique (`.title-line.title-accent`) is safe because its gradient uses only `var()`.

### PD-09 — Compendium search input is 13.6px: iOS Safari will zoom the page on focus
**Severity: Medium** — font size **measured** (13.6px computed at 390×844); the zoom behaviour itself is **reasoned, not measured** (real iOS required)
**Platforms:** iPhone/iPad Safari.
**Cause:** `src/styles/style.css:3168-3184` — `.comp-search { font-size: 0.85rem; }`. iOS Safari auto-zooms when a focused input's font-size is below 16px, and does not zoom back out on blur.
**Repro (reasoned):** tap the search field on `/compendium/` on an iPhone → viewport zooms ~18%, and stays zoomed after searching, leaving the grid cropped until the visitor pinches out.
**Impact:** the single most interactive control on the largest content page knocks the page out of its layout on the most common mobile browser.

### PD-10 — Browsers without `svh` get an uncapped phone-landscape menu with unreachable links
**Severity: Low-Medium** — **reasoned, not measured** (modern engines all support `svh`; measured behaviour on current engines is correct)
**Platforms:** iOS Safari ≤ 15.3, Chrome/WebView ≤ 107 (2022-era Android).
**Cause:** `src/styles/style.css:671-676` — the only height cap on the open collapse menu is `max-height: 70svh`. A browser that doesn't parse `svh` drops the declaration entirely (no px fallback line precedes it), leaving `overflow-y: auto` with no height limit. The menu lives inside `position: fixed` `#mainNav`, so it cannot scroll with the page: in 844×390 landscape the 8-item menu (~296px + bar ~64px) fits, but with the social row it is tight, and on shorter landscapes (e.g. 736×414 ≈ older phones at 320px-class heights) the bottom items would render off-screen with no way to reach them.
**Measured on current engines (for contrast):** at 844×390 the cap computes to 273px, menu scrolls, last link bottom = 354 < 390. Correct where `svh` exists.

### PD-11 — No skip link, no `<main>` landmark, and the nav's keyboard focus ring is a faint off-brand halo
**Severity: Low-Medium**
**Platforms:** keyboard-only users, switch access, screen readers; every page.
**Cause / evidence:**
- `src/layouts/Base.astro:164-187` — `<body>` goes straight from `<Nav>` to page `<slot>`; no skip link, no `<main>` (measured: 12 tab stops — brand, 4 social links, 7 nav items — before any page content, on every page; with the ClientRouter, focus resets to `<body>` each swap so this tax repeats per page).
- Measured focus styles: `.nav-link` keyboard focus shows `outline: none` with Bootstrap's default `box-shadow: rgba(13,110,253,0.25) 0 0 0 4px` — a 25%-alpha Bootstrap-blue halo on a `#07071a` bar, visually near-invisible and the only place stock Bootstrap blue appears on the site. Custom controls (`.prose-link`, `.lost-canvas`) define proper `:focus-visible` outlines; nav links, filter buttons, and CTAs rely on UA/Bootstrap defaults (CTA gets UA `auto` outline — acceptable).
- The route announcer exists and announces page titles (measured: `.astro-route-announcer` with `aria-live="assertive"`) — good.
**Impact:** tabbing through 12 chrome stops per page with a barely-visible indicator on the seven most-used stops.

### PD-12 — Trailer facades on iOS likely need two taps (autoplay param is ignored)
**Severity: Low** — **reasoned, not measured** (real iOS required)
**Platforms:** iPhone/iPad Safari, Low Power Mode Android in some cases.
**Cause:** `public/js/app.js:154-165` — first tap replaces the thumbnail with a `youtube-nocookie.com/embed/...?autoplay=1&playsinline=1` iframe. iOS Safari's media policy commonly refuses autoplay inside a freshly inserted cross-origin iframe (the user gesture does not propagate into it), so the visitor gets the YouTube player poster and must tap play again.
**Measured half:** the facade works, the iframe is created with the right attributes on tap (verified in Pixel-7 emulation with network blocked).
**Impact:** minor friction ×16 trailers on `/credits/`.

### PD-13 — `theme-color` follows the OS, never the visitor's chosen theme
**Severity: Low**
**Platforms:** Android Chrome (address-bar/task-switcher tint), Safari 15+ tab bar tint.
**Cause:** `src/layouts/Base.astro:60-61` — two `meta name="theme-color"` tags keyed on `prefers-color-scheme` only. A dark-OS visitor who locks the site to light gets a near-black browser bar over a near-white page (and vice versa); nothing updates the meta on toggle or on `astro:after-swap`.
**Repro:** dark-OS Android phone → toggle site to light → browser chrome stays `#07071a` above `#f6f7fb` content.

### PD-14 — With storage blocked, a chosen theme silently reverts on every navigation
**Severity: Low**
**Platforms:** Safari "Block all cookies", Firefox strict + storage partitioning edge cases, some corporate browsers.
**Cause:** the toggle writes `data-theme` and *tries* to persist (`app.js:293-301`, correctly try/caught) — but the ClientRouter swap replaces `<html>` attributes and the restore hook (`Base.astro:81-88`) reads only localStorage, which throws; the catch falls through without re-applying the runtime choice.
**Measured:** Chromium with a throwing `localStorage` property: toggle → `data-theme="dark"`; navigate → `data-theme` gone (default), zero errors.
**Impact:** the theme button appears broken ("it keeps switching back") for exactly the privacy-conscious visitors most likely to also be judging the craft.

### PD-15 — Information that exists only in `title` tooltips never reaches touch, keyboard, or reliably SR users
**Severity: Low**
**Platforms:** all touch devices (no hover = no tooltip), keyboard users.
**Instances:** partner tiles' relation line (`Pedigree.astro` — `title={name — relation}`, `alt` carries the name only); pending platform tags on `/credits/` (`title="No public store link for X yet"` — the *meaning* of the dotted style); Compendium status chips (`title={statusMeaning[status]}`); ⚠ verify markers (`title="Cost tier or platform unconfirmed…"` — mitigated by the visible Independence panel restating it).
**Impact:** a phone visitor sees dotted chips and ⚠ marks whose explanation they can never summon; the pedigree band's "what was their involvement" answer is desktop-hover-only.

### PD-16 — Constellation: links nested inside `role="img"` SVG
**Severity: Note** — **reasoned, not measured** beyond Chromium (which exposes them; verified via ARIA snapshot: all 7 tool links present with names)
**Cause:** `ConstellationField.astro` — the `<svg>` carries `role="img"` + `aria-label`, with seven `<a>` children. Per ARIA, `img` role should flatten descendants to presentational; Chromium chooses to expose them, but VoiceOver/NVDA behaviour for links inside `role="img"` is historically inconsistent — some pairs read the image label and skip the links (the cards below carry the same destinations, so nothing is *unreachable*, merely duplicated or silent).
**Impact:** possible SR confusion; keyboard focus can land on elements that some ATs do not announce.

### PD-17 — Miscellaneous engine/hardware notes (all verified low-impact)
**Severity: Note**
- **DPR cap:** at Pixel-7's real 2.625 DPR the starfield renders at ratio 2.0 (measured: 824px buffer for a 412px canvas) — ~76% of native resolution; slight softness on 3x phones is a deliberate trade and looks acceptable.
- **`scene.js:46`** freezes `isMobile` (star count, antialias, sprite sizes) at first load; a rotation or window resize keeps the stale profile until full reload. Cosmetic.
- **`scene.js:446-459`** calls `renderer.setSize()` on every raw resize event (only `readScroll` is debounced) — on Android the URL-bar collapse fires a resize stream mid-scroll, each reallocating the drawing buffer. Suspected scroll jank contributor on mobile; **reasoned, not measured**.
- **Comet trail** (`comet.js:17`) binds on `(hover: hover) and (pointer: fine)` — true on touchscreen laptops, so a finger drag paints a comet during touch scrolling there. Cosmetic.
- **`offset-path` CTAs**: on engines without `offset-path` (Safari ≤ 15.3), the comet dot sits static at its path origin while its opacity keyframes still blink it. Cosmetic. **Reasoned, not measured.**
- **Hero `min-height: 100vh`** (`style.css:745`) switches to `100svh` only ≤ 767px; an iPad portrait (768–991) keeps `100vh`, which in Safari means the hero's scroll indicator starts below the visible fold by the toolbar's height. Minor. **Reasoned, not measured.**
- **Firefox** gets no styled scrollbar (`::-webkit-scrollbar` only) — default UA scrollbar over the dark page; cosmetic inconsistency.
- **Reader modes**: no `<main>`/`<article>` and heavy `div`/`section` structure; Firefox Reader's readability heuristic may refuse most pages. **Reasoned, not measured.**

### PD-18 — What held up under attack (verified negatives — kept deliberately, so the next pass doesn't re-litigate them)
- **Layout:** 9 pages × 17 viewports (320→3440, incl. 844×390 and 926×428 landscape, 508px split-screen, 640px≈200%-zoom): zero document-level overflow, zero content clipped at the viewport edge (two-stage check, since `html{overflow-x:clip}` hides overflow from `scrollWidth`).
- **Engines:** Firefox 153 and WebKit 26.5 — zero console/page errors across all pages; starfield, client navigation, theme toggle, collapse, `svh` all correct.
- **WebGL blocked:** clean degradation — canvas never fades in, static CSS star wash stays at 0.6 opacity, three.js logs console errors but nothing user-visible breaks.
- **Hidden tab:** rAF callbacks measured at **0** while hidden, resume on visibility. The 404 game additionally stops off-screen via IntersectionObserver and caps catch-up steps.
- **Reduced motion:** CSS animations all stop (`animation: none !important`), starfield renders a static frame (drift is zeroed), 404 game replaces itself with an explanatory line, view-transition fade disabled. (Only the JS anchor scroll violates it — PD-05.)
- **Forced colors (Windows High Contrast):** fully legible, including the gradient-clipped hero title — Chromium repaints it in CanvasText (screenshot evidence).
- **Slow 3G (400ms RTT / 400kbps):** FCP 2.6s, load 5.6s, starfield deferred to 8.0s, ~350KB total for the home page including the scene. Fonts are same-origin, `font-display: swap` on all 30 faces, sane fallback stacks.
- **404:** served with real 404 status + full page; legacy-path redirect pages exist with instant meta refresh.
- **Tap targets:** all controls ≥ 24px (toggler 44×40, theme 34×34, socials 30×30, to-top 40×40); only inline prose links are 20px tall (inline exception applies). Apple's 44pt guideline is not met by the 30–34px chrome controls — noted, not failed.
- **Phone landscape menu:** capped at `70svh`, scrolls, `overscroll-behavior: contain`, Escape closes and returns focus to the toggler.
- **Navigation while scrolled:** scroll position resets instantly (no smooth-scroll crawl) despite `html{scroll-behavior:smooth}`; route announcer announces the new title.
- **Theme flash:** stored theme applies pre-paint inline; measured no flash artefacts in swaps.
- **localStorage unavailable:** no errors thrown anywhere (all access is try/caught); only PD-14's revert.

---

## What the project's own tooling cannot see (by construction)

`tools/responsive-audit.mjs` asserts geometry and hygiene at an instant: overflow, tap targets, header opacity, collapse behaviour, third-party requests, console errors — per page, per profile, freshly loaded, JS on, motion on, screen media. Structurally outside it, and where this pass found its findings:

1. **The no-JS/JS-failed axis** (PD-01) — every check runs with scripts executing.
2. **Time** — anything that only appears across navigations or minutes: listener leaks (PD-04), animation CPU cost under throttle (PD-03).
3. **Behavioural preference emulation** — reduced-motion is honoured in CSS, but only a behavioural test catches JS-driven scrolling (PD-05).
4. **Print media** (PD-06).
5. **Occlusion** — a fixed element covering content produces no overflow and no error (PD-02); its 1200px edge case sits exactly on a width the table includes, and still passes the checks the tool runs there.
6. **URL/focus state** (PD-07) — invisible to any screenshot- or geometry-based check.
7. **Syntax floors** — a parse error in an old engine cannot be seen by any modern-engine run (PD-01's second half, PD-08, PD-10).

## What I could not test, and what would be needed

- **Real iOS Safari** (input zoom PD-09, autoplay PD-12, URL-bar/`vh` dynamics, momentum scroll, tap latency): needs a physical iPhone or a macOS Safari + real-device session. Playwright's WebKit shares the engine but not iOS's UI behaviours or media policy.
- **Real screen readers** (VoiceOver rotor, TalkBack swipe order, NVDA + role="img" links, PD-16): needs manual AT sessions; only Chromium's accessibility tree was inspected.
- **Pre-2023/2020 browsers** (PD-08, PD-01 parse floor, PD-10): needs BrowserStack-class legacy devices; the failures are deterministic from the shipped syntax/feature use but were not executed.
- **Real print dialogs** (PD-06's background-stripping step) across Chrome/Firefox/Safari with default settings.
- **Real low-end hardware and battery/thermal states** (PD-03 was measured via CPU throttling + software GL, a proxy, not a Moto G on battery saver).
- **Foldables' hinge/dual-screen posture APIs** — widths were covered (508–926 tested), posture-specific behaviour was not.
- **The live GitHub Pages deployment** (headers, 404 status at the host, cache behaviour, real CDN latency) — this pass tested the built output locally by design.
