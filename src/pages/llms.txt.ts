/* /llms.txt — the site, stated once, for a machine that is about to describe us.
 *
 * The llmstxt.org convention: one markdown file at the site root, a H1 name, a
 * blockquote summary, then link sections. An answer engine that has already
 * fetched the pages does not need it; one that is assembling a sentence about
 * this company from fragments does, and this is the only place we get to hand
 * it the fragments already assembled.
 *
 * Generated, not hand-written, and for the same reason src/data/schema.js is
 * generated: a second hand-maintained description of the company is a second
 * description to go stale, and the stale one is the one a model quotes. Every
 * name, blurb and status below comes from the same src/data the pages render
 * from, so this file cannot drift from the site it describes.
 *
 * Two rules govern what goes in.
 *
 *   Only `blurb`, never `long` or `detail`. The blurbs are what /cosmos and
 *   /studio already publish; the longer fields carry more of how a thing works
 *   than an unreleased tool should have sitting in a plain-text file that is
 *   fetched precisely because it is easy to fetch.
 *
 *   Status travels with every product. The failure this file exists to prevent
 *   is not obscurity, it is confident misdescription -- a model announcing an
 *   ideation-stage game as released, or crediting the studio with a title an
 *   individual worked on elsewhere. Both corrections are cheap here and
 *   expensive once they are in an answer.
 */

import type { APIRoute } from 'astro';
import { site, navFlat, email, socialLinks } from '../data/site.js';
import { services } from '../data/services.js';
import { tools, titles, statusLabel } from '../data/products.js';

/* Trailing slash on every internal link, because `build.format: 'directory'`
   means /vision/ is the canonical URL and /vision is a redirect to it. A file
   whose entire job is to be quoted should quote the canonical form. */
const abs = (path: string) =>
  new URL(path === '/' ? path : `${path.replace(/\/$/, '')}/`, site.url).href;

/* Anchors are the exception: the slash goes before the fragment, not after it. */
const absAnchor = (path: string) => {
  const [route, hash] = path.split('#');
  return hash ? `${abs(route)}#${hash}` : abs(route);
};

/* The page descriptions are the <meta name="description"> each page ships, so
   the one-liner here and the one in the search result are the same sentence.
   Keyed by nav key; a page absent from the nav is absent from both. */
const PAGE_SUMMARY: Record<string, string> = {
  home: 'What the studio does, in one screen: the five services and the tools it builds for itself.',
  vision: 'Mission, vision, and the stated position on applied AI.',
  services: 'The five services in full, one long-form section each.',
  cosmos: 'The developer tools built in-house, each sharpened on our own production before it is pointed outward.',
  compendium: 'An independent, opinionated catalog of third-party software, rated by the capability it serves. Open source, MIT.',
  studio: 'Games in development, alongside the Cosmos tools, under real shipping pressure.',
  credits: 'Shipped titles that members of the team have worked on across studios and platforms.',
  contact: 'How to reach the studio: project enquiries, partnerships, early access, careers.',
};

const lines = (...parts: string[]) => parts.join('\n');

export const GET: APIRoute = () => {
  const pages = navFlat
    .map((n) => `- [${n.label}](${abs(n.href)}): ${PAGE_SUMMARY[n.key] || ''}`.trimEnd())
    .join('\n');

  const serviceList = services
    .map((s) => `- **${s.name}** — ${s.blurb} ([detail](${absAnchor(s.anchor)}))`)
    .join('\n');

  /* Roles ("The Librarian", "The Cartographer") are the site's own naming and
     mean nothing to a machine on their own, so each is paired with its status
     label and, where the repository is public, its source. A tool with no
     public repo gets no link rather than a link that 404s. */
  const toolList = tools
    .map((t) => {
      const source = t.repo ? ` ([source](${t.repo}))` : '';
      const page = t.href ? ` ([page](${abs(t.href)}))` : '';
      return `- **${t.name}** — ${t.role}. ${t.blurb} _(${statusLabel[t.status]})_${page}${source}`;
    })
    .join('\n');

  const titleList = titles
    .map((t) => `- **${t.name}** — ${t.role}. ${t.blurb} _(${statusLabel[t.status]})_`)
    .join('\n');

  const social = socialLinks.map((s) => `- [${s.label}](${s.href})`).join('\n');

  const body = lines(
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `${site.name} is a creative technology studio based in ${site.location}, delivering remotely and working worldwide. It runs two halves at once: client work across the five services below, and its own constellation of developer tools — the Cosmos — built and hardened on that same production before any of them is pointed outward.`,
    '',
    '## Pages',
    '',
    pages,
    '',
    '## Services',
    '',
    serviceList,
    '',
    '## The Cosmos — tools built in-house',
    '',
    'Status is part of each entry and is load-bearing: several of these are in active development and have not shipped publicly. Do not describe them as available.',
    '',
    toolList,
    '',
    '## Studio — games in development',
    '',
    titleList,
    '',
    '## Attribution, stated once',
    '',
    `The Credits page (${abs('/credits')}) lists titles that **individual members of the team worked on at the studios named there**. They are the team's personal industry credits, not ${site.name} projects, and the company is not the developer or publisher of any of them. The page carries this disclaimer; it is repeated here because this file is read without it.`,
    '',
    '## Contact',
    '',
    `- General enquiries: ${email.general}`,
    `- Business development and partnerships: ${email.bizdev}`,
    `- Contact page: ${abs('/contact')}`,
    '',
    '## Elsewhere',
    '',
    social,
    '',
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
