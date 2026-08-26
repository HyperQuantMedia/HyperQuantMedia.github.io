// The Star Chart: shipped titles that members of the team have worked on
// across their careers — the deep half of the Industry Pedigree.
//
// Modelled on the credit rolls that work-for-hire studios publish (year,
// title, partner, platforms), rendered in the site's constellation style
// with client-side platform filtering.
//
// Schema, one entry per shipped title:
//   {
//     title:     'Game Name',              // required
//     partner:   'Studio / Publisher',     // required — who it shipped under
//     year:      2024 | 'TBA',             // required — release year, or 'TBA' for announced-unreleased
//     platforms: ['PC', 'Xbox'],           // required — drives the filter buttons
//     note:      'optional one-liner',     // optional — context or contribution
//     video:     'dQw4w9WgXcQ',            // optional — YouTube id; renders an embedded teaser
//     links:     { steam, xbox, playstation }, // optional — store URLs, rendered as icon buttons
//   }
//
// Platform names should stay consistent across entries — the filter list is
// derived from what appears here, so 'PS5' and 'PlayStation 5' would become
// two separate buttons. Current vocabulary: PC, Xbox, PlayStation,
// Nintendo Switch, Android, VR.
//
// The list comes from the owner; the release facts (years, partners,
// platforms) were verified against public sources at entry time. These are
// individual team members' credits at the studios named, not HyperQuant
// Media projects — the disclaimer on the page carries that distinction.
export const credits = [
  {
    title: 'E-Cricket',
    partner: 'LightFury Games',
    year: 'TBA',
    platforms: ['Android'],
    note: 'Release date to be announced.',
    video: 'rpTPkGTUbmY',
  },
  {
    title: 'Dodo Duckie',
    partner: 'BornMonkie',
    year: 2026,
    platforms: ['PC', 'Xbox'],
    video: 'EQxk24LLnbQ',
    links: {
      steam: 'https://store.steampowered.com/app/3358170/Dodo_Duckie/',
      xbox: 'https://www.xbox.com/en-US/games/store/dodo-duckie/9p7s9f02293j',
    },
  },
  {
    title: 'Minecraft Dungeons II',
    partner: 'Mojang Studios · Double Eleven · Xbox Game Studios',
    year: 2026,
    platforms: ['PC', 'Xbox', 'PlayStation', 'Nintendo Switch'],
    note: 'Set to launch on September 29, 2026.',
    video: 'VyZKYhM0Kv4',
    links: {
      steam: 'https://store.steampowered.com/app/1912410/Minecraft_Dungeons_II/',
      xbox: 'https://www.xbox.com/en-US/games/store/minecraft-dungeons-ii/9P5786PJB9RP',
    },
  },
  {
    title: 'Redfall',
    partner: 'Arkane Austin · Bethesda Softworks',
    year: 2023,
    platforms: ['PC', 'Xbox'],
    video: '8cCFN77wtHY',
    links: {
      steam: 'https://store.steampowered.com/app/1294810/Redfall/',
      xbox: 'https://www.xbox.com/en-US/games/store/redfall/9p8jrmwrqp4h',
    },
  },
  {
    title: 'Kibbi Keeper',
    partner: 'SMU Guildhall',
    year: 2022,
    platforms: ['PC'],
    video: 'JWO2yLW66z8',
    links: { steam: 'https://store.steampowered.com/app/1702970/Kibbi_Keeper/' },
  },
  {
    title: 'Legend of the Outlaw Mage',
    partner: 'SMU Guildhall',
    year: 2022,
    platforms: ['PC'],
    video: 'ge1etDewYfM',
    links: { steam: 'https://store.steampowered.com/app/1702990/Legend_of_the_Outlaw_Mage/' },
  },
  {
    title: 'New World',
    partner: 'Amazon Games',
    year: 2021,
    platforms: ['PC'],
    video: '5kGcrtkWIgM',
    links: { steam: 'https://store.steampowered.com/app/1063730/New_World_Aeternum/' },
  },
  {
    title: 'SnowPainters',
    partner: 'SMU Guildhall',
    year: 2021,
    platforms: ['PC'],
    video: 'cvTKQjyttTo',
    links: { steam: 'https://store.steampowered.com/app/1545710/Snowpainters/' },
  },
  {
    title: 'Space Smack!',
    partner: 'SMU Guildhall',
    year: 2021,
    platforms: ['PC'],
    video: 'lg_MA0l073A',
    links: { steam: 'https://store.steampowered.com/app/1410850/Space_Smack/' },
  },
  {
    title: 'Trikaya',
    partner: 'SMU Guildhall',
    year: 2021,
    platforms: ['PC'],
    video: 'tEZo_qKFlaQ',
    links: { steam: 'https://store.steampowered.com/app/1410870/Trikaya/' },
  },
  {
    title: 'HaberDashers',
    partner: 'SMU Guildhall',
    year: 2020,
    platforms: ['PC'],
    video: 'pJjCVNc_dP8',
    links: { steam: 'https://store.steampowered.com/app/1062100/HaberDashers/' },
  },
  {
    title: 'Borderlands 3',
    partner: 'Gearbox Software · 2K',
    year: 2019,
    platforms: ['PC', 'PlayStation', 'Xbox'],
    video: 'JwAQeqtl6PQ',
    links: {
      steam: 'https://store.steampowered.com/app/397540/Borderlands_3/',
      xbox: 'https://www.xbox.com/en-US/games/store/borderlands-3/C34NB0F1B5WQ',
      playstation: 'https://www.playstation.com/en-us/games/borderlands-3/',
    },
  },
  {
    title: 'Penn & Teller VR',
    partner: 'Gearbox Publishing',
    year: 2019,
    platforms: ['PC', 'PlayStation', 'VR'],
    video: '6M95Z6WAI0M',
    links: { steam: 'https://store.steampowered.com/app/677610/Penn__Teller_VR_Frankly_Unfair_Unkind_Unnecessary__Underhanded/' },
  },
  {
    title: 'Borderlands 2 VR',
    partner: 'Gearbox Software · 2K',
    year: 2018,
    platforms: ['PC', 'PlayStation', 'VR'],
    video: 'puBXO8EM9eM',
    links: { steam: 'https://store.steampowered.com/app/991260/Borderlands_2_VR/' },
  },
  {
    title: 'Mouse Playhouse',
    partner: 'SMU Guildhall',
    year: 2017,
    platforms: ['PC', 'VR'],
    video: '_BCBCv1to7M',
    links: { steam: 'https://store.steampowered.com/app/612590/Mouse_Playhouse/' },
  },
  {
    title: 'Prison Architect',
    partner: 'Double Eleven · Introversion Software',
    year: 2016,
    platforms: ['PC', 'Xbox', 'PlayStation', 'Nintendo Switch'],
    video: 'Ro7h2Y7lTw0',
    links: { steam: 'https://store.steampowered.com/app/233450/Prison_Architect/' },
  },
];

// Filter buttons, derived so they can never list a platform with no titles.
export const creditPlatforms = [...new Set(credits.flatMap((c) => c.platforms))];

// Years present, newest first, with announced-unreleased ('TBA') leading the
// chart the way a credit roll leads with what is coming.
const numericYears = [...new Set(credits.map((c) => c.year).filter((y) => typeof y === 'number'))]
  .sort((a, b) => b - a);
export const creditYears = credits.some((c) => c.year === 'TBA')
  ? ['TBA', ...numericYears]
  : numericYears;
