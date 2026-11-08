# Squatch Pool — Rock & Roll visual contract

Classic is the preserved baseline. Rock & Roll is an optional, reversible overlay in src/wild-squatch.css. Do not alter Classic to achieve the Rock look.

## Typography
- Display: Georgia, Times New Roman, serif. Wordmark, page titles, game headings, section signs.
- Interface: system-ui. Body copy, rules, buttons, labels, tables, stats, shot overlays and Pacific deployment stamp.
- Typography tokens live in src/wild-squatch.css. No per-game font overrides or external font downloads.
- Only the hero headline uses italic display; other headings stay upright.

## Visual language
- Pacific Northwest temperate rainforest, never jungle: firs, moss, ferns, Cascades, waterfalls.
- Repository-owned assets in assets/brand; rock-pnw-hero.svg is a first reusable asset, not a substitute for game-specific illustrations.
- Cedar/brass frames, dark opaque panels, moss-green action buttons; no small text on busy art.
- Differentiate games with art and accents, not divergent layouts.

## Page contract
- One shared header, navigation, Pacific deployment stamp and live statistics across all pages.
- Shared gameplay table/control layout. Decorative artwork must never cover aim controls or intercept touches.
- Homepage is the storefront; rules expand in place; no external rulebook links.
- Never invent stats, achievements or account state.

## Release gate
1. Toggle Classic to Rock and back; verify the original skin is unchanged.
2. Navigate home and every game; verify consistent typography and navigation.
3. Check mobile width, focus indicators, touch targets and table interaction.
4. Run release CI, inspect preview and verify production after deployment.
5. Ship small visible improvements; no unnecessary test infrastructure.

Tracking: #291, #293, #294, #295.