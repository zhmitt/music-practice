/**
 * Store for imported MusicXML pieces, persisted via the kv store.
 */

import { writable } from 'svelte/store';
import type { ExerciseDef } from '$lib/types/session';
import {
  clearPersistenceFailure,
  getKV,
  reportPersistenceReadFailure,
  setKV,
  type PersistenceResult,
} from '$lib/db';

export interface ImportedPiece {
  id: string;
  title: string;
  noteCount: number;
  importedAt: string; // ISO date (YYYY-MM-DD)
  exercise: ExerciseDef;
}

const STORAGE_KEY = 'tt-imported-pieces';
interface ImportedPiecesEnvelope {
  version: 1;
  records: ImportedPiece[];
}

/** Reactive list of all imported pieces. */
export const importedPieces = writable<ImportedPiece[]>([]);

// ── Persistence helpers ──

async function _persist(pieces: ImportedPiece[]): Promise<PersistenceResult> {
  const envelope: ImportedPiecesEnvelope = { version: 1, records: pieces };
  return setKV(STORAGE_KEY, JSON.stringify(envelope));
}

function isImportedPiece(value: unknown): value is ImportedPiece {
  if (!value || typeof value !== 'object') return false;
  const piece = value as Partial<ImportedPiece>;
  return (
    typeof piece.id === 'string' &&
    piece.id.length > 0 &&
    typeof piece.title === 'string' &&
    piece.title.length > 0 &&
    Number.isInteger(piece.noteCount) &&
    (piece.noteCount ?? -1) >= 0 &&
    isIsoDate(piece.importedAt) &&
    isExercise(piece.exercise) &&
    piece.noteCount === piece.exercise.tones.length
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isExercise(value: unknown): value is ExerciseDef {
  if (!value || typeof value !== 'object') return false;
  const exercise = value as Partial<ExerciseDef>;
  return (
    typeof exercise.id === 'string' &&
    exercise.id.length > 0 &&
    (exercise.type === 'long_tones' || exercise.type === 'scale' || exercise.type === 'custom') &&
    typeof exercise.nameKey === 'string' &&
    exercise.nameKey.length > 0 &&
    typeof exercise.descriptionKey === 'string' &&
    exercise.descriptionKey.length > 0 &&
    Array.isArray(exercise.tones) &&
    exercise.tones.every(
      (tone) =>
        !!tone &&
        typeof tone.note === 'string' &&
        tone.note.length > 0 &&
        Number.isInteger(tone.octave) &&
        Number.isFinite(tone.durationSec) &&
        tone.durationSec > 0,
    )
  );
}

function decodePieces(raw: string): ImportedPiece[] {
  const decoded: unknown = JSON.parse(raw);
  const legacy = Array.isArray(decoded);
  if (
    !legacy &&
    decoded &&
    typeof decoded === 'object' &&
    (decoded as { version?: unknown }).version !== 1
  ) {
    throw new Error(
      `Unsupported imported-pieces version: ${String((decoded as { version?: unknown }).version)}`,
    );
  }
  const records = legacy ? decoded : (decoded as { records?: unknown } | null)?.records;
  if (!Array.isArray(records)) {
    throw new Error('Invalid imported-pieces record');
  }
  const valid = records.filter(isImportedPiece);
  if (valid.length !== records.length) {
    reportPersistenceReadFailure(
      new Error(`Rejected ${records.length - valid.length} invalid imported piece(s)`),
      'imported-pieces:partial-validation',
    );
  }
  if (valid.length === records.length)
    clearPersistenceFailure('imported-pieces:partial-validation');
  return valid;
}

// ── Initialisation ──

/**
 * Load imported pieces from the kv store and populate the in-memory store.
 * Call once during app initialisation.
 */
export async function loadImportedPieces(): Promise<void> {
  try {
    const raw = await getKV(STORAGE_KEY);
    if (raw) importedPieces.set(decodePieces(raw));
    clearPersistenceFailure('imported-pieces:read');
  } catch (error) {
    reportPersistenceReadFailure(error, 'imported-pieces:read');
    importedPieces.set([]);
  }
}

// ── Mutation API ──

/**
 * Add a newly imported piece to the store and persist it.
 *
 * @param piece - The piece to add.
 */
export async function addImportedPiece(piece: ImportedPiece): Promise<PersistenceResult> {
  let updated: ImportedPiece[] = [];
  importedPieces.update((list) => (updated = [...list, piece]));
  return _persist(updated);
}

/**
 * Remove a piece by id from the store and persist the change.
 *
 * @param id - The piece id to remove.
 */
export async function removeImportedPiece(id: string): Promise<PersistenceResult> {
  let updated: ImportedPiece[] = [];
  importedPieces.update((list) => (updated = list.filter((p) => p.id !== id)));
  return _persist(updated);
}
