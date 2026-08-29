# Reopenable decisions

Decisions that were **taken and are working**, but were taken with a known cost
and a known lever. None of these is a bug and none is a backlog item in the
"should get done" sense. Each is here because a specific future condition would
make the opposite answer correct — and without the condition written down, the
next person re-litigates it from scratch or, worse, "fixes" it.

Read this before changing any of the things below. If you are about to reverse
one of these, check its trigger has actually fired.

What is NOT here: items still genuinely open (missing X/Twitter handle, the
Observatory + Protostar icon ladders), and decisions closed for good with no
trigger (single `og:image`, the Star Chart's store-side delistings, `--dpr`
staying local). Those live in `WAYPOINT.md`, which is local-only.

---

## 1. Compendium status chips are hidden

**Decision.** `showStatus = false` in the Compendium data. The Liked / Watching
chips render nothing.

**Why.** The distinction reads as a rating to a visitor who has not met the
legend, and a landscape page whose own copy says it is not an endorsement for
hire should not have the loudest thing on every card look like a score.

Implemented in the data rather than as a CSS hide, deliberately — hidden text is
still read by screen readers and still ships in the HTML, so "one CSS line"
would have hidden it from sighted visitors only.

**Trigger to reopen.** A legend that makes the chips mean what they actually
mean, or a decision that the rating reading is fine. The chips are parked, not
deleted, so reversing is one flag.

---

## 2. The Compendium stays on this site — no subdomain

**Decision.** `/compendium` is a page on the main site, in the navigation under
Cosmos, plus a footer entry. No separate property.

**Why.** "No new subdomain, this works fine for now, we can reconsider it in the
future if and when we need to."

**Trigger to reopen.** The Compendium outgrowing the site, or needing its own
release cadence.

**Cost, so the call is made with the number.** The nav/footer work created
**nine internal inbound links** across every page — two on the homepage alone.
Moving the Compendium to its own property converts all nine into **external**
links, which undoes most of what that work bought. The page carries **306
entries across 16 sections**, so the "one inbound link" problem it solved was
larger than it looked.

If it ever does move, build the **README-generated** version. "Must match the
README" was the condition, and generation is the only thing that stops the two
drifting.

---

## 3. Font subsetting is punted

**Decision.** Fonts ship as full variable Latin ranges. No subsetting step.

**Why.** "Does not seem a significant blocker or load right now."

**Numbers, so it can be re-decided without re-measuring.** Fonts are **132 KB of
the 219.7 KB homepage critical path** — the largest single item now that three.js
is deferred. Inter alone is **48 KB** for the full variable Latin range and the
site renders a fraction of those glyphs. Realistic gain: **~60-70 KB**.

**Cost of doing it.** A Python dependency (`fonttools` / `pyftsubset`) in a build
that is otherwise pure Node.

**Trigger to reopen.** A measured text-paint complaint (Lighthouse / Core Web
Vitals), a slow-connection report, or the font share growing past its current
132 KB.

**If reopened, build the unicode-range version, not the observed-text version.**
Subsetting by observed text means the first curly quote, accented name or
em-dash added to future copy silently falls back to a system font mid-sentence.
Subsetting by unicode-range (Latin + Latin-1 Supplement + punctuation) is a
smaller win with no trap.

---

## 4. `@parcel/watcher`'s install script stays blocked

**Decision.** Not added to `allowScripts`. `npm install` prints an unapproved-
build-script warning every time.

**Why — the blocker is scope, not risk appetite.** The instinct was to allow it
for local dev only, and **`allowScripts` cannot express that**: it is one
repo-wide policy, and the CI `check` job runs `npm ci`, so approving it for a dev
machine approves it on the runner too.

**Provenance, since this was mis-attributed once.** It comes from
**`sass@1.103.1`**, not from `@astrojs/check` — `npm ls @parcel/watcher` resolves
`sass -> @parcel/watcher@2.6.0`.

**Nothing is broken.** Astro falls back to a JS watcher; dev reloads are
marginally slower.

**Trigger to reopen.** Dev-reload latency becoming a real complaint.

---

## 5. `/credits` keeps `maxresdefault` in the thumbnail srcset

