# Jungle 3D vertical slice — implementation notes

**Scope:** opt-in 3D renderer and first animated Speed Squatch introduction. This branch does not replace the playable Classic version or change physics, surprise-ball rules, scorekeeping or opponent AI.

## Architecture
- The original `src/game.js` alone continues stepping the existing fixed-step physics and owning `state`, phase transitions and referee results.
- `src/jungle3d.js` lazily imports **Three.js 0.186.1** only after **Jungle 3D** or **Meet Speed Squatch** is selected. It takes read-only state snapshots by reference for display only. It never advances balls, assigns groups, awards points, or resimulates shots.
- `src/jungle-contract.js` provides pure table ↔ world coordinate transforms: 1000×500 Canvas units map to 20×10 world units. UI pointer projection maps from 3D table back into existing game controls.
- Switch **Classic ↔ Jungle 3D** using the visible buttons at any point. Ball positions and turn are not reset, and the active match is never copied to a second engine.
- A simple procedural 3D foliage / wood table and a procedural Speed Squatch rig avoid external character art, image assets, attribution uncertainties and download bloat. The optional introduction is skippable and auto-skipped on reduced-motion devices.
- WebGL failure or module-loading error falls back to Classic. No accounts, analytics, ads, servers or payment flow.

## External code / license
- **Three.js** pinned to `0.186.1`, runtime-loaded from `https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js`.
- Three.js is MIT licensed. Source: https://github.com/mrdoob/three.js/blob/master/LICENSE . Before production release, consider self-hosting a pinned distributable to remove CDN availability as a dependency, and retain the license notice.
- All meshes, foliage, sign typography and Speed Squatch rig introduced in this experiment are generated using original code, without downloaded textures or models. No third-party assets are copied.
- Physics alternatives such as cannon-es, Rapier or other pool engines are **research candidates** in #12, not implemented here. Don't present view switching as physics engine switching.

## Validation / definition of done
- `npm test` and `npm run check` pass, including `tests/jungle-contract.test.js`.
- In a deployed preview, switch Classic → Jungle → Classic five times while balls are moving and while stopped: same balls, score and turn each time.
- Shoot with mouse and touch in both modes. Test normal aim, cue-ball placement and held-ball placement after #7 is fixed; remain compatible with that rule change.
- Intro starts in 3D, visibly features cap, glasses and ridiculous cue bag, is skippable and respects reduced motion.
- Verify performance and legibility on a midrange phone. On graphics failure it must return to Classic with game state intact.
- Record test evidence on #20 and #21 before merging. This is a **draft vertical slice**, not a claim that Jungle 3D is fully browser-verified.

## UX limitations
- Scene art and animation are deliberately low-poly/procedural; final character design, sound and lore-specific dialogue require a separate art pass.
- 3D ball numbers use camera-facing miniature badges as a first pass, not final realistic texture mapping.
- The renderer still uses current Classic physics, including any bugs remaining in P0. Do not confuse prettier 3D rendering with corrected pool dynamics.
- Physics backend switching must happen only at settled state and will require explicit compatibility testing (#12), not part of this prototype.
