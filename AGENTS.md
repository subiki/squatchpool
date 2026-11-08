# Squatch Pool — coding agent instructions

> **Current direction (November 2026): ONE shared game-page template, not five independent mini-sites.** This instruction supersedes the old October ticket order, game-specific layout experiments and date-based release estimates.

## Start every run

1. Read [README](README.md), [Architecture](docs/ARCHITECTURE.md), [Game template](docs/GAME_PAGE_TEMPLATE.md), [Backlog](docs/BACKLOG.md) and [Delivery](docs/DELIVERY.md).
2. Inspect live `main`, open PRs and relevant issues **before editing**. Dated documentation is a snapshot, not a guarantee that a PR or deploy remains current.
3. Select one small useful vertical slice. Avoid overlapping agent branches and duplicate implementations.
4. Use a branch/PR; run applicable tests and check preview. After merge, verify the **exact merged SHA** on the existing Cloudflare Pages production deployment. Never invent a successful deploy or browser check.

## Shared interface — mandatory

- **Only one page composer:** `src/game-page-shell.js`. **Only one common layout stylesheet:** `src/game-shell.css`. Classic (`src/pnw-theme.css`) and Rock & Roll (`src/wild-squatch.css`) are **skins**, not alternative page templates.
- All five original games and Arcade use identical slots in order: **Introduction → Set up your game → How to play → At the table → Details and history**.
- Player and table-size inputs use the shared setup grid and the same labels, padding, dimensions and responsive layout. Game-specific skill, target or team choices are extensions *inside* the shared slots.
- Common shot layout: optional striker → power → Shoot/Break; reverse aim and fullscreen; expandable call/spin/game options; rack actions below.
- Game controllers own mechanics, scoring, bots, rules, state and named exceptional controls—not headers, cards, page spacing, selectors, background or independent button design.
- **Move existing canvas and control nodes; never clone them.** Preserve controller DOM IDs, event bindings, break placement and shared size preference.
- The site header and statistics persist across soft navigation. Mount/dispose controllers exactly once. Fullscreen must retain status, scoreboard, canvas, controls and rack actions.
- Avoid broad `!important` override patches and new `<game>-layout.css`. Change the shared shell, then check *all* games **in both appearance modes**. Theme CSS may style colors, type and decorative materials but must never change control geometry, DOM order or gameplay.
- Use local brand assets: Pacific Northwest temperate rainforest, cedar, moss, water, felt and footprint/8-ball. No jungle, cartoon sunglasses, flat green cards or mismatched repeating contour wallpaper.
- No external Google Docs/manual links, separate Rules/Field Notes pages, custom install buttons or visible offline-ready banner.
- No rule, physics or scoring modifications inside a pure layout cleanup. Keep regulation balls/pockets across 7/8/9-ft tables where supported.

## Acceptance for shared UI changes

1. `npm test`, `npm run check`, `npm run build`, then `node scripts/smoke-game-shell.mjs` on CI with Chromium (Classic and Rock & Roll). Review the generated game screenshot artifact; do not bypass failing checks.
2. Verify the **same shell hierarchy and setup/shot controls** in But Wait, Caroms, Cutthroat, Press Your Luck, Tuna **and Arcade**. No duplicate IDs or missing game-specific options.
3. Direct-load each page and navigate between games. Header must not rerender; prior controller listeners/timers must dispose.
4. Play a rack: break → call/aim → shoot → foul/turn → win → new rack. Test bot/local arrangements as supported; check unique scoring.
5. Inspect narrow mobile, desktop, fullscreen and safe-area controls **in Classic and Rock & Roll**. Appearance choice persists across routes, while the layout, focus/Space/keyboard behavior and accessible states remain consistent.
6. Check actual computed text/background contrast and image-loading screenshots. Static color ratios are not proof of complete WCAG compliance.
7. Verify native PWA/offline behavior; preserve existing Cloudflare build and production SHA evidence.

If the browser or device cannot be inspected, document the missing acceptance rather than declaring the work completely tested.

## Product and process

- **Features over tests**, but retain targeted regression tests for repeated bugs. Avoid extensive new QA infrastructure and speculative frameworks.
- Original game rules are stored in `src/game-guides.js` for display and in adjudicators for behavior. Preserve `archive/source/` untouched.
- One architecture PR at a time, plus nonoverlapping verification/hotfix work. Never cross-merge agent lanes or force-push another contributor's work.
- Keep product direction in [Backlog](docs/BACKLOG.md) and [Roadmap](docs/ROADMAP.md); keep procedure in [Delivery](docs/DELIVERY.md); keep component ownership in [Architecture](docs/ARCHITECTURE.md). Do not copy the same instructions into new one-off documents.
- Escalate only real owner choices, unavailable access, conflicting game rules or irreversible changes. Otherwise execute the highest-priority unblocked task.
