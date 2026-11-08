# Squatch Community — creator and player product plan

**Decision (2026-11-07):** Squatch Pool is a place to **invent, play, share and discover fun pool games**. Creators decide rules, players decide what's fun, and AI is an implementation assistant—not the product or a mandatory play interface. This plan updates the priorities of [Passport #163](https://github.com/subiki/squatchpool/issues/163) and [Maker #151](https://github.com/subiki/squatchpool/issues/151), without duplicating their detailed specifications.

## Product contract

- Everyone can browse, play locally or against bots, and use the offline PWA without signing in.
- Sign-in is required to publish/remix with attribution, rate, favorite, save scores across devices and participate in persistent leaderboards.
- A person is both player and creator; one account, one public-safe handle. Private by default, public visibility opt-in.
- Built-in curated Squatch games and versioned community games coexist. Rules are readable on-site; no external manual links.
- Creators describe rules in ordinary language; AI maps them to **validated, versioned declarative rules**, asks about ambiguity and reports unsupported mechanics. The creator approves and playtests. Never run generated code from users.
- Published versions remain immutable for score comparability; remixes preserve source attribution.
- Both Classic and Rock & Roll use the same shared shell; community features must not fork game interfaces.

## Outcome-first sequence

| Order | Player-visible outcome | Work item / release gate |
| --- | --- | --- |
| P0 interrupt | Existing production remains usable and trustworthy; fix critical gameplay/outages immediately | [#159](https://github.com/subiki/squatchpool/issues/159) |
| P1 — now | Optional Google login, safe profile and favorites saved across devices | [#312](https://github.com/subiki/squatchpool/issues/312); reuse [#163](https://github.com/subiki/squatchpool/issues/163) / [#164](https://github.com/subiki/squatchpool/issues/164) |
| P1 — next | Player ratings and personal match journal; scores correctly attributed to seats, versions and table sizes | [#163](https://github.com/subiki/squatchpool/issues/163), [#165](https://github.com/subiki/squatchpool/issues/165) |
| P1 — early, parallel | Creator recipe proof: remix one known game, safe validation, immediate local playtest; publishing follows identity | [#151](https://github.com/subiki/squatchpool/issues/151) |
| P2 | Community discovery, replay/popularity signals, ratings, moderation, creator profiles | Extend Maker/Passport with narrow execution tickets after first vertical slice |
| P2 | Achievements, cosmetic Squatch Points, friendly challenges | [#166](https://github.com/subiki/squatchpool/issues/166), [#167](https://github.com/subiki/squatchpool/issues/167) |

**Owner override:** community and early creator tools take precedence over optional full-match perfection and physics polish. Do not block identity or the local creator proof on exhaustive five-game acceptance. Interrupt only for urgent P0 gameplay, security or production failures.

## Data and trust

- Prefer existing Cloudflare Pages Functions and D1, with migrations, indexed unique identity and ownership keys, idempotency and bounded writes.
- Verify Google OIDC server-side; use provider subject, not email, as stable identity. Secure HttpOnly SameSite sessions; revoke on logout; CSRF/Origin checks. Never put API secrets in browser.
- Match journal records game ID, immutable rules version, player seat, table size, opponent type, outcome, timestamps, idempotency key and trust tier. Never attribute historical anonymous stats to new accounts.
- Client-reported and offline scores are **casual/unverified**. Public competitive ranks require a separate authoritative trust design; login alone does not prove a shot.
- Protect pseudonyms, default private profiles, opt-in public listings, export/delete, moderation/reporting and rate limiting before broad publication.
- AI calls only during creation/revision, not every shot; gameplay remains deterministic and offline-capable for cached recipes.

## Measure fun, not generated content

**North star:** weekly completed games, with returning players and repeat plays separately visible. Report real sample sizes and time windows. A popularity ranking should balance unique players, completed racks, repeat-play rate, favorites, shares and ratings; exclude creator self-play from community popularity where practical. No fake counts, no raw clicks as the sole ranking. Compare game versions and modes fairly.

## First executable slice

Deliver #312 as a small PR: Google sign-in → safe handle → favorite an existing game → sign out → sign in on another device and retrieve favorite. Verify guest/offline play, account isolation, invalid token rejection, session revocation, both themes and production preview. Then advance ratings and match journal in separate small PRs.

## Agent handoff

Read [AGENTS](../AGENTS.md), [Backlog](BACKLOG.md), [Architecture](ARCHITECTURE.md), and the live issues/PRs before editing. One architecture lane; don't cross-merge work. Preserve shared shell and existing physics; do not claim a deployed feature without exact SHA and browser evidence.
