# Third-party notices and corresponding source

## Tailuge Billiards — GPL-3.0

Original project: https://github.com/tailuge/billiards
Original authors: tailuge/billiards contributors.
License: GNU GPL version 3, in [LICENSE](LICENSE).

`src/vendor/tailuge-physics.js` is an adapted, dependency-free JavaScript
translation of original Tailuge functions from:
- `src/model/physics/collisionthrow.ts` (ball collision, throw and friction)
- `src/model/physics/physics.ts` (sliding/rolling motion, spin, Han cushion blend)
- `src/model/physics/constants.ts` (physical constants)

Changes: rewritten scalar vector operations for Canvas 2D without importing
Three.js, user-adjustable cue spin controls, arcade cloth calibration,
and new collision detection/table geometry in `src/physics.js`.

This deployed browser game is distributed under GPL-3.0. The complete
corresponding source (HTML, JS, CSS, tests and game rules) is served by this
static deployment; begin at `/README.md`, `/src/game.js`,
`/src/physics.js`, `/src/vendor/tailuge-physics.js`,
`/tests/physics.test.js` and `/LICENSE`. No compiled or obfuscated
assets are necessary to reproduce it. Local running and testing:
`python3 -m http.server 8080` and `npm test`.

## Former Planck.js / Box2D (MIT)

Previous physics iteration used Planck.js by Erin Catto and Ali Shakiba,
MIT-licensed. That implementation is superseded by Tailuge and is no longer
in the runtime. Its history remains in earlier repository commits.
