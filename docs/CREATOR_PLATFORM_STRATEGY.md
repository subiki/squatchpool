# Squatch Pool — The Wildest Pool Arcade (2027–2028)

**Direction:** Build the coolest, most playable, most shareable pool-game playground we can, as quickly as we can. **This is a creative roadmap, not a monetization plan.** No revenue, subscription, marketplace, profit, or paid-growth gates. Play is free. Squatch Points are earned, non-purchasable, non-transferable and never redeemable for money.

## North star
**People invent wild pool games, other people play and remix them, and everyone keeps coming back for the fun.**

Measure: weekly games played to completion; creator-made games played by someone else; repeat creators; returning players; completed friend challenges. Do not substitute page views or a green CI build for genuine play.

## Fast release sequence — ship vertical slices, not big-bang platforms

| Horizon | What ships | Player-facing acceptance |
| --- | --- | --- |
| **Now / next 2–4 weeks** | Trustworthy shot physics and visual aiming, shared game layout, reliable full matches, Rock/Classic theme parity, Chaos Maker iteration | A new player can complete a game on mobile without coaching; actual ball paths agree with aim previews under deterministic modifiers |
| **Next 4–8 weeks** | **Publish a Chaos game**: safe versioned recipes, game URL, creator attribution, remix button, discoverable public catalog; retain anonymous local drafts | Creator builds → tests → publishes → sends link → another player completes it → remixes it |
| **Next 2–4 months** | Optional Squatch Passport, saved games and favorites, creator pages, reactions, follows, friend challenges, leaderboards | Friends can find each other and play the same creator challenge asynchronously; no login required just to play |
| **Next 4–6 months** | Tournaments, seasonal events, game ratings, featured creator challenges, Squatch Points and achievements | An organizer can run a challenge and players can see trustworthy results and a winner |
| **6–12 months** | More imaginative mechanics, creator templates, better bots, replay sharing, multiplayer experiments, moderation and community curation | New games can be created from reusable mechanics rather than custom forks |
| **Year 2 (2028)** | Creator clubs, cooperative modes, richer live competition, seasonal universes, replay/spectator features, polish and accessibility | Community activity and returning play justify deeper investment |

Horizons are **ambitious targets, not promises**; adjust based on demonstrated player experience. Ship something usable weekly when possible. Do not hold back a fun, safe vertical slice waiting for unrelated infrastructure.

## What we will NOT do
- No advertising, subscriptions, token purchases, real-money wagering, creator payout marketplace or profit milestones.
- No rebuilding every game page separately. One reusable game shell, physics layer and declarative rule/recipe system.
- No huge test suites, enterprise process or speculative architecture before a playable feature. Keep lightweight release checks and focused regression coverage for broken gameplay.
- No pretending that browser-local match results are authoritative ranked scores.
- No sacrificing offline/guest play or existing Classic appearance for Rock experiments.
- No unreviewed creator code execution. Game recipes are validated data, not scripts.

## Minimal trust and community foundations
- Versioned creator recipes, content ownership/attribution, remix lineage, reporting/removal, basic spam/rate limits and moderation.
- Opt-in accounts for persistence and social identity; guest play remains available.
- Verified competition outcomes only when there is a server-authoritative or otherwise credible recording path; label casual/local leaderboards accordingly.
- Respect GPL-3.0, artwork licenses, privacy and accessibility.

## Delivery and prioritization
1. **Playable > pretty > speculative.** Fix aim, ball behavior, game completion and mobile controls first.
2. **Creator loop > new standalone modes.** Publish, share, play, remix and discover are the next product breakthrough.
3. **Social loop > monetization.** Friends, challenges, creator recognition and tournaments make games worth returning to.
4. **Ship small, verify real play, fix fast.** Branch → focused checks → preview → main → production SHA verification; no claims of browser/device acceptance without evidence.
5. Every issue must state a user-visible outcome, acceptance criteria, dependencies and whether it can ship independently. One active priority per overlapping subsystem; avoid agent collisions.

## Near-term demonstration
The next flagship demo should show: **a creator invents a ridiculous Chaos table, saves it, publishes a link, a friend opens it without signing in, finishes a challenge, and remixes it into something even crazier.** Make this work before investing in any business model.

Engineering release gates remain in [ROADMAP.md](ROADMAP.md); active work belongs in [BACKLOG.md](BACKLOG.md).
