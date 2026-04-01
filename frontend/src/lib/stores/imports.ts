/**
 * Store for imported MusicXML pieces, persisted in localStorage.
 */

import { writable } from 'svelte/store';
import type { ExerciseDef } from '$lib/types/session';

export interface ImportedPiece {
  id: string;
  title: string;
  noteCount: number;
  importedAt: string; // ISO date (YYYY-MM-DD)
  exercise: ExerciseDef;
}

const STORAGE_KEY = 'tt-imported-pieces';

function loadPieces(): ImportedPiece[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ImportedPiece[];
  } catch {
    // localStorage unavailable or JSON corrupt — start fresh
  }
  return [];
}

function savePieces(pieces: ImportedPiece[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pieces));
  } catch {
    // Storage quota exceeded or unavailable — silent fail
  }
}

/** Reactive list of all imported pieces. */
export const importedPieces = writable<ImportedPiece[]>(loadPieces());

/**
 * Adds a newly imported piece to the store and persists it.
 *
 * @param piece - The piece to add.
 */
export function addImportedPiece(piece: ImportedPiece): void {
  importedPieces.update((list) => {
    const updated = [...list, piece];
    savePieces(updated);
    return updated;
  });
}

/**
 * Removes a piece by id from the store and persists the change.
 *
 * @param id - The piece id to remove.
 */
export function removeImportedPiece(id: string): void {
  importedPieces.update((list) => {
    const updated = list.filter((p) => p.id !== id);
    savePieces(updated);
    return updated;
  });
}
