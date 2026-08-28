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
export const nav = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/vision', label: 'Vision', key: 'vision' },
  { href: '/services', label: 'Services', key: 'services' },
  { href: '/cosmos', label: 'Cosmos', key: 'cosmos' },
  { href: '/studio', label: 'Studio', key: 'studio' },
  { href: '/credits', label: 'Credits', key: 'credits' },
  { href: '/contact', label: 'Get In Touch', key: 'contact', cta: true },
];

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
    href: null,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com/@HyperQuantMedia',
  },
];

export const socialLinks = social.filter((s) => s.href);
