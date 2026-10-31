# Squatch Pool — agent execution queue

**Authoritative execution order, reviewed 2026-10-31.** Start here after reading [AGENTS.md](../AGENTS.md). This is a **queue**, not a catalog of every idea. [#159](https://github.com/subiki/squatchpool/issues/159) owns the five-game release gate; [#53](https://github.com/subiki/squatchpool/issues/53) owns the architecture epic. This document gives the next agent an unambiguous decision. An issue/PR may have changed since this snapshot: check live state before claiming work.

## Objective and current milestone

**Deliver five original Squatch games that players can finish and restart on desktop and touch, with one reusable table/control/session layer, a healthy production deploy, honest live stats, and Android offline play, fully playable Squatch Bot opponents in all five modes, and a persistent site header through navigation.** Features and playability first; no comprehensive test framework, new modes, Maker, OIDC, token economy or 3D until this release gate. Preserve existing physics, house rules, rainforest lore, assets and archives.

**NOW: [#206 — ARCH M1: shared break placement and shot lifecycle](https://github.com/subiki/squatchpool/issues/206).** First vertical slice: Press Your Luck. Second: Tuna. Both must use a shared lifecycle/placement module, with ordinary break requiring no confirmation. Each mode must complete a rack before its old handler is removed. Start by examining PRs [#204](https://github.com/subiki/squatchpool/pull/204) and [#205](https://github.com/subiki/squatchpool/pull/205): merge a verified nonconflicting emergency fix or explicitly incorporate/supersede its change in #206. Do not independently reimplement the same bug a third time.

**One parallel operational lane only:** [#128](https://github.com/subiki/squatchpool/issues/128) verify live Cloudflare Pages source SHA, five page loads and actual build/runner state. If production is down, or a player cannot break/start a mode, a bounded hotfix takes precedence. Do not call a GitHub PR or green check a deployed release. Avoid spawning a second CI/deployment system.

## Strict implementation order

| Order | Issue | Visible exit criterion | Start condition |
|---|---|---|---|
| **NOW — M1** | [#206](https://github.com/subiki/squatchpool/issues/206) | Press Your Luck and Tuna break, aim, shoot, foul, finish and restart via one shared state/placement API | Start now; reconcile #204/#205 first |
| **NEXT — M2** | [#207](https://github.com/subiki/squatchpool/issues/207) | All five render and accept mouse/touch aim through common renderer/input with correct 7/8/9-ft geometry and Caroms striker | M1 accepted; migrate one mode per PR |
| **THEN — M4** | [#209](https://github.com/subiki/squatchpool/issues/209) | Shared shot-result event and five independent rules adapters; one ruling/history/telemetry event per shot | M1 accepted; settle interface with M2 owner; migrate incrementally |
| **THEN — M3** | [#208](https://github.com/subiki/squatchpool/issues/208) | Same compact HUD, controls, shot caller, announcer, contextual actions, and history across five games | Stable shot-result contract from M4; build consumers once |
| **THEN — Bot parity** | [#77](https://github.com/subiki/squatchpool/issues/77) | Press Your Luck, Tuna and Cutthroat gain real full-match bot opponents; existing But Wait/Caroms bot play retained | #209 shared shot contract settled; coordinate M3 UI ownership |
| **LAST — M5** | [#210](https://github.com/subiki/squatchpool/issues/210) | Remove replaced duplicate handlers including redundant bot turn logic, document module boundaries | M1–M4 and bot adapters accepted |
| **Navigation shell** | [#212](https://github.com/subiki/squatchpool/issues/212) | Header DOM and live deployment/stats state persist through page navigation; all game loops dispose safely | #210 lifecycle teardown is proven |

**Why M4 before M3:** #208's HUD, announcer and history are consumers of #209's result event. Establish the event before finalizing the UI, not after. M4 interface design can happen while M2 is being implemented by a *different owner*; avoid simultaneous edits to the same controllers. The order is by **acceptance**, not a mandate for giant all-or-nothing PRs.

## Next release gate — after bot parity, M5 and persistent navigation

- [#213](https://github.com/subiki/squatchpool/pull/213): unify header branding, release timestamp font, active nav and statistics across all public pages; **merged to main at 6096e53; production SHA still unverified**. Keep this UX working after the persistent-shell transition.
- [#77](https://github.com/subiki/squatchpool/issues/77): solo bot **or** local humans in every game. Cutthroat must support 1 human+2 bots, 2 humans+1 bot or 3 humans. Do not claim incomplete bot support in the catalog.
- [#212](https://github.com/subiki/squatchpool/issues/212): navigate without reloading header; preserve router/history/offline and terminate old game controllers; CSS transitions are not sufficient.
- [#15](https://github.com/subiki/squatchpool/issues/15), with [#7](https://github.com/subiki/squatchpool/issues/7), [#54](https://github.com/subiki/squatchpool/issues/54), [#55](https://github.com/subiki/squatchpool/issues/55), [#58](https://github.com/subiki/squatchpool/issues/58), [#127](https://github.com/subiki/squatchpool/issues/127): complete each five-mode match (break → call/aim → legal/illegal shot → next turn/placement → finish → restart), desktop and touch. Fix defects as discovered; do not broaden QA infrastructure.
- [#63](https://github.com/subiki/squatchpool/issues/63): confirm compact fullscreen controls, persistent reverse aim and consistent interfaces **through M3**, not a separate competing UI rewrite.
- [#45](https://github.com/subiki/squatchpool/issues/45): verify real D1 five-game counters, precise event counting, homepage table and online/unavailable semantics on production.
- [#131](https://github.com/subiki/squatchpool/issues/131): verify real Android install → offline cold start → five modes/rules/archive → reconnect/update; source code alone is not acceptance.
- [#128](https://github.com/subiki/squatchpool/issues/128): match production assets and `deployment.json` to the accepted source SHA and execute a player-facing smoke.

## Open PR intake — reconcile before touching overlapping files

**37 open PRs at audit, not 37 independent tasks.** First check whether any are merged/closed or obsolete now. Do not bulk-merge, bulk-close or assume a green `mergeable` means safe. Representative collision groups:

| PRs | Route |
|---|---|
| [#204](https://github.com/subiki/squatchpool/pull/204), [#205](https://github.com/subiki/squatchpool/pull/205) | Emergency broken-break fixes or fold into M1; review behavior first |
| [#200](https://github.com/subiki/squatchpool/pull/200), [#195](https://github.com/subiki/squatchpool/pull/195), [#142](https://github.com/subiki/squatchpool/pull/142), [#132](https://github.com/subiki/squatchpool/pull/132) | Check against latest rules and active work; merge only if still valid and non-overlapping |
| [#201](https://github.com/subiki/squatchpool/pull/201), [#202](https://github.com/subiki/squatchpool/pull/202), [#199](https://github.com/subiki/squatchpool/pull/199) | Reuse validated work under M3; do not land competing per-game HUD/announcer layers |
| [#203](https://github.com/subiki/squatchpool/pull/203) | Separate stats UI improvement, optional after immediate unplayable defects; preserve live D1 semantics |
| Older game/QA/3D PRs | Triage against current main and architecture before revival; no stale speculative work |

Mark the outcome in the existing PR/issue (integrate, fix/refresh, explicitly supersede, or defer) with the reason. Do not create duplicate tickets just to track the triage.

## Agent operating contract

1. **Read** current `main`, AGENTS.md, this queue, #159/#53, relevant issue, open PRs and changed filenames. Do not take a task already claimed by another agent.
2. **Pick** the first unclaimed, unblocked task in the order above. Maximum **one architecture implementation PR** and **one independent production/verification task** in active work. If blocked, state the exact blocker on the issue and move only to the next non-overlapping slice; never self-promote a parked feature.
3. **Claim** on the issue with branch, affected modules, expected player-visible outcome and anticipated acceptance. Keep one small reversible vertical slice per PR and link it to the issue.
4. **Verify** `npm test`, `npm run check`, `npm run build` as applicable plus a real shot/match on changed mode where possible. Log what *actually* ran; distinguish runner allocation from failed code. No invented playtest evidence.
5. **Ship** through the existing Cloudflare integration; verify preview/production SHA when available. A merged commit is **code complete**, not **deployed** or **player accepted**. Do not force-push or bypass an actual failed test.
6. **Handoff** in the issue: PR/commit; tests; observed browser/device; production SHA or unverified; result; remaining defect; **next precise action**. Close only on issue-specific acceptance, not a PR merge.

**Escalate to owner only** for an actual tradeoff between two equal-priority outcomes, missing source house rules, access/credentials or irreversible change. Include the 2 options and the recommendation. Otherwise execute the queue autonomously. Avoid spending more time managing the board than shipping gameplay.

## Parked (not execution-eligible)

Future original/standard games (Honolulu, Assassin, 8/9-ball, etc.), Maker [#151](https://github.com/subiki/squatchpool/issues/151), Squatch Passport [#163](https://github.com/subiki/squatchpool/issues/163), Squatch Points [#168](https://github.com/subiki/squatchpool/issues/168), 3D, cinematics and other historical vision issues. Preserve as discovery input; do not promote without owner approval after the five-game gate. Original-site/domain preservation [#28](https://github.com/subiki/squatchpool/issues/28) is a non-blocking separate lane.
