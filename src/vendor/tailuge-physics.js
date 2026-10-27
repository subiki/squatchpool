/**
 * Tailuge billiards physics — browser ES module adaptation for Squatch Pool.
 *
 * Copyright (c) tailuge/billiards contributors, GPL-3.0.
 * Based on original source:
 * https://github.com/tailuge/billiards/tree/master/src/model/physics
 * Upstream revision examined: master, 26 October 2026.
 *
 * The contact-throw, sliding/rolling, and Han cushion algorithms below are
 * translated from upstream's TypeScript/Three.Vector3 implementation into
 * dependency-free scalar JavaScript. Spatial collision scheduling belongs to
 * the Squatch adapter, not Tailuge. GPL-3.0 applies to this adaptation and
 * the combined browser work; see /LICENSE and /THIRD_PARTY.md.
 */
const R = 0.028575; // regulation 2.25-inch pool-ball radius in metres
const MASS = 0.17; // 6 oz regulation pool ball (~170 g)
const G = 9.8;
const I = (2 / 5) * MASS * R * R;
const SLIDING_FRICTION = 0.126;
const ROLLING_FRICTION = 0.007; // fast, plausible pool cloth; upstream 0.0055, typical range 0.005–0.015
const SPINDOWN_RHO = 0.045;
const CUSHION_E = 0.86;
const CUSHION_MU = 0.85;
const SIN_A = 0.1, COS_A = Math.sqrt(1 - SIN_A * SIN_A);
export const METERS_PER_PIXEL = R / 11;
const toMeters = n => n * METERS_PER_PIXEL;
const toPixels = n => n / METERS_PER_PIXEL;

export function applyCueSpin(ball, top = 0, side = 0) {
  // Tailuge cueToSpin: (5/2) * v * offset / R with offset ±0.45 radius.
  const x = toMeters(ball.vx), y = toMeters(ball.vy), speed = Math.hypot(x, y);
  const topSpin = Math.max(-1, Math.min(1, top)) * 0.45 * 2.5;
  ball.wx = -y / R * topSpin;
  ball.wy = x / R * topSpin;
  ball.wz = speed / R * Math.max(-1, Math.min(1, side)) * 0.45 * 2.5;
  ball.motion = 'sliding';
}

export function ballCollision(a, b) {
  // Adapted from collisionthrow.ts, Alciatore TP_A-14.
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist, ny = dy / dist;
  let ax = toMeters(a.vx), ay = toMeters(a.vy);
  let bx = toMeters(b.vx), by = toMeters(b.vy);
  const vrn = (ax - bx) * nx + (ay - by) * ny;
  if (vrn <= 1e-8) return false;

  // Relative velocity at sphere contacts, including side and follow/draw spin.
  const sx = (ax - bx) - R * ny * (a.wz + b.wz);
  const sy = (ay - by) + R * nx * (a.wz + b.wz);
  const sz = R * (ny * (a.wx + b.wx) - nx * (a.wy + b.wy));
  const tangx = sx - vrn * nx, tangy = sy - vrn * ny;
  const relTang = Math.hypot(tangx, tangy, sz);
  const mu = 0.01 + 0.108 * Math.exp(-1.088 * relTang);
  // A fresh phenolic ball set: restitution is within measured 0.92–0.98.
  const jn = -(1 + 0.94) * vrn / (2 / MASS);
  const jt = relTang > 1e-8
    ? -Math.min(mu * Math.abs(jn), (MASS / 7) * relTang) / relTang
    : 0;
  const jx = jn * nx + tangx * jt, jy = jn * ny + tangy * jt, jz = sz * jt;

  ax += jx / MASS; ay += jy / MASS;
  bx -= jx / MASS; by -= jy / MASS;
  a.vx = toPixels(ax); a.vy = toPixels(ay);
  b.vx = toPixels(bx); b.vy = toPixels(by);

  // Original CollisionThrow angular impulse is identical on both balls.
  const awx = R * ny * jz / I, awy = -R * nx * jz / I;
  const awz = R * (nx * (tangy * jt) - ny * (tangx * jt)) / I;
  for (const ball of [a, b]) {
    ball.wx += awx; ball.wy += awy; ball.wz += awz;
    ball.motion = 'sliding';
  }
  return true;
}

function hanDelta(vx, vy, wx, wy, wz, grip) {
  // Han 2005 cushion model, as implemented in physics.ts (gripHan/slipHan).
  const c = vx * COS_A;
  const sx = vx * SIN_A + R * wy;
  const sy = -vy - R * wz * COS_A + R * wx * SIN_A;
  const A = 7 / (2 * MASS);
  const ecB = (1 + CUSHION_E) * c * MASS;
  let px, py, pz;
  if (grip) {
    px = -(sx / A) * SIN_A - ecB * COS_A;
    py = sy / A;
    pz = (sx / A) * COS_A - ecB * SIN_A;
  } else {
    const theta = Math.atan2(vy, vx);
    const mu = 0.471 - Math.atan2(Math.abs(vy), vx) * 0.241;
    px = -mu * ecB * Math.cos(theta) * COS_A - ecB * COS_A;
    py = mu * ecB * Math.sin(theta);
    pz = mu * ecB * Math.cos(theta) * COS_A - ecB * SIN_A;
  }
  return {
    vx: px / MASS, vy: py / MASS,
    wx: -R * py * SIN_A / I,
    wy: R * (px * SIN_A - pz * COS_A) / I,
    wz: R * py * COS_A / I,
  };
}

