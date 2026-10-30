# Squatch Pool · The 4T's

**Status: v0.1 proof of concept in progress (not yet release-verified).** A mobile-friendly, self-contained browser pool game set at the Squatches' secret watering hole in the Pacific Northwest temperate rainforest.

## Release direction

**Fun first, process second.** Ship small improvements, playtest with real people, and increase automation only when repeated failures justify it. We are **not** adopting full test-driven development or coverage quotas during the proof of concept. A passing test suite is not proof that the game is fun or release-ready.

Our release gates, aggressive *targets* and maturity policy live in [docs/ROADMAP.md](docs/ROADMAP.md) (tracking [#33](https://github.com/subiki/squatchpool/issues/33)). **Current focus: v0.1 — one complete, understandable, fun match** with correct opponent-selected surprise-ball strategy, believable rails and pockets, usable phone/desktop controls and restart. Missing acceptance evidence means a gate is still open. Later rainforest storytelling, additional games, and site/domain migration are parallel or subsequent work, never blockers for fixing the playable prototype.

For contributors and agents: read [AGENTS.md](AGENTS.md) and [docs/DELIVERY.md](docs/DELIVERY.md). Existing game tests include a headless real-game click regression, but browser playtesting is the release decision.

## Deployment timestamp (Pacific time)

The top header displays the last known Cloudflare Pages deployment in **America/Los_Angeles**, automatically choosing PDT or PST. The current committed fallback is the **last independently verified successful Pages check run** (October 26, 2026 at 6:33 PM PDT, commit `ef762ad`); it is explicitly marked as *last verified* until newer build metadata is available. The browser never substitutes the current time or a Git commit date.

For ongoing builds, Cloudflare Pages injects `CF_PAGES`, `CF_PAGES_COMMIT_SHA`, and `CF_PAGES_BRANCH`. The zero-dependency `npm postinstall` script generates `deployment.json` with its **build timestamp** and commit when the Pages build runs; the header shows that build's timestamp as its deployment identifier. The exact successful upload-completion time may be seconds later and remains available in the **Cloudflare Pages GitHub check run** or dashboard. No private repo tokens or Cloudflare credentials are exposed.

The normal Cloudflare Pages setup remains **static root directory `.`**. `npm ci` (from `package-lock.json`) runs the stamp via `postinstall` automatically in standard Pages builds. If a custom build setup skips install scripts, configure **Build command: `npm run build`**, **Build output directory: `.`** in the existing Cloudflare Pages project's build settings. Don't add a second deployment system. Local npm installs do **not** emit a fake deployment timestamp. Preview branches are labeled `PREVIEW BUILD` rather than `DEPLOYED`.

## Live site statistics — players, racks and balls by game

The main page now displays **whole-site Players / Racks / Balls made**, with a **By game** breakdown. Above the playing table, a separate strip shows those totals for the current game, **But Wait, There's More**. When more playable games launch, each gets its own tracked row. The counters are backed by shared server-side Cloudflare D1 data, **not local browser-only totals**.

- **Players** means distinct anonymous *browsers* that struck a rack. A bot does not count, and two pass-and-play humans sharing a device count as one browser. This is an approximate, privacy-preserving number, not registered accounts.
- **Racks** counts actual break shots, never simply loading a page or positioning the white ball.
- **Balls made** counts non-cue object balls physically pocketed, including slop and the 8 but not scratches; duplicates don't count.
- Totals start when statistics are activated; no historical data before the feature can be reconstructed. A missing database displays **unavailable**, not invented counts, and doesn't interrupt gameplay.

**One-time activation:** The existing Cloudflare Pages project must have a D1 database bound as **`STATS_DB`** under **Settings → Bindings → Add → D1 database**. The database tables are created automatically when the API first runs. Use a **separate D1 database for preview** to avoid test traffic polluting production, then redeploy the existing project. See [docs/STATS.md](docs/STATS.md) for the detailed setup, privacy, validation steps, data definitions and future game integration.

## Play locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Or serve the directory with any static web host (Cloudflare Pages: no build command; output directory `.`). Modern browsers supporting ES modules are required. No accounts or backend.

## First game: But Wait, There's More

An existing Squatch Pool story/game concept, adapted into the first playable prototype:

1. Two players play 8-ball. One solid (7) and one stripe (15) are removed from the rear corners of the rack before breaking, leaving 13 object balls on the table.
2. After the break, the first legally **called ball in its called pocket** establishes groups. Slop does not count. You may pocket your own group; the 8 must stay on the table.
3. When a player pockets their final *visible* group ball, the opponent chooses either remaining hidden ball (solid or stripe) and places it anywhere legal. They can choose their own ball to block the shooter.
4. If the returned ball belongs to the shooter, they must pocket it before the 8. If it belongs to the opponent, it can be used as a defensive obstacle. Pocketing the 8 early loses; pocketing it legally wins. The existing surprise-ball selector remains tracked under issue #7; this pocket/call fix does not change that separate rule.

**Prototype simplifications (not authoritative 8-ball rules):** no explicit rail-after-contact requirement, no three-foul rule, no break-specific foul rules. The engine treats an incorrect first contact or a scratch as ball-in-hand for the opponent; a miss passes the turn. A legal pocket on the break grants another shot but does not assign groups. The automated Speed Squatch opponent is rudimentary and may make poor shots. Draw/follow and sidespin are now available as optional physics controls; jump shots and full 3D cue elevation are not implemented. These are implementation limits, not claims about the original house rules.

## Table sizes — regulation balls and pockets

Choose **7 FT**, **8 FT**, or **9 FT** with the three large buttons beside the opponent choice. The first-time default is 7 ft; your selection is remembered in your browser when local storage is available. Changing size resets the rack (it does not stretch an in-progress shot).

| Table | Playing surface (nose to nose) | Ball diameter | Corner mouth | Side mouth |
| --- | --- | --- | --- | --- |
| 7 ft bar box | 78 × 39 in | 2.25 in | 4.56 in | 5.06 in |
| 8 ft standard home | 88 × 44 in | 2.25 in | 4.56 in | 5.06 in |
| 9 ft tournament | 100 × 50 in | 2.25 in | 4.56 in | 5.06 in |

The **ball, pocket mouths, cushion facings, and pocket shelves retain the same physical inch measurements** at every size. Only the bed length/width, rail positions, pocket center positions, rack location, and view/canvas size change. All three beds are 2:1 *nose-to-nose*. The 8 ft choice is the standard 88 × 44 home table; WPA's 92 × 46 is an *oversized/pro* 8-footer not offered in this three-choice MVP. Dimensions follow [Dr. Dave's table sizing reference](https://drdavepoolinfo.com/faq/table/sizes/) and the [WPA equipment specifications](https://wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf). The labels are the table's common nominal sizes, not its measured bed length.

## Break placement and power

On a fresh rack, **tap or drag anywhere in the kitchen** (the shaded left quarter of the playing surface) to position the white cue ball. Its center can go as close to the cushions as the ball's physical radius allows, including the corners of the playable kitchen. Release to aim and press **BREAK!**. Until you strike, you can also **tap or drag to reposition directly in the kitchen again**—no special button is required. The **Reposition break cue ball** button lets you change that position until the cue strikes. The break requires no called pocket. This applies to all 7/8/9-foot tables, and the head string is in the same regulation location relative to the bed.

Break power now follows a cue-ball speed curve rather than the ordinary shot slider: 100% produces approximately **11.5 m/s (~25.7 mph)**; the default break power is now **85% (~9.9 m/s, 22 mph)**, while post-break shots reset to the ordinary 68% slider default, informed by [typical pool shot speeds](https://drdavepoolinfo.com/faq/speed/typical/). Ordinary-shot power mapping is unchanged. **After every stroke (including the break), the power slider resets to 68%, draw/follow resets to 0%, and English resets to 0%**, without altering the spin/power just applied to the shot. The triangular rack is nearly frozen together (about 0.035 logical pixels of separation instead of 0.35–0.9), with apex on the foot spot at three-quarters of the bed. The collision engine remains Tailuge-based, now with regulation 2.25-inch ball radius/6oz mass, **0.94** ball-ball restitution, and now research-calibrated cloth rolling resistance **0.010** (sliding friction **0.20**, see the documented before/after measurements); see [Dr. Dave's physical-property ranges](https://drdavepoolinfo.com/faq/physics/physical-properties/). The animation loop retains unprocessed simulation time after an overloaded frame rather than silently discarding it, preventing slow-motion-looking breaks under load.

## Controls

- **On a new rack:** place the white ball behind the head string first, then tap or drag elsewhere on the felt to aim. Use **Reposition break cue ball** to try another break position without restarting.
- **After the break:** tap your intended object ball **on the table**, then tap one of the **six illuminated pocket numbers**. Only then does the cue stick appear so you can aim and shoot. Buttons numbered by available balls below the table are a touch/keyboard alternative when balls are tightly clustered. Tap **Undo call** to clear your pending ball and pocket before shooting, then choose again. No call required on the break. Slop stays down but doesn't keep your turn; an uncalled 8-ball loses.
- Set power with the slider, then select **Shoot**. Optionally dial in **Draw/Follow** or **English** under the main controls. All three controls **reset after every shot** (power 68%, draw/follow 0%, English 0%) so the next player begins neutral. On desktop, left/right arrows (or A/D) adjust aim and Space shoots.
- On fouls or scratches, place the cue ball by tapping a clear spot.
- When a hidden ball must be restored, the opponent places it by tapping an empty spot; Speed Squatch chooses automatically in single-player mode.
- Choose **Two players (pass & play)** to share one screen, or play against the basic Squatch bot.

## Cloth realism and measurable physics

After playtest feedback that balls coasted like they were on ice, cloth sliding friction was raised from 0.126 to **0.20**, effective rolling deceleration corrected from 0.007 × gravity / √2 to **0.010 × gravity**, and the sliding-to-rolling transition uses the contact-point slip physics rather than a broad 0.05 m/s shortcut. An unobstructed naturally rolling ball at 0.50 m/s now stops after **1.27 m in ~5 seconds**, down from 2.57 m / ~10 seconds; this agrees with the textbook μ=0.01 rolling-resistance model. Pockets, rails and all three table sizes stay regulation. The 120 Hz reference regression tests and published sources live in [docs/PHYSICS_CALIBRATION.md](docs/PHYSICS_CALIBRATION.md). Real-table comparison remains necessary before making claims of professional simulation accuracy.

## Development

```bash
npm test       # built-in Node test runner; no npm install
npm run check  # parse-check JavaScript modules
```

The game uses dynamically selected pool-table playing surfaces modeled in `src/table-geometry.js`: 2.25-inch balls, 4.56-inch diagonal corner mouths and 5.06-inch side mouths, realistic short angled rubber facings and distinct shelf depths. **No circular pocket capture zones.** The game uses Canvas 2D with a **Tailuge Billiards GPL-3.0-based physics adapter** in `src/vendor/tailuge-physics.js`, integrated through `src/physics.js` at a fixed 120 Hz step. The numerical ball collision/throw, cloth sliding/rolling, follow/draw/sidespin, and Han-model cushions are adapted from Tailuge's real open-source billiards code. Squatch provides its own six-pocket continuous time-of-impact detection, table jaws, game rules, controls and rendering. The site remains static and self-contained, with no npm installation or CDN needed to play.

**License and source:** Tailuge's GPL-3.0 code means the combined deployed browser work is GPL-3.0, with [complete license](LICENSE), [upstream credit and adaptation details](THIRD_PARTY.md), and unminified browser source available at the site's static paths. This is a deliberate GPL commitment, not an MIT-library drop-in. The physics models are calibrated for short arcade racks and require further live desktop/touch playtesting; do not confuse this with integrating Tailuge's entire 3D application.

## v0.1 acceptance checklist (not yet certified)

1. [x] Shoot the cue ball, collide with other balls and rails, pocket balls.
2. [x] Alternate turns or play a minimal single-player opponent.
3. [x] Implement basic group selection, fouls, surprise-ball rule, legal/illegal 8, and win/loss.
4. [x] Run core rule and physics unit tests locally.
5. [ ] Confirm a complete game in an actual desktop and mobile browser; fine-tune aiming, physics, and bot behavior based on playtesting.
6. [ ] Deploy a publicly reachable preview, then confirm mobile controls there.

**Don't build the community platform until a full match can be played comfortably.** See [docs/BACKLOG.md](docs/BACKLOG.md) for the ideas explicitly deferred.

## Install and play offline (Android, desktop)

Squatch Pool is built as a Progressive Web App. After visiting the site online and letting the **Ready to play offline** indicator appear, Android Chrome users can use **⋮ → Add to Home screen / Install app**. Desktop Chrome/Edge users can choose **Install** from the browser menu. A small **Install game** button also appears when the browser offers its installation prompt.

The install saves each current HTML game, all local physics/scripts/styles, rules, archive and app icons. Reopen from the device launcher and play in airplane mode. Local two-player and the bundled bot need no network. Site-wide D1 statistics are online-only; the existing small browser event queue retries on reconnection. An offline match is not persisted between app restarts yet; don't assume automatic saved-game recovery. External archive source links still need internet.

A new Cloudflare Pages build automatically generates a content-versioned service worker and launcher icons via `scripts/build-pwa.mjs`; incomplete new downloads leave the previous offline edition intact. To preview offline behavior locally, run `npm run build` first, then serve the root over `localhost` (service workers require localhost or HTTPS). The generated `service-worker.js` and `app-icon-*.png` are build outputs, not manually maintained files. Do not cache `/api/stats` or assume the browser will preserve CacheStorage forever if the user clears site data or storage is evicted.
