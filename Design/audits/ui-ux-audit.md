# UI/UX Adversarial Audit — hyperquantmedia.com

- **Pass:** Blind adversarial UI/UX review (independent; `WAYPOINT.md` and everything else under `Design/` deliberately not read, per the blindness rule).
- **Date:** 2026-08-29
- **Build tested:** commit `832c82db67be20a2fa3c3fbe8acb9eff921f241c` ("stop rendering the Liked/Watching chips"), clean tree, `npm run build` → `astro preview` (Astro 7.2.x), tested against the static `dist/` output at `http://localhost:4321`.
- **What was actually exercised:** all nine pages in headless Chromium (Playwright 1.62.1), both `prefers-color-scheme` themes; full keyboard Tab traversal of `/`, `/credits/`, `/compendium/` (and spot checks elsewhere) with computed focus-indicator styles recorded per stop; measured WCAG contrast ratios for ~35 element/theme pairs via ancestor background compositing (gradient layers flagged as approximations); mobile menu open/close/Escape at 390px; desktop submenu via mouse hover, click, and keyboard; credits platform filter; compendium search + kind filter incl. the empty state; trailer-button activation (iframe injection observed); theme-toggle three-state cycle; `reducedMotion: 'reduce'` render of the Cosmos constellation; horizontal-overflow probes at 320px; full-page screenshots at 1280/390 in both themes; YouTube video IDs verified against oEmbed titles; thumbnail URLs verified to exist.
- **What is reasoned, not exercised:** real screen-reader behaviour (no NVDA/JAWS/VoiceOver run — items below marked accordingly), Firefox/Safari/WebKit rendering, real touch hardware, text-only zoom at 200%, the production GitHub Pages host (redirects, `_redirects` handling), and actual YouTube playback after iframe injection. Judgement calls are labelled **[judgement]**; everything else cites a measurement or a `file:line`.

Line numbers reference the source files at the commit above.

---

## Executive summary

The site is visually accomplished, technically disciplined (theming, motion safety, self-hosted assets, responsive behaviour to 320px are all genuinely good), and its biggest failures are not in the pixels — they are in **what a stranger can understand and believe**:

1. **The site never plainly says what the company does.** Above the fold, the concrete offering ("games · ar-vr · applied ai · web · consulting") exists only as a 13px mono line styled as a code comment. Everything louder is metaphor. (UX-01)
2. **The navigation vocabulary is internal.** "Cosmos", "Credits"-that-is-actually-"Star Chart", "Vision" — and the site's largest content page (Compendium) hangs behind a 22×22px chevron that hover does not open. (UX-02, UX-03, UX-20)
3. **The credits page's framing overclaims.** The `<title>` says "Titles We've Shipped" and the homepage button says "Shipped Titles" while the page itself correctly disclaims that these are individual team members' credits at other studios. A prospective client who notices the gap trusts everything else less. (UX-50)
4. **Keyboard and assistive-tech users are underserved in specific, measurable ways:** no `<main>`, no skip link, focus indicators on the primary nav measuring 1.28:1, a search field with `outline: none`, zero headings inside the two catalogue pages, filters with no state semantics and no result announcements. (UX-28 through UX-34)
5. **Contact is a mailto-only funnel.** For the large population whose browser has no configured mail client, every contact affordance on the site silently does nothing. (UX-22)
6. **Six of the seven Cosmos tools are dead ends** described in riddles ("Every operator keeps a rhythm. This one learns yours, and names it back."), with no plain sentence anywhere saying what each tool actually is. (UX-06, UX-12)
7. **One outright WCAG contrast failure shipped:** the dotted "pending" platform tags on `/credits/` measure 2.34:1 (dark) / 2.44:1 (light). (UX-32)

---

## A. Information architecture

### UX-01 · High · Homepage — the fold does not say what the company is
**Where:** `src/pages/index.astro:17-40`, `src/styles/style.css:907-913` (`.hero-sub`).
**What a real user does:** a first-time visitor with thirty seconds lands and reads, top to bottom: a gold pill ("Creative Technology ✦ Developer Tools ✦ Interactive Experiences"), "We Chart the Uncharted", "Bespoke digital products, a constellation of developer tools, and experiences people move through," and two buttons ("Explore Services", "See the Cosmos"). None of that says *games studio*, *agency*, or *what you can buy*. The one concrete line — `// games · ar-vr · applied ai · web · consulting` — is 13.4px `--star-dim` mono deliberately styled as a code comment, the least prominent text in the hero.
**Evidence:** screenshot at 1280×900 dark; the five service cards (the actual answer) are entirely below the 100vh hero.
**[judgement]** on the ranking; measured on what is above the fold.
**Direction:** let one plain sentence near the H1 carry the category ("A games and creative-technology studio that builds…"), or promote the `//` line out of comment styling. The metaphor can stay; it just cannot be the only thing.

