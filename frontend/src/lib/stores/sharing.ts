/**
 * Student name persistence for progress sharing.
 *
 * The writable store holds the in-memory value for reactive UI.
 * `loadStudentName()` populates it from the kv store on startup.
 * `saveStudentName()` writes both to the store and to the kv store.
 */

import { writable } from 'svelte/store';
import { getKV, setKV } from '$lib/db';

const STORAGE_KEY = 'tt-student-name';

/** Reactive store holding the current student name. */
export const studentName = writable('');

/**
 * Load the student name from the kv store and populate the in-memory store.
 * Call once during app initialisation.
 */
export async function loadStudentName(): Promise<void> {
  try {
    const saved = await getKV(STORAGE_KEY);
    if (saved !== null) studentName.set(saved);
  } catch {
    /* non-fatal */
  }
}

/**
 * Update the student name in the store and persist it to the kv store.
 *
 * @param name - The new student name to save.
 */
export function saveStudentName(name: string): void {
  studentName.set(name);
  setKV(STORAGE_KEY, name).catch(() => {
    /* non-fatal */
  });
}
