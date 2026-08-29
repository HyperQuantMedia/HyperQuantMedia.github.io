# Palette & Typography Audit — blind exhaustive pass

- **Pass**: Colour palette + typography, both themes, all nine pages, findings + proposals
- **Date**: 2026-08-29
- **Commit tested**: `832c82db67be20a2fa3c3fbe8acb9eff921f241c` (built with `astro build`, audited via `astro preview` on `:4321`)
- **Blindness**: run without reading `WAYPOINT.md` or anything under `Design/` (other than writing this file). All numbers independently derived. Overlap with prior passes is expected and is a signal, not a defect.
- **Scratch work**: `scratchpad/palette-typography-audit/` — census script, raw JSON (2,590 element records), colour-math module, 36 full-page screenshots (9 pages × 2 themes × 1440/390), verification crops.

## What was MEASURED vs what was JUDGED

**Measured** (reproducible, method below): every contrast ratio in this report; token values as resolved by the browser in both themes; the full element census (per page, per theme: computed colour, backdrop samples, font family/size/weight/line-height/letter-spacing/transform); characters-per-line at 4 widths; webfont-blocked reflow deltas; per-weight ink density (weight reality); x-height/cap-height per family; hover/focus computed states; CVD-simulated colour distances; dead classes and unused tokens (grep of built HTML + JS against the stylesheet).

**Judged** (labelled as such wherever it appears): harmony, "reads as", identity fit, pairing quality, whether a colour "means" something. No taste claim is presented as a number.

## Contrast-computation method (so the numbers can be reproduced)

1. Playwright Chromium drives the **built** site. Themes via `colorScheme` emulation (the no-attribute media-query path — the state every first-time visitor gets). `reducedMotion: reduce` so every animation rests at its finished state and the WebGL starfield holds still (`scene.js` zeroes drift under reduced motion). Scroll-gated `.fade-*` content force-revealed. Viewport 1440×900.
2. For every visible element with a direct text node (plus SVG `<text>`), computed `color`, font properties and document rect are recorded, along with the cumulative ancestor `opacity` product.
3. All text ink is then made transparent (`color`, `-webkit-text-fill-color`, `text-shadow`, SVG `fill` on text), and **viewport-band screenshots are captured while actually scrolling**, so fixed layers (`body::before/::after` washes, the starfield canvas, the nav) composite exactly as a reader sees them — a full-page stitch would misplace them.
4. Each element's rect is sampled on a grid (up to 9×6 points) from the band containing it. The text colour (alpha × ancestor opacity) is composited over each sampled pixel; WCAG 2.x relative-luminance contrast is computed per pixel. Reported: **min** (worst-case region — what the text sits on at its worst point, including gradients, glows, star sprites, scene geometry) and **med** (the flat-backdrop figure). AA verdicts are graded on **med**; worst-case-region findings are reported as their own class. One known artefact: paragraphs containing underlined links sample their own gold underline pixels — those minima were individually re-verified with crops and are excluded where they were self-sampling.
5. Analytic cross-checks (`colormath.mjs`): srgb-linear compositing for translucent tokens, WCAG contrast, and Machado-2009 severity-1.0 matrices for protanopia/deuteranopia/tritanopia.
6. Thresholds: AA 4.5:1 body text, 3:1 large text (≥24 px, or ≥18.66 px at weight ≥700) and UI components/graphical objects (1.4.11); AAA 7:1 / 4.5:1 noted where relevant.

---

## Executive summary — what actually matters, in order