### UX-02 · High · Site-wide — one page, three names: "Credits" / "Star Chart" / "Titles We've Shipped"
**Where:** `src/data/site.js:58` (nav label "Credits"), `src/pages/credits.astro:119` (H1 "Star Chart"), `src/pages/credits.astro:105` (`<title>` "Credits — Titles We've Shipped"), `src/components/Pedigree.astro:100-124` (button "Explore the Full Star Chart of Shipped Titles").
**What goes wrong:** a visitor who clicks "Credits" lands on a page headed "Star Chart"; a visitor who clicks the homepage's "Star Chart" button lands on a URL and tab title that say "Credits". Neither label predicts the other. The nav's mental model has to be learned per page.
**Direction:** pick one public name and let the others become subtitles. (Which name is the trust-correct one is UX-50.)

### UX-03 · Medium · Nav — Compendium's placement contradicts its parent's own definition
**Where:** `src/data/site.js:44-56`, `src/pages/cosmos.astro:28` ("tools we forged for our own work"), `src/pages/compendium.astro` ("third-party software we rate").
**What goes wrong:** Cosmos is defined on its own page as *our* tools; Compendium is explicitly *other people's* tools. Nesting the second under the first means a visitor who has actually read the Cosmos page is the one most likely to be confused by the submenu. The source comment (`site.js:47-53`) says they are "the same subject seen from both sides" — that is an insider's symmetry a first-time visitor does not have.
**[judgement]**, and the maintainer's own comments show it was decided deliberately — flagged anyway per the audit contract.
**Direction:** either surface Compendium as a top-level "resource" (its independence story is a marketing asset), or make the Cosmos page's copy introduce the pairing explicitly where the submenu implies it.

### UX-06 · Medium · Cosmos — six of seven tool cards are dead ends
**Where:** `src/data/products.js:29-100` (only `compendium` has `href`/`repo`), `src/components/ToolCard.astro:44-70`.
**What a real user does:** a visitor intrigued by Astra or Pulsar looks for anything to click. There is nothing — no detail page, no screenshot, no docs, no waitlist link on the card. The only outlet is a single ghost "Request Early Access" button two sections further down, and the generic "Get In Touch". The constellation figure's stars *look* clickable and are links — but they only scroll to these same cards.
**Evidence:** DOM traversal; tab order on `/cosmos/` contains no card-level links except Compendium's two.
**Direction:** give every card one action, even if it is only "Get notified" pre-filled with the tool's name (the contact page's mailto-subject pattern already exists for exactly this).

### UX-05 · Low · 404 — "Report a Broken Link" under-delivers
**Where:** `src/pages/404.astro:31`.
**What goes wrong:** the button promises a reporting action but lands on the generic contact page; the visitor must re-explain from scratch. The site already knows how to pre-fill mailto subjects (`src/pages/contact.astro:44-75`) and the 404 page even knows nothing about the bad URL it could have quoted.
**Direction:** point it at a `mailto:` with subject "Broken link" (the referring URL cannot be known statically, but the subject can).

### UX-07 · Low · In-page anchors never update the URL
**Where:** `public/js/app.js:461-476` (`e.preventDefault()` + `scrollIntoView`, no `history` update).
**What goes wrong:** the year rail on `/credits/` and the constellation stars on `/cosmos/` navigate, but the address bar never gains `#y-2019` / `#astra`, so a visitor cannot copy a link to a year or a tool, and Back does not return them.
**Direction:** push the hash (or drop `preventDefault` and rely on CSS `scroll-behavior` + `scroll-margin-top`, which are already in place).

---

## B. Visual hierarchy and scanning

### UX-08 · Medium · Homepage — third-party logos are the brightest thing on the page
**Where:** `src/components/Pedigree.astro:76` (`feature` treatment), `src/styles/style.css:1345-1352` (`.pedigree-feature` min-height 66svh), `.logo-tile` white plates (`--logo-plate`).
**What goes wrong:** on a near-black page, fifteen white tiles form the highest-contrast band on the homepage — deliberately sized to "own" a viewport stop. The eye lands on PlayStation/Xbox/Gearbox marks before it lands on anything HyperQuant made. Combined with UX-51 (what those logos actually mean), the loudest element is also the most easily misread one.
**[judgement]** on prominence trade-off; measured on luminance (white tiles vs `#04040c` ground).
**Direction:** if the band keeps its size, make the *relationship labels* (client / alliance / credential) visible on it — the prominence is then honest labour instead of borrowed light.

### UX-09 · Medium · Cosmos — "The Field" spends a full band saying what the next section says better
**Where:** `src/pages/cosmos.astro:78-93`, `src/components/ConstellationField.astro`.
**What goes wrong:** the constellation figure is beautiful, but for a first-time visitor it is seven unlabeled-at-phone-widths glyphs (labels hidden below 768px — `style.css:2554`) whose only interaction is scrolling to the cards directly beneath it. The information it carries (names + one-line roles, via hover `<title>` only) is a strict subset of the card stack that follows. On a phone it is a band of small marks with no names at all.
**[judgement]** — it is also the single strongest "these people can build things" signal on the site, so this is a trade, not a defect.
**Direction:** consider letting the figure earn its space: surface the role line on hover/focus visibly (not only native `<title>` tooltips), or fold the section into the cards' header.

