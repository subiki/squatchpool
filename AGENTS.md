# Squatch Pool — Agent instructions

## Mission
Finish and verify the **existing playable browser game**, then release a shareable Squatch Pool alpha. Keep changes lean. Read README.md, docs/BACKLOG.md and open GitHub issues before doing work.

## Current reality (recheck every session)
The repository contains a static, self-contained Canvas 2D prototype with a GPL-3.0 Tailuge Billiards-derived billiards physics engine of **But Wait, There's More**, with physics in src/physics.js, rules in src/rules.js, gameplay/UI in src/game.js, and Node tests. The existing deployment and issues may be changing in another ChatGPT session. **Do not restart engine evaluation or replace the Tailuge integration just because an old issue or instruction suggests it.** Reconcile current code, open PRs, and issue edits first.

## Break-shot placement and physics
- Start every new rack in `placeBreak` mode. Human breaker must tap or drag/release **anywhere within the kitchen** (not just on top of the cue ball) at a legal point behind—not on or beyond—the head string. Let the cue center reach within one ball radius of cushion noses; don't reuse stricter general `canPlace` or add arbitrary margin. Direct tap/drag reposition should work until strike even during break-aim mode. That is a physical restriction through `headStringX`/`canPlaceBreakCue`. Never permit `BREAK!` before placement. The `Reposition break cue ball` button returns to placement mode until cue strike; no called ball/pocket is needed on the break.
- Keep break shot power physically calibrated independently from ordinary shots: max ~11.5m/s (~25.7mph), default break 85% ~9.9m/s, reset to standard 68% for normal shots. Never solve weak breaks by changing frame time or turning up all shots. Tight rack uses near-touching regulation balls; apex at foot spot, 75% along the bed. Validate full-break ball movement and first contact on all sizes as well as UI placement/reposition/forbidden kitchen clicks.
- Current `src/physics.js` exports `shotSpeed`, `headStringX`, `canPlaceBreakCue`, and `kitchenPoint`; `tests/call-ui.test.js` drives actual UI handlers.
- Keep physical Tailuge ball radius **0.028575 m**, ball mass **0.17 kg**, ball-ball restitution **0.94**, and rolling friction **0.007** unless revised against real playtests. Earlier code used radius 0.03275 m, mass 0.23 kg, and friction 0.016; do not restore it to 'improve' break dynamics. Rendering must keep 2.25in balls on all table sizes. Keep animation frame backlog instead of dropping time (old .08s cap/reset made heavy breaks look slow). Do not reintroduce hardcoded 9ft dimensions.

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
- Browser/mobile web first; no native package, login, database, network multiplayer or community creator in P0.
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
