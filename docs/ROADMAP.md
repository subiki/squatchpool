# Squatch Pool — outcome-based roadmap

**North star:** all five original Squatch games feel like the same well-made pool app, have their own clear rules, finish reliably and remain fun on phones and desktops. Ship quickly and fix quickly. Dates are not release gates.

| Gate | What the player gains | Acceptance |
| --- | --- | --- |
| **A · One recognizable site** · current | Shared PNW brand, page composition, setup controls, shot kit and mobile/fullscreen layout on five games and Arcade | Every route uses the same [template](GAME_PAGE_TEMPLATE.md); no cloned game-specific page layout |
| **B · Complete playable matches** | Break, aim, called pocket, legal/foul adjudication, winner, next rack and stable bot/local mode on all five | A full human-played match in a real browser on desktop and phone, beyond tests or mere page load |
| **C · Credible pool feel** | Regulation 7/8/9-foot choices, consistent rack geometry, believable rails, pocketing, rolling and spin | Targeted physics benchmarks plus real player shot comparisons |
| **D · Trustworthy experience** | Fast site transitions, readable announcements/scoreboard, persistent preferences, offline play and honest statistics | Browser navigation/fullscreen/reconnect tests, correct Cloudflare/D1 deployment SHA, no misleading counters |
| **E · New reasons to return** | Optional achievements, profiles, Squatch Points, additional games and storytelling | Only plan after core games are accepted and the user selects the next outcome |

## Release decision

A merged PR, green unit tests or successful Cloudflare Pages build **is not a full-match acceptance**. A gate advances only when its player-facing behavior is demonstrated; record the browser/device, the tested route and any limitation.

For a small hotfix: run targeted checks, preview and production verification. For a shared-layout change: check *all* five games plus Arcade at identical viewport widths, direct load and SPA, phone and desktop, with a real shot. The existing production release inspector and issue #159 can record independent evidence.

## Design principles

- Shared template and architecture **before** repeated presentation patches.
- Game rules live in adjudicators, not in a second UI rules engine.
- Good PNW nature materials and accessible contrast, not overwhelming contour wallpaper.
- Existing five games, fast, lean and fun, before speculative monetization or accounts.
- Preserve license/source obligations and historical originals in Git.
- Owner approval for genuinely irreversible infrastructure or domain changes.

[Work queue](BACKLOG.md) | [Delivery procedure](DELIVERY.md) | [Architecture](ARCHITECTURE.md).
