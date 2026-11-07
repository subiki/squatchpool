# Squatch Pool identity / v3

This folder contains the approved **five-toe** footprint + prominent eight-ball system, not the former jellybean/paw mark. All icons are derived from the same visible silhouette and adjusted for a compact PWA launcher.

## Use
- `favicon.svg`: square browser icon master, and the shared site's header mark.
- `app-icon-master.svg`: editable launcher master. The committed 192/512 PNG exports are copied into the static PWA output in `scripts/build-pwa.mjs`.
- `mark-dark.svg`, `mark-light.svg`, `mark-mono.svg`: standalone clean vector variations.
- `badge.svg`, `textured-badge.svg`: print and decorative applications.
- `wordmark-dark.svg`, `wordmark-light.svg`: accessible horizontal lockups.
- `texture-felt.svg`, `texture-cedar.svg`, `texture-topography.svg`: small procedural patterns loaded by `src/pnw-theme.css`.
- `forest-banner.svg`: illustration behind the homepage hero; non-essential to game rendering.
- `palette.json`, `contrast-matrix.json`: colors and measured token contrast.
- Existing v2 artboard is superseded by the approved downloadable v3 high-resolution asset kit; do not use the old artboard as a new production graphic.

## Visual rules
Pacific Northwest temperate rainforest, subdued. No playing-card spades, sunglasses characters, neon/glossy arcade elements, stretched marks, or UI overlays on playing canvases. Use wood grain on buttons/surrounds, felt on card panels, topographic pattern on background. Keep copy on sufficiently opaque surfaces.

## Accessibility
Normal body text requires ≥4.5:1 contrast; nontext UI boundaries ≥3:1. Light and dark sample color-pair checks live in `tests/brand-identity.test.js`; route-specific UI still needs browser-based contrast review, including pressed/disabled/focus states.
