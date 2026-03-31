import { writable } from 'svelte/store';

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

export function initTheme() {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', onSystemChange);

  // Load saved preference
  try {
    const saved = localStorage.getItem('tt-theme') as ThemeMode | null;
    if (saved && ['auto', 'dark', 'light'].includes(saved)) {
      themeMode.set(saved);
    }
  } catch {
    // localStorage not available (e.g. SSR)
  }

  themeMode.subscribe((mode) => {
    applyTheme(mode);
    try {
      localStorage.setItem('tt-theme', mode);
    } catch {
      // ignore
    }
  });
}

export function cycleTheme() {
  themeMode.update((current) => {
    const order: ThemeMode[] = ['auto', 'dark', 'light'];
    return order[(order.indexOf(current) + 1) % 3];
  });
}
