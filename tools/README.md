# tools — local debug kit

Two halves of one job: seeing the site at every size and platform without
deploying it, and asserting that it holds there. Plus the vendoring scripts,
which are here because the audit is what caught the CDN failure.

Nothing here ships. `devview.html` is served by an `apply: 'serve'` Vite plugin
declared in `astro.config.mjs`, so `astro build` never sees it; `dist/` has no
`devview` in it (checked). The rest are devDependency scripts you run from your
terminal.

| File | What it is |
|---|---|
| `devices.mjs` | The viewport / device / path table. **One** table, read by both halves. |
| `devview.html` | Live harness: a wall of real viewports at `/devview`, dependency-free. |
| `responsive-audit.mjs` | Headless audit across device profiles and engines. Exits non-zero on a finding. |
| `vendor-fonts.mjs` | Re-generates `public/vendor/fonts/` from Google Fonts. |
| `bootstrap-custom.scss` | The Bootstrap import list — **this** is the file you edit. |
| `vendor-bootstrap.mjs` | Compiles it, and refuses to write a build missing a class the site uses. |

---

## 1. Look at it — `devview`

```
npm run devview          # dev server + opens /devview
# or, if a server is already up:
#   http://localhost:4321/devview
```

Every device is a real iframe at its real CSS-pixel width, scaled down only
for presentation — the site genuinely believes it is 320px wide, so media
queries, container queries and layout all behave. Not a resized window.

- **path / theme / zoom** — theme is *forced* into each frame (this works only
  because the harness is served same-origin with the site; over `file://` every
  frame would be cross-origin and the harness would be a wall of pictures).
- **rotate** — swaps width and height on every frame. Phone landscape is where
  the collapsed nav menu gets taller than the viewport.
- **sync scroll** — scroll one frame, all follow proportionally. This is how
  you catch a section that reflows differently halfway down.
- **insets** — paints the status-bar / notch band over phone frames, so
  anything that would tuck under it is visible.
- **audit** — measures every frame in place and opens the findings drawer:
  horizontal overflow (and the element causing it), tap targets under 24px,
  headings colliding with the fixed header, a translucent header, script
  errors. Badges also sit in each frame's caption.
- **edges** — the `edge-575 / 576 / 767 / 768 / 991 / 992 / 1199 / 1200`
  profiles are one pixel either side of this site's own breakpoints. Layouts
  break at a boundary far more often than in the middle of a range.

Keys: `r` rotate · `s` sync · `i` insets · `a` audit · `Esc` close drawer.
The toolbar state lives in the URL, so a layout you are chasing survives a
reload and can be pasted to someone else.

### Cross-engine, for free

The harness is plain HTML with no build step, so **whichever browser you open
it in renders the frames with that browser's engine.** Open `/devview` in
Chrome, in Firefox, and in Safari and you have three real engines, not an
emulation of three.

### Real devices — the part no harness can fake

Touch, momentum scrolling, the iOS URL bar resizing the viewport mid-gesture,
real device pixel ratio, actual paint cost: none of that is emulable. Both
`npm run dev` and `npm run preview` bind every interface, so Astro prints LAN
addresses:

```
Network: http://10.0.0.10:4321/
```

Open that on the phone, on the same Wi-Fi. `/devview` works there too, but the
point is to open the site itself. (Windows Firewall may prompt the first time —
allow node on private networks.)

---

## 2. Assert it — `npm run audit`

Needs a server already running (`npm run dev` in another terminal).

```
npm run audit                            # dark, chromium, every page, device profiles
npm run audit -- --both                  # dark and light
npm run audit -- --group phone           # phone | tablet | desktop | edges | device | all
npm run audit -- --pages home,cosmos     # a subset. bare names; 'home' means /
npm run audit -- --shots                 # write screenshots to scratchpad/audit/
npm run audit -- --url http://127.0.0.1:4321
npm run audit -- --engines chromium,webkit
```

Per page per profile it checks: horizontal overflow (naming the offender), tap
targets under 24 CSS px on phone widths (WCAG 2.5.8), the fixed header being
fully opaque, the navbar collapsing below 992px and expanding above, the
**open** collapse menu having an opaque ground and either fitting the viewport
or scrolling, any uncaught error / `console.error`, and every request that
failed or answered 4xx/5xx — reported **with its URL**, because a bare "500" is
not a finding.

It also flags **any request to a host other than the one under test**. That is
the guard that keeps a vendored dependency from quietly becoming a CDN
dependency again (see below). The allowlist and the reasoning for each entry
are at the top of the script; `--allow-third-party` turns the check off.

Where Playwright has a device descriptor (`pw` in `devices.mjs`) the run gets
that device's real user-agent, device pixel ratio and touch flags. Otherwise
the width is emulated.

Exit code is 1 when anything is found, so this can gate a commit.

### Auditing the real build

The dev server is not what visitors get. For the closer check:

```
npm run build
npm run preview           # serves dist/, also LAN-bound
npm run audit -- --url http://localhost:4321
```

### Other engines

Chromium only by default, because that browser build is already in the local
Playwright cache. **WebKit is the one worth adding** — it is what catches iOS
Safari behaviour, and Safari is where `backdrop-filter`, `svh`, sticky
positioning and viewport units diverge.

