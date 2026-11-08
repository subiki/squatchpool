# Squatch Pool identity / v3

This folder contains the approved **five-toe** footprint + prominent eight-ball system, not the former jellybean/paw mark. All icons are derived from the same visible silhouette and adjusted for a compact PWA launcher.

## Use
- `favicon.svg`: square browser icon master, and the shared site's header mark.
- `app-icon-master.svg`: editable launcher master. The committed 192/512 PNG exports are copied into the static PWA output in `scripts/build-pwa.mjs`.
- `mark-dark.svg`, `mark-light.svg`, `mark-mono.svg`: standalone clean vector variations.
- `badge.svg`, `textured-badge.svg`: print and decorative applications.
- `wordmark-dark.svg`, `wordmark-light.svg`: accessible horizontal lockups.
- `texture-felt.svg` and `texture-cedar.svg`: subtle decorative overlays. `texture-topography.svg` is archived only; its edges do **not** tile and it must never be applied as repeating page wallpaper.
- `forest-banner.svg`: preserved illustrative banner. The active shared game template uses optimized `pnw-forest.jpg` for scenic surfaces.
- `palette.json`, `contrast-matrix.json`: colors and measured token contrast.
- The self-contained `brand-artboard.svg` now shows the v3 mark at fixed aspect ratios (not stretched). The separately generated, approved v3 high-resolution illustration package remains available as a downloadable ZIP.

## Visual rules
Pacific Northwest temperate rainforest, subdued. No playing-card spades, sunglasses characters, neon/glossy arcade elements, stretched marks, or UI overlays on playing canvases. Use cedar grain on button surrounds, felt on HUD panels, moss/forest on cards and water subtly on site statistics. No repeating topographic wallpaper or oversized lines behind text. All copy must sit over an opaque enough dark-green surface.

## Accessibility
Normal body text requires ≥4.5:1 contrast; nontext UI boundaries ≥3:1. Light and dark sample color-pair checks live in `tests/brand-identity.test.js`; route-specific UI still needs browser-based contrast review, including pressed/disabled/focus states.


## Photographic material surfaces (v4)

The four locally committed JPEG materials `pnw-forest.jpg`,
`pnw-cedar.jpg`, `pnw-moss.jpg`, and `pnw-water.jpg` are optimized
atmospheric crops derived **only from the original approved v3
illustrated-concept-board and rainforest panorama** (not third-party web photos).
They deliberately remain lightweight (the forest panorama is 420×200 and
materials are 96×96) and always sit beneath a contrast-preserving CSS gradient.
For poster/full-resolution usage, work from the original v3 artboard rather
than enlarging these optimized website crops.

- **Forest** — single `cover` image for body, shared header, and hero; never tile.
- **Cedar** — shaded, single-instance wood grain on navigation and buttons.
- **Moss/grass** — understated physical texture on raised content cards.
- **Running water** — quiet water surface behind site statistics.
- **Felt** — the existing `texture-felt.svg` overlay remains local and repeating
  at a fine scale only where unobtrusive.

Do **not** use `texture-topography.svg` as a repeating full-page background.
Its paths have non-matching edges and caused visible seams at 420×280; do not
hide those seams with yet more repeated overlays. The original SVG remains in
the brand archive but the shared site no longer renders it.

All files are bundled into the offline PWA by the existing build scanner.
The shared visual presentation is owned by `src/pnw-theme.css` (Classic), `src/wild-squatch.css` (Rock & Roll) and `src/game-shell.css` (common geometry). Changing appearance must never alter control placement; individual games must never restyle the common layout. CSS falls back to opaque forest gradients if imagery is delayed or unavailable.
Keep default text at least 4.5:1 and important UI boundaries at least 3:1
against their *actual composited* backgrounds. Source-level palette tests
alone are not a complete browser WCAG audit.
