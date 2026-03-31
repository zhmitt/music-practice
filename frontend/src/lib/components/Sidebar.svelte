<script lang="ts">
  import { page } from '$app/state';
  import { t } from '$lib/i18n';
  import { settingsOpen } from '$lib/stores/navigation';

  const navItems = [
    { href: '/', key: 'nav.dashboard', icon: 'home' },
    { href: '/tonelab', key: 'nav.tonelab', icon: 'tonelab' },
    { href: '/rhythm', key: 'nav.rhythm', icon: 'rhythm' },
    { href: '/progress', key: 'nav.progress', icon: 'progress' },
  ] as const;

  function isActive(href: string): boolean {
    if (href === '/') return page.url.pathname === '/';
    return page.url.pathname.startsWith(href);
  }
</script>

<nav class="sidebar">
  <div class="sidebar-logo">
    <svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/></svg>
  </div>

  {#each navItems as item}
    <a class="nav-item" class:active={isActive(item.href)} href={item.href} title={$t(item.key)}>
      {#if item.icon === 'home'}
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      {:else if item.icon === 'tonelab'}
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
      {:else if item.icon === 'rhythm'}
        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></svg>
      {:else if item.icon === 'progress'}
        <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      {/if}
    </a>
  {/each}

  <div class="sidebar-spacer"></div>

  <div class="sidebar-stats">
    <div class="sidebar-stat">
      <div class="sidebar-stat-num" style="color:var(--accent)">--</div>
      <div class="sidebar-stat-label">{$t('sidebar.streak')}</div>
    </div>
    <div class="sidebar-stat">
      <div class="sidebar-stat-num" style="color:var(--green)">--</div>
      <div class="sidebar-stat-label">{$t('sidebar.ct_avg')}</div>
    </div>
  </div>

  <button class="nav-item" title={$t('nav.settings')} onclick={() => settingsOpen.update(v => !v)}>
    <svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  </button>
</nav>

<style>
  .sidebar {
    grid-row: 1 / -1;
    background: var(--bg-solid);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    gap: 2px;
    z-index: 10;
    transition: background 0.3s;
  }

  .sidebar-logo {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, var(--accent), #818cf8);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px; flex-shrink: 0;
  }

  .sidebar-logo svg { width: 15px; height: 15px; fill: white; stroke: none; }

  .nav-item {
    width: 40px; height: 40px; border-radius: 10px; border: none;
    background: transparent; color: var(--text-3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; position: relative;
    text-decoration: none;
  }

  .nav-item svg {
    width: 18px; height: 18px; stroke: currentColor; fill: none;
    stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
  }

  .nav-item:hover { color: var(--text-2); background: var(--surface); }
  .nav-item.active { color: var(--accent); background: var(--accent-soft); }

  .nav-item.active::before {
    content: ''; position: absolute; left: -8px; top: 50%;
    transform: translateY(-50%); width: 3px; height: 16px;
    background: var(--accent); border-radius: 0 2px 2px 0;
  }

  .sidebar-spacer { flex: 1; }

  .sidebar-stats {
    display: flex; flex-direction: column; align-items: center;
    gap: 12px; padding: 12px 0; border-top: 1px solid var(--border);
    margin-top: 8px; width: 100%;
  }

  .sidebar-stat { text-align: center; line-height: 1; }
  .sidebar-stat-num { font-size: 13px; font-weight: 700; }
  .sidebar-stat-label { font-size: 8px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }

  @media (max-width: 1024px) {
    .sidebar { display: none; }
  }
</style>
