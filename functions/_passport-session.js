// Passport session primitives for Cloudflare Pages Functions.
// This module never trusts a browser-provided player ID or email.
const encoder = new TextEncoder();
const COOKIE = 'squatch_session';
const DAY = 86400;
const MAX_AGE = 30 * DAY;
const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
export const digest = async value => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
export const randomToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return hex(bytes);
};
export function cookieHeader(token, maxAge = MAX_AGE) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
export const clearCookieHeader = () => cookieHeader('', 0);
export function readSessionToken(request) {
  const raw = request.headers.get('Cookie') || '';
  const entry = raw.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  const token = entry?.slice(COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export function sameOriginWrite(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  // Require Origin on browser state changes to avoid cross-site form submissions.
  return origin === url.origin;
}
export async function issueSession(db, playerId) {
  const token = randomToken();
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  await db.prepare('INSERT INTO player_sessions (token_hash, player_id, expires_at) VALUES (?, ?, ?)')
    .bind(await digest(token), playerId, expires).run();
  return { token, expires };
}
export async function resolveSession(db, request) {
  const token = readSessionToken(request);
  if (!token) return null;
  return db.prepare(`SELECT p.id, p.handle, p.display_name, p.visibility, p.leaderboard_opt_in
    FROM player_sessions s JOIN players p ON p.id = s.player_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?`)
    .bind(await digest(token), Math.floor(Date.now() / 1000)).first();
}
export async function revokeSession(db, request) {
  const token = readSessionToken(request);
  if (!token) return;
  await db.prepare('UPDATE player_sessions SET revoked_at = ? WHERE token_hash = ?')
    .bind(Math.floor(Date.now() / 1000), await digest(token)).run();
}
