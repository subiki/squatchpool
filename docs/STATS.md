# Statistics — site-wide and per game

**Purpose:** show actual anonymous players/devices, racks started and balls pocketed for the whole site and each game. Never manufacture counters or confuse a bot with a player.

## What the numbers mean

- **Players:** distinct anonymous browser installations that took part in a rack (not people/accounts). Two pass-and-play humans on one browser count as one device; bots count as zero.
- **Racks:** an actual break shot, not a page load, cue placement or clicking New Rack.
- **Balls made:** unique non-cue object balls pocketed, including balls on slop shots and the 8. Cue scratches do not add a point.
- **By game:** a separate game identifier for each playable mode, from the server's accepted telemetry. Data exists only since tracking became active; history cannot be reconstructed.
- **Unavailable:** if the server or binding is missing, show an unavailable state and keep gameplay working.

## Backend and Cloudflare

The existing Pages Functions API uses a D1 database binding named `STATS_DB`. Keep preview and production databases separate. Check the current binding in Cloudflare before changing schema or claiming counters work; these documents cannot inspect live account settings.

The browser sends events such as rack-start and balls-pocketed with deduplication IDs; the server validates allowed game identifiers and values before updating totals. Browse `functions/api/stats*`, `src/game-telemetry.js`, `src/stats-games.js` and related tests for the active schema, rather than copying old sample payloads.

## Adding or fixing a game

1. Register its identifier in the shared game catalog/telemetry contract and server validation.
2. Emit rack start only on a real break, and pockets only after adjudication/physics reconciliation.
3. Include bots/local play in game rules but **never count bots as anonymous players**.
4. Verify with the preview DB, then exact production deployment; avoid mixing demo/test traffic into production.
5. Keep HUD lifetime totals inside the shared `#table-stage` so they remain visible in fullscreen.

For game-specific scorekeeping (e.g. Press Your Luck's banked/provisional points), use the game's score engine. **Lifetime stats are not current match points.**
