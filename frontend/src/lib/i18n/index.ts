/**
 * Internationalisation store.
 *
 * The locale starts with the system default ('de') and is updated once
 * `loadLocale()` resolves the persisted preference from the kv store.
 */

import { writable, derived } from 'svelte/store';
import { getKV, setKV } from '$lib/db';
import en from './en.json';
import de from './de.json';

export type Locale = 'en' | 'de';

const translations: Record<Locale, Record<string, string>> = { en, de };

export const locale = writable<Locale>('de');

export const t = derived(locale, ($locale) => {
  const dict = translations[$locale];
  return (key: string): string => dict[key] ?? key;
});

/**
 * Load the persisted locale from the kv store and update the store.
 * Call once during app initialisation.
 */
export async function loadLocale(): Promise<void> {
  try {
    const saved = await getKV('tt-locale');
    if (saved === 'en' || saved === 'de') locale.set(saved);
  } catch {
    /* ignore — fall back to default */
  }
}

/**
 * Persist a locale change to the kv store and update the reactive store.
 *
 * @param l - The locale to set.
 */
export async function setLocale(l: Locale): Promise<void> {
  locale.set(l);
  try {
    await setKV('tt-locale', l);
  } catch {
    /* non-fatal */
  }
}
