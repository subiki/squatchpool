# Jungle Lab — isolated first creative slice

**Not the production pool game.** A first 3D experiment for Squatch Pool's free, absurd, atmospheric *Welcome to the Jungle* direction (#19, #20, #21).

## Run

Serve the repository root as static files and open:

\`\`\`
http://localhost:8080/experiments/jungle/
\`\`\`

For example: \`python3 -m http.server 8080\` at repository root.

Requires WebGL and a network connection for Three.js 0.186.1, pinned from jsDelivr via an ES module import map. Works as a Cloudflare Pages static directory, with no application server and no build command.

## What's here

- An original procedural 3D clearing: forest/jungle canopy, rustic open-air Four T's bar, ferns, lanterns, drifting fireflies, wood and felt pool table.
- A deliberately low-poly **Speed Squatch** stand-in: gray fur, glasses, cap, enormous multi-cue gear bag, dancing intro and a name/catchphrase. It is a temporary procedural model, **not approved production character art**.
- A skippable camera/character entrance and a reduced-motion option.
- Cinematic/perspective and overhead camera modes without resetting the balls or shot state.
- A basic **free-shot-only** table using the current \`src/physics.js\` for pockets, cue strikes, rebounds, and settling. Aim by tapping or dragging on the table, select power and press SHOOT. The normal game's rules/turn logic are intentionally *not* loaded here.
- Graceful fallback message for unsupported WebGL. The original game is always linked.

## Implementation boundaries

- \`scene-state.js\` is pure session state + the existing physics, with Node tests.
- \`jungle.js\` is presentation, camera controls, character staging, and input.
- No changes to \`src/game.js\`, \`src/rules.js\`, or \`src/physics.js\`: parallel P0 game fixes are safe.
- Visual cushion/pocket meshes are still **illustrative** and inherit existing physics simplifications; do not use this lab to sign off realistic 3D cushion behavior.
- The "overhead" mode is an orthographic 3D camera, **not yet the production Canvas Classic renderer**. The actual live-match 2D ↔ 3D renderer adapter in issue #20 remains future integration.
- No real collision/physics engine switching yet; that needs issue #12 adapter and stationary-ball handoff.
- Intro is visual-only: not tied to the bot breaking or the main game's scoring. These are intentional scope boundaries.

## Validation needed before merge

1. Run \`npm test\` and \`npm run check\` on the branch; \`node --check experiments/jungle/jungle.js\` separately (bare Three import is syntax-only).
2. Open in a desktop browser and midrange mobile device; check initialization, scene/camera, controls, WebGL fallback, and performance.
3. Compare ball IDs/positions and shot count through at least five camera switches.
4. Verify table isn't obscured by scenery in both cameras and intro can be skipped immediately.
5. Capture a screenshot/video and record a playtest in #20, including known limitations.
6. Decide whether to reuse this procedural scenery, replace it with modeled art, or discard it. This experiment is allowed to be ugly and funny.

## Licensing and attribution

- [Three.js](https://threejs.org/) 0.186.1, MIT licensed. Runtime module CDN: \`https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js\`.
- Scene geometry, procedural textures, character shapes, and CSS authored here; no copied 3D game meshes, logos, photos, soundtrack, or third-party character assets.
- No Tailuge/Hanazar/pooltool code is imported. Existing Squatch physics remains the source of ball motion.
