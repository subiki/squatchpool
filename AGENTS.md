# Squatch Pool — Agent instructions

> **ACTIVE PRODUCT DIRECTIVE — Oct 30, 2026:** [Ship tracker #159](https://github.com/subiki/squatchpool/issues/159) is the near-term execution queue. All **five existing** modes (But Wait, Caroms, Cutthroat, Press Your Luck and Big Tuna Casserole) have game pages; finish/verify their complete gameplay, compact fullscreen table UX, D1 statistics and offline production. **Do not start another game, rules workshop/Maker architecture (#151), 3D engine, or new CI framework before these acceptance gates.** Old numbered prototype phase/order sections below are historical; when they disagree with #159 and actual repo, follow the newer user directive. A merge is not a live release: verify production deployment.json SHA, assets, and real browser play. Continue from [docs/BACKLOG.md](docs/BACKLOG.md) and the related issues, choosing one independent player-facing slice per run.

## Mission
Finish and verify the **existing playable browser game**, then release a shareable Squatch Pool alpha. Keep changes lean. Read README.md, docs/BACKLOG.md and open GitHub issues before doing work.

## Current reality (recheck every session)
The repository contains a static, self-contained Canvas 2D prototype with a GPL-3.0 Tailuge Billiards-derived billiards physics engine of **But Wait, There's More**, with physics in src/physics.js, rules in src/rules.js, gameplay/UI in src/game.js, and Node tests. The existing deployment and issues may be changing in another ChatGPT session. **Do not restart engine evaluation or replace the Tailuge integration just because an old issue or instruction suggests it.** Reconcile current code, open PRs, and issue edits first.

## Deployment timestamp in site header
- The top banner shows a Pacific-time version timestamp from `deployment.json`, generated **inside the Cloudflare Pages build**, not the viewer's clock. Preserve the verified fallback and distinguish preview builds from production.
- `scripts/stamp-deployment.mjs` is invoked by `npm postinstall` (Cloudflare's default install) and `npm run build` (alternative if install hooks are disabled). Use the provided Cloudflare build SHA and timestamp; no Github API credentials in browser. Output dir stays `.`. The stamp marks build time **just before** deployment, not the exact successful upload completion.
- `src/deployment.js` formats `America/Los_Angeles` with DST automatically and retains last independently verified production timestamp on metadata failure. Never fabricate a production deploy from `Date.now()` at page load or the latest git commit.
- Maintain `tests/deployment.test.js` covering both time zones, manifest validity, previews and fallback. Real Cloudflare check runs are the source for exact completed deploy timestamps.

## Break-shot placement and physics
- Start every new rack in `placeBreak` mode. Human breaker must tap or drag/release **anywhere within the kitchen** (not just on top of the cue ball) at a legal point behind—not on or beyond—the head string. Let the cue center reach within one ball radius of cushion noses; don't reuse stricter general `canPlace` or add arbitrary margin. Direct tap/drag reposition should work until strike even during break-aim mode. That is a physical restriction through `headStringX`/`canPlaceBreakCue`. Never permit `BREAK!` before placement. The `Reposition break cue ball` button returns to placement mode until cue strike; no called ball/pocket is needed on the break.
- Keep break shot power physically calibrated independently from ordinary shots: max ~11.5m/s (~25.7mph), default break 85% ~9.9m/s, reset to standard 68% for normal shots. Never solve weak breaks by changing frame time or turning up all shots. Tight rack uses near-touching regulation balls; apex at foot spot, 75% along the bed. Validate full-break ball movement and first contact on all sizes as well as UI placement/reposition/forbidden kitchen clicks.
- Current `src/physics.js` exports `shotSpeed`, `headStringX`, `canPlaceBreakCue`, and `kitchenPoint`; `tests/call-ui.test.js` drives actual UI handlers.
- Keep physical Tailuge ball radius **0.028575 m**, ball mass **0.17 kg**, ball-ball restitution **0.94**. **Cloth sliding μ=0.20 and rolling μ=0.010**, grounded in Dr. Dave's ranges, are now the benchmark, replacing the 'ice-like' 0.126 sliding and 0.007/√2 rolling behavior. Earlier code also used an incorrect radius 0.03275 m and mass 0.23 kg; do not restore them to 'improve' break dynamics. Rendering must keep 2.25in balls on all table sizes. Keep animation frame backlog instead of dropping time (old .08s cap/reset made heavy breaks look slow). Do not reintroduce hardcoded 9ft dimensions.

## Cloth realism and neutral stroke controls
- See **docs/PHYSICS_CALIBRATION.md** for published parameter sources, 120 Hz measured stop time/distance, slip→roll time, spin decay, and open real-table validation gates. The typical baseline is sliding μ_s≈0.20, rolling μ_r≈0.010, and 0.5m/s natural roll stops in roughly 1.27m/5s. The old 0.007/√2 coefficient made the felt artificially slick. Never apply one drag multiplier to all friction states or undo the physically limited slip impulse (slip/3.5).
- At the **instant of every strike**, reset all three control sliders and displayed labels: **power=68%**, **draw/follow=0%**, **English=0%**; the initial break is still 85% *before* the break. This must work for regular shots, breaks, pass-and-play, and bot play; don't touch the spin/power already applied to the moving ball. Preserve all event tracking, called-pocket, and Undo UX. The real-game tests must cover both break and post-break slider resets.
- Treat numerical regression and published ranges as evidence for this *baseline*, not full calibration to a particular real cloth. Playtest ball skid, stop distance/time, side-spin decay, draw retention and low/medium/high banks before further tightening of coefficients.

## Site-wide statistics (newly requested)
- The main page must show shared real players/racks/balls totals and **by-game breakdown**, plus the current game's three totals immediately above the table. Register new *playable* game IDs in `src/stats-games.js` (do not count archive/rules as played games).
- `functions/api/stats.js` exposes the one Cloudflare Pages Function API, backed by D1 binding `STATS_DB`. Do not invent localStorage aggregate counters or create a duplicate hosting pipeline. The D1 binding requires one-time Cloudflare dashboard hookup for **production**, with an isolated **preview** D1 database (see `docs/STATS.md`). A missing binding must show 'stats unavailable' gracefully, not 0; gameplay remains usable.
- Player metric = distinct anonymous browsers that **struck a rack** (never bot counts, no claim that pass-and-play equals two people); rack = break actually struck; balls = non-cue balls physically pocketed after physics settles, including slop, no scratch count. Stats start when deployed and bound, **no historical backfill**.
- IDs for rack and shots are browser UUIDs, server accepts idempotent inserts and validates game, rack ownership, count limits. Browser keeps a bounded retry queue. No names, emails or raw visitor IDs go to D1; store only hash. Never claim authenticated/unsybilable counts.
- Preserve the 120Hz simulation and call/undo UX. Keep `tests/stats.test.js` green, test a real POST→GET across two browsers after D1 binding, and never count page loads as racks.

## Direct table call UX
- No native ball/pocket dropdowns: on post-break human turns, tap a legal object ball in the canvas, then tap one of six visible, accessible pocket buttons over the canvas. Large touch targets and fallback numbered ball buttons must remain functional on phones.
- Suppress cue stick and aim guidance until both called ball and pocket are locked. During the break, aim immediately with no call. `Undo call` clears both selections only before a shot is fired. Never permit shoot (including keyboard) without the required call.
- `tests/call-ui.test.js` mocks the browser surface and loads the actual game module; keep it passing alongside physics/rules tests. Real browser playtesting is still a required release gate.

## Regulation table sizes — geometry invariants
- The three size buttons choose standard **7 ft = 78×39 in**, **8 ft = 88×44 in** (not oversized/pro 8 ft 92×46), **9 ft = 100×50 in**, measured between opposite cushion noses.
- Never scale or stretch balls or pockets with bed size. All tables retain **2.25 in balls**, **4.56 in corner mouths**, **5.06 in side mouths**, and the same cushion/pocket angles and shelf depths. The shared constant `PX_PER_IN` is derived from the ball diameter; `setTableSize(7|8|9)` rebuilds the shared arrays in place.
- Place racks, head string, rails, pockets, cue and other marks from the current `TABLE.width`/`TABLE.height`; do not cache these dimensions at module load. Canvas pixel dimensions, CSS aspect ratio, hit coordinates, physics and visual geometry must stay synchronized.
- Changing table size starts a new rack and remembers the preference locally. No extra network, sign-in, or Cloudflare settings. Preserve the no-call break, table-tap ball/pocket choice and undo UX.
- All 3 sizes must pass the same pocket, rail, ball-overlap, and break tests, plus the actual game click regression. Real touch/desktop verification is still required.

## Geometry and called-shot truth
- One physical/visual source of truth is `src/table-geometry.js`, scaled from standard 7/8/9 foot playing surfaces and WPA pockets (9 ft is 100×50 inches, ball 2.25 inches, corner mouth 4.56 inches diagonally between lips, side mouth 5.06 inches across tips, corner and side shelves, angled facings). No circular capture zones or unaligned decorative rails.
- `But Wait, There’s More` requires an explicitly **called ball and pocket after the break**; slop stays pocketed but does not retain turn or assign a group; eight in an uncalled pocket loses. Break shots are exempt from calling. Use shot pocket IDs emitted by physics; never infer the pocket by ball position after it disappears.

## Physics and open-source obligations
- Tailuge-derived billiards physics lives in `src/vendor/tailuge-physics.js`; the game adapter and pocket/rail geometry live in `src/physics.js`. Preserve this modular boundary and the 120Hz frame API.
- Under GPL-3.0, distribute full corresponding source and license with the browser game. Keep `/LICENSE`, `/THIRD_PARTY.md` and public source links available. Do not silently change the license or hide adaptations.
- Box2D/Planck was the older implementation and is not the active engine. Further spin/cushion/pocket tuning must use observable playtests and focused regressions.

## Canon and delivery
- Squatch Pool is set in a **Pacific Northwest temperate rainforest**, never a tropical jungle. Use native cedar/hemlock, moss, ferns, mist and rain in art, lore, copy, character intros and prompts. Preserve historical archives verbatim.
- Follow [docs/DELIVERY.md](docs/DELIVERY.md) for the issue → branch → PR → CI → Cloudflare preview → merge → production verification loop. Reuse the existing Cloudflare integration; do not build duplicate deployment infrastructure.

## Parallel-agent coordination
- Assume another agent may be editing the same repository at the same time.
- Before any write: refresh the target file/issue, check branches and open PRs, and choose a non-overlapping issue.
- Prefer a dedicated branch and small PR for code changes. Do not force-push, overwrite concurrent changes, or merge unreviewed conflicting work.
- If another agent owns a task, choose a distinct independent issue (tests/docs/validation) and say what you are taking.
- Treat live playtest findings and newer confirmed rule descriptions in GitHub as higher priority than stale roadmap text.
- Never mark someone else's task complete without verifying acceptance evidence.

## Release strategy and engineering maturity
- [docs/ROADMAP.md](docs/ROADMAP.md) defines the v0.1–v1.0 product exit gates and aggressive target dates. Treat dates as targets; never declare a release complete without evidence. Do not call the current prototype v1.0 or infer completion from green CI.
- **v0.1–v0.2:** optimize for fun and a complete match. Run existing tests and syntax checks plus focused manual browser playtests; add regression tests for concrete failures, not speculative coverage. **No full TDD or coverage quota.**
- **v0.3–v0.4:** add focused repeatable physics/rules regressions as needed; validate a real desktop and touch playthrough for each release.
- **v0.5–v1.0:** gradually enforce PR checks, deployed preview smoke tests, release evidence and rollback only as reliability needs justify them. Do not create a second Cloudflare deployment system.
- Prioritize a working game over release ceremony. A failed core flow blocks a release; an optional cinematic does not. Cut optional scope before compromising core play.
- Domain/content migration (#28) runs independently. Never block physics/gameplay changes on registrar or DNS work.

## Delivery order and gates
1. **P0: Preserve playable deployment** — confirm current public URL and run existing tests. Fix regressions first. See #5.
2. **P0: Original game correctness** — implement the actual opponent-selected held-ball behavior for But Wait, There's More; see #7. Never invent unresolved edge cases.
3. **P0: Input and game completion** — phone/desktop aiming, placement, fouls, complete local match and restart; see #3 #4 #15.
4. **P0: Release verification** — demonstrate full match in actual desktop and touch/mobile browser; record environment, steps, result, screenshot or other evidence where possible; see #13.
5. **P1: Presentation** — improve Squatch branding and character personality without delaying functional release; see #6.
6. **Later** — other original games, rules editor, creator, sharing workshop, hybrid referee (#8–#11 and docs/BACKLOG.md). No infrastructure work for these before P0 passes.

Existing M0 engine-selection issue #12 is historical planning; reassess against current implementation before spending time. Do not delete or close it without recording the reason.

## Every work session
1. Read AGENTS.md, README.md, docs/BACKLOG.md, current open issues, PRs, and latest relevant commits.
2. Pick one unclaimed, high-impact P0 task; avoid duplicating another agent.
3. Implement the smallest working change. Run `npm test` and `npm run check`.
4. Verify user-facing behavior in a real browser where tools permit; a successful build alone is insufficient.
5. Update the relevant issue with commit/PR, tests, browser/device and outcomes, URL and remaining gaps.
6. Close only after acceptance criteria are actually verified; otherwise leave it open and move to another unblocked task.
7. Repeat until release gate passes, or document the exact external blocker.

## Rules and product constraints
- Browser/mobile web first; no native package, login, network multiplayer or community creator in P0. The **one D1-backed anonymous statistics counter** is an explicit user-approved exception to the previous no-database prototype scope; keep it narrow and optional, with graceful failure.
- Local two-player pass-and-play is sufficient; simple bot is optional.
- Source-of-truth original game: **But Wait, There's More**. The opponent chooses which held ball to reintroduce and where to place it legally. Do not silently auto-select based on the shooter's group. See issue #7 for detailed edge cases and acceptance.
- Do not infer undocumented Squatch rules from story episodes. Ask for only genuinely missing decisions; work on independent tasks meanwhile.
- Keep working deployment available. Avoid sweeping refactors, framework rewrites, new engines, elaborate CI, or unrelated polish.
- If source/license questions arise, inspect actual files and dependencies rather than guessing.

## Immediate v0.1 release gate
v0.1 is eligible for release only when a public URL opens without login; desktop and touch aiming/shooting work; normal collisions, pockets and scratches work; two local players can finish a full game with correct held-ball choice and placement, turns, fouls and win detection; restart works; and Squatch identity is visible. Record real-browser evidence. If a gate is unverified, report it as unverified.

## Blockers and recovery
Diagnose routine failures and try bounded fixes. Preserve last known playable state. Escalate only missing access/credentials, consequential licensing questions, or genuinely unresolved original rules. Report what failed, what was tried, the recommended resolution, and one specific question. Do not fabricate tests, deployments, approvals, or completion.

## Session handoff
Report: current deployed URL and verified status; issue/PR worked; tests and browser evidence; remaining release gates; next concrete action; blockers. Instructions do not themselves schedule background agents.

## Installable offline PWA
- New pages/games must include `/manifest.webmanifest` and `/src/pwa.js` in the HTML head; `scripts/build-pwa.mjs` automatically bundles root HTML, source JS/CSS, archive text and launcher icons for offline play. Static Pages root remains `.`.
- Cloudflare's existing npm postinstall and npm build generate a versioned `service-worker.js`, without an alternate deployment pipeline. Keep the old working cache until a full new asset preload succeeds. Never cache `/api/` or pretend server statistics are available offline.
- Run `npm run build` before local offline testing. Test install, reload in airplane mode, open each game/rules/archive, and reconnect on an actual Android browser before claiming a release verified. Offline racks are playable but not persisted across reloads yet.