### UX-10 · Low · Homepage — two consecutive sections with the same sentence shape
**Where:** `src/pages/index.astro:76` ("We don't just use the tools. We forge them.") and `index.astro:101` ("We don't just build for others. We build for ourselves too.").
**What goes wrong:** back-to-back "We don't just X. We Y." headlines read as one template stamped twice; skimmers blur them into a single section and miss that one is products and the other is the studio.
**Direction:** vary one of the two constructions.

### UX-11 · Low · Small-type density in the utility layer
**Where:** measured computed sizes: platform/cost tags 10.56px (`--font-mono`, letter-spaced), year-rail labels 10.56px, tool roles/status 10.56px, footer headings 11.52px, credit lines 11.52px.
**What goes wrong:** everything secondary on this site is 10–11.5px letter-spaced uppercase mono. Each instance is a defensible label; in aggregate the site's entire metadata layer sits below comfortable reading size, and all of it passes contrast only because the palette was tuned to (several rows sit at 4.5–5.3:1 exactly).
**[judgement]** on comfort; measured on sizes and ratios.
**Direction:** one step up (0.72rem → 0.78–0.8rem) on the most-read labels (tags, filter buttons) would cost little.

---

## C. Copy and content design

### UX-12 · High · Cosmos — tool descriptions are riddles; no card says what the tool is
**Where:** `src/data/products.js` blurbs, e.g. Astra ("You may forget — the machinery never will, at depth and at breadth."), Pulsar ("Every operator keeps a rhythm. This one learns yours, and names it back."), Afterglow ("Most of what you capture was never worth keeping. It knows which part was.").
**What a real user does:** a potential client or curious developer reads a card and still cannot answer "what does this do, and would I use it?" The roles ("The Cartographer", "The Timekeeper") add mood, not meaning; the chips ("Propose, never impose") are values, not capabilities. Only Compendium and Warpgate blurbs parse on first read.
**Evidence:** the data file itself keeps plain-language `long` descriptions for public tools (`products.js:29-41`) — so the register is a choice, and for unreleased tools the vagueness may be deliberate confidentiality. Flagged regardless: the current copy reads as withholding, and a stranger cannot tell deliberate mystery from absence of substance.
**Direction:** one plain clause per card ("video-editing triage", "team environment provisioning") — effect-not-mechanism wording can stay confidential while still being parseable.

### UX-13 · Medium · Vision — the same sentence appears twice on one screen
**Where:** `src/pages/vision.astro:20` (hero sub) and `vision.astro:31-34` (Mission card): "Our mission goes beyond… delivering digital solutions — we aim to set new standards for innovation, creativity, and impact" — verbatim, twice, one viewport apart.
**Direction:** let the hero tease and the card state, or vice versa.

### UX-14 · Medium · Compendium — the shelf explanations exist in the data and never render
**Where:** `src/data/compendium.js` — each kind carries a `blurb` ("Engine-agnostic source dependencies — the licence decides whether you can ship it…", "Not software: reference sites… A free site may still point at a paid book."). `src/pages/compendium.astro` renders `k.sections` only; the blurbs reach the JSON-LD (`schema.js:251`) but no visitor.
**Evidence:** grep + rendered DOM. These one-liners are precisely the orientation the page lacks (see UX-40).
**Direction:** render the kind blurb as each kind's (currently missing) heading block.

### UX-15 · Medium · Site-wide — insider vocabulary is used as structural labels
**Where:** section kickers and headings: "The Field", "The Bodies", "The Deep Chart", "The Librarian's Shelves", "Forge Games · Build Builders" (`studio.astro:36`), "Each a star in its own right".
**What goes wrong:** kickers are where scanners look for scent; here they consistently give theme instead of information. One or two would be flavour; as the *system* of labels it forces every visitor to translate.
**[judgement]** — this is the brand voice, clearly intentional. The cost falls on personas (a) and (c), who don't yet care about the voice.
**Direction:** keep the poetry in headings, put the information in kickers (or the reverse) — never both slots on the same section spent on theme.

### UX-16 · Low · Vision/Services — "partners in innovation, not service providers" appears on both pages nearly verbatim
**Where:** `vision.astro:117` (heading) and `services.astro:214` (body).
**Direction:** one page owns the line; the other alludes.

### UX-17 · Low · Studio — the stat row mixes measurements with jokes
**Where:** `src/pages/studio.astro:66-83`: "2 Titles in Development · 7 Tools in Development · 0 Mandatory Crunch · ∞ Ambition".
**What goes wrong:** two real counts share a row with a joke stat and a values statement dressed as a stat; the joke devalues the counts. Also "2 Titles in Development" counts NibbleBloom, whose own badge on the same page says **Ideation** — a reader who compares the number with the badges finds the number generous.
**[judgement]** on tone; measured on the ideation/count mismatch (`products.js:150-156`).
**Direction:** either all four are real, or the two real ones stand alone.

