/**
 * Theme management.
 *
 * The `themeMode` store drives immediate UI changes.  On first load,
 * `initTheme()` reads the saved preference from the kv store (SQLite in
 * Tauri, localStorage in browser) before subscribing to future changes.
 */

import { writable } from 'svelte/store';
import { getKV, setKV } from '$lib/db';

export type ThemeMode = 'auto' | 'dark' | 'light';

export const themeMode = writable<ThemeMode>('auto');

let mediaQuery: MediaQueryList | null = null;

function applyTheme(mode: ThemeMode) {
  let resolved: 'dark' | 'light';
  if (mode === 'auto') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = mode;
  }
  document.documentElement.setAttribute('data-theme', resolved);
}

function onSystemChange(e: MediaQueryListEvent) {
  // Only react if current mode is auto
  const unsub = themeMode.subscribe((m) => {
    if (m === 'auto') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });
  unsub();
}

/**
 * Initialise the theme system.
 *
 * Reads the saved preference from the kv store, then subscribes to the
 * store so every future change is persisted automatically.
 */
export async function initTheme(): Promise<void> {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', onSystemChange);

  // Load saved preference from kv store (async)
  try {
    const saved = await getKV('tt-theme') as ThemeMode | null;
    if (saved && ['auto', 'dark', 'light'].includes(saved)) {
      themeMode.set(saved);
    }
  } catch { /* ignore */ }

  themeMode.subscribe((mode) => {
    applyTheme(mode);
    setKV('tt-theme', mode).catch(() => { /* non-fatal */ });
  });
}

/**
 * Cycle through auto → dark → light → auto.
 */
export function cycleTheme() {
  themeMode.update((current) => {
    const order: ThemeMode[] = ['auto', 'dark', 'light'];
    return order[(order.indexOf(current) + 1) % 3];
  });
}
