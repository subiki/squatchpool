# Squatch Pool · The 4T's

**Status: first playable proof of concept.** A mobile-friendly, dependency-free browser pool game set at the Squatches' secret Pacific Northwest watering hole.

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
3. When a player pockets their final *visible* group ball, the opponent chooses a legal spot to put the held-back ball of that group back into play.
4. That player must pocket this surprise ball as well before legally potting the 8. Pocketing the 8 early loses. Pocketing the 8 legally wins.

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

The game uses Canvas 2D and a fixed-step physics module (`src/physics.js`). Turn logic is in `src/rules.js`, and UI + minimal AI are in `src/game.js`. Everything is static and self-contained.

## Milestone / definition of done

1. [x] Shoot the cue ball, collide with other balls and rails, pocket balls.
2. [x] Alternate turns or play a minimal single-player opponent.
3. [x] Implement basic group selection, fouls, surprise-ball rule, legal/illegal 8, and win/loss.
4. [x] Run core rule and physics unit tests locally.
5. [ ] Confirm a complete game in an actual desktop and mobile browser; fine-tune aiming, physics, and bot behavior based on playtesting.
6. [ ] Deploy a publicly reachable preview, then confirm mobile controls there.

**Don't build the community platform until a full match can be played comfortably.** See [docs/BACKLOG.md](docs/BACKLOG.md) for the ideas explicitly deferred.