### UX-18 · Low · Language mix under `lang="en-GB"`
**Where:** `Base.astro:45` declares `en-GB`; Services says "optimisation/localisation" style while Studio says "Stabilize", "specializations" (`studio.astro:55,150`) and products say "localization" (`compendium.js` Naninovel note).
**What goes wrong:** minor, but the site elsewhere documents British English as a deliberate contract (`Base.astro:96-99` og:locale comment). "Stabilize" is a named phase, so it may be a term of art — flagged, not resolved.
**Direction:** pick one spelling system for prose; keep phase names if they are proper nouns.

---

## D. Interaction design

### UX-20 · Medium · Desktop nav — hover does not open the submenu; the only affordance is a 22px chevron
**Where:** `src/components/Nav.astro:96-137`, `public/js/app.js:322-341`, `style.css:517-530` (`.nav-sub-toggle` 22×22px).
**Measured:** hovering "Cosmos" for 400ms does not open the panel (`hover opens false`); only clicking the chevron does. Every mainstream marketing-site dropdown opens on hover or on parent-click; here the parent navigates and the chevron is the smallest interactive element in the header.
The keyboard path works correctly (Enter on the toggle → Tab reaches "Compendium" → Enter navigates — verified), and the parent-stays-a-link decision is architecturally right. The gap is discoverability for mouse users, who get no hover response at all on the chevron's 13px glyph until they find it.
**Direction:** open on hover of the whole `.nav-has-sub` (with a close delay), keeping click/keyboard semantics exactly as they are; or enlarge the toggle to ≥24px (also UX-34).

### UX-21 · High · Credits — trailer playback injects an iframe *inside* the button
**Where:** `public/js/app.js:154-168`, `src/pages/credits.astro:160-180`.
**Measured:** after activation the DOM is `<button class="chart-video" aria-label="Play the E-Cricket trailer"><iframe title="Trailer" …>` — interactive content nested inside a `button`, which is invalid HTML and unreliable for AT: a screen-reader user still finds a "Play the E-Cricket trailer, button" whose activation now does nothing, wrapping a player they may not be able to reach; a keyboard user tabs "into" a button. All sixteen iframes share the generic title "Trailer".
**Direction:** on activation, replace the button with the iframe (or a wrapper `div`), and title the iframe "E-Cricket trailer (YouTube)". Focus should land on the iframe.

### UX-22 · High · Contact — mailto: is the only path in
**Where:** `src/pages/contact.astro:36-77`, plus every "Get In Touch" CTA site-wide.
**What a real user does:** a prospective client on a work machine with no default mail app (i.e. most webmail users) clicks "Game Development" and *nothing visibly happens* — the classic dead mailto click. There is no form fallback, no "copy address" affordance (the addresses are at least displayed as text on the right column, which softens this), and the same dead-end applies to the nav CTA on every page. The page's own copy frames this as a feature ("no form, no third-party service") — an honest trade, but the visitor who hits the dead click never reads the rationale.
**[judgement]** on how many users are affected; the mechanism is fact.
**Direction:** keep mailto as primary if the no-backend stance matters, but add a one-click "copy email" and consider a minimal static-friendly form service; at minimum, make the addresses visibly copyable next to the topic grid, not only in the right column.

### UX-23 · Medium · Reduced motion — in-page anchor scrolling still animates
**Where:** `public/js/app.js:470` (`scrollIntoView({ behavior: 'smooth' })` unconditional).
**Why it matters:** `html { scroll-behavior: auto }` under `prefers-reduced-motion` (`style.css:3488-3491`) is correctly in place, but an explicit `behavior: 'smooth'` in JS overrides the CSS, so year-rail and constellation jumps animate for exactly the users who asked them not to. The site is otherwise exemplary here (starfield, comet, CTA scenes, view transitions, 404 game all respect the setting), which makes this one-liner stand out. `toTop` gets it right two hundred lines earlier (`app.js:262-266`).
**Reasoned from code** (spec behaviour of scrollIntoView), not run under a motion-sensitivity test.
**Direction:** reuse the `reduceMotion()` helper already defined in the same file.

### UX-24 · Medium · Filters and search — state feedback is visual-only and stateless
**Where:** `app.js:377-400` (credits), `app.js:424-455` (compendium).
**Measured:** filtering to "Android" collapses sixteen cards to one with zero announcements (0 live regions on the page) and no visible result count for sighted users either; the URL carries nothing, so refresh/share/Back all reset silently. On the compendium the same applies to search.
**Direction:** a small "n of 51 shown" line beside the controls (doubling as an `aria-live=polite` region) fixes sighted feedback, SR feedback, and the empty state's context in one element.

### UX-25 · Low · External links give no new-tab warning
**Where:** all `target="_blank"` links (social, store tags, compendium destinations, repo links).
**What goes wrong:** SR and keyboard users get no "opens in new tab" cue; the aria-labels ("OBS Studio — Download") are otherwise good.
**Direction:** append "(new tab)" to the aria-label or add a visually-hidden suffix.

