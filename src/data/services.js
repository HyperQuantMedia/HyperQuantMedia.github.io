/* The five services, as data.
 *
 * These strings were hardcoded five times over in index.astro's card grid.
 * Every word here is that existing copy, moved rather than rewritten — nothing
 * was invented while extracting it.
 *
 * Three things read this file now, which is the point: the homepage card grid,
 * the Service nodes in src/data/schema.js, and (by anchor) the long sections on
 * the Services page. A service's name in the JSON-LD can no longer drift from
 * the name on the card, because there is one name.
 *
 * `anchor` must match a section id in src/pages/services.astro — that page
 * carries the long-form prose for each of these and the cards link into it.
 * `accent` is the palette family in src/styles/style.css; `icon` is the glyph
 * the card shows.
 */

export const services = [
  {
    key: 'games',
    anchor: '/services#games',
    name: 'Immersive Game Development',
    blurb:
      'Graphics and rendering, artist and editor tooling, engine and platform work. Unreal, custom engines, Unity, Godot.',
    accent: 'a-aurora',
    icon: '◉',
  },
  {
    key: 'xr',
    anchor: '/services#xr',
    name: 'Interactive XR Experiences',
    blurb:
      'AR/VR content, simulations, and immersive installations that change how people engage.',
    accent: 'a-polaris',
    icon: '◇',
  },
  {
    key: 'ai',
    anchor: '/services#ai',
    name: 'Applied AI & Agent Systems',
    blurb:
      'Agent workflows, retrieval, and AI features built into real products — not demos.',
    accent: 'a-rose',
    icon: '✦',
  },
  {
    key: 'web',
    anchor: '/services#web',
    name: 'Bespoke Web Development',
    blurb:
      'Custom, high-performance websites engineered from your goals. No templates, no page builders.',
    accent: 'a-nebula',
    icon: '◈',
  },
  {
    key: 'consulting',
    anchor: '/services#consulting',
    name: 'Strategic IT Consulting',
    blurb:
      'Infrastructure, delivery, and technology decisions made clear for the road ahead.',
    accent: 'a-stellar',
    icon: '⬡',
  },
];
