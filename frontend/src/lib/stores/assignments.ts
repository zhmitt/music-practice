import { writable, get } from 'svelte/store';
import type { Assignment, AssignmentRecord } from '$lib/types/assignment';

const STORAGE_KEY = 'tt-assignments';

function load(): AssignmentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function save(records: AssignmentRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export const assignments = writable<AssignmentRecord[]>(load());

export function importAssignment(assignment: Assignment) {
  assignments.update(list => {
    // Don't import duplicates
    if (list.some(r => r.assignment.id === assignment.id)) return list;
    const record: AssignmentRecord = {
      assignment,
      importedAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
    };
    const updated = [...list, record];
    save(updated);
    return updated;
  });
}

export function markAssignmentCompleted(assignmentId: string) {
  assignments.update(list => {
    const updated = list.map(r => {
      if (r.assignment.id === assignmentId && !r.completed) {
        return { ...r, completed: true, completedAt: new Date().toISOString() };
      }
      return r;
    });
    save(updated);
    return updated;
  });
}

export function removeAssignment(assignmentId: string) {
  assignments.update(list => {
    const updated = list.filter(r => r.assignment.id !== assignmentId);
    save(updated);
    return updated;
  });
}

/** Parse and validate an assignment JSON file. */
export function parseAssignmentFile(jsonString: string): Assignment | null {
  try {
    const data = JSON.parse(jsonString);
    if (data.version !== '1.0' || !data.id || !data.exercises || !Array.isArray(data.exercises)) {
      return null;
    }
    return data as Assignment;
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

/** Export assignment as downloadable JSON file. */
export function exportAssignment(assignment: Assignment) {
  const blob = new Blob([JSON.stringify(assignment, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `assignment-${assignment.title.replace(/\s+/g, '-').toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
