# Squatch Pool · The 4T's

**Status: v0.1 proof of concept in progress (not yet release-verified).** A mobile-friendly, self-contained browser pool game set at the Squatches' secret watering hole in the Pacific Northwest temperate rainforest.

## Release direction

**Fun first, process second.** Ship small improvements, playtest with real people, and increase automation only when repeated failures justify it. We are **not** adopting full test-driven development or coverage quotas during the proof of concept. A passing test suite is not proof that the game is fun or release-ready.

Our release gates, aggressive *targets* and maturity policy live in [docs/ROADMAP.md](docs/ROADMAP.md) (tracking [#33](https://github.com/subiki/squatchpool/issues/33)). **Current focus: v0.1 — one complete, understandable, fun match** with correct opponent-selected surprise-ball strategy, believable rails and pockets, usable phone/desktop controls and restart. Missing acceptance evidence means a gate is still open. Later rainforest storytelling, additional games, and site/domain migration are parallel or subsequent work, never blockers for fixing the playable prototype.

For contributors and agents: read [AGENTS.md](AGENTS.md) and [docs/DELIVERY.md](docs/DELIVERY.md). Existing game tests are lightweight safety checks; browser playtesting is the release decision.

## Play locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Or serve the directory with any static web host (Cloudflare Pages: no build command; output directory `.`). Modern browsers supporting ES modules are required. No accounts or backend.

## First game: But Wait, There's More

An existing Squatch Pool story/game concept, adapted into the first playable prototype:

1. Two players play 8-ball. One solid (7) and one stripe (15) are removed from the rear corners of the rack before breaking, leaving 13 object balls on the table.
2. After the break, the first legal pocketed solid or stripe establishes groups. You may pocket your own group; the 8 must stay on the table.
3. When a player pockets their final *visible* group ball, the opponent chooses either remaining hidden ball (solid or stripe) and places it anywhere legal. They can choose their own ball to block the shooter.
4. If the returned ball belongs to the shooter, they must pocket it before the 8. If it belongs to the opponent, it can be used as a defensive obstacle. Pocketing the 8 early loses; pocketing it legally wins. The current prototype still auto-selects the shooter's group: see issue #7 for the required gameplay correction.

**Prototype simplifications (not authoritative 8-ball rules):** no called shot/pocket, no explicit rail-after-contact requirement, no three-foul rule, no break-specific foul rules. The engine treats an incorrect first contact or a scratch as ball-in-hand for the opponent; a miss passes the turn. A legal pocket on the break grants another shot but does not assign groups. The automated Speed Squatch opponent is rudimentary and may make poor shots. No advanced spin or jumping. These are implementation limits, not claims about the original house rules.

## Controls

- Tap or drag anywhere on the table to aim from the cue ball.
- Set power with the slider, then select **Shoot**. On desktop, left/right arrows (or A/D) adjust aim and Space shoots.
- On fouls or scratches, place the cue ball by tapping a clear spot.
- When a hidden ball must be restored, the opponent places it by tapping an empty spot; Speed Squatch chooses automatically in single-player mode.
- Choose **Two players (pass & play)** to share one screen, or play against the basic Squatch bot.

## Development

```bash
npm test       # built-in Node test runner; no npm install
npm run check  # parse-check JavaScript modules
```

The game uses Canvas 2D with a **vendored MIT-licensed Planck.js (Box2D) rigid-body physics engine** (`src/vendor/planck.mjs`), wrapped by `src/physics.js` at a fixed 120 Hz step. The wrapper keeps the original ball/rules API and defines shared physical and visible cushion geometry. Turn logic is in `src/rules.js`; UI and minimal AI are in `src/game.js`. The site stays static and self-contained, with no CDN or runtime install. High-speed balls use Box2D bullet collision detection. The first pass has no spin or fully modeled pocket jaws; live desktop and touch playtesting are still required.

## v0.1 acceptance checklist (not yet certified)

1. [x] Shoot the cue ball, collide with other balls and rails, pocket balls.
2. [x] Alternate turns or play a minimal single-player opponent.
3. [x] Implement basic group selection, fouls, surprise-ball rule, legal/illegal 8, and win/loss.
4. [x] Run core rule and physics unit tests locally.
5. [ ] Confirm a complete game in an actual desktop and mobile browser; fine-tune aiming, physics, and bot behavior based on playtesting.
6. [ ] Deploy a publicly reachable preview, then confirm mobile controls there.

**Don't build the community platform until a full match can be played comfortably.** See [docs/BACKLOG.md](docs/BACKLOG.md) for the ideas explicitly deferred.
