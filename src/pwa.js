// Runs on every Squatch page. Installing is optional; the game never depends on the worker.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const header = document.querySelector('.squatch-unified-header') || document.querySelector('header') || document.body;
  let ready = false;
  let pendingInstall = null;
  let updateWaiting = false;
  let offlineCheckFailed = false;
  let registration = null;
  const bar = document.createElement('div');
  bar.className = 'squatch-offline-tools';
  const status = document.createElement('span');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const install = document.createElement('button');
  install.type = 'button';
  install.textContent = 'Install game';
  install.hidden = true;
  bar.append(status, install);
  header?.append(bar);
  function render() {
    if (!navigator.onLine) {
      status.textContent = ready ? 'Offline · Play locally; site stats sync when connected' : 'Offline · Download not verified; reconnect to finish';
    } else if (offlineCheckFailed) {
      status.textContent = 'Online play available · Offline files not verified; reload to retry';
    } else if (updateWaiting) {
      status.textContent = 'New version downloaded · Reopen the app to update';
    } else {
      status.textContent = ready ? 'Ready to play offline' : 'Downloading offline game…';
    }
    install.hidden = !pendingInstall || window.matchMedia('(display-mode: standalone)').matches;
  }
  install.addEventListener('click', () => {
    if (!pendingInstall) return;
    const prompt = pendingInstall;
    pendingInstall = null;
    render();
    void prompt.prompt();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingInstall = event;
    render();
  });
  window.addEventListener('appinstalled', () => {
    pendingInstall = null;
    render();
  });
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
        status.textContent = 'Restoring missing offline game files…';
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
