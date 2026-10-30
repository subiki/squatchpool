/** Browser-local aiming preference shared by every playable Squatch Pool game. */
export const INVERT_AIM_KEY = 'squatch-invert-aim';

export function readInvertAim() {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(INVERT_AIM_KEY) === 'true'; }
  catch { return false; }
}

/** Standard: point towards finger; inverted: point away from finger behind cue. */
export function angleFromPointer(striker, point, inverted = false, threshold = 8) {
  const dx = point.x - striker.x, dy = point.y - striker.y;
  if (Math.hypot(dx, dy) <= threshold) return null;
  const angle = Math.atan2(inverted ? -dy : dy, inverted ? -dx : dx);
  return angle === 0 ? 0 : angle;
}

export function bindInvertAim(button) {
  let inverted = readInvertAim();
  function render() {
    if (!button) return;
    button.setAttribute('aria-pressed', String(inverted));
    button.textContent = inverted ? '↔ Reverse aim: ON · drag behind cue' : '↔ Reverse aim: OFF';
    button.setAttribute('aria-label', inverted ? 'Reverse aim on. Drag behind the cue ball to aim away from your finger.' : 'Reverse aim off. Drag toward the target to aim.');
  }
  if (button) button.addEventListener('click', () => {
    inverted = !inverted;
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(INVERT_AIM_KEY, String(inverted)); } catch {}
    render();
  });
  if (button && typeof window !== 'undefined') window.addEventListener('storage', event => {
    if (event.key === INVERT_AIM_KEY) { inverted = event.newValue === 'true'; render(); }
  });
  render();
  return () => inverted;
}
