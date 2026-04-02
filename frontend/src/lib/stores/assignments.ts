/**
 * Assignment store — persists the list of imported/created assignments.
 *
 * The Svelte store is the synchronous source of truth for reactive UI.
 * `loadAssignments()` populates it from the kv store on startup.
 * Internal mutations persist back via `_persist()`.
 */

import { writable, get } from 'svelte/store';
import type { Assignment, AssignmentRecord } from '$lib/types/assignment';
import { getKV, setKV } from '$lib/db';

const STORAGE_KEY = 'tt-assignments';

export const assignments = writable<AssignmentRecord[]>([]);

// ── Persistence helpers ──

async function _persist(records: AssignmentRecord[]): Promise<void> {
  try {
    await setKV(STORAGE_KEY, JSON.stringify(records));
  } catch { /* non-fatal */ }
}

// ── Initialisation ──

/**
 * Load assignments from the kv store and populate the in-memory store.
 * Call once during app initialisation.
 */
export async function loadAssignments(): Promise<void> {
  try {
    const raw = await getKV(STORAGE_KEY);
    if (raw) assignments.set(JSON.parse(raw) as AssignmentRecord[]);
  } catch { /* non-fatal */ }
}

// ── Mutation API ──

/**
 * Import an assignment from an external source.
 * Silently ignores duplicates.
 *
 * @param assignment - The assignment to import.
 */
export function importAssignment(assignment: Assignment): void {
  assignments.update(list => {
    if (list.some(r => r.assignment.id === assignment.id)) return list;
    const record: AssignmentRecord = {
      assignment,
      importedAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
    };
    const updated = [...list, record];
    _persist(updated);
    return updated;
  });
}

/**
 * Mark an assignment as completed.
 *
 * @param assignmentId - The assignment to mark complete.
 */
export function markAssignmentCompleted(assignmentId: string): void {
  assignments.update(list => {
    const updated = list.map(r => {
      if (r.assignment.id === assignmentId && !r.completed) {
        return { ...r, completed: true, completedAt: new Date().toISOString() };
      }
      return r;
    });
    _persist(updated);
    return updated;
  });
}

/**
 * Remove an assignment by id.
 *
 * @param assignmentId - The assignment id to remove.
 */
export function removeAssignment(assignmentId: string): void {
  assignments.update(list => {
    const updated = list.filter(r => r.assignment.id !== assignmentId);
    _persist(updated);
    return updated;
  });
}

/** Parse and validate an assignment JSON file. */
export function parseAssignmentFile(jsonString: string): Assignment | null {
  try {
    const data = JSON.parse(jsonString);
    // Structural validation — only accept known-good shapes
    if (
      typeof data !== 'object' || data === null ||
      data.version !== '1.0' ||
      typeof data.id !== 'string' || !data.id ||
      typeof data.teacherName !== 'string' ||
      typeof data.title !== 'string' ||
      !Array.isArray(data.exercises) || data.exercises.length === 0
    ) {
      return null;
    }
    // Validate each exercise has required fields
    for (const ex of data.exercises) {
      if (!ex || typeof ex.type !== 'string' || !Array.isArray(ex.tones)) return null;
      for (const tone of ex.tones) {
        if (!tone || typeof tone.note !== 'string' || typeof tone.octave !== 'number' || typeof tone.durationSec !== 'number') {
          return null;
        }
      }
    }
    // Build a sanitised assignment with only known fields
    return {
      version: data.version,
      id: data.id,
      teacherName: String(data.teacherName),
      title: String(data.title),
      description: String(data.description ?? ''),
      dueDate: typeof data.dueDate === 'string' ? data.dueDate : null,
      exercises: data.exercises.map((ex: Record<string, unknown>) => ({
        type: String(ex.type),
        nameKey: String(ex.nameKey ?? ''),
        descriptionKey: String(ex.descriptionKey ?? ''),
        tones: (ex.tones as Array<Record<string, unknown>>).map(t => ({
          note: String(t.note),
          octave: Number(t.octave),
          durationSec: Number(t.durationSec),
        })),
      })),
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    } as Assignment;
  } catch {
    return null;
  }
}

/** Create a new assignment (teacher mode). */
export function createAssignment(
  teacherName: string,
  title: string,
  description: string,
  dueDate: string | null,
  exercises: Assignment['exercises'],
): Assignment {
  return {
    version: '1.0',
    id: `assignment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    teacherName,
    title,
    description,
    dueDate,
    exercises,
    createdAt: new Date().toISOString(),
  };
}

/** Export assignment as a downloadable JSON file. */
export function exportAssignment(assignment: Assignment): void {
  const blob = new Blob([JSON.stringify(assignment, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `assignment-${assignment.title.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
