import { writable } from 'svelte/store';

export const sessionActive = writable(false);
export const sessionPaused = writable(false);
export const settingsOpen = writable(false);
