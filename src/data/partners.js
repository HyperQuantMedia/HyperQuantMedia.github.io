// Studios, publishers, and institutions behind the team's track record.
// Each slug matches a file in src/assets/logos/<slug>.png.
//
// ORDER IS MEANINGFUL and runs closest-relationship first: direct clients,
// then active alliances, then employee credentials, then the alma mater. The
// row is rendered as one continuous grid with no group headings -- the
// chronology is conveyed by sequence alone, which is the intent. Reordering
// this array reorders the row, so keep the grouping intact when editing.
//
// `relation` is not displayed as a heading; it drives the hover tooltip and
// documents why each entry sits where it does.
//
// These are other companies' trademarks, shown to evidence client work,
// alliances, and where the team has worked or studied. The credit line has to
// carry that meaning, or a bare logo row reads as claimed endorsement.

export const creditLine =
  'Direct clients, active alliances, employee credentials, and alma mater';

export const partners = [
  // Direct clients
  { slug: 'lightfury-games',  name: 'LightFury Games',       relation: 'Client' },
  { slug: 'virtual-medicine', name: 'Virtual Medicine',      relation: 'Client' },

  // Active alliances
  { slug: 'funfinity',        name: 'Funfinity Interactive', relation: 'Alliance' },
  { slug: 'zombie-fox',       name: 'Zombie Fox Studios',    relation: 'Alliance' },

  // Employee credentials
  { slug: 'bornmonkie',       name: 'BornMonkie',            relation: 'Team credential' },
  { slug: 'playstation-studios', name: 'PlayStation Studios', relation: 'Team credential' },
  { slug: 'xbox',             name: 'Xbox',                  relation: 'Team credential' },
  { slug: 'arkane-studios',   name: 'Arkane Studios',        relation: 'Team credential' },
  { slug: 'zenimax-media',    name: 'ZeniMax Media',         relation: 'Team credential' },
  { slug: 'gearbox-software', name: 'Gearbox Software',      relation: 'Team credential' },
  { slug: 'double-eleven',    name: 'Double Eleven',         relation: 'Team credential' },
  { slug: 'ridiculous-games', name: 'Ridiculous Games',      relation: 'Team credential' },
  { slug: 'amazon-games',     name: 'Amazon Games',          relation: 'Team credential' },
  { slug: 'ink-games',        name: 'INK Games',             relation: 'Team credential' },

  // Alma mater
  { slug: 'smu-guildhall',    name: 'SMU Guildhall',         relation: 'Alma mater' },
];
