<script lang="ts">
  import { page } from '$app/state';
  import { t } from '$lib/i18n';

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

<nav class="bottom-bar">
  {#each navItems as item}
    <a class="bottom-item" class:active={isActive(item.href)} href={item.href}>
      {#if item.icon === 'home'}
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      {:else if item.icon === 'tonelab'}
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
      {:else if item.icon === 'rhythm'}
        <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/></svg>
      {:else if item.icon === 'progress'}
        <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      {/if}
      <span>{$t(item.key)}</span>
    </a>
  {/each}
</nav>

<style>
  .bottom-bar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--bg-solid); border-top: 1px solid var(--border);
    padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
    z-index: 10; transition: background 0.3s;
    justify-content: space-around;
  }

  @media (max-width: 1024px) {
    .bottom-bar { display: flex; }
  }

  .bottom-item {
    display: flex; flex-direction: column; align-items: center;
    gap: 2px; padding: 4px 12px; border-radius: 8px;
    color: var(--text-3); text-decoration: none;
    transition: color 0.2s;
  }

  .bottom-item svg {
    width: 20px; height: 20px; stroke: currentColor; fill: none;
    stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round;
  }

  .bottom-item span { font-size: 9px; font-weight: 500; }

  .bottom-item.active { color: var(--accent); }
</style>
