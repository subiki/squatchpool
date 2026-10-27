# Site-wide Squatch Pool statistics

**Purpose:** Show players, racks started and object balls pocketed for the *whole site* and by playable game. The current game also shows its own lifetime figures immediately above the table. These are real server-side shared totals, **not per-browser counters or fabricated demo data**.

## Meaning of the numbers

- **Players:** approximate number of distinct *anonymous browsers/devices* that struck at least one rack break, counted once per game and once across the whole site. Pass-and-play with two people on one device counts as **one**, returning on the same browser counts once; clearing browser storage or using another browser counts as another. Bots never count as players.
- **Racks:** increment once when the first break is *struck*, not when a rack page is opened, a cue is positioned, or New Rack is pressed. Repeating the same event has no effect.
- **Balls made:** each **non-cue object ball physically pocketed**, including slop and the 8, whether or not called or legally scored. Scratches (cue ball) do not count. A shot with three object balls pocketed adds three. A shot submitted twice is counted once.
- **By game:** counters grouped by a shared game ID. Only **But Wait, There's More** is playable and instrumented today; future games register in `src/stats-games.js` and use the same event API. Rules archive pages do not count as games played.
- **Since launch of tracking:** historical games played before this backend exists cannot be reconstructed. Stats begin when this API is connected. Don't describe these as all-time prelaunch numbers.

No accounts, analytics cookies, email addresses, names, or IP addresses are stored. The browser generates one random UUID in localStorage; the server stores **only a SHA-256 hash** of that UUID. A short localStorage queue retries events if the stats service is temporarily unavailable. Turning off stats does not block the game. These counts are approximate, not proof against determined artificial event submissions: public anonymous APIs have no authenticated human identity.

## One-time Cloudflare Pages hookup (required)

The repository now includes `functions/api/stats.js`. Cloudflare Pages deploys the Function automatically with the existing Git-connected Pages project. It needs one free/low-volume **Cloudflare D1 database** binding:

1. In the existing Cloudflare account, open **Workers & Pages** and the Pages project already serving `squatch.subikistudios.com`.
2. In **D1**, create a database named **`squatchpool-stats`** (choose the region appropriate for the site).
3. On the Pages project, go to **Settings → Bindings → Add → D1 database**, set **Variable name = `STATS_DB`** and choose `squatchpool-stats` for **Production**. Redeploy the *existing project* after saving. Don't create a new Worker/Pages project or point DNS anywhere else.
4. For Preview branches, use a **different D1 database** (for example `squatchpool-stats-preview`) and the same `STATS_DB` binding name under **Preview**. Never bind production's database to previews: previews may contain experimental tracking or fake test matches.
5. No manual SQL migrations: on the first successful API request, the function creates the small tables/indexes using `CREATE TABLE IF NOT EXISTS`.

Confirm `GET https://squatch.subikistudios.com/api/stats` responds with a JSON `site` object and a `games` array, and no longer responds with 503. Play a rack in the production site: **the break** should raise racks by 1 and (if a new browser) players by 1; pocketing an object ball raises balls; moving the cue ball or clicking New Rack alone does nothing. Refresh in another browser: totals should match. Check Cloudflare D1 usage/costs periodically.

When `STATS_DB` is missing or errors, the API returns **503** and the webpage shows **statistics unavailable**, *not* made-up zero counts. Gameplay continues. Debug under Cloudflare Pages Functions logs; verify the bindings and redeploy first.

Local: the existing `python3 -m http.server` is static-only, so game play works but `/api/stats` does not. For local API development use Wrangler Pages with a local D1 binding and the existing output root. No secrets are needed in browser code.

## API schema and abuse boundaries

- `GET /api/stats`: `{site:{players,racks,balls},games:[{id,title,players,racks,balls}],definition,since}`, always no-store.
- `POST /api/stats`: JSON `{type:'rack',game,visitorId,rackId}` once per struck rack; `{type:'balls',game,visitorId,rackId,shotId,count}` after a shot settles with object balls pocketed. All identifiers are browser-generated UUIDs; duplicate rack IDs and shot IDs are idempotent.
- Known-game whitelist prevents garbage new categories. Event count range enforced, and the existing game caps total counted object balls at **14 per rack**. A ball event cannot be sent for a nonexistent rack or a different visitor/game. Calls with a cross-origin `Origin` are denied. As unauthenticated telemetry this is best-effort anti-accidental-inflation, **not** an anti-bot system.
- Don't backfill old games from fabricated counts or put real people's names in this dataset.

## Adding another playable game

Register a new `{id,title,maxBallsPerRack}` in `src/stats-games.js`. Hook `reportRack` into its break event and `reportBalls` into its finished shot; avoid doing either on rerender. The current frontend tracker uses `CURRENT_GAME`; make that configurable when two playable game routes actually exist. The overview automatically lists games from the shared catalog and the backend aggregates by game. Cover new game's counters with focused tests.
