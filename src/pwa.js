// Runs on every Squatch page. Installing is optional; the game never depends on the worker.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const header = document.querySelector('.squatch-unified-header');
  let ready = false;
  let pendingInstall = null;
  let updateWaiting = false;
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
      status.textContent = ready ? 'Offline · Play locally; site stats sync when connected' : 'Offline · Open the app online once to download';
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
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  render();
  navigator.serviceWorker.register('/service-worker.js', {updateViaCache: 'none'}).then(reg => {
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
    return navigator.serviceWorker.ready;
  }).then(() => {
    ready = true;
    render();
  }).catch(() => {
    status.textContent = navigator.onLine ? 'Online play available · Offline download unavailable' : 'Offline download unavailable';
  });
}
