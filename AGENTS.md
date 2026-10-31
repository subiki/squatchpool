# Squatch Pool — agent instructions

> **ACTIVE EXECUTION GATE (2026-10-31):** [docs/BACKLOG.md](docs/BACKLOG.md) is the **single ordered queue**. **NOW = [#206](https://github.com/subiki/squatchpool/issues/206)**: shared break placement and shot lifecycle, first Press Your Luck then Tuna, reconciling PRs #204/#205. **NEXT = #207 → #209 → #208 → #210** (shot-result event contract before UI consumers). [#53](https://github.com/subiki/squatchpool/issues/53) owns architecture acceptance; [#159](https://github.com/subiki/squatchpool/issues/159) owns the five-game release gate. **Only production-down or a completely unplayable core flow may interrupt.** If the architecture PR is already claimed, use the **independent** production verification lane #128; do not duplicate work. Older v0.1 one-game, chronological version targets, numbered phases and broad new-game directions below are historical when they conflict with this queue.

> **New player-facing acceptance (2026-10-31):** The canonical header, including Pacific deployment stamp and site statistics, is merged in [PR #213](https://github.com/subiki/squatchpool/pull/213). True header-preserving navigation across games requires lifecycle-safe routing [#212](https://github.com/subiki/squatchpool/issues/212). All five games must support solo vs bots or valid local human seats: track [#77](https://github.com/subiki/squatchpool/issues/77), including Cutthroat 1+2 bots / 2+1 bot / 3 humans. Existing But Wait and Caroms bot modes work in code; do not mislabel the others until actually playable. Schedule bot parity after #209's shared contract and before final #159 acceptance. Preserve existing PWA and game telemetry while changing headers.

**First five minutes of any agent run:** read BACKLOG.md, current #206/#53/#159, `main`, *all open PRs touching the files you would edit*, then claim one small unblocked slice in the relevant issue. Cap active work to **one architecture PR plus one non-overlapping production/verification task**. Follow [docs/DELIVERY.md](docs/DELIVERY.md); provide actual test/browser/Cloudflare evidence. No new modes, Maker, 3D, accounts, broad test harness or speculative refactor before five-game acceptance.

## Mission
Finish and verify the **existing playable browser game**, then release a shareable Squatch Pool alpha. Keep changes lean. Read README.md, docs/BACKLOG.md and open GitHub issues before doing work.

## Current reality (recheck every session)
Five game pages are present: But Wait, Caroms, Cutthroat, Press Your Luck and Big Tuna Casserole. They are **not yet accepted as five complete production-verified matches**. Physics and 7/8/9-foot geometry are shared; renderer/input/UI/session and rule orchestration are fragmented, driving repeated break, call and HUD bugs. Preserve Tailuge and original rules. Reconcile open PRs before editing; a GitHub merge is not production verification. Specific next actions and deferred features are in [docs/BACKLOG.md](docs/BACKLOG.md).

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

## Lean delivery and release gates
- **Current sequence:** M1 #206 → M2 #207 → M4 #209 → M3 #208 → M5 #210, then verify five-game release #159. The shared shot-result event must precede the HUD/announcer/history built on it. Keep each game migration a small, reversible playable PR.
- **P0 exception:** production down or a mode unable to start/break. Investigate #128 and current #204/#205 before making a competing fix. Routine polish, extra modes, new frameworks and creator systems are parked.
- **Tests:** run current `npm test`, `npm run check`, `npm run build` as relevant, plus actual touch/desktop behavior where possible; write focused regressions for reproduced defects, not blanket coverage goals. Never treat missing CI runner as a failing test.
- **Ship discipline:** PR + merge is code shipped to a branch, *not* Cloudflare-deployed or player-accepted. Verify deployment SHA, live gameplay, honest D1 counters and PWA offline behavior as specified in #159. Preserve last known playable production.
- **Parallel agents:** claim on the issue with branch/files/outcome; check conflicting PRs before edits. One architecture PR + one independent production/verification lane maximum. Do not rewrite another agent's branch, force-push, or merge overlapping changes blindly.
- **Escalation:** only unresolved house rules, access, irreversible decisions or real owner priority tradeoffs. Otherwise choose first unblocked queue item and ship the smallest player-facing increment.
- **Handoff:** issue/PR/commit, tests actually executed, browser/device evidence (or unverified), deployed SHA (or unverified), outcome, exact next action and blocker. Close issues only after the stated acceptance evidence.

## Technical and product invariants
- The original But Wait opponent may choose **either** hidden ball and place it legally; preserve all five distinct house-rule engines.
- Keep regulation 7/8/9-foot physical ball/table/rail/pocket measures and Tailuge integration; keep PNW **temperate rainforest** canon, GPL notices and original archives.
- Keep D1 `STATS_DB` anonymous semantics, event dedup, and offline PWA; API stats must never be cached offline or invented on failure.
- Preserve persistent reverse aim, direct touch placement and a no-confirmation normal break after legal cue placement. Called ball/pocket before a regular shot and ability to change pocket until shooting must work.
- Read [docs/PHYSICS_CALIBRATION.md](docs/PHYSICS_CALIBRATION.md), [docs/STATS.md](docs/STATS.md), specific game issues and this file's technical sections for exact behavior; do not invent missing rules.

## Installable offline PWA
- New pages/games must include `/manifest.webmanifest` and `/src/pwa.js` in the HTML head; `scripts/build-pwa.mjs` automatically bundles root HTML, source JS/CSS, archive text and launcher icons for offline play. Static Pages root remains `.`.
- Cloudflare's existing npm postinstall and npm build generate a versioned `service-worker.js`, without an alternate deployment pipeline. Keep the old working cache until a full new asset preload succeeds. Never cache `/api/` or pretend server statistics are available offline.
- Run `npm run build` before local offline testing. Test install, reload in airplane mode, open each game/rules/archive, and reconnect on an actual Android browser before claiming a release verified. Offline racks are playable but not persisted across reloads yet.
