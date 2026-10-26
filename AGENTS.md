# Squatch Pool agent instructions

## Mission
Ship a publicly accessible, playable, Squatch-branded pool game in the browser as fast as practical. Adapt a viable open-source implementation rather than building physics from scratch.

## Delivery sequence
M0: Evaluate and select a licensed engine (#12).
M1: Integrate, verify physics/controls, deploy preview (#1 #2 #3 #5).
M2: Finish a complete local two-player game and browser play-test (#4 #15).
M3: Add Squatch identity and first original mode using **confirmed** rules (#6 #7).
M4: Pass public alpha release gate (#13).

These are planning phases, not yet GitHub milestone objects.

## Working agreement
- Favor small, runnable increments; keep the preview playable.
- For each issue: implement, build, play-test in a browser, fix failures, record evidence, then close.
- Do not declare done on passing unit tests or successful deploy alone.
- Never invent original Squatch game rules; ask for confirmation if source rules are unavailable.
- Verify open-source licenses and preserve required attribution.
- Prioritize desktop mouse and mobile touch controls.
- No authentication, database, multiplayer backend, creator platform, elaborate CI, or custom physics engine in MVP unless absolutely required.
- Record blocking dependencies in the issue; escalate license/access/rules decisions.
- Do not expand to P2 features before public alpha acceptance.

## Release definition
An unfamiliar player can open the public URL without login, aim and shoot with mouse or touch, observe working collisions/pockets/scratches, complete a two-player local match, see Squatch branding and a confirmed original Squatch game mode, and restart. Verify all of these in actual browsers.

## Scope and sources
Original Squatch game rules are not fully documented in this repository yet. Treat any inferred episode/game details as unverified until confirmed.
