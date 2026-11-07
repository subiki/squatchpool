# Squatch Pool — footprint/8-ball branding kit

## Consistent assets
- **Vector masters:** mark-dark.svg, mark-light.svg and mark-mono.svg. These are resolution-independent. No spade or caricature.
- **Brand treatments:** favicon.svg, badge.svg, badge-light.svg, textured-badge.svg, wordmark-dark.svg, wordmark-light.svg, social-square.svg.
- **Environment:** forest-banner.svg and pattern-fern.svg. Use only as subtle decoration, not behind small text.
- **Visual guide:** brand-artboard.svg (scalable vector artboard). A downloadable 2400px raster export is available separately.
- **Production icons:** app-icon-192.png, app-icon-512.png, apple-touch-icon.png, favicon-32.png are tracked alongside the masters. The PWA build copies the icons to root manifest paths.
- **Auditable color system:** palette.json and contrast-matrix.json. Shared header CSS and tests use the same semantic colors.

## Readability
Light surface `#F7F5EC` with `#102923` text; `#14513D` primary buttons with light text; copper `#865016` as the complementary readable accent. Dark surface `#0C2119` with `#F4EEDA` text; light moss `#A4CC99` buttons with deep text; brass `#F0C478` for links and focus. Do not put brass or yellow small copy on cream. Keep Cutthroat group colors accompanied by written labels.

Every reviewed normal-text contrast pair is >=4.5:1; important component boundaries/focus are >=3:1 against their neighbor. The color audit certifies **defined tokens and shared header components**, not every legacy game page. Audit remaining hardcoded UI colors as separate slices.

## Usage
Use clean, high-contrast icon at favicon sizes and optional badge texture only for large artwork. Keep the same header icon across all nine routes. Preserve browser-native PWA install rather than an in-page Install button. Avoid embedded web fonts; use readable platform UI fonts.
