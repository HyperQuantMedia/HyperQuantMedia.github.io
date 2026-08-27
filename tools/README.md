# tools — local debug kit

Two halves of one job: seeing the site at every size and platform without
deploying it, and asserting that it holds there.

Nothing here ships. `devview.html` is served by an `apply: 'serve'` Vite plugin
declared in `astro.config.mjs`, so `astro build` never sees it; `dist/` has no
`devview` in it (checked). The rest are devDependency scripts you run from your
terminal.

| File | What it is |
|---|---|
| `devices.mjs` | The viewport / device / path table. **One** table, read by both halves. |
| `devview.html` | Live harness: a wall of real viewports at `/devview`, dependency-free. |
| `responsive-audit.mjs` | Headless audit across device profiles and engines. Exits non-zero on a finding. |

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

## Provenance

Built 2026-08-27, replacing a pile of one-off Playwright scripts that lived in
`F:\Git\Scratchpad\wix-archive` (`responsive-audit.mjs`, `nav-check.mjs`,
`find-overflow.mjs`, `check2..9.mjs`). Those were written per question and
thrown away; the checks they encoded are now in one script with one device
table, in the repo they serve.

Playwright is pinned exactly (`1.62.1`) so the already-cached Chromium build is
reused rather than triggering a fresh browser download on install. Bumping it
will very likely want a new browser build.
