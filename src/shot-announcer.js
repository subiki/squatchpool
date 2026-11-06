/**
 * Broadcast a resolved GameSession ruling above the table.
 * The session, not the UI, decides what happened. This consumer has no
 * effect on rules, physics, history or telemetry and can be disposed on route exit.
 */
export function attachShotAnnouncer(session, stage, {holdMs = 3400} = {}) {
  if (!session?.subscribe || !stage?.ownerDocument) {
    throw new TypeError('Shot announcer requires a session and table stage');
  }
  const banner = stage.ownerDocument.createElement('div');
  banner.className = 'shot-announcer';
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-atomic', 'true');
  stage.appendChild(banner);

  let hideTimer;
  let lastShotId;
  const unsubscribe = session.subscribe(result => {
    if (!result?.shotId || !result.announcement || result.shotId === lastShotId) return;
    lastShotId = result.shotId;
    clearTimeout(hideTimer);
    banner.classList.remove('is-visible');
    banner.textContent = String(result.announcement);
    // Restart the half-second entrance animation on consecutive rulings.
    void banner.offsetWidth;
    banner.classList.add('is-visible');
    hideTimer = setTimeout(() => banner.classList.remove('is-visible'), holdMs);
  });

  return function disposeShotAnnouncer() {
    unsubscribe();
    clearTimeout(hideTimer);
    banner.remove();
  };
}
