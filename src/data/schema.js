/* JSON-LD structured data, built from the same data the pages render from.
 *
 * One `@graph` per page rather than a pile of loose blocks, so the
 * Organization and WebSite are declared ONCE with stable `@id`s and every
 * other node points at them. A crawler that sees `#organization` on nine pages
 * with nine slightly different shapes has to guess whether it is one entity;
 * one node referenced by id leaves nothing to guess.
 *
 * Node ids, all absolute so they are globally unique:
 *
 *   <site>/#logo              the mark, referenced by logo and image
 *   <site>/#organization      the company
 *   <site>/#website           the site itself, published by the organization
 *   <canonical>#webpage       this page, part of the website
 *   <canonical>#breadcrumb    this page's trail (omitted on the homepage,
 *                             where a one-item breadcrumb says nothing)
 *
 * Rule for everything here: only assert what src/data actually knows, and never
 * more precisely than it knows it. No invented founding date, no street or city
 * behind a country the site only names as a country, no ratings, and no
 * `datePublished` squeezed out of a year field that says "TBA". A
 * structured-data lie is worse than a missing property -- it is the one part of
 * the page written purely for machines, so nothing else catches it.
 */

import { site, socialLinks, email } from './site.js';
import { nav, navFlat, navParentOf } from './site.js';

const abs = (path) => new URL(path, site.url).href;

export const ORG_ID = `${site.url}/#organization`;
export const SITE_ID = `${site.url}/#website`;
export const LOGO_ID = `${site.url}/#logo`;

/* The logo is its own top-level node rather than an object nested inside
   Organization. A flattening processor resolves a nested definition either way,
   but two properties (`logo` and `image`) reference this one, and a node that
   only exists inside one of them is a node that disappears the moment that
   property is restructured. */
const logo = {
  '@type': 'ImageObject',
  '@id': LOGO_ID,
  url: abs('/icon-512.png'),
  contentUrl: abs('/icon-512.png'),
  width: 512,
  height: 512,
  caption: site.name,
};

/* The company. Referenced by id from every page's WebPage and WebSite. */
const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.name,
  url: site.url,
  description: site.description,
  slogan: site.tagline,
  logo: { '@id': LOGO_ID },
  image: { '@id': LOGO_ID },
  email: email.general,
  sameAs: socialLinks.map((s) => s.href),
  // Country only. The Contact page publishes the country and nothing narrower,
  // and a fabricated street or city here would be exactly the structured-data
  // lie this file refuses.
  address: {
    '@type': 'PostalAddress',
    addressCountry: site.countryCode,
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: email.general,
      availableLanguage: 'en',
    },
    {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: email.bizdev,
      availableLanguage: 'en',
    },
  ],
};

const website = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: site.url,
  name: site.name,
  description: site.description,
  publisher: { '@id': ORG_ID },
  inLanguage: 'en-GB',
};

/* Page key -> the more specific WebPage subtype, where one is honest. A page
 * that is just a page stays a WebPage; guessing a subtype to look richer is
 * the same failure as inventing a property. */
const PAGE_TYPE = {
  home: 'WebPage',
  vision: 'AboutPage',
  services: 'WebPage',
  cosmos: 'CollectionPage',
  studio: 'WebPage',
  credits: 'CollectionPage',
  compendium: 'CollectionPage',
  contact: 'ContactPage',
  404: 'WebPage',
};

/* Breadcrumb label for a page, taken from the navbar so the trail and the nav
 * can never disagree. navFlat rather than nav, so a submenu child resolves to
 * its own label. Pages absent from the nav entirely (404) name themselves. */
const CRUMB_LABEL = {
  404: 'Not Found',
};
const crumbLabel = (page) =>
  navFlat.find((n) => n.key === page)?.label || CRUMB_LABEL[page] || page;

