# Web research — how the most-visited sites do colour and type (2026)

Date: 2026-08-29. Purpose: ground the Palette Lab's exploration slots in what
the most-popular websites actually ship, after the first exploration set was
rightly rejected as "single-colour tone maps". This is the workings file for
the `DeepSpace` / `Jewel` / `Arcade` lab slots and the `T3` / `T4` type
directions.

Scope honesty: "top 50 by traffic" (Google, YouTube, Facebook, Instagram,
ChatGPT, Reddit, X, Wikipedia, Amazon, Netflix, TikTok…) skews to search,
social and commerce properties whose branding surface is thin. The analysis
below leans on the design-relevant subset of that list plus the design systems
those companies publish (Primer, Material, Radix), which is where the actual
palette engineering is documented.

## The structural finding

**Nobody tints the whole page toward one hue.** Every major dark theme is built
the same way:

1. **A neutral (or near-neutral) ground ramp.** GitHub `#0d1117 → #161b22 →
   #21262d`; Material/Spotify `#121212` + tonal elevation; Netflix `#141414`;
   Vercel pure `#000`; Discord `#1e1f22 → #2b2d31 → #313338`; Steam's blue-slate
   `#171a21 → #1b2838 → #2a475e`. The ground carries at most a whisper of hue.
2. **Multiple saturated accents, each owning a semantic job.** Primer dark:
   blue `#2f81f7` links, green `#3fb950` success, red `#f85149` danger, purple
   `#a371f7` special, amber `#d29922` caution. Discord blurple `#5865f2`,
   Twitch purple `#9146ff`, Netflix red `#e50914`, Steam blue `#66c0f4`,
   Stripe `#635bff`, Linear `#7c5cfc`, Supabase `#3ecf8e`.
3. **Depth from layered elevation, not from cast.** Radix's 12-step scale is
   the cleanest statement: steps 1–2 app backgrounds, 3–5 component
   backgrounds, 6–8 borders, 9–10 solid fills, 11–12 text. Material 3 does the
   same with five surface-container tones. "Richness" is many accents at full
   saturation sitting on a disciplined neutral ramp.
4. **Dark as a first-class theme, not an inversion** — GitHub, Linear,
   Supabase all state this explicitly; it matches the palette audit's PAL-13
   finding about this site's light theme.
5. 2026 trend layer: **jewel tones** (sapphire, emerald, amethyst, ruby) as the
   accent register on charcoal/ink grounds, warm metallics (gold, copper) as
   contrast — which is convenient, because HQM's gold already is one.

Why the first exploration set failed: it changed the *ground* to the accent's
hue and re-tinted the star inks and hairlines to match — a colour-grade over
the same design. The sites above do the opposite: ground goes neutral, accents
diverge.

## The lab slots this produced

All values verified by the lab's own composited contrast table, both themes,
`all 60 pairs ≥ 4.5` at time of writing. Light glow seeded at 0.08 (the palette
audit's B discipline).

- **DeepSpace** — Primer's ramp verbatim (`#0d1117/#161b22/#21262d`,
  `#010409` void = their canvas.inset) with HQM's token roles mapped onto their
  accent hues. Light uses Primer's **700-tier** inks, not the 600s: the 600s
  are tuned for white and measured ~4.3 on this site's `panel-2` and hero
  grounds. That correction is the lab's, not Primer's error.
- **Jewel** — the 2026 jewel-tone register on a Radix-style neutral ramp:
  ink-charcoal grounds (≈3% violet), emerald/sapphire/amethyst/ruby/gold/copper
  each at full depth; gallery-ivory light with jewel inks.
- **Arcade** — the gaming-platform synthesis: Steam's blue-slate ground family,
  Steam blue `#66c0f4` as comet, Twitch violet (brightened to `#b685ff` to
  clear panel-2), gold kept as the north star.

## Type

What the top properties run: **custom grotesques** (Discord gg sans by
Colophon; Reddit Sans; YouTube Sans; Spotify's and TikTok's own faces) or
**system stacks** — the practical takeaway for a site that vendors its fonts is
"one good grotesque family used consistently", not "more families".