### UX-26 · Note · Theme toggle is one-way on the live site
**Where:** `ThemeToggle.astro` comments, `app.js:189-216` (`devHost()` gate).
**Measured (dev host):** system → light → dark → system cycles correctly. On production the third step is deliberately removed: after one click, "follow my device" is unreachable without clearing site data. The control's own labels never offer it, so nothing is mislabelled — but a visitor who toggled once to peek can never return to auto behaviour. Deliberate per the comments; flagged as a visitor-hostile default anyway.
**Direction:** allow the cycle to close on production too, or add "auto" to the cycle only when the stored value matches the system (the dev behaviour, everywhere).

### UX-27 · Low · Compendium search input keeps its label only while empty
**Where:** `compendium.astro:81-88` — `placeholder="Search the shelves…"`, `aria-label` present, no visible label.
**What goes wrong:** placeholder-as-label disappears on input; a distracted user returning to a filled field has no visible reminder of what the box is. Acceptable pattern at this scale, listed for completeness.
**Direction:** none required; a persistent floating label would be a refinement.

---

## E. Accessibility

### UX-28 · High · No `<main>` landmark, no skip link, and focus resets to `<body>` on every client-side navigation
**Where:** `src/layouts/Base.astro:170-186` (`<Nav/> <slot/> <Footer/>` — the slot content is bare `<section>`s), verified on all nine built pages (`main: 0` everywhere).
**Measured:** the tab order on every page runs brand → 4 social links → 5-7 nav links → submenu toggle → theme toggle (= 14 stops on desktop) before the first content link; after a client-side navigation, `document.activeElement` is `<body>`, so a keyboard user re-runs the gauntlet on every page they visit. Astro's route announcer is present and working (verified: announces the new title) — the landmark and bypass are the missing half.
**WCAG:** 2.4.1 (Bypass Blocks), 1.3.1.
**Direction:** wrap the slot in `<main id="main">`, add a visually-hidden-until-focused "Skip to content" link as the first tab stop.

### UX-29 · High · Focus indicators fail on exactly the controls used most
**Measured:**
- Primary nav links: Bootstrap's default `.nav-link:focus-visible { outline: 0; box-shadow: 0 0 0 .25rem rgba(13,110,253,.25) }` survives the custom build (`public/vendor/bootstrap/bootstrap.custom.min.css`). That ring composites to **1.28:1** against the dark nav bar and **1.40:1** against the light one — far below the 3:1 an indicator needs. This includes the "Get In Touch" CTA.
- Compendium search: `outline: none` (`style.css:3179`) with a focus style that is only a border-alpha change measuring **1.4–2.1:1** against its own background.
- Everything else falls through to the Chromium default `outline: auto` ring (visible, but unstyled and inconsistent with the five controls that *do* have designed focus styles: `.prose-link`, `.field-star` labels, `.topic-link`, `.lost-canvas`).
**WCAG:** 2.4.7, 2.4.11/1.4.11.
**Direction:** one site-wide `:focus-visible { outline: 2px solid var(--polaris); outline-offset: 2px }` (the `.prose-link` rule generalised) and delete the two suppressions.

### UX-30 · High · The two catalogue pages have no headings below the H1
**Measured:** `/compendium/` heading outline is `H1: Compendium → H2: Navigation (footer) → H2: Contact (footer)`. Its 17 shelf sections ("Video and playback", "Physics", …) are `<span class="chart-year-label">` (`compendium.astro:57-63`); its 51 card titles are `<span>`s. `/credits/` likewise: `H1: Star Chart` then footer; 11 year groups and 16 title names carry no heading semantics.
**Why it matters:** heading navigation is the primary way screen-reader users traverse long pages, and these are the two longest pages on the site (compendium: 8,775px at 1280). A SR user gets one H1 and then 8,000px of flat content.
**WCAG:** 1.3.1; **reasoned** for SR impact (not run under a real SR).
**Direction:** `h2` per kind (see UX-14 — the missing kind headers), `h3` per section, `h4` (or strong) per card title; the visual styles already exist and need only be re-attached to heading elements. Same for credits years.

### UX-31 · High · Filters announce nothing and expose no state
**Where:** `credits.astro:127-134`, `compendium.astro:89-95`, `app.js:377-455`.
**Measured:** `.chart-filter-btn` buttons toggle a CSS class only — no `aria-pressed` (confirmed `null` on every button), so a SR user cannot tell which platform/kind is active; applying a filter or search silently hides content with no live region anywhere on either page (0 measured); the compendium empty-state paragraph flips `hidden` un-announced.
**WCAG:** 4.1.2, 4.1.3.
**Direction:** `aria-pressed` on the buttons (they behave as toggles in a group) and the result-count live region from UX-24.