/* The per-page graph. `nodes` is whatever the page itself wants to add. */
export function pageGraph({ page, title, description, canonical, nodes = [] }) {
  const webpageId = `${canonical}#webpage`;
  const breadcrumbId = `${canonical}#breadcrumb`;
  const isHome = page === 'home';

  const webpage = {
    '@type': PAGE_TYPE[page] || 'WebPage',
    '@id': webpageId,
    url: canonical,
    name: title,
    description,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en-GB',
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: abs('/og.png'),
      width: 1200,
      height: 630,
    },
  };
  if (!isHome) webpage.breadcrumb = { '@id': breadcrumbId };

  const graph = [logo, organization, website, webpage];

  if (!isHome) {
    /* Three levels when the page hangs under a submenu parent, two otherwise.
       The trail states the same relationship the navbar shows -- claiming a
       flat Home > Compendium while the menu nests it under Cosmos would be the
       structured-data lie this file exists to refuse. */
    const parent = navParentOf(page);
    const trail = [{ '@type': 'ListItem', position: 1, name: 'Home', item: site.url }];
    if (parent) {
      trail.push({
        '@type': 'ListItem',
        position: 2,
        name: parent.label,
        item: abs(`${parent.href.replace(/\/$/, '')}/`),
      });
    }
    trail.push({
      '@type': 'ListItem',
      position: trail.length + 1,
      name: crumbLabel(page),
      item: canonical,
    });
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: trail,
    });
  }

  graph.push(...nodes);

  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ── Page-specific node builders ───────────────────────────────
 * Each takes the same data the page renders and returns nodes to append.
 * They live here rather than in the pages so the shapes stay consistent and
 * one file is the whole answer to "what do we tell crawlers". */

/* Cosmos: the tools, as an ordered list of applications. No `offers` and no
 * `aggregateRating` — we have neither, and inventing them to chase a rich
 * result is exactly the lie this file refuses. */
export function toolListNodes(tools) {
  return [{
    '@type': 'ItemList',
    '@id': `${abs('/cosmos/')}#tools`,
    name: 'The Cosmos — developer tools by HyperQuant Media',
    numberOfItems: tools.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: tools.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: t.name,
        alternateName: t.role,
        description: t.blurb,
        applicationCategory: 'DeveloperApplication',
        url: t.repo || abs(t.href || '/cosmos'),
        author: { '@id': ORG_ID },
        publisher: { '@id': ORG_ID },
      },
    })),
  }];
}

/* Star Chart: shipped titles. `datePublished` only when the year really is a
 * year — the data uses 'TBA' for unannounced ones. */
export function creditListNodes(credits) {
  return [{
    '@type': 'ItemList',
    '@id': `${abs('/credits/')}#credits`,
    name: 'Shipped titles credited to the HyperQuant Media team',
    numberOfItems: credits.length,
    itemListElement: credits.map((c, i) => {
      const game = {
        '@type': 'VideoGame',
        name: c.title,
        gamePlatform: c.platforms,
      };
      if (/^\d{4}$/.test(String(c.year))) game.datePublished = String(c.year);
      // The partner is the studio the title shipped under, not us — naming
      // ourselves the publisher here would be false.
      if (c.partner) game.publisher = { '@type': 'Organization', name: c.partner };
      return { '@type': 'ListItem', position: i + 1, item: game };
    }),
  }];
}

/* Services: what the studio sells, from src/data/services.js — the same five
 * entries the homepage cards render, so a name here cannot drift from a name on
 * the page. Service has no rich result in Google's gallery; what it buys is the
 * link between "game development" / "AR/VR" and this organization as an entity
 * rather than as body copy a crawler has to infer from. */
export function serviceListNodes(services) {
  return [{
    '@type': 'ItemList',
    '@id': `${abs('/')}#services`,
    name: `Services offered by ${site.name}`,
    numberOfItems: services.length,
    itemListElement: services.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        '@id': `${abs(s.anchor)}`,
        name: s.name,
        description: s.blurb,
        serviceType: s.name,
        provider: { '@id': ORG_ID },
        // No physical premises are claimed anywhere on the site, and the work
        // is remote-delivered, so this is the honest scope rather than a
        // fabricated city.
        areaServed: { '@type': 'Place', name: 'Worldwide' },
      },
    })),
  }];
}

/* Compendium: third-party software we rate. Name and url only. The status
 * chips are our opinion, not a rating anyone else should machine-read, so no
 * `aggregateRating` / `review` — those would claim a review corpus we do not
 * have. */
export function compendiumListNodes(kinds) {
  const entries = kinds.flatMap((k) => k.sections.flatMap((s) => s.entries));
  return [{
    '@type': 'ItemList',
    '@id': `${abs('/compendium/')}#compendium`,
    name: 'Third-party software rated by HyperQuant Media',
    numberOfItems: entries.length,
    itemListElement: entries.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.name,
      url: e.url,
    })),
  }];
}

