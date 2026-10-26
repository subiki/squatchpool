# Squatch Pool — release gates and maturity plan

**Operating principle:** fast playable proof of concept first. These are aggressive planning targets starting 2026-10-26, **not guarantees or evidence of completion**. Product acceptance beats the calendar; cut optional scope rather than shipping broken core play. Track direction in [#33](https://github.com/subiki/squatchpool/issues/33).

| Release | Target | Product exit gate | Engineering expectation |
|---|---|---|---|
| **v0.1 — Playable experiment** | Oct 28–30, 2026 | Finish *But Wait, There's More* on desktop and touch; clear controls; credible collisions/cushions/pockets; opponent selects **either** held ball and places it legally; restart | Existing `npm test` and `npm run check`; focused manual playtest; no TDD mandate |
| **v0.2 — Fun prototype** | Nov 2 | Three unfamiliar testers complete a game without coaching; fix top frustrations; basic Speed Squatch reactions and rainforest ambience | Add tests for actual repeat regressions only |
| **v0.3 — Squatch identity** | Nov 9 | Recognizable character intros/reactions, sound, original Pacific Northwest **temperate rainforest** identity without harming play | Targeted rules/physics regression tests; desktop and touch evidence |
| **v0.4 — Variety** | Nov 23 | A second *original* game fully playable; switch between two modes and finish both | Smoke-test each mode; keep architecture proportional |
| **v0.5 — Public alpha** | Dec 7 | Shareable discover→learn→play experience; original-site content preserved and represented accurately; core flows verified | PR checks and preview smoke tests, basic recovery instructions |
| **v1.0 — First stable release** | Jan 4, 2027 | Stable phone/desktop matches, cohesive world, repeatable releases; original site and domain migration including registration complete, with dependencies verified | Versioned release, deployment evidence and tested rollback |

**External dependency:** DreamHost→Cloudflare DNS/registrar transfer (#28) can take longer than code work. Keep the game shipping at the existing preview while migration proceeds. A transfer delay does not prevent gameplay iteration; revisit the v1.0 date/scope transparently if needed.

## Universal release gate

1. Identify a public URL and source commit/tag. A commit or green CI alone is **not** a shipped release.
2. Demonstrate that release's distinct exit criteria with brief recorded evidence (device/browser, result, issue or PR link).
3. No known critical defect that prevents finishing the supported game flow.
4. Record a short changelog, known limitations and next priority; keep deferred work in issues.
5. Only tag/publish a release after its gate is verified. Never silently lower acceptance criteria to meet a date.

## Agent focus and scope

- **Now:** game rules, physics, pockets, cushions, intuitive aiming, placement, full-match validation (#7, #13 and related playtest issues).
- **Parallel, nonblocking:** lean CI/CD (#31), rainforest canon (#30), original content and domain migration (#28), deployment provenance (#27).
- **After the first fun match:** character art, rainforest atmosphere, second original game, then broader public alpha.
- Coordinate through independent issues and small PRs. Reuse Cloudflare Pages integration. Avoid full TDD, blanket coverage gates, framework rewrites, speculative engine swaps, redundant CI, accounts and creator platforms during v0.1.

## Change control

Revisit the next gate after each real playtest. If dates slip, document what was learned and remove optional scope. Do not invent player validation, browser test evidence, deployments or registrar completion. The roadmap is a decision aid, not a promise to automate every task.
