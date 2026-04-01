/**
 * Store for imported MusicXML pieces, persisted via the kv store.
 */

import { writable } from 'svelte/store';
import type { ExerciseDef } from '$lib/types/session';
import { getKV, setKV } from '$lib/db';

export interface ImportedPiece {
  id: string;
  title: string;
  noteCount: number;
  importedAt: string; // ISO date (YYYY-MM-DD)
  exercise: ExerciseDef;
}

const STORAGE_KEY = 'tt-imported-pieces';

/** Reactive list of all imported pieces. */
export const importedPieces = writable<ImportedPiece[]>([]);

// ── Persistence helpers ──

async function _persist(pieces: ImportedPiece[]): Promise<void> {
  try {
    await setKV(STORAGE_KEY, JSON.stringify(pieces));
  } catch { /* Storage quota exceeded or unavailable — silent fail */ }
}

// ── Initialisation ──

/**
 * Load imported pieces from the kv store and populate the in-memory store.
 * Call once during app initialisation.
 */
export async function loadImportedPieces(): Promise<void> {
  try {
    const raw = await getKV(STORAGE_KEY);
    if (raw) importedPieces.set(JSON.parse(raw) as ImportedPiece[]);
  } catch { /* localStorage unavailable or JSON corrupt — start fresh */ }
}

// ── Mutation API ──

/**
 * Add a newly imported piece to the store and persist it.
 *
 * @param piece - The piece to add.
 */
export function addImportedPiece(piece: ImportedPiece): void {
  importedPieces.update((list) => {
    const updated = [...list, piece];
    _persist(updated);
    return updated;
  });
}

/**
 * Remove a piece by id from the store and persist the change.
 *
 * @param id - The piece id to remove.
 */
export function removeImportedPiece(id: string): void {
  importedPieces.update((list) => {
    const updated = list.filter((p) => p.id !== id);
    _persist(updated);
    return updated;
  });
}