The script will not install it for you: that download lands in a machine-wide
cache outside this workspace, which is your call to make, not a script's. Ask
for the engine and it prints the command if the build is missing:

```
npx playwright install webkit
npm run audit -- --engines chromium,webkit
```

---

## 3. Vendoring — `npm run vendor`

The fonts and Bootstrap are served from this origin, out of `public/vendor/`,
and the files are committed. They used to load from jsDelivr and Google at
runtime.

That changed for a measured reason, not a principle: an audit run caught
`ERR_CONNECTION_RESET` on the jsDelivr Bootstrap CSS, and **that page lost
`d-none` and the collapse plugin entirely** — the desktop social row rendered
at 480px and the hamburger was inert. A page must not be able to fail for a
reason outside this repo.

```
npm run vendor              # both of the below
npm run vendor:fonts        # Space Grotesk, Space Mono, JetBrains Mono, Inter
npm run vendor:bootstrap    # compile tools/bootstrap-custom.scss
```

### Fonts

`latin` and `latin-ext` only; cyrillic, greek and vietnamese are dropped (the
site is English, and latin-ext carries the Western European accents). 12 woff2
files, ~337 KB, from 30 `@font-face` blocks — Google hands the same variable
file to every requested weight. The blocks are kept verbatim except for the
URL, so weight ranges and unicode-ranges stay Google's rather than being
guessed here.

`public/vendor/fonts/fonts.css` is **generated**. Do not hand-edit it. The css2
endpoint negotiates format on the user-agent, so the script sends a current
Chrome UA; without one you get ttf.

### Bootstrap — a custom build, not the prebuilt bundle

Playwright CSS coverage measured the stock `bootstrap.min.css` at **4.8% used**
across all nine pages (desktop and mobile, nav opened). The other 216 KB was
the utility and component matrix the site never touches — and GitHub Pages caps
every asset at `max-age=600`, even content-hashed ones, so it was re-downloaded
every ten minutes of browsing.

`bootstrap-custom.scss` imports only Reboot, containers, the grid, nav, navbar,
transitions, two helpers, and the eighteen utility families the markup actually
uses. **232.8 KB → 67.4 KB raw; 30.7 → 10.1 KB gzipped.**

Hand-writing those classes instead would have been the wrong risk. Reboot is
doing load-bearing work that `style.css` has grown around — global
`box-sizing`, heading and list margin resets, form normalisation — and coverage
cannot warn you about those dependencies, because Reboot's rules *do* count as
used. Generating from source keeps identical class semantics and keeps Reboot.

**Adding a Bootstrap class to a page means adding it here too.** Trimming
`$utilities` is silent: drop the wrong family and `mt-4` simply stops existing,
the page shifts a few pixels, and nothing errors. So `vendor-bootstrap.mjs`
reads every class token out of `dist/**/*.html`, works out which ones Bootstrap
owns, and refuses to write a build that is missing any of them — by name. Run
`npm run build` first so there is a `dist/` to check against.

Bootstrap's **JavaScript is gone entirely.** The only plugin in use was
Collapse, driving the navbar toggler — 23.7 KB gzipped for a class swap and a
height transition. `public/js/app.js` does it directly now, against the same
`.collapse` / `.collapsing` / `.show` classes the CSS build still provides, and
adds the `aria-expanded` / `aria-controls` wiring Bootstrap used to do at
runtime plus Escape-to-close. The audit's open-menu check covers it on every
phone profile.

### three.js is no longer vendored either

It comes from npm (`three@0.158.0`, pinned exact) and is bundled by Astro, so
Vite tree-shakes it. `src/scripts/scene.js` imports the 15 symbols the scene
uses by name; the prebuilt UMD bundle shipped all of it. **169.3 KB → 114.2 KB
gzipped**, and Base.astro dynamically imports the module on
`requestIdleCallback` so none of it is on the critical path. Nothing is lost
visually: `#siteCanvas` starts at `opacity: 0` and fades in over 1.2s once the
scene marks itself live, with a static CSS star wash underneath until then.

### Still third-party, and why

The Umami analytics tag (nothing renders from it; empty the website id in
`src/data/site.js` and it stops being requested at all) and the `i.ytimg.com`
trailer thumbnails on the Star Chart (vendoring means committing YouTube's
artwork and watching it go stale; the `<img>` has explicit width/height under
the play glyph, so a failed fetch costs a picture and holds the layout).
`www.youtube-nocookie.com` is *not* allowlisted on purpose — the lite embed
builds that iframe on a click, so seeing it in an untouched page load would be
a real finding.

---

## Provenance

Built 2026-08-27, replacing a pile of one-off Playwright scripts that lived in
`F:\Git\Scratchpad\wix-archive` (`responsive-audit.mjs`, `nav-check.mjs`,
`find-overflow.mjs`, `check2..9.mjs`). Those were written per question and
thrown away; the checks they encoded are now in one script with one device
table, in the repo they serve.

Playwright is pinned exactly (`1.62.1`) so the already-cached Chromium build is
reused rather than triggering a fresh browser download on install. Bumping it
will very likely want a new browser build. `bootstrap` and `three` are pinned
exact too: they are build inputs whose output is committed, so a floating range
would mean the committed file and the declared version could disagree.

`tools/vendor-libs.mjs` existed briefly to download the prebuilt Bootstrap and
three.js bundles. Both now come from source, so it is gone.