1. **The light theme passes its own flat-swatch maths and fails its composited page.** Every light token was chosen against flat `--space`/`--panel` (the stylesheet's own comments record 4.9–6.5:1) — but the page-hero glow paints each accent's *own dark ink* at 0.16 opacity under the text set in that accent, dragging the ground toward the text. Measured: `.section-label` 4.0–4.4:1 on **every** page hero in light (needs 4.5); the hero badge 4.38; the active filter pill 4.10; the Compendium creed chips 3.66. Dark is untouched by the same mechanism (13.6:1) because dark's glow is bright over dark and gold-on-dark has enormous headroom. This is the single most systematic failure and the clearest evidence dark was designed first.
2. **Three discrete hard failures in both themes**: the 48 px service numbers at `opacity: .35` (1.6–2.5:1 vs 3:1 required); the `tag-pending` chips, whose own scrim sits *over the text* (effective 2.40 dark / 2.56 light vs 4.5 required); and keyboard focus on every nav link, which is Bootstrap's stock blue ring at 25 % alpha — 1.28:1 dark / 1.39:1 light against the bar, and an off-palette literal besides.
3. **`--star-faint` has zero headroom and is used for real text at 9.6–12.2 px.** Its comment claims 5.03:1 on `--space`; measured, the fixed nebula washes pull that to 4.19–4.49 in washed regions (Studio stat labels FAIL at 4.19 med), and on `--panel-2` it is 4.24. The smallest, thinnest text on the site is set in the weakest colour — the compound failure a contrast checker that ignores composition cannot see.
4. **Typography is an accumulation, not a scale**: 42 distinct rendered font sizes at one viewport, 83 distinct (family, size, weight, tracking, transform) combinations, with a dense cluster of one-off values between 10.56 and 13.76 px. A large share of real content — platform tags, partner lines, tool roles, statuses, hints — renders at 9.6–11 px in a monospace face, frequently uppercase with wide tracking, frequently in `--star-faint`. The search input is 13.6 px, which triggers iOS focus zoom.
5. **The dark palette itself is excellent** — every accent clears 6.25:1 on every panel it sits on, the token architecture (accent/dim/glow triads, per-card `--accent` contract) is genuinely good, and the light theme is a real re-derivation rather than an inversion. The failures above are fixable with a small, verified token diff (Section 4, Direction A); nothing requires a redesign.

---

# Section 1 — Complete inventories

## 1.1 Colour tokens, as resolved in the browser (source: `src/styles/style.css:8–268`)

| Token | Dark | Light | Consumed by (representative; count = `var()` refs in style.css) |
|---|---|---|---|
| `--void` | `#04040c` | `#eef1f8` | `html` ground, nav-CTA hover ink, 404 canvas/overlay scrims, scrollbar track |
| `--space` | `#07071a` | `#f6f7fb` | tag-pending scrim; basis of `--veil`/`--nav-scrim` values |
| `--space-2` | `#0b0c22` | `#eef0f8` | CTA capsule ground, nav submenu, pipeline header, topic-link, lost-game, chart-video |
| `--panel` | `#11122e` | `#ffffff` | service/value/principle/project/tool/mv cards, pipeline table, comp-independence, footer-social hover |
| `--panel-2` | `#181a3c` | `#f5f7fd` | card hover ground, spec-chip ground, tag-live hover mix |
| `--panel-edge` | `#23264f` | `#dce1f0` | **nothing — defined in both themes, consumed 0 times** |
| `--line-faint` | `b4c3ff` @ 7 % | `121638` @ 8 % | band/section hairlines, nav hairline, footer rules, tags, logo tiles |
| `--line` | `b4c3ff` @ 13 % | `121638` @ 14 % | card borders, toggler, theme-toggle, inputs, filter pills |
| `--line-bright` | `b4c3ff` @ 22 % | `121638` @ 26 % | CTA border, hover borders, field lines, tag-pending border, year-rail line |
| `--star` | `#eef1ff` (17.7:1 on space) | `#0c0e1a` (17.9:1) | headings, card titles, hover text, ghost CTA, comet head, voyage ship/text |
| `--star-dim` | `#aab4d8` (9.7:1) | `#3b4160` (9.3:1) | body copy, nav links, blurbs, notes, field labels, toggler bars |
| `--star-faint` | `#767ea6` (5.03:1 flat — see PAL-05) | `#5c6282` (5.6:1) | tags, stat labels, footer tagline/bottom, social links, spec-note, hints, CTA scene stars, placeholders |
| `--polaris` | `#ffce6e` (13.6:1) | `#8a5a00` (5.5:1 flat — see PAL-01) | links, section labels, active filter, nav CTA, partner lines, chips, year stars, ~40 more |
| `--polaris-dim/-glow` | 12 % / 30 % | 10 % / 24 % | pill/chip washes, hover washes, borders, halos |
| `--polaris-bright` | `#ffd98a` | `#6d4700` | primary-CTA label, prose-link hover, comet head hover, beam edge |
| `--nebula` | `#57e1c4` (12.3:1) | `#0b7a66` (4.9:1) | status dots/text, Compendium accent, creed chips, Web service, VR brand, 404 pips/waypoints |
| `--nebula-dim/-glow` | 12 % / 28 % | 10 % / 22 % | washes/halos |
| `--aurora` | `#a98bff` (7.4:1) | `#5b3bd6` (6.5:1) | Games service, VoN/project glyphs+genre, scrollbar thumb, hero glow (Studio/Vision/404) |
| `--aurora-dim/-glow` | 12 % / 30 % | 10 % / 24 % | washes/halos |
| `--rose` | `#f472b6` (7.5:1) | `#b02a72` (5.7:1) | Applied-AI accent, Quartermaster… (products), pip-hit flash |
| `--rose-dim/-glow` | 12 % / 30 % | 10 % / 24 % | washes/halos |
| `--stellar` | `#b8d3ff` (13.1:1) | `#2d5296` (7.1:1) | Consulting accent, Astra, belief block/star, 404 trail |
| `--stellar-dim/-glow` | 12 % / 30 % | 10 % / 24 % | washes/halos |
| `--comet` | `#6aa6ff` (8.1:1) | `#14509f` (7.3:1) | Contact topic "Cosmos / Early Access" only |
| `--comet-dim` | 12 % | 10 % | topic hover wash |
| `--comet-glow` | 30 % | 24 % | **nothing — consumed 0 times** |
| `--ember` | `#ff9166` (9.0:1) | `#9c3d13` (6.4:1) | Contact topic "Business Development" only |
| `--ember-dim` | 12 % | 10 % | topic hover wash |
| `--ember-glow` | 30 % | 24 % | **nothing — consumed 0 times** |
| `--warn` | `#ff5f52` (6.7:1) | `#c02a1d` (5.5:1) | Compendium ⚠ unverified marker only |
| `--warn-dim` | 12 % | 10 % | **nothing — consumed 0 times** |
| `--dust-1…6` | white @ 40–70 % | `1e265a` @ 18–34 % | static CSS star wash (`body::before`) |
| `--nav-scrim` | `#07071a` | `#f6f7fb` | nav ground; duplicated by hand in `theme-color` meta (Base.astro:60–61) |
| `--hero-scrim` | `04040c` @ 55 % | `eef1f8` @ 55 % | home hero radial edge |
| `--shadow-hard` | black @ 90 % | `121638` @ 22 % | CTA/voyage label text-shadow, scrolled nav |
| `--shadow-soft` | black @ 70 % | `121638` @ 16 % | card hover shadows |
| `--glass-top/-bottom` | `181a3c`/`11122e` @ 50 % | white/`f4f6fd` @ 80 % | `.glass` — **class unused in build** |
| `--card-fill` | `11122e` @ 70 % | white @ 82 % | chart/comp cards, search input, back-to-top (translucent → PAL-06) |
| `--card-fill-hover` | `181a3c` @ 80 % | white @ 96 % | same, hover/focus |
| `--tag-fill` | `b4c3ff` @ 4 % | `121638` @ 4 % | tags, chips, filter pills, tool actions |
| `--veil` | `07071a` @ 72 % | `f6f7fb` @ 80 % | `.band`, pedigree, cta-section (translucent → PAL-06) |
| `--veil-deep` | `04040c` @ 78 % | `eef1f8` @ 86 % | footer |
| `--logo-plate` | `#f4f5f8` | `#ffffff` | logo tiles |

**Composited grounds** (what text actually sits on, computed): dark veil ≈ `#060616`, dark card ≈ `#0e0e27`, light veil ≈ `#f4f6fa`, light card ≈ `#fdfdfe` — over the *flat* page. Over a lit star sprite the same surfaces reach `#4c4c5a` (veil) and `#58596d` (card) in dark — see PAL-06.

**Tokens defined but never consumed**: `--panel-edge`, `--warn-dim`, `--comet-glow`, `--ember-glow` (both themes — 8 dead declarations).
**Tokens used but undefined**: none found (every `var()` reference resolves; fallbacks are declared inline for the `--accent` family).
**Duplication risk (measured identical today)**: the entire light block exists twice (`style.css:126–197` media-query form and `:199–268` attribute form, documented "edit both together") — 60 values that can silently drift. The brand-colour light overrides are likewise duplicated (`style.css:2999–3004`).

## 1.2 Colour literals that escape the token system

| Where | Value(s) | Verdict |
|---|---|---|
| `style.css:1500–1504`, `2942–2947`, `2999–3004` | Godot `#478cbf`, Xbox `#107c10`, PS `#0070d1`, Android `#3ddc84`→`#1e8e4e` light, Windows `#0078d4`, Switch `#e60012`→`#c00010` light | Documented third-party brand invariants, light-mode re-derived for the two that fail. Correct as designed. |
| `style.css:3038–3059` | `.chart-video-play`: `#fff`, `rgba(4,4,12,.62/.8)`, `rgba(255,255,255,.35)` | Deliberate — sits on arbitrary video footage. Correct. |
| `style.css:571` | `.nav-sub` shadow `rgba(0,0,0,0.34)` | Hard black shadow in both themes while every other shadow is tokenised (`--shadow-*`). Escapee. |
| `style.css:445` | brand-mark glow `rgba(3,116,229,0.28)` | Documented (logo's own blue). Correct, but it is the only place the brand blue exists in CSS — no token. |
| `src/scripts/scene.js:150–176` | full duplicate of both palettes as hex literals, plus **two greys that exist nowhere in the token system**: light star inks `0x181c33`, `0x23284a` | Hand-mirrored; will drift silently if tokens are retuned (it cannot read CSS custom properties from WebGL, but the duplication is undocumented on the CSS side — the CSS token block does not say scene.js mirrors it). |
| `public/js/comet.js:40` | trail inks `'50,75,160'` / `'214,230,255'` | Hard-coded, near `--star-dim`-ish but not tokens. |
| `public/js/lost.js:54–58` | reads real tokens with hex fallbacks | Correct pattern — the fallbacks mirror dark tokens. |
| `src/layouts/Base.astro:60–61` | `theme-color` `#07071a` / `#f6f7fb` | Necessary duplication (meta can't read CSS), correctly matched to `--nav-scrim`, but unflagged on the token side. |
| `public/vendor/bootstrap/bootstrap.custom.min.css` | full `--bs-*` root palette + focus ring `rgba(13,110,253,.25)` | The `--bs-*` block is dead weight; the focus ring is **live** on `.nav-link:focus-visible` — see PAL-04. |

**Colour-bearing classes defined but absent from the build** (grep of `dist/**/*.html` + all JS): `.von-teaser/.von-glyph/.von-title/.von-genre/.von-status`, `.status-dot`, `.status-text`, `.bg-polaris/.bg-nebula/.bg-aurora`, `.brand-star`, `.glass`, `.comp-status`(+`.liked`) (gated off by `showStatus=false`, `src/data/compendium.js:44`), `.comp-link`, `.section-divider`, `.project-glyph`, `.project-title`, `.chart-empty*` (conditional), `.alt-a-nebula/-aurora/-rose/-stellar` (data currently only uses `alt-a-polaris`).

## 1.3 Type inventory

**Families loaded** (`public/vendor/fonts/fonts.css`, all `font-display: swap`, latin + latin-ext):

| Family | Faces declared | Files | Weight reality (measured ink density at 48 px) |
|---|---|---|---|
| Inter | 300/400/500/600 normal + 400 italic | one variable file per subset ×2 + italic ×2 | 300<400<500<600 all distinct — **real variable axis**. A request for 700 renders identically to 600 (clamped to the declared range). |
| Space Grotesk | 400/500/600/700 | one variable file ×2 | 400<500<600<700 distinct — real. **No italic file exists** (TYP-05). |
| JetBrains Mono | 400/500/700/800 | one variable file ×2 | all distinct — real; the brand's 800 is genuine. |
| Space Mono | 400, 700 | four static files | distinct — real. |

**Weights actually rendered anywhere** (census, all pages): Inter 400 (+italic 400); Space Grotesk 500/600/700; JetBrains Mono 800; Space Mono 400/700. So Inter 300/500/600, SG 400, JBM 400/500/700 are declared-but-unrendered (zero byte cost — same variable file — but the vendored `FAMILIES` list overstates what the site uses).

**Preloaded**: `inter-normal-latin.woff2`, `space-mono-normal-latin.woff2` only. Above the fold also renders Space Grotesk 700 (every h1), JetBrains Mono 800 (the brand lockup, every page), and Space Mono **700** (CTA labels, footer headings) — three above-the-fold faces, including the page title face and a separate static 700 file, are not preloaded (TYP-06).

**Metrics** (measured, per 100 px em): x-height — Inter 55, JetBrains Mono 55, Space Mono 50, Space Grotesk 49; cap height — Inter/JBM 73, SM/SG 70. Space Mono has the *smallest* x-height of the four and carries the *smallest* type on the site.

**The as-implemented "scale"**: 83 distinct (family, size, weight, tracking, transform) combinations; **42 distinct font sizes at 1440 px** (px): 9.6, 10.56, 10.88, 11.2, 11.52, 11.84, 12.16, 12.48, 12.5, 12.8, 13.12, 13.44, 13.6, 13.76, 13.92, 14.08, 14.4, 14.56, 14.72, 14.88, 15.2, 15.52, 16, 16.48, 16.64, 16.8, 17.86, 17.92, 19.05, 19.2, 20.8, 21.43, 22.4, 24, 33.6, 36.8, 41.6, 43.2, 48, 73.6, 96, 144. Verdict: **an accumulation, not a scale** (TYP-01). Fourteen distinct sizes sit inside the single interval 13.4–17.0 px; eleven sit below 12 px.

Representative role table (family / px / weight / tracking / transform → where):

| Role | Face | px | wt | Notes |
|---|---|---|---|---|
| h1 home hero line | Space Grotesk | 96 | 700 | −0.03 em, lh 1.04 |
| h1 inner page | Space Grotesk | 73.6 | 700 | clamp() |
| h2 section title | Space Grotesk | 43.2 | 600 | −0.02 em |
| h2 CTA-block title | Space Grotesk | 36.8 | 600 | |
| stat number | Space Grotesk | 33.6 | 700 | |
| h3 project name | Space Grotesk | 24 | 700 | |
| hww number (div) | Space Grotesk | 22.4 | 700 | outranks most h3s |
| h3 tool name | Space Grotesk | 20.8 | 600 | |
| h3 principle title | Space Grotesk | 19.2 | 600 | |
| h3 service-card title | Space Grotesk | 17.92 | 600 | |
| h3 value title | Space Grotesk | 16.64 | 600 | 0.6 px above body |
| body / section-body | Inter | 16 | 400 | lh 1.8 |
| page-hero sub / tool blurb | Inter | 16.8 | 400 | |
| card bodies | Inter | 13.44–14.88 | 400 | five distinct sizes for one role |
| brand word | JetBrains Mono | 17.9 nav / 21.4 footer / 19.0 lg | 800 | caps, 0.09–0.12 em |
| nav link | Space Mono | 12.8 | 400 | |
| CTA label | Space Mono | 13.12 | 700 | caps 0.06 em |
| section label | Space Mono | 11.52 | 400 | caps 0.18 em |
| footer h2 | Space Mono | 11.52 | 700 | caps 0.14 em — an h2 below body size |
| tags/chips | Space Mono | 10.56–10.88 | 400 | most numerous text on credits/compendium/studio |
| partner / kind line | Space Mono | 10.88 | 400 | caps 0.08 em |
| tool role / status | Space Mono | 10.56 | 400 | caps 0.12 em / 0.08 em |
| year-rail cap | Space Mono | **9.6** | 700 | caps 0.14 em, `--star-faint` |
| comp-status (dormant) | Space Mono | 9.6 | 400 | caps — would be the smallest text on the site if re-enabled |
| 404 code | Space Mono | 144 | 700 | gradient ink |

---

# Section 2 — Colour findings (`PAL-xx`, severity-ranked)

Ratios are worst-instance **med** (flat backdrop) unless marked *min* (worst-case region). "D"/"L" = dark/light theme. File refs are `src/styles/style.css` unless said otherwise.

### PAL-01 · HIGH · Light theme: accent-on-its-own-glow fails AA across every page hero
The `.page-hero-glow` (`:946–961`) paints `var(--polaris|nebula|aurora)` at opacity 0.16 under the hero text. In light those tokens are **dark inks**, so the glow *darkens* the ground toward the label's own colour. Measured (light, med / need 4.5):
- `.section-label` (11.52 px, `#8a5a00`): services 4.20 · cosmos 4.18 · studio **3.92–4.04** · vision 4.07 · contact 4.18 · credits 4.22 · compendium 4.10–4.17 · home (band context) 4.38–4.50. All FAIL. Dark equivalents: 13.3–13.6 PASS.
- `.hero-badge .badge-item` (home, 11.52 px): **4.38** L FAIL ×2 phrases (dark 7.4+ PASS).
- `.chart-filter-btn.active` (credits/compendium, 11.2–11.52 px): **4.10** L (credits 4.47–4.50 borderline) FAIL; dark 11+ PASS.
- `.comp-creed li` (compendium, 11.2 px, `#0b7a66` on `--nebula-dim` over the nebula glow): **3.66** L FAIL ×3; dark 10+ PASS.
- Analytic confirmation: light ground under the polaris glow ≈ `#e5ded3`; `#8a5a00` on it = **4.44**; nebula ground ≈ `#d0e3e3`, `#0b7a66` on it = **3.94**.
Which theme is worse: **light, decisively** — the identical markup measures 3.7–4.4 in light vs 7.4–13.6 in dark.
Root cause: every light accent was verified only against flat `--space`/`--panel` (the comments at `:141–174` record exactly those numbers). The composited grounds were never in the maths. Fixes verified in Section 4 (darker light gold/teal, and/or halving the glow opacity in light — both options' numbers shown there).

### PAL-02 · HIGH · `.service-number` at `opacity: .35` fails 3:1 in both themes
`:1655`. 48 px / 700 display numerals (real text, "01"–"05", services page). Effective ink after opacity, on `--space`:
- Dark: aurora **1.84**, rose **1.82**, nebula 2.32, stellar 2.42, polaris 2.45 — all FAIL 3:1.
- Light: polaris **1.67**, nebula **1.63**, rose 1.66, stellar 1.67, aurora 1.69 — all FAIL, light worse.
Verified fix: `opacity: .6` dark (weakest becomes 3.27) and `.8` light (weakest 3.45) — or drop opacity and use the accent solid (6.25–13.6 D / 4.9–7.1 L). If these numerals are argued to be decorative, the argument fails: they are the only ordinal cue for the five services and are read as content.

### PAL-03 · HIGH · `tag-pending` scrim sits over its own text: 2.40:1 D / 2.56:1 L
`:2979–2995`. The `::after` ground-scrim (`--space` at 0.4) covers the whole chip **including the 10.56 px label and platform glyph**. Composited: dark fg `#4a4e6e` on `#0b0b22` = **2.40**; light fg `#9a9eb2` on `#fafbfd` = **2.56**. FAIL 4.5 (and even 3:1) in both themes; the census numbers for these chips (min 1.85 etc.) *understate* the failure because the census composites raw `--star-faint` without the scrim. The dotted border + `title` tooltip carry the "not a link" meaning fine — the scrim is purely subtractive. Verified fix: delete the scrim, set the label to `--star-dim` (9.21 D / 9.79 L on card) or keep `--star-faint` (4.78 D / 5.86 L), keep the dotted border.

### PAL-04 · HIGH · Keyboard focus on nav links is Bootstrap's stock blue at 25 % alpha — 1.28:1 D / 1.39:1 L
Measured by tabbing: every `.nav-link` (including the gold nav CTA) shows `outline: none` + `box-shadow: rgba(13,110,253,.25) 0 0 0 4px` — the un-themed Bootstrap focus ring surviving the custom build (`tools/bootstrap-custom.scss` trims utilities but keeps nav/navbar defaults). Ring vs `--nav-scrim`: **1.28** dark, **1.39** light — far below the 3:1 an focus indicator needs, and the only place the Bootstrap blue `#0d6efd` renders anywhere on the site. Everything else (brand links, socials, theme toggle) falls back to the UA default ring, which works but is inconsistent; only `.prose-link` and `.lost-canvas` have designed `:focus-visible` (gold, 2 px — verified 13.6 D / 5.5 L, PASS). Verified fix in Section 4 (one global `:focus-visible` rule).

### PAL-05 · HIGH · `--star-faint` (dark) has zero headroom; real text in it fails off flat `--space`
The token's own comment (`:25`) claims 5.03:1 on `--space` — true on the flat swatch, but:
- The fixed `body::after` nebula tints raise the ground: measured ground under the Studio intro ≈ `#171431`, star-faint on it = **4.49**; the Studio `.stat-label` (10.88 px ×3) measured **4.19 med** — FAIL.
- On `--panel` it is 4.61; on `--panel-2` **4.24** — every chip/label in star-faint on a hovered card is below AA.
- Contact page: `.social-link-lg` labels 4.52 med / 3.66 min (washed region), `.contact-note` 4.52, `.ci-label.c-faint` 4.37 min — all borderline-to-fail.
- Credits `.year-rail-cap` (9.6 px, bold caps) 4.71/4.49; services `.spec-note` (10.88 px) 5.00/4.29.
Light `--star-faint` (5.6–6.0 on its surfaces) is healthier but drops to 4.78 under light washes. This is also the **weight × colour interaction** finding: nearly everything set in star-faint is ≤11 px Space Mono 400 — the site's lowest-contrast colour is reserved for its smallest, lightest-stroke type (see TYP-02). Verified fix: dark `#858db5` (6.14 space / 5.63 panel / 5.17 panel-2 / 5.48 washed) — visually still "faint" next to `--star-dim` 9.7.

### PAL-06 · MEDIUM · Translucent surfaces + live starfield produce worst-case regions down to 1.06:1
`--card-fill` (70 % D) and `--veil` (72 % D) let star sprites show through *behind text* — deliberately for the veil ("the field is continuous", `:87–91`), but text sits on the result. Measured minima with the field frozen (visually verified by crops):
- credits `.chart-card-partner` gold: **1.06 min** (star pixel inside the card behind the text row; med 13.57);
- credits `.chart-card-note`: 1.34 min; compendium `.page-hero-sub`: **1.59 min** (constellation line + node directly behind glyphs — crop shows it); services `.section-body` (unbanded section, raw field behind): 2.16–3.02 min; compendium `.chart-year-star`/gold ✦: 2.99 min.
- Analytic worst case: a full-brightness star under dark `--card-fill` composites to `#58596d`; `--star-dim` on that = **3.34**, gold = 4.67. Under `--veil`: `#4c4c5a`, star-dim = 4.11.
These are moving, glyph-scale overlaps — med values pass, so this is reported as its own class, not as flat AA failures. But the *mechanism* is real and permanent: nothing bounds the luminance under body text in unbanded sections. Light theme is structurally safer (its "stars" are dark inks at low alpha on a light ground; measured light minima for the same elements 1.33–3.8 come mostly from underline self-sampling and the glow, not the field). Options verified in Section 4 (raise fill alphas: card-fill 0.92 → worst-pixel star-dim 7.25, gold 10.14; veil 0.85 → star-dim 6.67).

### PAL-07 · MEDIUM · CTA labels cross their own scene geometry
`.cta-label` gold/starlight text sits over animated gold comet/ring/spark geometry at scene opacity 0.72 (`:1120–1136`). Measured min under the label: 1.91–2.45 D, 2.25–2.63 L (med 6.1–17.7 — flat state passes everywhere). Dark is defended by `text-shadow: 0 1px 8px var(--shadow-hard)` (black @ 90 %); light's `--shadow-hard` is `121638` @ 22 % — a much weaker defence exactly where the ink is darker than the scene. Frozen under reduced-motion the geometry rests where the keyframes end, so the overlap is a permanent state for those users, not a transient. Low practical harm (13 px bold caps, short labels), but it is the one place the design deliberately puts text on same-hue moving geometry.

### PAL-08 · MEDIUM · Light borderline set (4.4–4.7) — the light theme's habit of "just passing"
Elements that pass flat AA with < 0.3 headroom in light and dip under it in washed regions: `.ci-label.c-nebula` 4.65 med / 4.46 min (contact); `.spec-chip` gold-on-wash 4.81 analytic; `.chart-filter-btn.active` credits 4.47–4.50; `section-label` on home bands 4.47–4.50; `.stat-label` light 4.50 med / 4.46 min. None of these has the headroom to survive the site's own washes. Direction A's light-ink darkening clears the whole set at once (numbers in Section 4).

### PAL-09 · MEDIUM · Component boundaries live at 1.1–2.2:1 in both themes
Measured borders (med, vs their real composited surroundings): footer `.social-link` 1.09 D; theme toggle 1.24 D; topic-links 1.27 D; `.comp-search` input border 1.29 D / 1.33 L; voyage capsule 1.27; ghost CTA 1.60–1.67; tool-shelf/repo 1.67; primary CTA 2.14–2.22; filter pills ~1.2. WCAG 1.4.11 nuance stated honestly: a border is only *required* to hit 3:1 where it is the sole identifier of the control. The search input is the strongest genuine failure (its boundary **is** the affordance; the placeholder inside is star-faint at 4.78 D). The buttons carry visible text/glyphs that pass, so they are hit-area-discovery issues (judged: real but mild), not automatic 1.4.11 failures. Consistency note: `--panel-edge` was evidently minted for exactly this job and is never used.

### PAL-10 · MEDIUM · Gold means four things; two of them on the same page
Semantic census of `--polaris`: (a) in-prose **link** semantic — declared in the stylesheet itself ("gold is the site's own link semantic", `:1027–1030`); (b) non-interactive **labels** — section labels, chart partner lines, year labels/stars, brand ✦, pipeline "Converge" row; (c) **active state** — filter pills, year-rail active, nav CTA; (d) **tool identity** — three of nine Cosmos bodies. On `/credits` alone, gold is simultaneously a non-link partner line, an active filter, a hover state on store links, and decorative stars. `--warn`'s comment argues an unverified claim can't be gold *because gold would read as a link* — the palette's own documentation acknowledges the collision that (b) and (c) then commit. Consequence (judged, mechanism measured): gold cannot signal interactivity reliably anywhere, and the underline on `.prose-link` is doing all the real work (which is why it exists — correctly).

### PAL-11 · MEDIUM · Nebula teal carries three unrelated meanings
Measured usage: live/success status (status dots, project-status badge, 404 hull pips, "Liked"), a service identity (Web Development), a platform brand (VR), and the Compendium's page accent + creed. One colour spans "state", "category", and "brand". No page shows two of these side by side today except compendium (accent + creed) and credits (VR brand tag + nothing stateful), so it holds — barely — but any future "live" indicator on the credits/compendium cards collides instantly. Judged severity: architectural, not a present-day reading error.

### PAL-12 · LOW-MED · Colour-blind simulation: the cross-page colour rhymes vanish; in-situ meaning survives
Machado severity-1.0, distances in 8-bit RGB (< 60 = confusable):
- **Deuteranopia** (most common): dark `aurora~comet` Δ**5** (identical), `nebula~rose` Δ48, `polaris~ember` Δ53, `ember~warn` Δ39; light `nebula~rose` Δ**7**, `polaris~ember` Δ12, `polaris~warn` Δ18.
- **Protanopia**: dark `aurora~comet` Δ32; light `ember~warn` Δ14, `stellar~comet` Δ19.
- **Tritanopia**: dark `rose~ember` Δ16; light `stellar~comet` Δ4, `nebula~stellar/comet` Δ25–27.
Functional review of every place hue carries meaning: contact topics (glyph + full text label ✓), service accents (numbered + titled ✓), pipeline rows (text labels ✓), tag-live vs tag-pending (border *style* + cursor ✓ — good), filter active (gold + fill + `aria-pressed`-equivalent class; luminance shift large ✓), year-rail active (scale + glow + colour ✓), ⚠ unverified (glyph shape ✓). **No case found where hue is the sole channel** — the deliberate multi-cue patterns hold. What *is* lost: the designed rhyme "each contact topic wears its service's colour" (contact.astro comment) is imperceptible to deutan/protan users — Games (aurora) and Cosmos (comet) become the same colour. Judged: acceptable loss; note it so nobody strengthens that rhyme into a load-bearing signal.

### PAL-13 · LOW · Theme parity: three structural inversions
1. **Surface ladder flips in the middle.** Dark ladder is monotonic (void→space→space-2→panel→panel-2, each lighter). Light: `--space-2` (`#eef0f8`) is *darker* than `--space`, and `--panel-2` darker than `--panel`. So the CTA capsule, nav submenu, pipeline header, topic tiles and lost-game panel — "lifted" grounds in dark — become recesses in light; card hover *lightens* in dark and *darkens* in light. The hover direction is conventional per theme (judged: fine), but the capsule grounds read as near-invisible pale-grey boxes in light (measured Δ ≈ 2 RGB steps vs page; judged from screenshots: the "night-sky capsule" concept effectively disappears).
2. **Elevation is shadow-borne in dark, border-borne in light.** Dark shadows are black @ 70–90 %; light's are `121638` @ 16–22 % — nearly invisible — so light depends on its (very faint, PAL-09) borders. Neither theme fails on this alone; the pair means hierarchy reads differently per theme.
3. **Gold identity inverts.** `#ffce6e` is luminous and unmistakably gold; `#8a5a00` reads olive-brown (judged; and the hero glow renders as a brown wash behind light titles — visible in `shots/credits-light-1440.png`). The star of the palette is the thing light mode loses. Which theme was designed first: **dark**, by declaration (`:110` "the dark palette … is the design's native state") and by measurement (dark accents carry 6.25–13.6:1 headroom on panels; light 4.9–7.8 with multiple 4.x borderlines).

### PAL-14 · LOW · Literal escapes (inventory in §1.2)
Actionable subset: the `.nav-sub` black shadow (`:571`) should be `--shadow-hard`; scene.js's two invented light greys (`0x181c33`, `0x23284a`) and comet.js's two ink strings deserve a "mirrors tokens X/Y — edit together" comment on the CSS side (the JS side already says it); the dead `--bs-*` root block ships ~2 KB of unused palette custom properties on every page.

### PAL-15 · LOW · Dead colour surface (inventory in §1.1/§1.2)
Eight dead token declarations, ~20 dead colour-bearing classes. Zero user impact; audit noise and drift risk. The dormant `.comp-status` block would re-enter at 9.6 px star-faint — i.e. pre-loaded with a PAL-05/TYP-02 failure if `showStatus` is ever flipped back on.

### PAL-16 · LOW · `::selection` unstyled
Default UA blue selection over gold/dark surfaces (judged: jarring against an otherwise fully-themed site; dark-theme selected gold text on UA blue measures ~2.5:1 for the gold). One two-line rule fixes both themes.

### PAL-17 · INFO · Verified-fine set (recorded so they aren't re-litigated)
Scroll-progress hairline (decorative, 2 px); scrollbar thumb 1.6:1 vs track (decorative, UA fallback exists); logo tiles (light plate in both themes — correct for third-party marks); `hero-badge` dark 7.36 on its pill; belief-quote gradient worst stop 8.9 D / 9.95 L (PASS AAA); hero "Uncharted" gradient stops 7.42–13.9 D / 4.66–6.45 L at 96 px (needs 3 — PASS both, AAA in dark); 404 code gradient stops at 144 px all ≥ 4.66 (needs 3 — PASS); 404 pips 11.9 D / 4.63 L (needs 3 — PASS); placeholder 4.78 D / 5.86 L (marginal pass dark); footer star-faint on veil-deep 5.16/5.27 (PASS).

---

# Section 3 — Typography findings (`TYP-xx`)

### TYP-01 · HIGH · 42 sizes is not a scale
§1.3 table. The interval 13.4–17.0 px contains fourteen distinct sizes serving the single role "small body/card copy" (0.84, 0.85, 0.86, 0.87, 0.88, 0.9, 0.91, 0.92, 0.93, 0.95, 0.97, 1.0, 1.03, 1.05 rem — read straight off the stylesheet). Below 12 px there are eleven more. Consequences: (a) no two card families agree on their body size (service 14.08, value 13.92, principle 14.56, project 14.88, hww 14.4, chart-note 13.44); (b) any retune is 40+ individual edits; (c) hierarchy inside cards is carried by ±0.5 px differences no reader can perceive. The heading half is healthier — 96/73.6/43.2/36.8 form a real progression. Fix directions in Section 4 (T1).

### TYP-02 · HIGH · The micro-mono layer: content at 9.6–11 px, worst-ink, tracked caps
The most numerous text on three pages (credits, compendium, studio) is 10.56–10.88 px Space Mono 400 — the face with the smallest x-height of the four loaded (50/100 em → **x-height ≈ 5.3 px** at these sizes). Much of it is also uppercase with 0.08–0.14 em tracking and set in `--star-faint` (PAL-05): year-rail cap 9.6 px/bold/caps/faint; tool status 10.56/caps/faint; spec-note 10.88/faint; tags 10.56/faint; partner lines 10.88/caps/gold. This is the compound finding a contrast checker cannot produce: **smallest size × lightest stroke × weakest ink × caps-tracking simultaneously**, and it lands on real content (platform names, statuses, provenance lines), not decoration. At 390 px these sizes do not scale up (measured: identical px on mobile), so a phone renders 10.56 px mono at arm's length.

### TYP-03 · HIGH · Search input at 13.6 px triggers iOS focus zoom
`.comp-search` (`:3168`) measured 13.6 px at 390 px viewport. iOS Safari zooms the page on focus of any input under 16 px — on the one page built around live search. Fix: 1 rem on the input (visual style can stay via padding); verified no layout dependency on the 13.6 px.

### TYP-04 · MEDIUM · Semantic vs visual hierarchy disagreements
- Footer `h2` renders 11.52 px — below body size — while spans (`.chart-year-label` 16.8/700, `.comp-section-label` 14.72/700) render *as* section headings without being headings. The footer-h2 choice is documented and defensible (heading-level integrity over size); the chart/comp section labels are the inverse case and would cost nothing as `h2`/`h3`.
- `h3` spans 16.64–24 px across card families while non-headings sit inside that band (hww-num div 22.4/700, stat-number 33.6): a screen-reader outline and the visual outline tell different stories on /cosmos and /vision.
- `.value-title` h3 at 16.64 px vs 16 px body is a sub-perceptual step (0.64 px); its weight (600) is doing all the work.

### TYP-05 · MEDIUM · `.belief-quote` italic is synthesised
`font-style: italic` + `--font-display` (`:1859–1871`), but no Space Grotesk italic face exists in `fonts.css` → the browser slants the upright (faux oblique) at 24 px 500 in the site's single most set-piece typographic moment. Inter italic 400 (real, vendored) is used correctly elsewhere (cosmos disclaimer). Options: un-italicise the quote (it is already differentiated by size, colour gradient and the mark), or accept the synthesis knowingly.

### TYP-06 · MEDIUM · Fallback and loading: modest reflow, wrong preloads, no metric tuning
Measured with all `/vendor/fonts/*.woff2` aborted (fallback = Arial for Inter/SG on Windows, Consolas-class for the monos; `SFMono-Regular` in `--font-mono` matches nothing on Windows/Android/Linux):
- Document height 4450 → 4348 px (−2.3 %); CTA label −9.3 % width; hero badge −6.5 %; nav links −5.5 %; brand word −7.3 %. Real but contained CLS during `swap`; no `size-adjust`/`ascent-override` fallback tuning anywhere.
- Preloads (Base.astro:138–139) cover Inter 400 and Space Mono 400 — but every page's h1 is Space Grotesk 700, every CTA label is Space Mono **700** (a separate static file), and the brand is JetBrains Mono 800. On a slow connection the two most identity-carrying faces above the fold (title + brand) arrive un-preloaded and swap late. The preload comment ("the faces on every page above the fold") is measurably incomplete.
- `font-display: swap` everywhere is the right call for this stack; nothing renders invisible.

### TYP-07 · MEDIUM · Measure (CPL) misses at both ends
Measured characters-per-line: `.comp-independence .section-sub` **105 cpl** at 1440 *and* 1024 (its own `max-width: 82ch` cap, `:3255` — `ch` being the width of "0" in 16.48 px Inter makes 82ch ≈ 105 actual characters; the comment "short enough to read" is not borne out by the number). Cosmos `.section-prose` body: **86 cpl** at 1440/768 (the 560 px cap is removed inside `.section-prose`, `:1049`, and the column is 856 px). At the other end, two-column chart notes at 1024 run 21 cpl. Everything else measured 29–74 — healthy. Flag threshold used: 45–85.

### TYP-08 · LOW · All-caps + wide tracking as the default label voice
27 of the 83 combos are uppercase, tracked 0.04–0.18 em, nearly all under 12 px. Identity-consistent (judged: the "telemetry" voice is the brand), but it compounds TYP-02, and the two longest caps runs — the voyage label (45 chars, 12.48 px) and hero badge phrases — sit at the size floor of comfortable caps reading. The 0.18 em on `.section-label` is the widest tracking on the site at 11.52 px; at that size the word-image disintegrates for dyslexic readers (judged, standard guidance).

### TYP-09 · LOW · Weight hygiene (verified real, some dead)
No synthetic bolds in use (measured, §1.3) — worth saying explicitly because the vendoring pattern (many weights → one file) usually hides exactly that failure, and here it does not. Inter 300/500/600, SG 400, JBM 400/500/700 are declared and never rendered; Inter 700, if ever requested, will silently render as 600 (clamped — measured identical ink). No sub-400 weight is used anywhere, so the "thin text on dark" classic is absent — the site's version of that failure is PAL-05/TYP-02 (colour, not weight).

### TYP-10 · LOW · Line-height and tracking are individually sound
Body 1.7–1.8; card bodies 1.6–1.75; h1 1.04 at 96 px (tight, correct); brand 1.12 (constrained by the lockup geometry, documented); 144 px `404` at 1.0; negative tracking only on ≥33 px display sizes (−0.01 to −0.03 em — correct direction). No finding beyond: `.title-cascade` h2 at 43.2 px lh 1.18 with three stacked spans is the tightest multi-line setting (fine, judged).

### TYP-11 · LOW (judged) · The pairing: four families, three of them "space mono adjacent"
Space Grotesk was literally derived from Space Mono — that pairing is genetically coherent and is the site's best typographic idea. JetBrains Mono exists **only** for the 3-line brand word (weight 800, ~9 glyphs), and at lockup sizes it is near-indistinguishable from bold Space Mono to a non-specialist (both are quirky technical monos; judged). Cost: two extra font files + a third voice with one line of dialogue. Inter is doing quiet, correct body work. The type *does* support the celestial identity — the mono telemetry voice + grotesk display is the right register — the question is only whether three monospace-family slots (`--font-mono`, `--font-brand`, plus `SFMono` fallbacks) are earning their keep. Options in T2.

### TYP-12 · LOW (judged, mechanism measured) · Apparent-weight shift between themes is unhandled
Light-on-dark text blooms and reads a half-step heavier than the same weight dark-on-light; this site amplifies it with glow `text-shadow`s and `drop-shadow`s in dark that light keeps at 16–24 % alpha. Result: dark reads *heavier/louder*, light reads *thinner/flatter* at identical tokens — one more reason light feels like the echo. Standard mitigation (dark body at 380–390 via the variable axis, or `-0.005em` tracking in dark) is available cheaply since Inter's axis is real; none is present.

---

# Section 4 — Proposals

Every colour below is concrete and was contrast-verified with the same maths as the findings (script: `scratchpad/palette-typography-audit/colormath.mjs`). "Hero ground" = accent glow @ 0.16 over `--space` (the measured worst text ground in light); "washed" = nebula-tint ground (accent @ 0.10 over `--space`).

## Palette Direction A — "Trim the wick" (surgical; clears every AA failure, look unchanged)

Dark theme: **two** value changes. Light theme: three inks + one opacity. Plus four one-line CSS rules. Blast radius: ~12 lines in `style.css` (×2 for the duplicated light block), 0 markup changes.

| Change | Before | After | Verification (contrast, D=dark L=light) |
|---|---|---|---|
| `--star-faint` (dark) | `#767ea6` | **`#858db5`** | space 6.14 · panel 5.63 · panel-2 5.17 · card 5.83 · washed 5.48 (was 5.03/4.61/4.24/4.78/4.49) — clears PAL-05, contact/credits/studio faint-text set |
| `--polaris` (light) | `#8a5a00` | **`#7a4f00`** | space 6.66 · panel 7.13 · hero ground 5.34 · badge-pill-on-hero 4.67 · nav-CTA-hover white-on-gold 6.30 — clears PAL-01 gold set, PAL-08 chip/filter |
| `--nebula` (light) | `#0b7a66` | **`#0a6455`** | space 6.61 · panel 7.08 · hero ground 5.32 · creed-pill-on-hero 4.62 — clears creed + ci-label |
| `--polaris-bright` (light) | `#6d4700` | keep | 6.43 on primary-CTA ground — already passes |
| `.service-number` opacity | `.35` | **`.6` dark / `.8` light** (one light-block override) | weakest accent: D aurora/rose 3.27, L nebula 3.45 — clears PAL-02 at 3:1 |
| `.tag-pending::after` | `--space` @ .4 over text | **delete**; label → `--star-dim` | 9.21 D / 9.79 L on card (dotted border keeps the semantics) — clears PAL-03 |
| Focus | Bootstrap blue ring | `a:focus-visible, button:focus-visible, input:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--polaris); outline-offset: 2px; }` (+ kill the `--bs-focus-ring` shadow on `.nav-link`) | ring vs nav 13.57 D / 6.66 L (new gold); vs panel 12.44 D / 7.13 L — clears PAL-04, ≥3:1 everywhere measured |
| `.comp-search` | `font-size: .85rem` | `1rem` | kills iOS zoom (TYP-03) |
| `.nav-sub` shadow | `rgba(0,0,0,.34)` | `var(--shadow-hard)` | token hygiene (PAL-14), visual change ≈ nil in dark |

- **Cost**: an hour, plus regenerating nothing (no font/vendor work). **Risk**: the light gold gets ~10 % darker — brand-visible but small; scene.js light `polaris` literal (`0x8a5a00`) should move with it or the hero stars diverge from the UI ink.
- **Does NOT fix**: starfield worst-case regions (PAL-06), CTA-label-over-scene minima (PAL-07), gold's semantic overload (PAL-10), theme-parity inversions (PAL-13), anything typographic beyond the input, the light theme still reading as the echo.

## Palette Direction B — "Re-derive the light sky" (systematic retune; fixes parity + composition)

Everything in A, plus the ramps and the compositing rules are rebuilt so that **every ink is verified against its worst composited ground, not its best flat one**, and light becomes a designed daylight rather than an inversion.

1. **Contrast targets as policy**: text inks must clear 4.5 on (space, panel, panel-2, card, washed, hero ground); label/large inks 3.0 on the same six. That is the rule the current dark palette already satisfies and the light palette does not.
2. **Light accent ramp** (all verified on space / panel / hero ground): polaris **`#6f4800`** (7.54 / 8.07 / 6.04) — one step deeper than A, buying headroom for future washes; nebula **`#0a6455`** (6.61 / 7.08 / 5.32); keep aurora `#5b3bd6` (6.45 / 6.90 / 5.04), rose `#b02a72`, stellar `#2d5296`, comet `#14509f`, ember `#9c3d13`, warn `#c02a1d` — measured, all already clear the policy.
3. **Glow discipline**: `.page-hero-glow` opacity splits per theme — 0.16 dark / **0.08 light** (light hero grounds become `#edeae7`-class; even A's gold then reads 5.95, B's 6.73). In light, glows should *tint*, never *shade*: this one number is most of the "brown stain" fix (PAL-13.3 judged issue, PAL-01 measured issue).
4. **Bounded translucency**: `--card-fill` 0.70→**0.92** dark (worst star pixel: gold 10.14, star-dim 7.25, new faint 4.89 — PAL-06 closed for cards); `--veil` 0.72→**0.85** (worst star pixel: star-dim 6.67 — closed for bands). The field stays visible between surfaces, which is where it was always most legible anyway. Light equivalents: card 0.92 over the darkest light-star ink → gold 6.04 (verified).
5. **Semantic token layer** (before/after architecture):

| Before (physical only) | After (physical + semantic aliases) |
|---|---|
| `--polaris` does link/label/active/identity | `--link: var(--polaris)` · `--link-hover: var(--polaris-bright)` · `--focus-ring: var(--polaris)` · `--label-ink: var(--polaris)` — one physical gold, four *named* jobs, so any future split (e.g. labels move to `--stellar`) is a one-line retarget |
| `--nebula` does status/identity/brand | `--ok: var(--nebula)` for status dots/badges/pips; identity uses stay raw `--nebula`; `[data-brand=vr]` keeps its own line |
| `--warn` | `--warn` (already semantic — keep) |
| — | `--panel-edge` finally consumed: input + toggle borders (`#23264f` = 2.0:1 on panel D — still shy of 3:1, so pair with `--line-bright` at 1.5px for inputs) or delete the token |
| `--comet-glow`, `--ember-glow`, `--warn-dim` | delete (dead) |
| light block ×2 | generate one block; wrap the media-query copy via build step, or accept duplication but add a checksum comment |

6. **scene.js / comet.js**: mirror-table comment on the CSS side + updated literals (`0x6f4800` etc.).
- **Cost**: 1–2 days incl. re-verification sweep; **blast radius**: ~60 token lines ×2 blocks, 2 JS files, zero markup. **Risk**: veil/card alpha changes visibly calm the starfield behind content — that *is* the point, but it is a perceptible identity adjustment someone may have already rejected (flagged per blindness rule: the veil comment at `:87` records choosing continuity over opacity deliberately).
- **Does NOT fix**: gold's overload is aliased but not visually split; light theme still has no luminous gold; typography untouched.

## Palette Direction C — "Two skies, one constellation" (ambitious re-articulation)

Premise (judged, built on measured asymmetries): the current light theme is dark's *negative* — same hues, inverted luminance, identity lost (PAL-13). C makes light a **day chart**: the sky an astronomer's paper chart, the accents *ink* by day and *light* by night, and gold restored as gold in both.

1. **Dual-rung accents**: every accent gets two physical rungs — `-core` (deep ink) and `-flare` (luminous). Dark uses flare for text and core for grounds; light uses core for text and flare *only* for non-text glints (badges' dots, rail stars, the hero glow). Concretely for gold: flare `#ffce6e` (13.6 D), core `#6f4800` (7.5 L text) — and light gets its gold back by letting **flare appear in light as non-text ornament** (a `#ffce6e` star glyph on white is 1.4:1 — fine for a decorative glint beside AA text, and it is the piece of the identity light currently amputates). Every text use = core in light / flare in dark, all already verified above.
2. **The atmosphere contract**: introduce `--ground-max-lum` per theme as a *tested invariant*, not a token — every text-bearing surface (veil 0.85, card 0.92, plus a new `.prose-scrim` behind unbanded prose columns: `--veil` at radius-lg) guarantees the backdrop never exceeds the luminance that keeps `--star-dim` ≥ 4.5. This retires PAL-06 as a *class*, permanently, and is enforceable by exactly the sampling script this audit used (drop it in `tools/`).
3. **Hero glow → corona**: replace the filled 680 px blob with an annulus (radial-gradient with a transparent centre) so the title/label sit on clean ground and the colour rings *around* them. Fixes PAL-01's mechanism outright in both themes rather than tuning around it; keeps more glow colour than B's 0.08 (judged: prettier, and strictly safer).
4. **Gold demoted to two jobs**: interaction (links, active, focus) + brand punctuation (✦). Labels (`.section-label`, partner lines, year labels) move to `--stellar` (13.1 D / 7.1 L — verified, and blue-white "starlight" is more celestial for chart-annotations than gold anyway — judged). Tool identity keeps the full constellation range. This resolves PAL-10 by subtraction, not by aliasing.
5. **Status becomes shape+colour**: the `--ok` dot gains a ring (live) vs dotted-open (horizon) so PAL-11/12 never mature into failures.
- **Cost**: ~1 week incl. design passes; **blast radius**: token block, ~15 component rules, scene.js, screenshots/OG. **Risk**: it is a *visible* redesign of the light theme and of every label on the site; the label-colour move (gold→stellar) changes a signature. Honest assessment: C is the only direction that makes light a first-class theme; it is also the only one that risks making the site look different to someone who liked it yesterday.
- **Does NOT fix**: typography (below); the JBM/Space-Mono duplication; anything in `tools/`.

## Typography Direction T1 — "Cut 42 sizes to 9" (tighten, keep every family)

A declared scale, tokenised, mapped by role. Proposed steps (rem): **0.75 / 0.8125 / 0.875 / 1.0 / 1.125 / 1.3 / 1.55 / 2.3 / 2.7-clamp / 4.6-clamp** (12 / 13 / 14 / 16 / 18 / 20.8 / 24.8 / 36.8 / 43.2 / 73.6 px).
- **Floor at 12 px** for anything that is content: tags/chips 10.56→12, partner/kind lines 10.88→12, tool role/status 10.56→12, hints 10.88→12, year-rail-cap 9.6→12 (or drop its text to icon-only). Purely decorative micro-text (the ✦ glyphs) exempt.
- Card bodies unify on 14 (0.875); ledes on 16; blurbs 16.8→16 or 18, not between.
- `h3` band separates from body: value/service titles → 18 px (1.125) so weight stops doing all the work (TYP-04).
- Footer h2 stays small (documented choice, respected) but rises to 12 px.
- Input 16 px (TYP-03). Tracking caps at 0.14 em below 12.5 px (TYP-08).
- **Cost**: ~40 declarations touched, visual QA on 9 pages ×2 themes; no font work. **Risk**: credits/compendium cards grow ~2–3 px per line; the dense "telemetry" look loosens slightly (judged: at 10.5 px it was buying density with legibility it didn't have). **Does not fix**: loading/fallback, pairing, faux italic.
- Verified interaction with palette: at 12 px the tags still need PAL-05's ink fix — size alone does not clear 4.24 on panel-2; do both.

## Typography Direction T2 — "One mono" (re-pair; escalation of T1)

Everything in T1, plus consolidate the monos. Two variants, honestly weighed:
- **T2a — JetBrains Mono everywhere** (recommended of the two): `--font-mono` → JetBrains Mono. Measured case: x-height 55 vs Space Mono's 50 (+10 % legibility at the same px — exactly what the micro layer needs), narrower advance (432 vs 440.6 per 15 chars → ~2 % more characters per chip), real 500 weight available for labels (Space Mono has only 400/700 — the reason half the labels are 700-tracked-caps today), and the brand face and UI face become the same voice (TYP-11 resolved by subtraction). Drops two static files (Space Mono 400/700 ×2 subsets, ~65 KB). Loses (judged): Space Mono's retro-NASA quirk — its dotted zero and bent "l" are genuinely more "1970s star chart" than JBM's sobriety; the nav/labels get ~5 % plainer.
- **T2b — Space Mono everywhere**: brand word → Space Mono 700. Keeps the quirk, drops JetBrains Mono (2 files), but the brand loses its 800 weight (SM has no 800; 700 measured ink 5759 vs JBM-800's 6399 — the lockup gets visibly lighter) and the micro layer keeps the smaller x-height. Cheaper, weaker.
- Also in T2: preload correction (add `space-grotesk-normal-latin.woff2` + the brand mono file; drop nothing — 4 preloads total ≈ 120 KB, all render above the fold on every page — TYP-06); un-italicise `.belief-quote` (TYP-05); trim `FAMILIES` in `tools/vendor-fonts.mjs` to weights actually rendered.
- **Cost**: T2a half a day + re-vendor + lockup QA against the brand asset (the wordmark is "set in JetBrains Mono" per `:99` — **T2a keeps that true; T2b breaks a recorded brand decision and should not be chosen without the brand owner in the room**). **Does not fix**: anything palette-side.

## Combination matrix

| | **T1 (scale only)** | **T2 (scale + one mono)** |
|---|---|---|
| **A (surgical)** | **The compliance package.** ~1.5 days. Every measured AA failure closed, micro-text legible, zero identity movement. Buys: green audit. Doesn't buy: light-theme parity, starfield worst-case class, semantic gold. *Choose if the goal is "pass, ship, move on".* | Odd pairing — font consolidation is a bigger identity move than any colour in A; if you're touching the brand mono you've left "surgical". Not recommended. |
| **B (retune)** | **The engineer's choice — recommended.** ~3 days. Policy-verified inks on composited grounds, bounded translucency, semantic aliases, plus a real type scale. Buys: durability (future washes/pages can't silently fail; the audit script becomes a regression test). Doesn't buy: luminous gold in light, label-semantics split. | **Best value overall.** ~4 days. Everything left of it, plus the micro layer gets JBM's x-height exactly where T1's 12 px floor needs help, and the font payload drops. Risk concentrated in the lockup QA. |
| **C (two skies)** | Mismatched — C's label/ink re-articulation deserves the type consolidation; doing C while keeping 42 sizes wastes its budget. | **The flagship.** ~1.5–2 weeks. Light becomes a designed theme, gold means one thing, the atmosphere contract makes the starfield failure class impossible, one mono voice. Buys: the site light-theme screenshots stop looking like a fallback. Costs: visible change, brand sign-off needed twice (gold label move, glow shape). |

If one cell must be picked: **B × T2a**, with C's corona-glow (item 3) cherry-picked into it — the corona is independently the cleanest fix for PAL-01's mechanism and costs one gradient.

---

# Section 5 — What is already right (do not touch)

1. **The dark accent set.** Every accent on every panel it actually sits on: 6.25–13.6:1 (full table §1.1/§2 maths). AAA for body-adjacent uses of polaris, nebula, stellar. This is *unusually* good for a five-accent dark palette; nothing in Direction A/B touches a dark accent.
2. **The accent/dim/glow triad architecture and the per-card `--accent` contract** (`.a-*` classes setting `--accent/--accent-dim/--accent-glow`, consumed by rails/rims/spotlights/icons). It is the reason the proposals above are one-line retargets instead of rewrites. The `--accent-2` two-colour star mechanism (Afterglow) is a genuinely elegant extension.
3. **The light theme being a re-derivation, not an inversion**: accents re-picked per surface with recorded ratios, starfield re-inked with normal blending, scrims flipped as tokens, brand colours re-derived where they fail on white (`android`, `nintendoswitch`). The *process* was right; it just stopped one compositing layer short (PAL-01). Same for `--warn` deliberately sitting outside the brand family with its reasoning written down.
4. **Multi-cue state design**: tag-live vs tag-pending by border *style*; horizon tools by dashed border + opacity + dot; filter active by fill + ink; the ⚠ by glyph. This is why the CVD simulation (PAL-12) found no meaning carried by hue alone — that is design, not luck.
5. **`.prose-link`**: underlined, offset, colour-verified in both themes, with a designed `:focus-visible`. The one fully-correct interactive text treatment on the site — Direction A's global focus rule is essentially "make everything else as good as this".
6. **Comet and ember existing at all** — minting two new families rather than overloading five existing meanings on the contact page was the architecturally correct call (the comment at `:48–51` shows the reasoning; PAL-10 exists precisely where this discipline was *not* applied to gold).
7. **Reduced-motion discipline**: animations rest at finished states by construction; the audit's frozen-field methodology only works because of it.
8. **Vendored, subset, variable fonts with `font-display: swap`** and real (not synthesised) weights throughout — measured, §1.3/TYP-09. The vendoring script's UA-negotiation and verbatim-block approach did its job.
9. **The opaque nav** and its `theme-color` twins; the fixed-scrim video play button; the light `--logo-plate` under third-party marks in both themes.
10. **Body type**: 16 px Inter at 1.7–1.8 line-height, 29–74 cpl nearly everywhere measured — the reading layer itself is sound. The heading progression 96/73.6/43.2/36.8 is a real scale; TYP-01 is about everything *below* it.

# Section 6 — What was not measured, and what it would take

1. **Mobile contrast census.** The full element-level contrast walk ran at 1440×900 only; 390 px got screenshots, font-size probes and CPL. Tokens don't change per width so flat ratios hold, but composited grounds shift (glow positions, field scale 1.9–2.3×). Re-running `census.mjs` with `VIEW = 390×844` is ~20 minutes of machine time.
2. **Hover/active/visited exhaustively.** 17 controls were probed live in both themes + analytic checks on the rest; `:visited` styling is nowhere defined (links don't distinguish visited — arguably a finding, listed here because it was not measured). A full hover census would need per-element `.hover()` sweeps (~2,500 interactions).
3. **The starfield is stochastic.** Star positions are random per load; the census froze one frame. Minima under PAL-06 are therefore *samples of the class*, not bounds — the analytic worst-case (full-white sprite) is the bound and is what the proposals were verified against.
4. **Real iOS behaviour** (focus zoom, dynamic-type, PWA theme-color): inferred from documented thresholds + the 13.6 px measurement; no physical device in the loop.
5. **Forced-colors / Windows High Contrast mode**: not tested; the heavy reliance on borders at 1.1–2.2:1 (PAL-09) suggests `forced-colors: active` would actually *improve* control visibility, but that is unverified.
6. **AAA sweep**: AAA was noted where incidental (§ PAL-17); a systematic AAA table was out of scope once AA had this many findings.
7. **CVD with real users**: matrices simulate dichromacy; anomalous trichromacy (far more common) was not simulated. The Δ<60 threshold is a heuristic, stated as such.
8. **`tools/responsive-audit.mjs`** was reviewed, not run: it measures overflow, tap targets, header opacity, collapse behaviour and third-party requests. It is **structurally incapable** of detecting anything in this report — it never reads a colour, a font size, or a composited pixel. Its passing output claims nothing about palette or type, and should not be read as if it did. The sampling census built for this audit (`scratchpad/palette-typography-audit/census.mjs`) is the missing counterpart and is promotable to `tools/` essentially as-is if a contrast regression gate is wanted.
9. **Print styles**: none exist; unmeasured, unjudged.

---
*Raw data: `scratchpad/palette-typography-audit/data/census.json` (2,590 records), `measure2.json`, `verify.json`. Screenshots: `scratchpad/palette-typography-audit/shots/` (36 full-page + 4 verification crops). Scripts: `census.mjs`, `analyze.mjs`, `measure2.mjs`, `verify.mjs`, `colormath.mjs`.*
