// Single source of truth for site metadata and navigation.
//
// Add a page: create src/pages/<slug>.astro, then add one entry to `nav`
// below. The navbar, the footer navigation, and the sitemap all read from
// here, so there is exactly one place to edit and nothing to keep in sync.
//
// Remove a page: delete the .astro file and its entry here.
// Rename a URL: rename the file, change the href here, and add a redirect
// in astro.config.mjs so the old URL keeps working.

export const site = {
  name: 'HyperQuant Media',
  // Names the company is genuinely known by, for Organization.alternateName.
  // Aliases only -- a name someone would actually use to mean this company,
  // never a description of what it does. `HQM` is the internal short form the
  // repositories are named after, and it began as a backronym of the company's
  // first slogan, "Here Quality Matters" -- which is why the letters are an
  // alias worth asserting and not an arbitrary contraction. That slogan is
  // retired and is deliberately not in the structured data: `slogan` means the
  // current one, and a phrase is not a name whatever it once stood for.
  // `HyperQuantMedia` is the closed form the
  // domain and the GitHub organisation carry, so a reader meets it before they
  // ever meet the spaced one. Case and spacing variants are deliberately
  // absent: an index normalises those to the same token, so a second entry
  // adds nothing and a long list reads as stuffing.
  alternateNames: ['HQM', 'HyperQuant', 'HyperQuantMedia'],
  // The registered entity, exactly as the MCA register spells it. This is the
  // string a business registry can be matched against, so it is copied from the
  // register rather than derived from `name` -- the two are allowed to differ
  // and a near-miss is worth less than nothing here.
  //
  // The LLP is converting to a private limited company. That conversion
  // incorporates a NEW company under a new CIN and surrenders the LLPIN, so
  // this string changes to "... Private Limited" on the day it completes. A
  // later reader finding that edit in the history is looking at the conversion,
  // not at a typo being corrected.
  legalName: 'HyperQuant Media LLP',
  // Date of incorporation from the LLP certificate, ISO 8601 because
  // schema.org/foundingDate is a Date. This is the incorporation of the legal
  // entity and nothing wider: it is NOT the same claim as Footer.astro's
  // `founded`, which is the year the work began. The two happen to share a
  // year, which is a coincidence to leave alone rather than a reason to derive
  // one from the other -- the conversion to a private limited company will
  // incorporate a new entity and move this date while the work's start year
  // stays put.
  foundingDate: '2025-03-21',
  url: 'https://hyperquantmedia.com',
  tagline:
    'We chart the uncharted — creative technology, developer tools, and interactive experiences.',
  // The footer runs the claim alone. The three-noun tail is doing work on a
  // page that has to introduce the company; under a lockup, beside a full
  // navigation column, it is the same list the visitor has already walked.
  // `tagline` stays whole -- it is the Organization slogan in the structured
  // data, and a slogan is not trimmed for layout.
  taglineShort: 'We chart the uncharted',
  description:
    'Creative technology, developer tools, and interactive experiences — built to make complex work navigable.',
  // Where the studio is. The Contact page states this publicly, so the
  // Organization structured data can state it too — country only, because
  // country is all the site actually publishes. ISO 3166-1 alpha-2 for the
  // machine-readable half; both come from here so the visible page and the
  // JSON-LD cannot disagree.
  location: 'India',
  countryCode: 'IN',
};

// Order is the display order, in the navbar and the footer both. The theme
// toggle is appended after these by Nav.astro.
// An entry may carry `children`, which renders as a submenu under it. The
// parent stays a real link to a real page -- the submenu is an addition to it,
// never a replacement for it, so nothing becomes unreachable if the disclosure
// fails to open.
export const nav = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/vision', label: 'Vision', key: 'vision' },
  { href: '/services', label: 'Services', key: 'services' },
  {
    href: '/cosmos',
    label: 'Cosmos',
    key: 'cosmos',
    // Compendium sits under Cosmos because the two are the same subject seen
    // from both sides: Cosmos is the tools we built, Compendium is the
    // third-party tools we rate. It also had exactly ONE internal inbound link
    // in the whole build (from /cosmos' body copy) while being the largest
    // content page on the site -- a page reached from one place is crawled and
    // weighted like one, whatever is on it.
    children: [
      { href: '/compendium', label: 'Compendium', key: 'compendium' },
    ],
  },
  { href: '/studio', label: 'Studio', key: 'studio' },
  { href: '/credits', label: 'Credits', key: 'credits' },
  { href: '/contact', label: 'Get In Touch', key: 'contact', cta: true },
];

// Every entry, parents and children alike, in reading order. For consumers
// that want a flat list of pages rather than the shape of the menu.
export const navFlat = nav.flatMap((item) => [item, ...(item.children || [])]);

// The parent an entry hangs under, or undefined when it is top level.
export const navParentOf = (key) =>
  nav.find((item) => (item.children || []).some((child) => child.key === key));

// Visit analytics — Umami (umami.is), chosen for: location (country/region/
// city) and visit-duration reporting, a free cloud tier, and no cookies —
// which keeps the site consent-banner-free. The tracker auto-follows the
// client-side router's navigations, so page changes count without extra code.
//
// The tracker loads only when websiteId is set; empty the field and nothing
// is requested at all.
export const analytics = {
  umami: {
    websiteId: '52533e14-0ed7-406c-bc5e-586dc9bfd20a',
    src: 'https://cloud.umami.is/script.js',
  },
};

export const email = {
  general: 'info@hyperquantmedia.com',
  bizdev: 'bizdev@hyperquantmedia.com',
};

// Facebook is deliberately absent: no HyperQuant Media page exists to link to.
//
// Entries with a null href are skipped at render time rather than shipped as
// dead links. X has no URL yet, so the handle has to come from elsewhere.
export const social = [
  {
    key: 'linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/hyperquantmedia/',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com/hyperquantmedia/',
  },
  {
    key: 'github',
    label: 'GitHub',
    href: 'https://github.com/HyperQuantMedia',
  },
  {
    key: 'x',
    label: 'X',
    href: 'https://x.com/HyperQuantMedia',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@HyperQuantMedia',
  },
];

export const socialLinks = social.filter((s) => s.href);
