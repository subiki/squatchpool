# Squatch Pool — Agent instructions

## Mission
Finish and verify the **existing playable browser game**, then release a shareable Squatch Pool alpha. Keep changes lean. Read README.md, docs/BACKLOG.md and open GitHub issues before doing work.

## Current reality (recheck every session)
The repository already contains a dependency-free Canvas 2D prototype of **But Wait, There's More**, with physics in src/physics.js, rules in src/rules.js, gameplay/UI in src/game.js, and Node tests. The existing deployment and issues may be changing in another ChatGPT session. **Do not restart engine evaluation or replace the implementation just because an old issue or instruction suggests it.** Reconcile current code, open PRs, and issue edits first.

## Parallel-agent coordination
- Assume another agent may be editing the same repository at the same time.
- Before any write: refresh the target file/issue, check branches and open PRs, and choose a non-overlapping issue.
- Prefer a dedicated branch and small PR for code changes. Do not force-push, overwrite concurrent changes, or merge unreviewed conflicting work.
- If another agent owns a task, choose a distinct independent issue (tests/docs/validation) and say what you are taking.
- Treat live playtest findings and newer confirmed rule descriptions in GitHub as higher priority than stale roadmap text.
- Never mark someone else's task complete without verifying acceptance evidence.

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

## Release gate
The game is DONE only when a public URL opens without login; desktop and touch aiming/shooting work; normal collisions, pockets and scratches work; two local players can finish a full game with correct held-ball choice and placement, turns, fouls and win detection; restart works; and Squatch identity is visible. Record real-browser evidence. If a gate is unverified, report it as unverified.

## Blockers and recovery
Diagnose routine failures and try bounded fixes. Preserve last known playable state. Escalate only missing access/credentials, consequential licensing questions, or genuinely unresolved original rules. Report what failed, what was tried, the recommended resolution, and one specific question. Do not fabricate tests, deployments, approvals, or completion.

## Session handoff
Report: current deployed URL and verified status; issue/PR worked; tests and browser evidence; remaining release gates; next concrete action; blockers. Instructions do not themselves schedule background agents.
