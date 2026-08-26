// The Cosmos: everything HyperQuant Media builds for itself.
//
// Two groups, and they render in two different places on purpose:
//
//   `tools`  -> the Cosmos page. A constellation with no center: every tool
//              stands alone, Warpgate included. Warpgate is a configurable
//              B2B environment-consistency platform, not a launcher the
//              others orbit. Games are not tools, so they are not listed
//              there.
//   `titles` -> the Studio page, in full.
//
// The Studio counts below are derived from this file, so a status change here
// updates the page rather than leaving a hand-typed number to go stale.
//
// Icons live in src/assets/products/<slug>.png, re-padded to a common optical
// size at 512px. 512 rather than 256 because the largest on-page icon is 86px
// and a 3x display needs 258 real pixels for it.

// `chips` are three capabilities per tool.
//
// Array order is the page's reading order: the open, public things lead
// (Compendium is MIT and browsable right now), the B2B platform sits lower,
// and what is still on the horizon comes last. `accent` is pinned to the tool,
// not to its position — reordering must never restyle a product.
//
// `repo` is set only for a repository that is public, so the button never
// 404s while implying the source is open. `long` likewise carries the full
// description only for a product that is already public.
export const tools = [
  {
    slug: 'compendium',
    name: 'Compendium',
    role: 'The Librarian',
    accent: 'a-nebula',
    status: 'active',
    href: '/compendium',
    repo: 'https://github.com/HyperQuantMedia/HQM-Compendium',
    blurb: 'A curated, independent catalog of tools that do a job well.',
    long: 'A public, opinionated landscape of third-party software, rated by the capability it serves \u2014 applications, libraries, engine plugins, and learning resources, each with its cost, platform, and why we like it. No affiliate links, no sponsorships, no mandates.',
    chips: ['Open source, MIT', 'Trusted, not sponsored', 'Apps, libraries, learning'],
  },
  {
    slug: 'astra',
    name: 'Astra',
    role: 'The Cartographer',
    accent: 'a-stellar',
    status: 'active',
    blurb: "A project's live cartographer and navigator. You may forget — the machinery never will, at depth and at breadth.",
    chips: ['Forgets nothing', 'Depth and breadth at once', 'Stays navigable as it grows'],
  },
  {
    slug: 'docutale',
    name: 'DocuTale',
    role: 'The Chronicler',
    accent: 'a-polaris',
    status: 'active',
    blurb: 'Long things go in. What comes out is short, complete, and stays with you.',
    chips: ['Short enough to finish', 'Nothing load-bearing lost', 'Read once, recall later'],
  },
  {
    slug: 'afterglow',
    name: 'Afterglow',
    role: 'The Editor',
    // Two colours, honestly: violet surround, amber core. `accentAlt` paints
    // the hot parts (the star's glint and core, the frames it picks).
    accent: 'a-aurora',
    accentAlt: 'a-polaris',
    status: 'active',
    blurb: 'Most of what you capture was never worth keeping. It knows which part was.',
    chips: ['Judges, never just cuts', 'Ready to post, not to edit', 'Scales past what you can see'],
  },
  {
    slug: 'pulsar',
    name: 'Pulsar',
    role: 'The Timekeeper',
    accent: 'a-polaris',
    status: 'active',
    blurb: 'Every operator keeps a rhythm. This one learns yours, and names it back.',
    chips: ['Propose, never impose', 'Learns without being taught', 'Stays on your machine'],
  },
  {
    slug: 'warpgate',
    name: 'Warpgate',
    role: 'The Gateway',
    accent: 'a-polaris',
    status: 'active',
    blurb: 'One manifest, and a whole team lands in the same environment.',
    chips: ['Role graph', 'Version-pinned toolsets', 'White-label'],
  },
  {
    slug: 'quartermaster',
    name: 'Quartermaster',
    role: 'The Keeper',
    accent: 'a-aurora',
    status: 'horizon',
    blurb: 'The equipment locker: small tools that take a reading and hand back clean data.',
    chips: ['Portable executables', 'One tool, one job', 'Windows + Android today'],
  },
];

// Games.
export const titles = [
  {
    slug: 'veins-of-nexus',
    name: 'Veins of Nexus',
    role: 'Roguelite · Action · 2D · Dungeon Crawler',
    accent: 'a-aurora',
    status: 'preproduction',
    blurb: 'A dark atmospheric roguelite built around a transforming pickaxe.',
    detail: [
      'A dark descent built on one idea: the pickaxe is not just a weapon. It cuts, it opens, it changes — and how you shape it is how you survive.',
      'Every run redraws the dungeon. Curiosity is rewarded, rigidity is not, and the choices you make down there follow you back up.',
    ],
    tags: ['Dark Fantasy', 'Story-Rich', 'Procedural Levels'],
  },
  {
    slug: 'nibblebloom',
    name: 'NibbleBloom',
    role: 'Cozy · Adventure RPG · Party-Based',
    accent: 'a-rose',
    status: 'ideation',
    blurb: 'A world of food kingdoms, and the work of putting it back together.',
    detail: [
      'A world of food kingdoms — proud, rival, and recovering from a war none of them won cleanly.',
      'You travel it as a party, mending what the fighting broke: a hearth, a road, an alliance. The surface is warm and the stakes are not — kindness here is work, and it costs something.',
    ],
    tags: ['Open-World', 'Story-Rich', 'Wholesome', 'Better With Friends'],
  },
];

// Two vocabularies, one map. Tools are either being worked on or are not
// started yet; games move through named production stages, which is what a
// reader of a studio page expects to see. Nothing shares a key, so a tool can
// never accidentally display a production stage or the reverse.
export const statusLabel = {
  // Tools
  active: 'Active Development',
  prototype: 'Prototype',
  horizon: 'On the Horizon',
  // Games. These are production-phase names — the funding axis — and a badge
  // must stay on that one ladder: a build-maturity word like 'Alpha' would not
  // be comparable against 'Pre-Production', because the two measure different
  // things. Order is the real sequence, so a reader can rank two titles.
  ideation: 'Ideation',
  poc: 'Proof of Concept Technology',
  preproduction: 'Pre-Production',
  production: 'In Production',
};

// Counts for the Studio page, derived rather than typed so they cannot go
// stale when a status above changes.
export const counts = {
  titlesInDevelopment: titles.filter((t) => t.status !== 'horizon').length,
  toolsInDevelopment: tools.filter((t) => t.status !== 'horizon').length,
};

// Back-compat for anything still importing the old flat name.
export const products = tools;
