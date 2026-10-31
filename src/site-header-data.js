// Every route shows the same verified Pacific deployment stamp.
// But Wait already owns its live/flush statistics client in game.js; avoid a
// second competing read-only fetch that could overwrite its richer display.
import './deployment.js';
if (location.pathname !== '/but-wait.html') {
  void import('./hub-stats.js');
}
