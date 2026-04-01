import type { ExerciseDef } from './session';

export interface Assignment {
  version: '1.0';
  id: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string | null; // ISO date or null
  exercises: ExerciseDef[];
  createdAt: string; // ISO timestamp
}

export interface AssignmentRecord {
  assignment: Assignment;
  importedAt: string;
  completed: boolean;
  completedAt: string | null;
}
