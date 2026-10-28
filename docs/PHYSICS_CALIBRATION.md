# Physics calibration — stop the ice-skating effect

This is a **measured-in-simulation tuning pass**, not a claim that the browser game perfectly reproduces a specific real table. Preserve the GPL-3.0 Tailuge adapter; calibrate its *cloth* first, then validate real shots at 7-, 8- and 9-foot table settings. A softer/dirtier cloth and a new tournament cloth play differently.

## Published physical references

- [Dr. Dave: pool physical-property constants](https://drdavepoolinfo.com/FAQ/physics/physical-properties/) — sliding μ = 0.15–0.40 (typical **0.20**); rolling μ = 0.005–0.015 (typical **0.010**); sidespin deceleration 5–15 rad/s²; ball-ball restitution 0.92–0.98; ball-rail restitution 0.6–0.9.
- [Dr. Dave: cloth effects](https://drdavepoolinfo.com/FAQ/table/cloth-effects/) — sliding and rolling losses describe **different** properties: slick cloth preserves draw; fast cloth rolls farther. Avoid trying to emulate cloth with one universal drag multiplier.
- [Dr. Dave: slide/roll with sidespin](https://drdavepoolinfo.com/faq/sidespin/slide-roll/) — cloth drag takes a stun ball from initial skid into forward roll; backspin can become stun then forward roll.
- [pooltool billiards model](https://ekiefl.github.io/2020/04/24/pooltool-theory/) — physical rationale for transition at the contact-point relative surface velocity and curved sliding trajectories.

## What changed in `src/vendor/tailuge-physics.js`

| Property | Earlier version | Calibrated version | Rationale |
| --- | ---: | ---: | --- |
| Sliding coefficient μ_s | 0.126 | **0.20** | Typical pool cloth, so a struck stun ball grips sooner |
| Rolling coefficient μ_r | 0.007 | **0.010** | Nominal middle of 0.005–0.015 measured range |
| Rolling acceleration magnitude | μ_r g / √2 | **μ_r g** | Rolling-resistance model on flat felt; removing the previous unintended weakening |
| Contact-point slip cutoff | 0.05 m/s | **0.005 m/s** | Don't snap from perceptible skid into natural roll too early |
| Sliding friction step cap | 0.5 × residual slip | **slip / 3.5** | Both linear deceleration and angular acceleration consume slip; stop at the exact transition |
| Ball diameter | 2.25 in | **unchanged** | Regulation on 7/8/9 ft surfaces |
| Ball mass | 0.17 kg | **unchanged** | No invented change to collision energy |
| Ball-ball restitution | 0.94 | **unchanged** | Within measured 0.92–0.98 range |

Side spin decays at about 9 rad/s² in the calibrated 0.010 rolling model, within Dr. Dave's 5–15 rad/s² range. Rail cushion response and contact throw are deliberately unchanged here; tune them only with controlled bank and cut-shot comparisons.

## Reproducible output benchmarks

The benchmark starts a *single unobstructed, already-rolling* ball with matching spin, integrates the same 120 Hz `advanceFriction()` used by the game, and measures travel until it falls below the current stop threshold (5 Canvas px/s ≈ 0.013 m/s). There are no cushions, pocket collisions or other balls in these isolation tests. **These are simulation outputs, not measurements of a physical table.**

| Starting rolling speed | Old travel | Calibrated travel | Old stop time | Calibrated stop time |
| --- | ---: | ---: | ---: | ---: |
| 0.30 m/s | 0.925 m | **0.457 m** | 5.93 s | **2.94 s** |
| 0.50 m/s | 2.573 m | **1.273 m** | 10.05 s | **4.98 s** |
| 1.00 m/s | 10.302 m | **5.097 m** | 20.36 s | **10.08 s** |

Sanity formula for pure rolling on flat cloth: `a = μ_r g`; stopping distance `d = v²/(2 μ_r g)`. At `v=0.5 m/s`, `μ_r=0.01`, `g=9.8 m/s²`, ideal stopping distance **1.276 m**, near observed simulation **1.273 m**. A 1.0 m/s *stun* ball with no initial rotation transitions from sliding to rolling in approximately **0.15 seconds** after traveling **~0.125 m**; rolling time/distance then continue separately.

These concrete checks are in `tests/physics.test.js`. Preserve them if editing coefficients. Also run all geometry/rail/break tests on **7, 8 and 9 feet**, including draw/follow and side-English correctness.

## Controls, not physics

Power returns to **68%**, draw/follow to **0%** and English to **0%** immediately **after every stroke**, while the balls are moving. The initial break still starts at **85%** to offer a strong break; subsequent shots are neutral. Call-ball/call-pocket and the Undo call button continue unchanged. No slider value from Player 1 should leak into Player 2's next shot.

## What would make this scientifically stronger

Run a repeatable live comparison on a real reference table and in the game:
- Record a 0.3–0.5 m/s pure-rolling ball stopping distance/time on actual cloth to fit **rolling resistance**.
- Record 1.0 m/s stun-ball skid length / time to natural roll (high-speed video) to fit **sliding friction**.
- Record draw retention and side-spin decay on a straight shot to evaluate cue-tip spin and cloth spindown separately.
- Compare one-rail banks at low/medium/high incident speeds and angles to tune effective rail restitution/friction, not just visual impacts.
- Recheck full-rack break spread, time to settle, ball trajectories, and frame-rate independence at 7/8/9 ft.

The fitted coefficients should only be adjusted using these observed outputs. Avoid fake claims of perfect physics, and don't use one friction constant for sliding, rolling and spin.
