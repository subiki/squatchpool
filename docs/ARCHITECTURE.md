# Architecture and ownership

Squatch Pool is a static, offline-capable pool app, not five independently maintained websites. One renderer composes the **same game UI** while each variant supplies behavior and unique options.

```text
Home / But Wait / Caroms / Cutthroat / Press / Tuna / Arcade
  ├─ site-styles.css                     ONE ordered CSS entry (every route)
  │    game-page-layout + shared-header + pnw-theme + game-shell
  ├─ site-header.js + wild-squatch.css    persistent header + optional Rock
  ├─ game-page-shell.js + game-shell.css   ONE page layout
  │    Introduction → Setup → Rules → Table → Details/history
  └─ game controller                     rule-specific behavior
       ├─ table physics / geometry / renderer
       ├─ shot lifecycle / input / bots
       ├─ adjudication / scoring
       └─ stats / match progression
```

## Responsibility map

| Responsibility | Owner |
| --- | --- |
| Section order, player/table controls and shot-kit arrangement | `src/game-page-shell.js` |
| Game-page responsive, fullscreen, card and control layout | `src/game-shell.css` |
| Shared header, art, appearance switch and skins | `src/site-header.js`, `src/pnw-theme.css`, `src/wild-squatch.css`, `assets/brand/` |
| Route switching, header retention, lifecycle | `src/static-navigation.js`, `src/*-entry.js` |
| Game states and live controls | `src/game.js`, `src/{caroms,cutthroat,press-your-luck,tuna}-game.js`, `src/arcade-game.js` |
| Shared pool simulation | `src/physics.js`, `src/table-geometry.js`, `src/table-renderer.js` |
| Rules enforced by gameplay | Rule engines, adjudicators and shot adapters |
| Rules displayed to players | `src/game-guides.js` |
| Hosted stats and offline PWA | `src/stats-*.js`, Pages functions, `src/pwa.js`, `scripts/` |

## Appearance versus layout

The header offers **Classic** and **Rock & Roll** skins. The appearance preference persists as the player navigates. Both skins use the **same** shared page composition and control geometry: they may change color, typography and artwork, never reorder sections or restyle individual game interfaces. Diagnose layout bugs in `game-page-shell.js` or `game-shell.css` before touching a skin. Compare both modes during visual acceptance.

### CSS loading is an architectural interface

Every public HTML route links **once** to `/src/site-styles.css`, which imports
`game-page-layout.css` → `aim-preference.css` → `shot-announcer.css` →
`shared-header.css` → `pnw-theme.css` → `game-shell.css`. Game-only CSS
is loaded **before** that link, and the optional `wild-squatch.css` is
attached **after** it by `site-header.js`. The same order is required on
direct navigation and via `static-navigation.js`; its injected route
styles belong **before** the persistent shared link.

This rule is enforced by `scripts/verify-ui-contract.mjs` during `npm run
build`. The checker also rejects page-level CSS resets in game-specific inline
styles. It addresses an actual defect: route-specific `:root`, `body`,
`main` and generic button rules previously applied differently depending
on navigation path. Avoid growing the historical `!important` override
stockpile; simplify an existing owner as components are migrated. The older
Rock CSS still needs incremental reduction, but new features must not add a
third layout layer.

## How one template works

At game mount, `prepareGamePage(root,gameId)` builds a single outer structure. It **moves**, rather than clones, existing game inputs/HUD/canvas into its named slots, then the controller installs listeners on those original elements. Config lists only valid game-specific setup fields and titles. The visual hierarchy is the same for every route.

This adapter stage preserves controller-required game markup, but removes duplicate static rulebook markup: rule text has one source in `src/game-guides.js`. **Next cleanup:** move repeated source markup into common builders and remove obsolete per-route styling; do not build another abstraction beside this one.

## Compatibility boundaries

- Keep each controller-required ID, canvas node, DOM event and game state unchanged during presentation work.
- `#table-stage` is the fullscreen host; scores, canvas, shot kit and rack actions stay within it.
- The site header remains mounted through SPA transitions; mounted controllers dispose listeners/timers on exit.
- The PNW assets are local. Soft navigation rejects route-local CSS with URL dependencies; keep photo textures in persistent CSS.
- No new public Rules/Field Notes pages or outbound manuscript links.
- No physics, bots, scoring, backend, auth or third-party systems work just to standardize appearance.

Read [Game page template](GAME_PAGE_TEMPLATE.md) for exact layout and acceptance criteria.
