# Squatch Pool — community-first outcome roadmap

**Owner decision · 2026-11-07:** Community first; experimental, fun gameplay is sufficient for expansion; creator tools begin **early, alongside identity**. AI implements creator intent; creators invent games and players decide popularity. [Community product contract](COMMUNITY_PRODUCT.md).

## Two-mode community lifecycle (owner decision · 2026-11-07)

**Rock & Roll is the experimental creator laboratory; Classic is the curated official catalog.** A creation originates as a versioned Rock & Roll experiment. Community ratings, unique completed plays, repeat plays and creator-independent engagement nominate promising games. Nomination is not automatic promotion: review playability, understandable rules, deterministic/reproducible behavior, accessibility, security and compatibility with Classic's clean interface. Owner/editor approval publishes a pinned immutable **Classic edition** with original creator attribution, source version and a link back to the experimental lineage. Experimental physics or mods must never silently bleed into existing Classic games. A promoted edition may retain unusual rules, but they must be intentional, documented, and stable. Keep the Rock original and remixes available. A bad rating alone does not erase a creator's work.

**Trust:** prevent self-rating/brigading, require meaningful completed plays, show sample sizes, and allow rollback/demotion without deleting published history. Until identity, ratings, moderation and measured completions exist, **no automatic promotions**.

## Five ordered milestones

| Priority | Milestone / outcome | Exit gate | Work |
| --- | --- | --- | --- |
| **P0 — interrupt** | Keep production playable and honest | No known sitewide outage or critical broken game; restore deploy integrity and guest play immediately | [#159](https://github.com/subiki/squatchpool/issues/159) |
| **P1 — active** | Squatch Passport: sign in, safe profile, favorite a game across devices | Secure Google login/session, guest unchanged, profile/favorite persistence, isolation and logout | [#312](https://github.com/subiki/squatchpool/issues/312), [#164](https://github.com/subiki/squatchpool/issues/164), draft PR #314 |
| **P1 — parallel, nonoverlapping** | Creator v0: describe/remix a known game and playtest | One existing mode + 3–5 supported validated rule choices, no arbitrary code, local draft and instant playable test | [#151](https://github.com/subiki/squatchpool/issues/151) |
| **P1 — next** | Saved casual scores and useful feedback | Per-seat/version match journal, personal history, editable ratings, idempotency, explicit unverified labels | [#165](https://github.com/subiki/squatchpool/issues/165), [#163](https://github.com/subiki/squatchpool/issues/163) |
| **P2 — after proof** | Publish, share and discover fun games | Creator-owned immutable versions, remix attribution, safe moderation, actual weekly completions and replay metrics | [#151](https://github.com/subiki/squatchpool/issues/151) |

**Not prerequisites for creator v0:** perfect physics, every original bot, exhaustive full-match certification, a new rendering engine, cosmetic polish, or competitive leaderboards. These remain valuable background work and release risks, not blanket blockers. A defect that prevents a creator's chosen source game from being played **is** a blocker.

## Release gates

A small experimental preview can ship with clear limitations. Do not call a broken game playable, fabricated score verified, or untested build deployed. For each affected route test a real break/shot/finish path; run targeted build checks, check mobile and both skins where touched, then verify deployed SHA. No unreviewed generated JavaScript. Keep the existing five games and offline guest mode intact.

## Product metric

**Weekly completed games**, plus repeat plays by distinct players, are the north star; not visits, prompts, or number of AI-generated rules. Show sample sizes and separate casual from verified results.

[Execution queue](BACKLOG.md) · [Agent instructions](../AGENTS.md) · [Delivery](DELIVERY.md).