Measured usage (MaxiBestOf top-25 tracker, 2026): **Inter #1 by a wide margin**
(the site already uses it — keep), Suisse Int'l / PP Neue Montreal / ABC
Diatype next (commercial), **Geist Mono #5 and climbing** — the standout mono
trend. On Google Fonts specifically, the strong 2026 installs: **Bricolage
Grotesque** (most-installed new sans of the last 24 months), **Plus Jakarta
Sans**, **Hanken Grotesk**, Instrument Sans, Outfit, Sora, Manrope. Space
Grotesk itself is still cited as a distinctive tech-brand heading face — the
site's existing choice is not dated.

Lab additions this produced:

- **Font dropdowns** now carry the researched candidates, marked `(web)`:
  body — Plus Jakarta Sans, Hanken Grotesk, Instrument Sans, Manrope, Geist;
  display — Bricolage Grotesque, Sora, Outfit, Geist;
  mono — Geist Mono, IBM Plex Mono, Fira Code; brand — Geist Mono.
- **T3 "Grotesk refresh"** — Bricolage display over Hanken body.
- **T4 "Geist suite"** — Geist + Geist Mono everywhere, the Vercel voice; the
  most "big-tech 2026" option and the furthest from the retro-NASA identity.
- Loading is **dev-only**: the lab injects one Google Fonts stylesheet for
  exactly the families the current slot uses, and removes it when none are in
  play. Nothing ships — adopting a face for real means adding it to
  `tools/vendor-fonts.mjs` and re-running `npm run vendor`, keeping the
  site's no-third-party-origin rule intact.

## Sources

- [Similarweb — Top Websites Ranking](https://www.similarweb.com/top-websites/) · [Exploding Topics — Most Visited Websites](https://analytics.explodingtopics.com/website) · [DataRefs — 100 Most Visited Websites 2026](https://www.datarefs.com/top-reports/most-visited-websites-in-the-world/)
- [Primer — UI colour system](https://primer.style/foundations/color/overview/) · [GitHub Blog — Primer's colour tooling](https://github.blog/news-insights/product-news/accelerating-github-theme-creation-with-color-tooling/) · [GitHub dark-mode values](https://themeandcolor.com/blog/github-dark-mode-colors)
- [Radix Colors — understanding the 12-step scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)
- [Material 3 — colour and elevation](https://github.com/material-components/material-components-android/blob/master/docs/theming/Color.md) · [M3 dark-theme codelab](https://codelabs.developers.google.com/codelabs/design-material-darktheme)
- [Discord dark-mode values](https://themeandcolor.com/blog/discord-dark-mode-colors) · [Discord — gg sans FAQ](https://support.discord.com/hc/en-us/articles/9507780972951-gg-sans-Font-Update-FAQ) · [Twitch brand colours](https://chromacreator.com/brands/twitch) · [Netflix brand colours](https://chromacreator.com/brands/netflix) · [Spotify colours](https://usbrandcolors.com/spotify-colors/) · [Steam palette](https://colorswall.com/palette/193)
- [Vercel design system breakdown](https://seedflip.co/blog/vercel-design-system) · [Dark-mode accent colours with hex](https://seedflip.co/blog/accent-colors-dark-mode) · [Muzli — dark-mode design systems](https://muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy/)
- [MaxiBestOf — most popular typefaces 2026](https://maxibestof.one/typefaces/popular) · [Typewolf — 40 best Google Fonts](https://www.typewolf.com/google-fonts) · [MadeGood — best new Google Fonts 2026](https://madegooddesigns.com/best-new-google-fonts-2026/) · [MadeGood — font trends 2026](https://madegooddesigns.com/font-trends-2026/)
- Trend layer: [Envato — 2026 colour scheme trends](https://elements.envato.com/learn/color-scheme-trends-in-mobile-app-design) · [Zeka — 30 palettes 2026](https://www.zekagraphic.com/30-creative-color-palette-ideas-for-2026/)