**Decision.** The trailer thumbnails ship a srcset of YouTube's own URLs with
`maxresdefault` (1280w) at the top of the ladder. Existence is settled ahead of
time by `npm run probe:thumbs` and the answer is committed, not probed at build
time.

**The cost is known and accepted — this is not a regression, do not "fix" it.**
YouTube has nothing between 640 and 1280, so a box needing 638-903px jumps
straight to the 1280 file:

    /credits, every thumbnail loaded
      laptop-1280 @2x    321 KB -> 1706 KB
      macbook-1512 @2x   321 KB -> 1706 KB
      iphone-15-pro @3x  209 KB -> 1116 KB

They are `loading="lazy"` and there are 16, so a visitor who does not scroll the
chart pays well under the headline figure.

**The lever, if the trade is revisited.** Drop
`{ file: 'maxresdefault.jpg', w: 1280, key: 'max' }` from `THUMB_RUNGS` in
`src/pages/credits.astro`. Lands near **800 KB**, at 640px sharpness.

**Not reopenable, recorded so it is not chased:** the remaining finding on this
page — `hqdefault` 480w into a 319px box at 1x, ~23.7 KB — is structural. The box
needs 320.7px, the 320w rung is 0.7px short, so the browser correctly takes the
next one up. Only a rung between 320 and 480 would close it, and YouTube does not
have one.

---

## 6. SPF stays `~all` (softfail), not `-all`

**Decision.** The apex SPF record is `v=spf1 include:_spf.google.com ~all`. Do
not tighten to `-all` yet.

**Why.** SPF, DKIM and DMARC all pass and align independently, verified on a real
send. `-all` tells receivers to hard-reject anything outside the record, and any
SaaS or forwarder sending as the domain that nobody remembered would start
failing silently.

**Original trigger.** A few weeks of DMARC aggregate reports at
`dmarc@hyperquantmedia.com` confirming nothing legitimate fails.

**That trigger cannot currently fire.** The DMARC record publishes
`rua=mailto:dmarc@hyperquantmedia.com` and **that mailbox does not exist**, so
the aggregate reports bounce and reporters eventually stop sending. Enforcement
is unaffected — no receiver checks `rua` deliverability before applying
`p=quarantine` — but there is no evidence stream, so `-all` could only be
tightened blind.

**Prerequisite before this decision is reopenable at all:** create the mailbox (a
Workspace group is preferable to a user alias — machine mail, survives account
changes), or point `rua` at a report processor that publishes the required
`hyperquantmedia.com._report._dmarc.<their-domain>` authorization, or drop the
`rua` tag and accept that `~all` is permanent.

---

## 7. The sitemap ships no `lastmod`

**Decision.** `lastmod` is deliberately absent from the sitemap.

**Why.** An honest `lastmod` needs a per-file git date, and the Actions checkout
is shallow (`fetch-depth: 1`), so every page would receive the same date — the
date of the build. A fabricated `lastmod` is a worse signal to a crawler than no
`lastmod` at all: it tells the crawler every page changed, every deploy, forever,
and the crawler learns to ignore the field.

**Trigger to reopen.** Wanting real per-page freshness signals. The change is
`fetch-depth: 0` in the deploy workflow plus per-file git dates — pay the full
clone, get an honest date, or keep shipping nothing.

---

## 8. Per-tool Cosmos detail pages are deferred

**Decision.** Each tool on `/cosmos` is a single card — blurb, three chips from
its README, status. There is no `/cosmos/<slug>` page for any tool. The longer
per-tool copy sits unrendered in `src/data/products.js`.

**Why.** A card holds what there is to say about most of these today, and a
detail page that restates the card is a page with nothing on it.

**Trigger to reopen.** A tool needing more than a card can hold — genuinely more
to say, not a wish for a bigger page.

**Confidentiality rail, which applies whether or not this reopens.** This repo is
**public**. Anything written into `products.js` is published the moment it is
committed, rendered or not, and stays in the history after it is removed. Copy
for a tool that has not been shown publicly describes the **effect**, never the
mechanism. That constraint is on the data file itself, not on the page that would
render it.
