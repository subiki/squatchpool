/* One accessible, identical site header for every standalone page.
 * Declared synchronously in <head>; its light-DOM <header> exists before game modules start.
 * Keep gameplay in ordinary documents until controllers have explicit mount/unmount APIs.
 */
(() => {
  const pages = [
    ['/', '🏠 Home'],
    ['/but-wait.html', '🎱 But Wait'],
    ['/caroms.html', '🌲 Caroms'],
    ['/cutthroat.html', '🦍 Cutthroat'],
    ['/press-your-luck.html', '🎲 Press Your Luck'],
    ['/tuna.html', '🐟 Tuna'],
    ['/arcade.html', '🏆 Arcade Lab'],
    ['/rules.html', '📜 Rules'],
    ['/archive.html', '📖 Field Notes'],
  ];
  class SquatchHeader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.rendered) return;
      this.dataset.rendered = 'true';
      const current = location.pathname === '/index.html' ? '/' : location.pathname;
      const header = document.createElement('header');
      header.className = 'squatch-unified-header';
      header.innerHTML = `
        <div class="squatch-brand-row">
          <div class="brand-mark" aria-hidden="true">♠</div>
          <div><p class="eyebrow">The 4T's · Somewhere in the Cascades</p><h1>SQUATCH <span>POOL</span></h1></div>
        </div>
        <div class="squatch-release" aria-label="Version and deployment">
          <span class="prototype">SQUATCH POOL · ALPHA</span>
          <span>LAST DEPLOYED <time id="deployment-time">Unavailable</time></span>
          <span id="deployment-note" aria-live="polite">Deployment metadata not loaded</span>
        </div>
        <nav class="squatch-header-nav" aria-label="Explore Squatch Pool"></nav>
        <details class="squatch-header-stats">
          <summary>Across Squatch Pool · Live statistics</summary>
          <div class="squatch-stat-numbers" aria-label="Site-wide statistics">
            <div class="stat"><strong id="site-stats-players">—</strong><span>Players</span></div>
            <div class="stat"><strong id="site-stats-racks">—</strong><span>Racks</span></div>
            <div class="stat"><strong id="site-stats-balls">—</strong><span>Balls made</span></div>
          </div>
          <div id="site-stats-breakdown"></div>
          <p class="stats-footnote" id="stats-status" aria-live="polite">Connecting to live statistics…</p>
        </details>`;
      const nav = header.querySelector('nav');
      for (const [href, label] of pages) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        if (current === href) link.setAttribute('aria-current', 'page');
        nav.append(link);
      }
      this.append(header);
    }
  }
  if (!customElements.get('squatch-header')) customElements.define('squatch-header', SquatchHeader);
})();
