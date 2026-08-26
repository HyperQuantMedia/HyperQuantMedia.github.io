# Partner logo tiles

Logos of the studios, publishers, and institutions the team's production
experience comes from. Rendered by the pedigree row on the homepage; the list
and display names live in `src/data/partners.js`.

## Provenance

`amazon-games.png` came later: fetched from Wikimedia Commons (the Amazon
Games logo SVG render) at the owner's direction on 2026-08-22, then run
through the same trim-and-pad treatment as the rest.

`bornmonkie.png` likewise, on 2026-08-22 at the owner's direction, settling
on the studio's registered mark: the orange monkey head on its own dark
ground (their official avatar artwork, fetched from the BornMonkie YouTube
channel at 900px). Full-bleed like the other dark-artwork tiles - the mark
carries its own ground, so no white plate.

`playstation-studios.png` likewise: the PlayStation Studios lockup fetched
from Wikimedia Commons at the owner's direction on 2026-08-22, standard
trim-and-pad treatment.

The rest were recovered from the previous site before it was taken down, which
was the only source available. The capture and the promotion script that
produced these files are kept outside this repository.

That site served only resized variants in its markup, so the originals were
pulled by stripping the transform segment from each asset URL.

## Why they are pre-processed

The sources are heterogeneous: some are wordmarks on white, some are full-bleed
square artwork. Dropped in raw they give wildly different optical weights, which
is what made the old logo row read as a sticker sheet.

Each file here is trimmed to its actual content, then centred on a 400x400 white
canvas with 10% padding, so every tile carries the same optical size. The
full-bleed artwork logos still fill their square — inherent to the artwork, not
fixable without redrawing them.

The white plate is deliberate. Several of these logos are black-on-white and
would disappear against the site's dark ground.

## Trademarks

These are other companies' marks, shown to evidence where the team has worked or
studied — not to imply endorsement or partnership. The credit line in
`src/data/partners.js` carries that distinction and needs to stay with the row.
