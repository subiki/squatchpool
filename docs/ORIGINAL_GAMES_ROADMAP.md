# Original Squatch Games — delivery roadmap

## Product direction
Squatch Pool is a collection of original, characterful house games set in a Pacific Northwest rainforest. The physics simulator is shared infrastructure, not the differentiator. Conventional 8/9/10-ball, straight pool and one-pocket are deferred.

## Source of truth
- Original manuscripts: `rules.html`, `archive.html`.
- 2024 brainstorming: https://docs.google.com/document/d/19FfvNqea7VoHx04AgKFQz-dGiWHq8gDVcz3rcklUqy0/edit
- Episode 2 document is empty; do not present a complete Press Your Luck ruleset as recovered.
- Mark every rule as **original documented**, **provisional design decision**, or **unresolved**.

## Delivery sequence and exit gates
### v0.2 — Mode architecture
#53 shared original-game architecture, #63 mode selection/tutorial/stats, #64 regression and release gates. Preserve But Wait, There's More as playable; size 7/8/9ft stays independent; responsive keyboard/touch. Draft PR #57 is initial primitives, not complete.

### v0.3 — Caroms + Coin-Op Cutthroat
#54 Caroms (Whacky Pool): shoot object ball, first contact cue ball, player-specific skill levels.
#55 Coin-Op Cutthroat: three players, 1–5 / 6–10 / 11–15, scratch claim and re-entry.
Gate: full playable local rounds with deterministic rules tests and desktop/touch smoke tests. Bots optional unless explicitly promised by mode UI.

### v0.4 — Press Your Luck
#56 source recovery and unresolved decisions, #58 scoring and bank bonus.
Recovered core: opponent ball +1, 8 +2, 8 at any time banks points, banked final 8 doubles, no 8 loses unbanked points. Confirm cushion-bank interpretation and resolve fouls, group ownership, accidental 8, turn and endgame before treating rules as canonical.
Gate: tested scoring ledger and complete playable round.

### v0.5 — Additional original games
#59 First Contact, #60 Big Tuna Casserole, #61 1–15, #62 Hudsquatch.
Gate: authoritative source recovered for each, explicit unknowns resolved, playable test match before release.

### v1.0 — Squatch universe collection
#65 provenance and episode/character introductions, rainforest art, accessible UX, per-game statistics.
Gate: stable modes, clear instructions, no dead controls, live Cloudflare asset verification and desktop/touch smoke tests.

## Operational rules
- Prioritize one end-to-end playable game over many half-built selectors.
- Never merge an unfinished draft as a completed mode.
- Validate on production URL; GitHub merge is not deployment evidence.
- Preserve existing assets, original narration and history.
- Scope CI to meaningful tests and a lightweight smoke gate.
