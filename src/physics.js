// Squatch Pool physics adapter: Planck.js (Box2D), MIT licensed.
// Coordinates stay in the game's original 1000 × 500 pixel units.
// Planck runs in meters so contacts/continuous collision detection behave predictably.
import * as pl from './vendor/planck.mjs';

export const TABLE = { width: 1000, height: 500, radius: 11, pocketRadius: 23 };
const SCALE = 100;
const STOP = 5;
const DAMPING = 1.15;
const BALL_RESTITUTION = 0.96;
const RAIL_RESTITUTION = 0.81;
const r = TABLE.radius;
const w = TABLE.width, h = TABLE.height;

// The same rail-face segments are used by the physics and the renderer.
// Openings are real gaps, not invisible walls drawn underneath the pockets.
export const cushions = [
  { x1: 34, y1: r, x2: w / 2 - 26, y2: r },
  { x1: w / 2 + 26, y1: r, x2: w - 34, y2: r },
  { x1: 34, y1: h - r, x2: w / 2 - 26, y2: h - r },
  { x1: w / 2 + 26, y1: h - r, x2: w - 34, y2: h - r },
  { x1: r, y1: 34, x2: r, y2: h - 34 },
  { x1: w - r, y1: 34, x2: w - r, y2: h - 34 },
];
export const pockets = [
  { x: 0, y: 0, radius: 22 }, { x: w / 2, y: 0, radius: 26 },
  { x: w, y: 0, radius: 22 }, { x: 0, y: h, radius: 22 },
  { x: w / 2, y: h, radius: 26 }, { x: w, y: h, radius: 22 },
];
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ball = (id, x, y) => ({ id, x, y, vx: 0, vy: 0, pocketed: false });
export const stationary = balls => balls.every(b => b.pocketed || Math.hypot(b.vx, b.vy) < STOP);

export function canPlace(balls, x, y, ignoreId = null) {
  // Ball centers stay inside the exposed cushion faces.
  const inset = 2 * TABLE.radius + 1;
  if (x < inset || x > w - inset || y < inset || y > h - inset) return false;
  if (pockets.some(p => Math.hypot(x - p.x, y - p.y) < p.radius + TABLE.radius + 3)) return false;
  return balls.every(b => b.pocketed || b.id === ignoreId ||
    Math.hypot(b.x - x, b.y - y) >= 2 * TABLE.radius + 2);
}
export function findPlacement(balls, preferred = { x: 260, y: 250 }) {
  if (canPlace(balls, preferred.x, preferred.y)) return preferred;
  for (let radius = 26; radius <= 400; radius += 26) {
    for (let i = 0; i < 36; i++) {
      const angle = i * Math.PI / 18;
      const x = preferred.x + Math.cos(angle) * radius;
      const y = preferred.y + Math.sin(angle) * radius;
      if (canPlace(balls, x, y)) return { x, y };
    }
  }
  return null;
}
export function rack() {
  const balls = [ball(0, 255, 250)];
  const numbers = [1, 10, 3, 12, 8, 2, 9, 11, 4, 13, 5, 14, 6];
  let index = 0;
  for (let row = 0; row < 5; row++) for (let column = 0; column <= row; column++) {
    if (row === 4 && (column === 0 || column === 4)) continue;
    balls.push(ball(numbers[index++], 695 + row * 19.4, 250 + (column - row / 2) * 22.9));
  }
  return balls;
}

