# Squatch Pool — Autonomous Development Instructions

These instructions apply to every coding agent working in this repository. The goal is delivery, not planning for its own sake.

## Mission and definition of success
Deliver a **publicly accessible, Squatch-branded, playable pool game** on desktop and mobile browsers. Reuse an existing open-source pool game when feasible. Keep scope lean and move quickly. The user must be able to share a link and have someone play without installing anything or signing in.

**MVP DONE means ALL of the following are demonstrated, not merely coded:**
1. Public URL opens without login on desktop and mobile.
2. Mouse and touch controls can aim, set power, shoot, and restart.
3. Balls collide, rebound, settle, pocket, and scratch reliably in ordinary play.
4. Two people can finish a complete local match on one device; turns, fouls, winning, and reset work.
5. Squatch identity is visible and at least one original Squatch ruleset is implemented **only after its actual rules have been confirmed**.
6. A real browser play-test documents results and any remaining limitations.

If original rules cannot be recovered, deliver and validate the playable generic mode, leave the original-mode release gate open, and report the exact missing decision. Never fabricate rules or claim full completion.

## Operating priorities
P0: first playable shot and preview. P1: complete match. P2: Squatch identity and original mode. P3: public alpha verification. Defer creator tools, community submissions, accounts, online multiplayer, leaderboards, extensive animation, backend services, advanced AI, and elaborate CI.

Prefer a working game over a perfect plan. Do not spend a session adding process while gameplay remains blocked.

## Milestone execution order
| Phase | Issues | Exit gate |
| --- | --- | --- |
| M0 — Engine decision | #12 | Source/license reviewed, demo and build inspected, viable choice and fallback recorded |
| M1 — First playable | #1 #2 #3 #5 | Deployed preview: table, aiming, shooting, collisions, pockets, restart; desktop + touch |
| M2 — Complete game | #4 #15 | Two local players complete a game, scratch/turn/win behavior tested in browser |
| M3 — Squatch identity | #6 #7 | Branding visible; first **confirmed** original Squatch game mode playable |
| M4 — Public alpha | #13 | All MVP release gates evidenced; shareable URL stable |

Issue #14 tracks these instructions. Issues #8–#11 are future backlog and MUST NOT block or distract from M0–M4. The M0–M4 labels describe phases; they are not necessarily native GitHub milestone objects.

## At the start of every agent session
1. Read this file, README, and open issues in subiki/squatchpool.
2. Inspect repository code and current build/deployment status. Never assume prior progress is deployed.
3. Determine the earliest unfinished milestone and its smallest actionable blocking issue.
4. Check issue history, branch/PR status, and tests to avoid duplicate or conflicting work.
5. Start implementing. Do not respond with a new roadmap unless blocked or explicitly asked to plan.

## Execution loop — repeat until the MVP is done or genuinely blocked
1. Choose the highest-priority unfinished acceptance criterion in the earliest incomplete milestone.
2. Make the smallest useful change on an appropriate branch; avoid unrelated refactors.
3. Run the build and relevant tests; fix regressions.
4. Open the app in a real browser when browser tools are available. For gameplay, actually aim and shoot. Test touch on a mobile browser/device or appropriate touch-capable emulation; identify emulation as such.
5. Deploy or validate the preview when access exists. Never claim deployment succeeded without checking the URL.
6. Record evidence on the GitHub issue: change/PR/commit, commands, browser/device, tested actions, pass/fail, preview URL, remaining problems.
7. Close the issue only when its acceptance criteria have been demonstrated. Move to the next issue without waiting for a new instruction.
8. If blocked, work on another independent milestone task without masking the blocker.

Do not close an issue solely because a commit merged, a build passed, or a test was added. A test that cannot be run is not a passing test.

## M0 engine decision (timeboxed)
Evaluate at most three credible candidates (initial leads: Tailuge Billiards, Classic Pool Game, Hanazar Billiards). Check actual LICENSE, dependency licenses, attribution, source accessibility, build/run steps, desktop and touch input, physics, rules separation, and deployment suitability. Favor the simplest viable permissively licensed option. GPL is not automatically disqualified, but document distribution obligations before incorporating it. Stop researching once a suitable candidate is demonstrated. If none works, record evidence and choose the smallest viable fallback; do not silently embark on a bespoke physics engine.

## Product decisions and guardrails
- Browser first; mobile-responsive web game, not native app packages.
- Local pass-and-play is sufficient. No networked multiplayer requirement.
- No authentication or persistence required for MVP.
- Preserve third-party license notices and attribution.
- Original Squatch rules are **not** fully specified in this repository. Do not infer them from story episodes, character descriptions, or issue titles. Capture confirmed rules: player count, rack/setup, turn sequence, legal shots, fouls, scoring, win condition, edge cases.
- Branding can begin with a title and modest visual treatment. Do not invent character lore or make animation a dependency.
- Favor existing tooling; avoid adding services, frameworks, CI pipelines, or dependencies without direct MVP value.
- Keep the game playable after every change. Fix regressions before starting optional work.
- Preserve accessible controls, legible text, and reasonable phone landscape usability.

## Blocker and recovery policy
Try to resolve routine build, test, merge, and deployment errors independently. If an approach fails, diagnose and attempt a bounded alternative; do not retry the same failure indefinitely. Revert or isolate breaking changes and keep the last working version available.

Escalate to the owner only for:
- Missing rights, permissions, credentials, or external account actions that cannot be performed;
- A consequential license or legal decision;
- Missing authentic original Squatch game rules required to complete M3;
- A major product tradeoff that changes the approved MVP.

When escalating, state: exact blocker, evidence, what was tried, safest recommended option, and one precise question. Continue unblocked tasks in the meantime. Never fabricate results, URLs, approvals, source material, or tests.

## Verification checklist
At minimum verify:
- First load and reset/new game.
- Desktop pointer aiming, power and shooting.
- Mobile touch aiming, power and shooting; layout legible and no accidental page scrolling during shots.
- Multiple collisions, rails, pocketed object ball, cue-ball scratch, settled-ball state.
- Turn progression, foul handling, win detection, full local match.
- Squatch mode behavior against confirmed rules.
- Public deployed URL and no-login entry.

Automated smoke tests are useful, but browser gameplay is the release authority. Record manual checks when automation cannot simulate gameplay.

## GitHub hygiene and reporting
Use issues as the source of truth for status. Keep issue scope and acceptance criteria aligned with actual implementation. Prefer updating existing issues over creating duplicates. Reference issue numbers in commits and PRs. Summarize at each session end:
- Last verified playable state and URL (or 'not yet deployed');
- Issues completed with evidence;
- Current issue and next concrete action;
- Blockers and owner decisions needed;
- Whether the MVP release gate is passed.

Do not mark M4 done unless every release criterion is evidenced. If work cannot continue autonomously because execution is not scheduled or the environment is unavailable, state that plainly; this file is instructions for agents, not an automatic scheduler.

## After MVP
Only after the public alpha passes, revisit #8–#11: configurable official/house rules, single- and multi-shot challenge creator, community sharing/verification, and hybrid referee. Prioritize based on real player feedback, not speculative architecture.