export function cushionBounce(ball, nx, ny) {
  // n points from rail into felt; rotate so impact travels in +X.
  const ix = -nx, iy = -ny, tx = -iy, ty = ix;
  const vx = toMeters(ball.vx) * ix + toMeters(ball.vy) * iy;
  if (vx <= 1e-8) return false;
  const vy = toMeters(ball.vx) * tx + toMeters(ball.vy) * ty;
  const wx = ball.wx * ix + ball.wy * iy;
  const wy = ball.wx * tx + ball.wy * ty;
  const wz = ball.wz;
  // Tailuge's isGripCushion threshold with original dynamic restitution.
  const sx = vx * SIN_A + R * wy;
  const sy = -vy - R * wz * COS_A + R * wx * SIN_A;
  const restitution = 0.39 + 0.257 * vx - 0.044 * vx * vx;
  const pze = CUSHION_MU * (1 + restitution) * vx * COS_A * MASS;
  const pzs = Math.hypot(sx, sy) / (7 / (2 * MASS));
  const grip = hanDelta(vx, vy, wx, wy, wz, true);
  const slip = hanDelta(vx, vy, wx, wy, wz, false);
  const checkSide = Math.sign(vy) === Math.sign(wz);
  const blend = checkSide ? Math.max(0, Math.min(1, Math.cos(Math.atan2(vy, vx)))) : 1;
  // Tailuge's Han Blend: mix slip and grip; threshold guards near-edge cases.
  const factor = pzs <= pze ? blend : Math.max(0, blend * 0.75);
  const mix = key => slip[key] * (1 - factor) + grip[key] * factor;
  ball.vx += toPixels(mix('vx') * ix + mix('vy') * tx);
  ball.vy += toPixels(mix('vx') * iy + mix('vy') * ty);
  ball.wx += mix('wx') * ix + mix('wy') * tx;
  ball.wy += mix('wx') * iy + mix('wy') * ty;
  ball.wz += mix('wz');
  // Never let the collision resolve into further penetration.
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + CUSHION_E) * vn * nx;
    ball.vy -= (1 + CUSHION_E) * vn * ny;
  }
  ball.motion = 'sliding';
  return true;
}

export function advanceFriction(ball, dt, stopPixelsPerSecond = 5) {
  let vx = toMeters(ball.vx), vy = toMeters(ball.vy);
  const speed = Math.hypot(vx, vy);
  if (speed < toMeters(stopPixelsPerSecond)) {
    ball.vx = 0; ball.vy = 0; ball.wx = 0; ball.wy = 0; ball.wz = 0;
    ball.motion = 'stationary';
    return;
  }
  // Tailuge surfaceVelocityFull: Va = v + (up × Rω).
  const sx = vx - R * ball.wy, sy = vy + R * ball.wx;
  const slip = Math.hypot(sx, sy);
  if (slip > 0.05) {
    // Tailuge sliding(): dv = -muS*g*unit(Va),
    // dw = +(5/2)*muS*g/R*unit(up×Va).
    const friction = Math.min(SLIDING_FRICTION * G * dt, slip * 0.5);
    const ux = sx / slip, uy = sy / slip;
    vx -= ux * friction; vy -= uy * friction;
    ball.wx -= (5 / 2) * friction * uy / R;
    ball.wy += (5 / 2) * friction * ux / R;
    ball.motion = 'sliding';
  } else {
    // Tailuge forceRoll and rollingFull; roll without slipping, decelerate.
    const decel = ROLLING_FRICTION * G / Math.sqrt(2) * dt;
    const next = Math.max(0, speed - decel);
    vx *= next / speed; vy *= next / speed;
    ball.wx = -vy / R; ball.wy = vx / R;
    ball.motion = 'rolling';
  }
  // Tailuge Mz spindown: (5/2) Mz/(m R²), with its rho factor.
  const spindown = (5 / 2) * (((ROLLING_FRICTION * MASS * G * 2) / 3) * SPINDOWN_RHO) /
    (MASS * R * R) * dt;
  ball.wz = Math.sign(ball.wz) * Math.max(0, Math.abs(ball.wz) - spindown);
  ball.vx = toPixels(vx); ball.vy = toPixels(vy);
  if (!Number.isFinite(ball.vx + ball.vy + ball.wx + ball.wy + ball.wz)) {
    ball.vx = 0; ball.vy = 0; ball.wx = 0; ball.wy = 0; ball.wz = 0;
    ball.motion = 'stationary';
  }
}
