// Runs on every Squatch page. Installing is optional; the game never depends on the worker.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Keep offline support silent: the browser owns installation and update UI.
  let ready = false;
  let updateWaiting = false;
  let offlineCheckFailed = false;
  let registration = null;
  function render() {
    // No visible offline status banner; preserve background readiness checks.
  }
  window.addEventListener('online', () => {
    render();
    if (registration) { void registration.update().catch(() => {}); void checkReady(registration); }
  });
  window.addEventListener('offline', render);
  // serviceWorker.ready only proves activation, not that every offline asset
  // survived browser storage eviction. Ask the active worker to inspect its cache.
  function verifyCache(reg, repair = false) {
    return new Promise((resolve, reject) => {
      if (!reg.active || typeof MessageChannel === 'undefined') {
        reject(new Error('Offline worker not active')); return;
      }
      const channel = new MessageChannel();
      const timeout = setTimeout(() => {
        channel.port1.close();
        reject(new Error('Offline worker did not respond'));
      }, repair ? 20000 : 5000);
      channel.port1.onmessage = event => {
        if (event.data?.type !== 'SQUATCH_OFFLINE_STATUS') return;
        clearTimeout(timeout);
        channel.port1.close();
        resolve(event.data.ready === true);
      };
      try { reg.active.postMessage({type:repair ? 'SQUATCH_OFFLINE_REPAIR' : 'SQUATCH_OFFLINE_STATUS'}, [channel.port2]); }
      catch (error) { clearTimeout(timeout); channel.port1.close(); reject(error); }
    });
  }
  // A failed first install leaves serviceWorker.ready pending indefinitely.
  // Bound the wait so a missing/broken precache asset shows a truthful error
  // instead of claiming to be downloading forever.
  async function waitForActiveWorker(reg) {
    if (reg.active) return;
    let timeout;
    try {
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Offline worker activation timed out')), 15000);
        })
      ]);
    } finally {
      clearTimeout(timeout);
    }
    if (!reg.active) throw new Error('Offline worker not active');
  }
  let readinessCheck = 0;
  async function checkReady(reg) {
    const currentCheck = ++readinessCheck;
    let verified = false;
    try {
      await waitForActiveWorker(reg);
      verified = await verifyCache(reg);
      if (!verified && navigator.onLine) {
        verified = await verifyCache(reg, true);
      }
    } catch {
      // Missing files, storage errors and failed installation are not ready.
    }
    // Ignore a stale result after reconnection or controller replacement.
    if (currentCheck !== readinessCheck) return;
    ready = verified;
    offlineCheckFailed = !verified;
    render();
  }
  render();
  navigator.serviceWorker.register('/service-worker.js', {updateViaCache: 'none'}).then(reg => {
    registration = reg;
    function watchWaiting() {
      if (reg.waiting && navigator.serviceWorker.controller) {
        updateWaiting = true;
        render();
      }
    }
    watchWaiting();
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', watchWaiting);
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      updateWaiting = false;
      ready = false;
      void checkReady(reg);
    });
    return checkReady(reg);
  }).catch(() => {
    offlineCheckFailed = true;
    render();
  });
}
