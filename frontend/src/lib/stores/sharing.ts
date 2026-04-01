/**
 * Student name persistence for progress sharing.
 *
 * Provides a writable store backed by localStorage so the name
 * entered in SharePanel survives page reloads.
 */

import { writable } from 'svelte/store';

const STORAGE_KEY = 'tt-student-name';

function loadName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/** Reactive store holding the current student name. */
export const studentName = writable(loadName());

/**
 * Update the student name in the store and persist it to localStorage.
 *
 * @param name - The new student name to save.
 */
export function saveStudentName(name: string): void {
  studentName.set(name);
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}