### UX-32 · High · Measured contrast failures
All at their smallest rendered size, both themes checked:
| Element | Dark | Light | Requirement |
|---|---|---|---|
| `.tag-pending` (credits, dotted platform tags — text sits under its own 40% scrim, `style.css:2988-3004`) | **2.34:1** | **2.44:1** | 4.5:1 — **fails both themes** |
| `.tag` on studio project cards (over the featured-card aurora gradient; gradient-approximated) | **4.31:1** | 5.50:1 | 4.5:1 — fails dark |
| `.comp-creed li` (compendium hero chips, nebula on nebula-dim) | 10.52:1 | **4.08:1** | 4.5:1 — fails light |
Everything else sampled (nav, body, cards, tags, rails, footers, hero elements — ~35 pairs) passes, several at 4.5–5.3:1 exactly. The `::after` scrim on `.tag-pending` is the direct cause of its failure: it dims the *text* along with the chip.
**Direction:** exclude the text from the scrim (paint the scrim under the text node, or lighten `--star-faint` inside `.tag-pending`); nudge the studio tag colour on gradient cards; darken the creed chip's light-mode nebula one step.

### UX-33 · Medium · Meaning delivered only through `title` tooltips
**Where:** logo tiles (`Pedigree.astro:80` — "PlayStation Studios — Team credential"), pending tags (`credits.astro:196` — "No public store link for Android yet"), the ⚠ verify mark (`compendium.astro:78`), and (when re-enabled) the Liked/Watching legend (`compendium.js:31-35`).
**What goes wrong:** `title` on non-focusable elements is unreachable by keyboard, by touch (the majority of visitors), and by most screen readers. In the pedigree case this is load-bearing: the *only* per-logo statement of "client vs employer" lives in a tooltip nobody on a phone can open (see UX-51).
**WCAG:** 1.4.13 adjacent; **reasoned** for SR specifics.
**Direction:** surface relation labels as visible (or focus-revealable) text; give the ⚠ a real `aria-label` and an in-flow explanation nearer the top (it currently gets explained 8,000px down, `compendium.astro:113-118`).

### UX-34 · Medium · Target sizes below 24px
**Measured:** `.nav-sub-toggle` 22×22 (every page, the only path to the submenu — compare UX-20). Everything else audited clears 24px, including the year rail (24px min-height), footer links (padded to 24), and social icons (26-30px) — the codebase visibly engineered for 2.5.8 elsewhere, which makes this one omission look like an oversight.
**Direction:** 24×24 minimum on the toggle.

### UX-35 · Low · Decorative glyphs are plain text content
**Where:** `.section-label::before { content: '✦' }` (`style.css:993`), `.badge-item::before` (`style.css:846`), service icons `◉◇✦◈⬡` as text nodes (`index.astro:55`), `∞` as a stat (`studio.astro:78`).
**What goes wrong:** CSS `content` and Unicode glyph text are announced by most screen readers ("black four-pointed star What We Do"; the whole-card service links begin their accessible name with "fisheye"). Individually trivial; the pattern repeats on every section of every page.
**Reasoned** (standard SR behaviour), not run under a real SR.
**Direction:** `content: '✦' / ''` (alt-text syntax) for the pseudo-elements; `aria-hidden` spans for the literal glyphs.

