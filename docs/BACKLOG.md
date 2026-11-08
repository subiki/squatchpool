# Squatch Pool — single ordered execution queue

**Owner priority override · 2026-11-07:** **community first**, **experimental gameplay quality**, **creator tools early**. This replaces the old blanket rule that accounts and Maker must wait for full five-game acceptance. [Roadmap](ROADMAP.md) owns milestone outcomes; GitHub issues own details.

## Priority policy

- **P0 interrupt:** site down, production/source mismatch, security/privacy failure, existing guest game fundamentally broken, or regressions caused by a new release. Fix immediately; track in [#159](https://github.com/subiki/squatchpool/issues/159).
- **P1 delivery:** player identity and creator playtest in small, independent slices; then saved casual scores/ratings. Experimental physics is acceptable if playable and accurately labeled.
- **P2 polish:** deep physics fidelity, broad bot parity, legacy CSS cleanup, exhaustive cross-game acceptance, cosmetic rewards, competitive ranking. Promote only on demonstrated player harm or explicit owner direction.

## Community graduation requirement

Rock & Roll creations are the incubation pool. After publishing/ratings exist, add **Classic promotion nominations and curator approval**: reliable unique-player completion and repeat-play signals, rating confidence and anti-abuse, creator consent, human playability review, immutable Classic version with creator credit, rollback/demotion. Do **not** auto-promote solely by rating count. Do not introduce experimental mechanics into existing Classic games. See [Community product contract](COMMUNITY_PRODUCT.md).

## Pick next, in this order

| Rank | Work | Lane / dependency | Definition of done |
| --- | --- | --- | --- |
| 0 | Urgent production/gameplay regression | Interrupt lane; #159 | Verified fix and exact deployed SHA |
| 1 | Finish Passport foundation, Google OIDC and favorites | **Active** draft [PR #314](https://github.com/subiki/squatchpool/pull/314), [#312](https://github.com/subiki/squatchpool/issues/312) | Guest unaffected; two-account isolation, cross-device favorites, revocable login |
| 2 | Maker proof: known game, small declarative rule subset, local playtest | [#151](https://github.com/subiki/squatchpool/issues/151); separate files/PR from Passport | A creator changes a supported rule and actually plays the variant, no deploy |
| 3 | Personal casual match history and editable ratings | [#165](https://github.com/subiki/squatchpool/issues/165); depends on Passport | Real user attribution, version/table context, no fake verified rankings |
| 4 | Versioned creator publish/remix + popularity discovery | #151; after creator proof and identity | Another player completes a creator game; repeat plays measured |
| 5 | UI/physics/bots/offline and legacy cleanup | #159, #303, #311, #77, #131 | Small improvements tied to observed playability, not open-ended refactor |

## Agent routing

One architecture implementation PR at a time; a second lane is allowed only for genuinely nonoverlapping changes (e.g. Passport server API versus creator local recipe validation). Do not merge another agent's branch or silently replace their work. Inspect open PRs before claiming a task. **Do not start another auth implementation while #314 exists.** Creator v0 should reuse existing rules and shared shell, not build a new site or free-form code executor.

## Shipping rules

Small, reversible, feature-first PRs; targeted checks and a representative real play path. Preview first. Do not assert production readiness without browser and deployed SHA evidence. Never require login to play, never trust browser scores as competitive, and never remove the Classic/Rock toggle or offline PWA.

Historical October roadmap and dated issue priorities do not override this explicit owner decision.
