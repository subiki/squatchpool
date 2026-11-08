# Squatch Pool — 2027–2028 creator-platform business roadmap

**Status:** proposed strategy for owner review, not an approved financial forecast. **Planning window:** January 2027–December 2028. **Mission:** a social arcade where people create, play, share, remix and compete in original pool games. **North star:** weekly meaningful matches in creator-published games, with repeat players and repeat creators.

## Product principles
- Play first: free guest play, accessible mobile controls, stable game rules and trustworthy shot outcomes.
- One engine, one interface, many rule packs. Creator games are declarative data with versioned rules and validation; no arbitrary creator JavaScript.
- Classic and Rock & Roll remain skins, not separate products.
- Squatch Points are **non-purchasable, non-redeemable, non-transferable** reputation/arcade rewards; no wagering, cash jackpots or pay-to-win competitive advantages.
- Revenue comes from optional subscriptions, digital content and creator tools—not advertisements or exploiting minors.
- Ranked competitions require server-authoritative results, abuse controls and replay/audit trails. Browser-local results cannot establish paid/ranked outcomes.
- Respect GPL-3.0 and third-party asset licensing; obtain legal review of creator uploads, marketplace terms, taxes and payout obligations before commerce.

## Milestones and explicit gates

| Period | Customer outcome | Deliverables | Go/no-go evidence |
|---|---|---|---|
| 2027 Q1 | Games work well enough to share | Finish shared UI and match lifecycle, realistic shot/rail physics, mobile/PWA, lightweight telemetry, opt-in Passport | 90%+ successful match completions; meaningful browser/device playtests; baseline retention cohort measured |
| 2027 Q2 | Anyone can make and share a game | Chaos Maker v1: versioned rule recipe, validation, draft/publish/remix, public game links, creator attribution, reporting | 25 active creators, 100 published playable games, 200 weekly active players (illustrative targets); 20%+ of published games played by another user |
| 2027 Q3 | Players have friends and rivals | Follows, profiles, favorites, asynchronous challenges, social feed of games, searchable catalog, comments/moderation | 25%+ week-4 player retention; 30%+ creators publish a second game |
| 2027 Q4 | First customers pay voluntarily | Creator Pro subscriptions, cosmetic player memberships, optional premium creator packs, Stripe/merchant implementation and support | 100 paying accounts or equivalent demand validation; positive gross margin after payment processing, hosting and creator payouts |
| 2028 Q1 | Creators earn money | Marketplace with versioned paid packs, opt-in storefronts, clear refund terms, creator earnings ledger, identity/payout compliance | 30+ transacting creators; repeat buyer rate >20%; no unresolved payout reconciliation |
| 2028 Q2 | Competition feels fair | Ranked seasons, clubs, private tournaments, verified replays, moderation and anti-cheat | 99%+ trusted match recording; stable abuse handling; 4-week competitive retention improves |
| 2028 Q3 | Discovery grows efficiently | Recommendations, themed seasons, creator collaborations, referral links and targeted partnerships | Measured acquisition CAC below contribution LTV; creator and player cohorts improve |
| 2028 Q4 | The platform sustains itself | Optimize infrastructure and customer support, scale proven creator channels, reserve runway | 3 consecutive months operating profit, positive cash flow after all operating costs and creator payouts |

Targets above are **hypotheses** to revise after instrumented cohorts, not claims about current traffic or guaranteed results.

## Revenue model (proposed; validate with real customers)
1. Free: guest games, public creator challenges, standard play, social discovery.
2. Player Plus: **$4.99/month** for cosmetics, profile customization, extra private clubs and convenience; never better shot physics or ranked advantage.
3. Creator Pro: **$9.99/month** for advanced publishing, analytics, custom branding and expanded drafts; keep a genuinely useful free creator tier.
4. Marketplace: creators set prices for optional game packs. Proposed **80% creator / 20% platform of net receipts after refunds, taxes and payment fees**. Make the base, fees and payout timing transparent; model margins before launch.
5. Clubs/organized events: optional **$19/month** club organizer tier, only after clubs show demand.

No sale of Squatch Points, real-money wagering, entry-fee jackpots, or payouts tied to chance-based game outcomes. Review app-store/payment processor rules and consumer-protection obligations before launch.

## Illustrative monthly business model (not forecast)
Assume 10,000 monthly active players; 3% Player Plus conversion (300 x $4.99 = $1,497); 100 Creator Pro subscribers (100 x $9.99 = $999); $5,000 marketplace net-receipt volume at 20% platform share ($1,000); 25 clubs at $19 ($475). **Gross platform revenue = $3,971/month** before hosting, processing, support, taxes, refunds, development, moderation and other costs. This is *not* enough to assume a salaried profitable company. At 100,000 MAU with similar conversion and proportional marketplace volume, gross revenue could be about $39,710/month, but infrastructure, customer acquisition, moderation and support scale too. Build a cohort-based contribution model and calculate true break-even from measured costs.

## Unit economics and measurement
- Weekly active players; weekly active creators; matches started/completed; games published/played by non-creators; creator repeat publishing; friend challenges; D1/D7/D30 retention; paid conversion; net receipts; creator payouts; gross margin; contribution margin; CAC, LTV and churn.
- Define a meaningful match as a verified start plus completion or a valid conceded outcome; do not count page visits as play.
- Instrument privacy-respecting opt-in events, data deletion, age/eligibility and content-reporting flows.
- Monthly operating review: active cohorts, creator supply/demand, revenue by stream, gross margin, cash runway, abuse incidents and release quality.
- Do not scale paid acquisition until retention and contribution margins are validated.

## Dependency order
1. Complete playable matches and shared physics; trustworthy game outcome data.
2. Optional Passport identity and cloud save while preserving guest/offline play.
3. Versioned creator recipe schema and safe publish/share/remix pipeline.
4. Catalog, moderation, social graph and challenges.
5. Subscription billing and creator marketplace/payout compliance.
6. Server-authoritative competitive seasons, tournaments and creator commerce scaling.

## Work policy
Keep docs/ROADMAP.md as the near-term engineering release gates. This document owns the 24-month business outcomes. Every epic must have a measurable user outcome, dependency, owner, acceptance evidence and explicit deferral of monetization work that outruns retention. No more standalone games or large visual rebuilds ahead of stable play, creator publishing and social loops.
