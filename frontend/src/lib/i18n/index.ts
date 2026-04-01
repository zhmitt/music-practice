import { writable, derived } from 'svelte/store';
import en from './en.json';
import de from './de.json';

export type Locale = 'en' | 'de';

const translations: Record<Locale, Record<string, string>> = { en, de };

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem('tt-locale');
    if (saved === 'en' || saved === 'de') return saved;
  } catch { /* ignore */ }
  return 'de';
}

export const locale = writable<Locale>(getInitialLocale());

export const t = derived(locale, ($locale) => {
  const dict = translations[$locale];
  return (key: string): string => dict[key] ?? key;
});