// Keyed by each game's balls array. Never share world state across racks or tests.
const contexts = new WeakMap();
function contextFor(balls) {
  let ctx = contexts.get(balls);
  if (ctx) return ctx;
  const world = new pl.World({ gravity: pl.Vec2(0, 0), allowSleep: true, continuousPhysics: true });
  const rails = world.createBody();
  for (const c of cushions) {
    rails.createFixture(pl.Edge(pl.Vec2(c.x1 / SCALE, c.y1 / SCALE),
      pl.Vec2(c.x2 / SCALE, c.y2 / SCALE)), { friction: 0, restitution: RAIL_RESTITUTION });
  }
  ctx = { world, bodies: new Map(), contacts: [] };
  world.on('begin-contact', contact => {
    const a = contact.getFixtureA().getBody().getUserData();
    const b = contact.getFixtureB().getBody().getUserData();
    if (Number.isInteger(a) && Number.isInteger(b)) ctx.contacts.push([a, b]);
  });
  world.on('pre-solve', contact => {
    const a = contact.getFixtureA().getBody().getUserData();
    const b = contact.getFixtureB().getBody().getUserData();
    // Box2D normally takes the *maximum* restitution. Rails must instead lose energy.
    contact.setRestitution(Number.isInteger(a) && Number.isInteger(b)
      ? BALL_RESTITUTION : RAIL_RESTITUTION);
  });
  contexts.set(balls, ctx);
  return ctx;
}
function makeBody(ctx, b) {
  const body = ctx.world.createDynamicBody({
    position: pl.Vec2(b.x / SCALE, b.y / SCALE),
    linearVelocity: pl.Vec2(b.vx / SCALE, b.vy / SCALE),
    userData: b.id, bullet: true, linearDamping: DAMPING, angularDamping: 5, fixedRotation: true,
  });
  body.createFixture(pl.Circle(TABLE.radius / SCALE),
    { density: 1, friction: 0, restitution: BALL_RESTITUTION });
  const record = { body, x: b.x, y: b.y, vx: b.vx, vy: b.vy };
  ctx.bodies.set(b, record);
  return record;
}
export function step(balls, dt = 1 / 120) {
  const ctx = contextFor(balls), pocketed = [];
  ctx.contacts = [];
  for (const [b, record] of ctx.bodies) {
    if (b.pocketed || !balls.includes(b)) {
      ctx.world.destroyBody(record.body);
      ctx.bodies.delete(b);
    }
  }
  for (const b of balls) {
    if (b.pocketed) continue;
    const record = ctx.bodies.get(b) || makeBody(ctx, b);
    // Gameplay may reposition the cue or add a hidden ball between shots.
    if (Math.hypot(b.x - record.x, b.y - record.y) > 0.001)
      record.body.setTransform(pl.Vec2(b.x / SCALE, b.y / SCALE), 0);
    if (Math.hypot(b.vx - record.vx, b.vy - record.vy) > 0.001)
      record.body.setLinearVelocity(pl.Vec2(b.vx / SCALE, b.vy / SCALE));
  }
  ctx.world.step(dt, 12, 6);
  for (const b of balls) {
    if (b.pocketed) continue;
    const record = ctx.bodies.get(b), pos = record.body.getPosition();
    b.x = pos.x * SCALE; b.y = pos.y * SCALE;
    const vel = record.body.getLinearVelocity();
    b.vx = vel.x * SCALE; b.vy = vel.y * SCALE;
    if (pockets.some(p => Math.hypot(b.x - p.x, b.y - p.y) <= p.radius)) {
      b.pocketed = true; b.vx = 0; b.vy = 0; pocketed.push(b.id);
      ctx.world.destroyBody(record.body); ctx.bodies.delete(b);
    } else {
      if (Math.hypot(b.vx, b.vy) < STOP) {
        b.vx = 0; b.vy = 0;
        record.body.setLinearVelocity(pl.Vec2(0, 0));
      }
      Object.assign(record, { x: b.x, y: b.y, vx: b.vx, vy: b.vy });
    }
  }
  return { pocketed, contacts: ctx.contacts };
}
export function clearShot(balls, from, to, excluded = []) {
  const dx = to.x - from.x, dy = to.y - from.y, len2 = dx * dx + dy * dy;
  if (!len2) return false;
  return balls.every(b => {
    if (b.pocketed || excluded.includes(b.id)) return true;
    const t = clamp(((b.x - from.x) * dx + (b.y - from.y) * dy) / len2, 0, 1);
    return Math.hypot(b.x - (from.x + t * dx), b.y - (from.y + t * dy)) > TABLE.radius * 2.15;
  });
}
