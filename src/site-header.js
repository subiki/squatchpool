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
    ['/chaos.html', '🎲 Chaos Maker'],
  ];
  // Favicons remain identical across standalone game pages.
  if (document.head) {
    if (!document.head.querySelector('link[rel="icon"]')) {
      const icon=document.createElement('link');
      icon.rel='icon';icon.type='image/svg+xml';icon.href='/assets/brand/favicon.svg';
      document.head.append(icon);
    }
    if (!document.head.querySelector('link[rel="apple-touch-icon"]')) {
      const touch=document.createElement('link');
      touch.rel='apple-touch-icon';touch.sizes='180x180';
      touch.href='/assets/brand/apple-touch-icon.png';
      document.head.append(touch);
    }
  }
  // Classic is the preserved baseline; Rock & Roll is a removable overlay.
  const THEME_KEY = 'squatchpool-visual-mode';
  const rockStyle = document.createElement('link');
  rockStyle.rel = 'stylesheet';
  rockStyle.href = '/src/wild-squatch.css';
  rockStyle.id = 'squatch-rock-style';
  rockStyle.disabled = true;
  // Insert the optional skin after page styles so shared game styling cannot
  // override it. The preference is read immediately, before the page renders.
  // This is one persistent stylesheet; SPA navigation does not recreate it.
  if (document.addEventListener && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.head?.append?.(rockStyle), {once:true});
  } else {
    document.head?.append?.(rockStyle);
  }
  const readMode = () => {
    try { return localStorage.getItem(THEME_KEY) === 'rock' ? 'rock' : 'classic'; }
    catch { return 'classic'; }
  };
  const setMode = (mode, persist = false) => {
    const rock = mode === 'rock';
    rockStyle.disabled = !rock;
    if (document.documentElement?.dataset) document.documentElement.dataset.squatchTheme = rock ? 'rock' : 'classic';
    if (persist) try { localStorage.setItem(THEME_KEY, rock ? 'rock' : 'classic'); } catch {}
    // Chaos is exclusive to Rock & Roll; Classic returns to the clean game hub.
    if (!rock && /^\/chaos(?:\.html)?$/.test(location.pathname)) { location.assign('/'); return; }
    document.querySelectorAll?.('[data-squatch-theme-choice]')?.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.squatchThemeChoice === (rock ? 'rock' : 'classic')));
    });
  };
  setMode(readMode());
  class SquatchHeader extends HTMLElement {
    connectedCallback() {
      if (this.dataset.rendered) return;
      this.dataset.rendered = 'true';
      // Pages redirects .html links to extensionless URLs; offline uses .html.
      const path = location.pathname.replace(/\/+$/, '') || '/';
      const current = path === '/index' || path === '/index.html' ? '/'
        : pages.find(([href]) => href === path || href.replace(/\.html$/, '') === path)?.[0];
      const header = document.createElement('header');
      header.className = 'squatch-unified-header';
      header.innerHTML = `
        <div class="squatch-brand-row">
          <div class="brand-mark" aria-hidden="true"><img src="/assets/brand/favicon.svg" width="62" height="62" alt=""></div>
          <div><p class="eyebrow">The 4T's · Somewhere in the Cascades</p><h1>SQUATCH <span>POOL</span></h1></div>
        </div>
        <div class="squatch-release" aria-label="Version and deployment">
          <span class="prototype">SQUATCH POOL · ALPHA</span>
          <span>LAST DEPLOYED <time id="deployment-time">Unavailable</time></span>
          <span id="deployment-note" aria-live="polite">Deployment metadata not loaded</span>
        </div>
        <div class="squatch-theme-switch" role="group" aria-label="Site appearance">
          <span>Appearance</span>
          <button type="button" data-squatch-theme-choice="classic" aria-pressed="true">🌲 Classic</button>
          <button type="button" data-squatch-theme-choice="rock" aria-pressed="false">🤘 Rock &amp; Roll</button>
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
        if (href === '/chaos.html') link.setAttribute('data-rock-exclusive', 'true');
        link.textContent = label;
        if (current === href) link.setAttribute('aria-current', 'page');
        nav.append(link);
      }
      header.querySelectorAll?.('[data-squatch-theme-choice]')?.forEach(button => {
        button.addEventListener('click', () => setMode(button.dataset.squatchThemeChoice, true));
      });
      this.append(header);
      // Rock-exclusive links stay out of Classic navigation.
      const updateExclusive = () => header.querySelectorAll?.('[data-rock-exclusive]')?.forEach(link => { link.hidden = document.documentElement?.dataset?.squatchTheme !== 'rock'; });
      header.querySelectorAll?.('[data-squatch-theme-choice]')?.forEach(button => button.addEventListener('click', updateExclusive));
      updateExclusive();
      setMode(readMode());
    }
  }
  if (!customElements.get('squatch-header')) customElements.define('squatch-header', SquatchHeader);
})();
