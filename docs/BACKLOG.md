# Execution queue — lean and current

**Purpose:** tell a human or agent what outcome to deliver next without relying on a six-week-old ticket number. Live issues, PRs and production status may change after this document is written. Inspect them before starting.

## Prioritization policy

**P0:** user-visible gameplay broken, production unavailable, or one-game-only UX that undermines every game.  
**P1:** improve playability, fidelity, bot behavior and persistent offline use.  
**P2:** new game modes, accounts, rewards, creator platform and cosmetic experiments.

Keep **one architecture PR** and at most one **nonoverlapping hotfix/verification lane** in flight. When uncertain, choose the smaller playable delivery.

## Current goal: one site, one game page

| Order | Outcome | Evidence required |
| --- | --- | --- |
| **P0 · Unified presentation** | But Wait, Caroms, Cutthroat, Press and Tuna (plus Arcade) share a single introduction/setup/rules/table/details template, one selector layout and one shot kit | [Template contract](GAME_PAGE_TEMPLATE.md); equal-viewport screenshots, DOM IDs preserved, all modes still playable |
| **P0 · Preserve release integrity** | No game becomes unplayable during the template migration | Automated tests and Cloudflare preview; representative direct-load and SPA rack smoke test |
| **P0 · Full-match acceptance** | Each of five modes can break, aim, shoot, finish, restart and play against relevant bots or local humans | Desktop and mobile play evidence, release tracking issue #159 |
| **P1 · Remove legacy duplication** | Move remaining repeated markup and CSS into the common shell after adapters prove safe | No cloned canvas/IDs, no per-game setup styles or divergent button sizing |
| **P1 · Game feel and physics** | Credible breaks, rails, pockets, cloth, spin, called shots and readable announcer rulings | Real-shot comparisons, no regression at 7/8/9 ft |
| **P1 · Offline/telemetry** | Native PWA installation/offline operation and accurate statistics | Real offline browser check and exact Pages/D1 evidence |
| **P2 · New modes and progression** | Add games, achievements, accounts or Maker only after the five-game finish line | Separate owner-approved milestones and clear scope |

Do **not** implement a new scoring engine, 3D framework, test platform or unrelated backend as part of the shared-page refactor. Preserve original lore/rules archives without surfacing Google Docs or external links to players.

## Picking up work

1. Read [AGENTS.md](../AGENTS.md), [Architecture](ARCHITECTURE.md) and [Template](GAME_PAGE_TEMPLATE.md).
2. Check `main`, open PRs and live issues. Do not claim a task already owned.
3. Write acceptance around a player-visible outcome and the mode(s) it touches.
4. Prefer a small vertical slice on the shared component. Merge only after representative integration checks.
5. If something cannot be validated, write the gap in the PR and leave the acceptance open.

### Rules for priority conflicts

Fix active player blockers and failed production ahead of planned cleanup. Escalate only conflicting product choices, missing rule provenance, access or irreversible changes; otherwise ship the highest-priority unblocked improvement. Do not spend more time reorganizing issue labels than delivering a playable change.

**Archive:** [Original October plan](ORIGINAL_GAMES_ROADMAP.md) is historical context. It is *not* today's issue execution order.