### UX-36 · Low · Trailer thumbnails: empty alt is right, but the button is the only name
**Where:** `credits.astro:166-176`.
`alt=""` on the thumbnail plus `aria-label` on the button is correct composition. Listed to note the *quality* dimension: two thumbnails read as the wrong thing to sighted scanners — HaberDashers' frame is a "TINY RACERS" title card and Penn & Teller VR's is stamped "CANCELLED BITS #3" (verified genuine: they are YouTube's chosen frames of the real trailers). A stranger scanning the shipped-titles wall sees "CANCELLED" in red on a credit.
**Direction:** where YouTube's default frame misleads, self-host a chosen poster frame for those entries.

### UX-37 · Note · What already works (so it does not get "fixed" away)
Measured/verified positives worth preserving: three-state theme toggle with state-naming labels rewritten on every change; Escape closes both menus and returns focus to the opener; mobile menu is height-capped and scrollable; `aria-current="page"` on nav; the 404 game is off under reduced motion with an explanatory line, has a canvas `aria-label` with full instructions and a polite live region; the constellation renders complete (not blank) under reduced motion because every animation's resting state is the finished state; zero horizontal overflow at 320px on all pages tested; route announcer present; all images carry alt or empty-alt correctly; the credits store-link tags are honestly differentiated (live vs dotted-pending) by shape, not colour alone.

---

## F. Consistency

### UX-40 · Medium · The compendium's kind layer is invisible on the page itself
**Where:** `compendium.astro:100-140` — kinds render as unlabelled `div.comp-kind` wrappers; sections inside them reuse the credits page's year-header component verbatim.
**What goes wrong:** under the default "All" filter, "Files and comparison" (an Applications section) and "Physics" (a Libraries section) render at identical hierarchy with nothing marking where Applications end and Libraries begin. The taxonomy the filter buttons promise ("Applications / Libraries / Unreal Plugins / VS Extensions / Learning") does not exist visually in the content. This is the same gap as UX-14/UX-30 seen from the sighted-scanner side — one fix (rendered kind headers) closes all three.
**Direction:** render each kind's label + blurb as a visible tier above its sections.

### UX-41 · Low · Glyph vocabulary collides
**Where:** `services.js` icons vs `vision.astro` value cards (all four values share ⬡) vs `contact.astro` topics (⬡ = IT Consulting, but also the Vision values glyph; ✦ = Applied AI on the homepage but "Cosmos / Early Access" on contact and the brand star everywhere else).
**What goes wrong:** the site teaches "glyph = service family" on the homepage, then reuses the same glyphs as generic decoration elsewhere; ✦ in particular means brand, AI, "All", bullet, and year-marker depending on page.
**Direction:** treat the five service glyphs as reserved; give values/decorations neutral marks.

### UX-42 · Low · Footer: "Get In Touch" listed under "Navigation" beside a column headed "Contact"
**Where:** `Footer.astro:36-56` (navFlat includes the CTA) next to the Contact column.
**What goes wrong:** two adjacent columns offer the same concept under two names; the nav column's "Get In Touch" link and the Contact column's mailto rows race for the same click.
**Direction:** drop the CTA from the footer's flat list (it is a page link, but "Contact" as its label here would already fix the echo).

### UX-43 · Note · Status vocabularies
Tools use "Active Development / On the Horizon"; games use "Ideation / Pre-Production" — documented as deliberate two-ladder design (`products.js:104-118`) and it works, but nothing on the *pages* explains either ladder to a visitor (the explanation is a source comment). A one-line legend on Studio would let "Ideation" and UX-17's count reconcile themselves.

---

## G. The reference page (Compendium) at scale

### UX-45 · High · The empty state actively misleads when a kind filter is set
**Measured:** with kind = "Learning" active, searching "unreal" shows **0 results** and the message "Nothing on the shelves matches — try fewer letters." — while 4 entries matching "unreal" exist under other kinds. The advice given ("fewer letters") is precisely wrong; the fix the user needs (clear the kind filter) is never suggested, and the active filter is seven screens above the message with no visual tie to it.
**Where:** `compendium.astro:110`, `app.js:424-448`.
**Direction:** make the empty state state the active constraints ("No matches for 'unreal' in Learning — 4 matches in other shelves / clear filter") and offer the one-click reset.

### UX-46 · Medium · Finding a specific entry cold requires either the filter row or 8,775px of scroll
**Measured:** page height 8,775px at 1280×900 (≈10 viewports); the search/filter controls scroll away immediately and nothing is sticky; there is no per-kind anchor nav, no A–Z, no "back to controls" other than the generic back-to-top button. The kind filter is a *filter*, not a *navigator* — clicking "Learning" does not take you anywhere, it silently removes ~44 cards around you, which mid-page reads as the page suddenly ending.
**Direction:** sticky (or floating) search/filter on this page, or a slim kind-anchor rail — the year rail on `/credits/` is exactly this pattern, already built, and its absence here is itself an inconsistency between the site's two long catalogues.

### UX-47 · Medium · The ⚠ verify mark is used 11 times before it is explained
**Measured:** eleven `comp-verify` marks render across the shelves; the legend lives in the Independence block at the very bottom (`compendium.astro:113-118`) and in hover-only titles (UX-33). First-time reading: "red warning triangle on a price" = *danger*, when the intended meaning is merely *unverified tier*.
**Direction:** explain the mark once near the controls, or reword to a visible "(unverified)".

### UX-48 · Note · Performance and behaviour at current scale — no issue found
Measured honestly: 51 entries, ~90 outbound links; per-keystroke filtering re-walks all cards with no debounce and it does not matter at this size (imperceptible in testing); no layout thrash observed; lazy images fine. The interaction model will strain (empty-state confusion aside) only if the catalogue grows by an order of magnitude — the source README-mirroring workflow suggests it might; the section-anchor nav (UX-46) is the first thing that scale would demand anyway. The `data-search` haystack does not include section names — searching "physics" works only because the entries' capability strings happen to contain the word; a section whose entries don't repeat its name is unfindable by its name.

---

## H. Trust and conversion

### UX-50 · High · "Titles We've Shipped" — the page's framing overclaims what its own disclaimer disclaims
**Where:** `credits.astro:105` (`<title>` "Credits — Titles We've Shipped"), `Pedigree.astro:100` (aria-label "…Star Chart of shipped titles") and the voyage button copy "Explore the Full Star Chart of Shipped Titles"; against `credits.astro:214-217` ("Credits reflect work by individual team members across their careers, at the studios named") and the hero sub which is correctly worded ("Shipped titles our team members have worked on").
**What goes wrong:** the tab title, the search-result title, and the homepage's biggest link all say *we shipped these*; Redfall, Borderlands 3, Prison Architect are not HyperQuant titles and the fine print says so. A games-industry reader (the exact audience for this page) knows what individual credits are and respects them — *if* they are framed as credits from the first word. The current strongest-worded surfaces are the overclaiming ones and the correction is 11px mono at the page's foot.
**Direction:** retitle to match the hero's honest wording ("Credits — Titles Our Team Has Shipped On" or similar) and fix the voyage button's label; move nothing else.

### UX-51 · High · The pedigree wall reads as a client list; only 2 of 15 logos are clients
**Where:** `src/data/partners.js` (2 clients, 2 alliances, 10 employer credentials, 1 school), `Pedigree.astro:75-84`.
**What goes wrong:** the band is one undifferentiated grid; the four-relation legend is a single 11.5px line below it ("Direct clients, active alliances, employee credentials, and alma mater") with the per-logo mapping available only in hover tooltips (UX-33). A prospective client skimming sees PlayStation/Xbox/Amazon and forms an impression the fine print does not support; the same prospective client, on discovering the real mapping, may discount the *legitimate* claims too. The data file's own comment says the credit line "has to carry that meaning, or a bare logo row reads as claimed endorsement" — the audit's finding is that one tiny line does not carry it.
**Direction:** group the grid visibly ("Clients / Alliances / Where our team has shipped / Where we trained") or badge each tile. The credential story is genuinely strong — told precisely, it gets stronger.

### UX-52 · Medium · Nothing on the site says who these people are
**What a real user does:** a client or candidate looks for founders, team, headcount, or even one named human. There are none anywhere — no team page, no names, no photos, no LinkedIn-person links (the LinkedIn link is the company page), no company registration details, and location is one word ("India"). Combined with unnamed "employee credentials" (UX-51), the site asks visitors to trust anonymous pedigree.
**[judgement]** on how much this costs; the absence is fact. May be deliberate (small team, privacy) — flagged because both the client and candidate personas hit it head-on.
**Direction:** even one short "who we are" block with founder name(s) on Studio or Vision would materially change the trust equation.

### UX-53 · Medium · The job-candidate persona has no path at all
**Where:** contact meta description promises "…or a career opportunity" (`contact.astro:12`), but the page's six topic links have no careers topic; no jobs/careers page exists; Studio talks about how the team grows but never says whether it is hiring.
**Direction:** one topic link ("Join the crew — mailto with subject Careers") or one line on Studio ("Not hiring right now — write anyway") closes the loop either way.

### UX-54 · Medium · No privacy note anywhere despite third-party calls
**Where:** Umami analytics loads from `cloud.umami.is` (`site.js:76-86`, `Base.astro:158-166`); `/credits/` requests 16 thumbnails from `i.ytimg.com` on load; activating a trailer talks to `youtube-nocookie.com`.
**What goes wrong:** the cookieless-analytics choice is privacy-*respecting* but the site never says any of this; there is no privacy page, and the footer offers only a copyright line. For an EU client evaluating a vendor, a missing privacy statement on a site that visibly loads third-party resources is a checklist failure. (Whether a banner is legally required is out of scope; a statement page is table stakes either way.)
**Direction:** a short /privacy page: what loads, what's collected (Umami, no cookies), contact for questions. It doubles as a trust signal.

### UX-55 · Low · No case studies or work samples for the services being sold
**What goes wrong:** Services sells five disciplines with zero artefacts of any of them — no client project named beyond two logos, no screenshots, no "we built X for Y". The Star Chart evidences *individual* pedigree and the Cosmos evidences *internal* products; the gap is company-as-vendor evidence. Early-stage reality, presumably — flagged because it is the first thing persona (b) looks for and cannot find.
**Direction:** even one honest case write-up (the Virtual Medicine or LightFury work, scope permitting) outweighs another band of polish.

---

## What I could not assess, and what would be needed to assess it

- **Real screen-reader experience.** Heading/landmark/name findings (UX-28, 30, 31, 33, 35) are measured from the DOM and standard AT behaviour, but pronunciation, verbosity in practice, the actual reading of `✦` glyphs and the injected iframe (UX-21) need an NVDA/VoiceOver session with a practised user. That session would also adjudicate how bad the whole-card link names really are.
- **200% zoom / text-only zoom.** Layout holds to 320px CSS width (measured), which approximates page zoom, but browser text-only zoom (which defeats `clamp()` vw terms differently) was not run; needs a desktop browser pass at 200% text scaling.
- **Engines other than Chromium.** Firefox/Safari were not run (the repo's own audit tooling covers engines; this pass did not re-verify). `color-mix()`, `offset-path`, SVG `r` as CSS, and `svh` all have engine-specific histories on this site's critical path.
- **The production host.** Redirects (`/ecosystem`, `/titles`), 404 status codes, cache behaviour, and the Umami tracker were not exercised against hyperquantmedia.com — only the local preview build.
- **Real touch hardware.** Tap-target and hover-dependency findings (UX-20, 33) are geometry-based; an actual phone session (especially the constellation's 44px hit circles vs its visual 9-24px bodies) would confirm or soften them.
- **mailto: failure rates.** UX-22's severity depends on the audience's mail-client configuration; analytics on CTA clicks vs inbound mail volume would turn the judgement into a number.
- **YouTube playback and its focus behaviour after injection** — needs a manual keyboard session with network access to YouTube.
