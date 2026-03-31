import { writable, derived } from 'svelte/store';
import en from './en.json';
import de from './de.json';

export type Locale = 'en' | 'de';

const translations: Record<Locale, Record<string, string>> = { en, de };

export const locale = writable<Locale>('de');

export const t = derived(locale, ($locale) => {
  const dict = translations[$locale];
  return (key: string): string => dict[key] ?? key;
});
