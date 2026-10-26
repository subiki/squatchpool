# Squatch Pool · The 4T's

**Status: v0.1 proof of concept in progress (not yet release-verified).** A mobile-friendly, self-contained browser pool game set at the Squatches' secret watering hole in the Pacific Northwest temperate rainforest.

## Release direction

**Fun first, process second.** Ship small improvements, playtest with real people, and increase automation only when repeated failures justify it. We are **not** adopting full test-driven development or coverage quotas during the proof of concept. A passing test suite is not proof that the game is fun or release-ready.

Our release gates, aggressive *targets* and maturity policy live in [docs/ROADMAP.md](docs/ROADMAP.md) (tracking [#33](https://github.com/subiki/squatchpool/issues/33)). **Current focus: v0.1 — one complete, understandable, fun match** with correct opponent-selected surprise-ball strategy, believable rails and pockets, usable phone/desktop controls and restart. Missing acceptance evidence means a gate is still open. Later rainforest storytelling, additional games, and site/domain migration are parallel or subsequent work, never blockers for fixing the playable prototype.

For contributors and agents: read [AGENTS.md](AGENTS.md) and [docs/DELIVERY.md](docs/DELIVERY.md). Existing game tests include a headless real-game click regression, but browser playtesting is the release decision.

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

## Controls

- Tap or drag anywhere on the table to aim from the cue ball.
- **After the break:** tap your intended object ball **on the table**, then tap one of the **six illuminated pocket numbers**. Only then does the cue stick appear so you can aim and shoot. Buttons numbered by available balls below the table are a touch/keyboard alternative when balls are tightly clustered. Tap **Undo call** to clear your pending ball and pocket before shooting, then choose again. No call required on the break. Slop stays down but doesn't keep your turn; an uncalled 8-ball loses.\n- Set power with the slider, then select **Shoot**. Optionally dial in **Draw/Follow** or **English** under the main controls (both start centered). On desktop, left/right arrows (or A/D) adjust aim and Space shoots.
- On fouls or scratches, place the cue ball by tapping a clear spot.
- When a hidden ball must be restored, the opponent places it by tapping an empty spot; Speed Squatch chooses automatically in single-player mode.
- Choose **Two players (pass & play)** to share one screen, or play against the basic Squatch bot.

## Development

```bash
npm test       # built-in Node test runner; no npm install
npm run check  # parse-check JavaScript modules
```

The game uses a WPA-dimensioned, 100 × 50 inch-reference table modeled in `src/table-geometry.js`: 2.25-inch balls, 4.56-inch diagonal corner mouths and 5.06-inch side mouths, realistic short angled rubber facings and distinct shelf depths. **No circular pocket capture zones.** The game uses Canvas 2D with a **Tailuge Billiards GPL-3.0-based physics adapter** in `src/vendor/tailuge-physics.js`, integrated through `src/physics.js` at a fixed 120 Hz step. The numerical ball collision/throw, cloth sliding/rolling, follow/draw/sidespin, and Han-model cushions are adapted from Tailuge's real open-source billiards code. Squatch provides its own six-pocket continuous time-of-impact detection, table jaws, game rules, controls and rendering. The site remains static and self-contained, with no npm installation or CDN needed to play.\n\n**License and source:** Tailuge's GPL-3.0 code means the combined deployed browser work is GPL-3.0, with [complete license](LICENSE), [upstream credit and adaptation details](THIRD_PARTY.md), and unminified browser source available at the site's static paths. This is a deliberate GPL commitment, not an MIT-library drop-in. The physics models are calibrated for short arcade racks and require further live desktop/touch playtesting; do not confuse this with integrating Tailuge's entire 3D application.

## v0.1 acceptance checklist (not yet certified)

1. [x] Shoot the cue ball, collide with other balls and rails, pocket balls.
2. [x] Alternate turns or play a minimal single-player opponent.
3. [x] Implement basic group selection, fouls, surprise-ball rule, legal/illegal 8, and win/loss.
4. [x] Run core rule and physics unit tests locally.
5. [ ] Confirm a complete game in an actual desktop and mobile browser; fine-tune aiming, physics, and bot behavior based on playtesting.
6. [ ] Deploy a publicly reachable preview, then confirm mobile controls there.

**Don't build the community platform until a full match can be played comfortably.** See [docs/BACKLOG.md](docs/BACKLOG.md) for the ideas explicitly deferred.
