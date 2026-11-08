# Squatch Pool · The 4T's

**Play:** https://squatch.subikistudios.com/

Five unusual pool games set in a Pacific Northwest temperate rainforest. Play against Squatch bots or local friends on a 7-, 8- or 9-foot table where supported. Arcade Lab is an additional local-only Squatch Points experiment.

**Current state:** playable alpha. Five game engines exist; a consistent cross-game interface, reliable full-match play, mobile/fullscreen and offline acceptance are ongoing. A green build does **not** certify gameplay.

## Games

| Game | The twist |
| --- | --- |
| But Wait, There's More | A hidden solid or stripe can be placed in front of your 8 |
| Caroms | Shoot a numbered ball into the white, then carom to a pocket |
| Coin-Op Cutthroat | Three colored teams; scratches can transfer a ball and revive a player |
| Press Your Luck | Build rack points, risk bonus points, double the winning 8 |
| Big Tuna Casserole | Two lowest-ball sequences and a special winning 10 |
| Arcade Lab | One pool challenge with imaginary, browser-local points |

On **Home**, expand each game's detailed house rules and example. Every game page shows the same in-site rules, collapsed by default. Rules and Field Notes no longer have separate public pages.

## How to play

The same layout appears on each game route: **Introduction → Set up your game → How to play → At the table → Details and history.** Choose players and table size, open the rules if needed, then use the table. Common controls are power, Shoot/Break, reverse aim, fullscreen and expandable shot options. The unusual legal shots and scoring are specific to each game.

Most games let you place the white ball in the shaded kitchen before breaking; Caroms breaks using the 1-ball. Called-pocket games require the intended ball and pocket after the break. Press **Space** to shoot while aiming where supported. The browser controls PWA installation: no custom Install button or offline-readiness banner.

## Run locally

Use a modern browser and a local HTTP server:

```bash
npm ci
python3 -m http.server 8080
# Open http://localhost:8080
```

Run the existing lightweight checks before proposing a change:

```bash
npm test
npm run check
npm run build
```

Cloudflare Pages deploys the static site from `main`; its header displays a build timestamp in Pacific time and a commit identifier. Cloudflare D1 supplies optional hosted anonymous statistics. Game functionality must degrade gracefully if statistics cannot load.

## Code at a glance

- **One page composition:** `src/game-page-shell.js`, `src/game-shell.css`. Layout and common player/table controls belong here.
- **Brand/header:** `src/pnw-theme.css`, `src/wild-squatch.css`, `src/site-header.js`, `assets/brand/`. Classic and Rock & Roll are appearance options; both use the **same page layout**. Forest, cedar, moss, water and felt imagery is local.
- **Game behavior:** `src/game.js` and `src/{caroms,cutthroat,press-your-luck,tuna}-game.js`. Rule and bot differences belong in controllers and adjudicators, not in new page templates.
- **Shared playing engine:** `src/physics.js`, `src/table-geometry.js`, `src/table-renderer.js` and shot/session utilities.
- **House-rule copy:** `src/game-guides.js`. Keep it aligned with actual adjudication.
- **Offline:** `src/pwa.js` and `scripts/`. A single PWA serves the seven public pages.

Use the shared header's **Classic / Rock & Roll** toggle to change appearance without changing game controls or section order.

The shared shell currently **moves the existing controller-owned DOM nodes** into one runtime layout, preserving canvas and input IDs. The five game HTML files no longer copy lengthy rulebooks: `src/game-guides.js` supplies one renderer for Home and in-game instructions. Continue retiring obsolete setup and shot-kit wrappers in small verified slices; do not create another page style.

## Documentation

Start at the [documentation map](docs/README.md).

- [Architecture](docs/ARCHITECTURE.md) — ownership and data flow.
- [Game page template](docs/GAME_PAGE_TEMPLATE.md) — mandatory common layout, control contract and migration checklist.
- [Backlog](docs/BACKLOG.md) and [roadmap](docs/ROADMAP.md) — current work and release outcomes.
- [Delivery](docs/DELIVERY.md) — tests, preview, production and rollback.
- [Agent instructions](AGENTS.md) — hard constraints for automated contributions.
- [Brand assets](assets/brand/README.md) and [third-party notices](THIRD_PARTY.md).

**Operating philosophy:** fun and visible features first, small reversible changes, no heavyweight coverage targets or new modes until the existing games work cleanly. Preserve original manuscripts in `archive/source/`, without sending visitors to external documents.

## License

The adapted Tailuge physics code means the distributed browser project follows **GPL-3.0**. Keep [LICENSE](LICENSE) and [THIRD_PARTY.md](THIRD_PARTY.md) intact. Recovered house-rule source material is preserved in Git history and `archive/source/`; current playable rules are maintained separately.
