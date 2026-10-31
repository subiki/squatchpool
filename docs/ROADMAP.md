# Squatch Pool — outcome-based release roadmap

**Rebaselined 2026-10-31.** Historic dates and version promises in issue [#33](https://github.com/subiki/squatchpool/issues/33) are no longer an accurate execution schedule: five modes now exist in code but their complete live gameplay is not yet accepted. **Do not declare a release merely because pages or merged PRs exist.** For agent-level NEXT work, use [BACKLOG.md](BACKLOG.md); for current release acceptance, use [#159](https://github.com/subiki/squatchpool/issues/159).

## North star
**Five original Squatch games that are easy, funny and satisfying to finish on a phone or desktop.** Table-first play, credible physics, real original house rules, consistent controls. Preserve the Pacific Northwest temperate rainforest universe without making stories, accounts or monetization a blocker. Fun first, no coverage quotas or heavyweight TDD during proof of concept.

## Milestones (outcomes, not calendar theater)

| Gate | Success means | Primary GitHub work |
|---|---|---|
| **A — Shared session** · IN PROGRESS | Press Your Luck and Tuna break with no confirmation gate and finish/restart through shared placement/lifecycle; rules and physics preserved | [#206](https://github.com/subiki/squatchpool/issues/206), urgent #204/#205 PR triage |
| **B — One table and shot contract** · NEXT | All five use shared drawing/input and a single event-driven shot resolution; game-specific house rules remain separate | [#207](https://github.com/subiki/squatchpool/issues/207) → [#209](https://github.com/subiki/squatchpool/issues/209) |
| **C — One game interface, less code** · NEXT | Shared compact controls, announcer, history and HUD; no redundant per-game implementations | [#208](https://github.com/subiki/squatchpool/issues/208) → [#210](https://github.com/subiki/squatchpool/issues/210), [#63](https://github.com/subiki/squatchpool/issues/63) |
| **D — Solo bot parity and seamless navigation** · NOT YET ACCEPTED | All five offer solo vs bot and correct local seating, including Cutthroat multi-bot; persistent header survives route changes without restarting gameplay controllers or stats | [#77](https://github.com/subiki/squatchpool/issues/77), [#212](https://github.com/subiki/squatchpool/issues/212), merged header [PR #213](https://github.com/subiki/squatchpool/pull/213) |
| **E — Five-game playable release (v0.2 candidate)** · NOT YET ACCEPTED | Five full matches and restarts on desktop and mobile touch; prod SHA verified; real/unavailable stats truthful; offline install/play proven | [#159](https://github.com/subiki/squatchpool/issues/159), [#15](https://github.com/subiki/squatchpool/issues/15), [#128](https://github.com/subiki/squatchpool/issues/128), [#45](https://github.com/subiki/squatchpool/issues/45), [#131](https://github.com/subiki/squatchpool/issues/131) |
| **F — Delight and expansion** · PARKED | Player feedback supports pursuing character identity, retention, optional accounts or Maker **after** playable release | Owner re-prioritizes [#65](https://github.com/subiki/squatchpool/issues/65), [#151](https://github.com/subiki/squatchpool/issues/151), [#163](https://github.com/subiki/squatchpool/issues/163), [#168](https://github.com/subiki/squatchpool/issues/168) |

Treat dates as **forecasts only when grounded in actual throughput**. Older Oct/Nov 2026 and January 2027 targets remain historical, not automatic escalations or a justification for incomplete acceptance. Set the next release date after seeing gates A–C ship. Review the next milestone after each production-backed playable increment.

## Always-on release safety

Keep production playable while refactoring. Only an outage or a genuinely unplayable mode interrupts the architecture queue. Use the existing Cloudflare Pages GitHub integration and deployment banner; never add a second deployment stack. Separate **code merged**, **production SHA verified**, and **real player workflow accepted**. Run lightweight targeted checks, use real browser play, and record failures precisely.

## Change control

One active architecture implementation PR, plus one independent production-verification/hotfix lane. Each milestone is complete only when its issue-specific checklist has evidence. New ideas go into existing parked issues unless genuinely distinct. No new game or speculative infrastructure is auto-promoted by a scheduled agent. Escalate only an actual unresolved owner tradeoff, precise missing rule or credential.
