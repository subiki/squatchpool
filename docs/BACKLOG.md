# Squatch Pool — active five-game shipping backlog

**Product owner direction (2026-10-30): finish and ship the five games that already exist before inventing new ones.** [Shipping tracker #159](https://github.com/subiki/squatchpool/issues/159) is the authoritative execution queue; this file keeps priorities visible to the agents. Older feature-spec issues are source material, not permission to open duplicate PRs.

## Current release: verified v0.2 five-game play

**P0 — Repair and prove production release [#128](https://github.com/subiki/squatchpool/issues/128), [#5](https://github.com/subiki/squatchpool/issues/5).** Confirm Cloudflare Pages actual preview/production build; source SHA in `deployment.json`; tests `npm test`, `npm run check`, `npm run build`; live homepage, five game pages and D1 API. Distinguish a GitHub runner job failing before executing any steps from a real code failure. Existing Pages GitHub integration only. If Cloudflare access is unavailable, record exactly one action and work another independent slice.

**P0 — Complete and playtest all five modes [#15](https://github.com/subiki/squatchpool/issues/15).** Each game must finish a full rack on desktop and mobile/touch, including legal break, called shot, make/miss, foul/ball-in-hand, next turn, win, next rack and restart. Keep house rules grounded: [But Wait #7](https://github.com/subiki/squatchpool/issues/7), [Caroms #54](https://github.com/subiki/squatchpool/issues/54), [Cutthroat #55](https://github.com/subiki/squatchpool/issues/55), [Press Your Luck #58](https://github.com/subiki/squatchpool/issues/58), [Tuna #127](https://github.com/subiki/squatchpool/issues/127). Preserve 7/8/9-foot regulation physics and the user's cue preferences.

**P1 — Compact fullscreen table kit [#63](https://github.com/subiki/squatchpool/issues/63).** Power + Shoot/Break + Reverse Aim + Fullscreen remain adjacent to the table, even fullscreen. One clear drawer for optional spin, called-shot options and placement with auto-reveal on missing required calls. Rules prominent; history collapsed; mobile-first. First implementation in Press Your Luck/Tuna exists; bring But Wait/Caroms/Cutthroat into parity and playtest all five.

**P1 — Live comparable statistics [#45](https://github.com/subiki/squatchpool/issues/45).** All five are registered in shared telemetry/D1 API, but live production must prove five rows, real rack/ball counting, anonymous-browser semantics, safe retry/dedup and true homepage popularity sorting. Never display unverifiable totals as real.

**P1 — Offline complete five-game install [#131](https://github.com/subiki/squatchpool/issues/131).** PWA source exists; real Android/desktop install -> preload -> airplane-mode cold launch -> every game/rules/archive -> reconnection/update must be observed. API remains network only.

## Definition of shipped
A focused change has a linked issue, PR and merge SHA plus its actual executed tests. A **production release** additionally has a verified Cloudflare deployed source SHA and player-facing smoke. A **completed product gate** additionally has full desktop and mobile acceptance evidence. Do not conflate these three states.

## Deferred until the five-game exit gate
- New games: Honolulu, Assassin and other candidates already parked in GitHub issues.
- [Maker Epic #151](https://github.com/subiki/squatchpool/issues/151): future rule blocks, community game creation, sharing/remixing. Only start by **extracting rules from proven completed games**, never premature framework work.
- Experimental 3D, cinematics, account features, monetization, arbitrary rules engine, comprehensive CI/test framework.

Preserve the original Pacific Northwest **temperate rainforest** universe, licensed source and archive; never invent source rules or lose the original stories. The site should remain **fun, clean, table-first and easy to play**.
