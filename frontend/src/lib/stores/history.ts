/**
 * Session history persistence.
 *
 * The in-memory array `_history` is the source of truth for all synchronous
 * getter functions.  On app startup `loadHistory()` populates it from SQLite
 * (or the localStorage fallback).  Each `saveSession()` call appends to the
 * in-memory array and immediately persists to the database.
 */

import { writable } from 'svelte/store';
import {
  getAllSessions,
  insertSession,
  reportPersistenceReadFailure,
  type PersistenceResult,
} from '$lib/db';

export interface ToneRecord {
  note: string; // "Bb4"
  avgCents: number;
  stability: number; // std deviation
  passed: boolean;
}

export interface SessionRecord {
  id: string; // ISO timestamp as unique key
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  exerciseType: string; // "long_tones"
  exerciseName: string; // i18n key
  tones: ToneRecord[];
  accuracy: number; // fraction passed (0..1)
  avgCents: number; // average |cent deviation|
}

// ── In-memory store ──

let _history: SessionRecord[] = [];
export const historyVersion = writable(0);

function bumpHistoryVersion() {
  historyVersion.update((value) => value + 1);
}

// ── Async persistence layer ──

/**
 * Load all sessions from SQLite (or localStorage fallback) into memory.
 * Call once during app initialisation.
 */
export async function loadHistory(): Promise<void> {
  try {
    const rows = await getAllSessions();
    _history = rows.map((r) => {
      let tones: ToneRecord[] = [];
      try {
        const parsed = typeof r.tones === 'string' ? JSON.parse(r.tones) : r.tones;
        if (!Array.isArray(parsed)) throw new Error(`Invalid tones for session ${r.id}`);
        tones = parsed.filter(isToneRecord);
        if (tones.length !== parsed.length) {
          reportPersistenceReadFailure(
            new Error(`Rejected ${parsed.length - tones.length} invalid tone record(s)`),
            `session-tones:${r.id}`,
          );
        }
      } catch (error) {
        reportPersistenceReadFailure(error);
      }

      return {
        id: r.id,
        date: r.date,
        durationSeconds: r.durationSeconds,
        exerciseType: r.exerciseType,
        // exerciseName is not stored in the DB; derive a default
        exerciseName: r.exerciseType,
        tones,
        accuracy: r.accuracy,
        avgCents:
          tones.length > 0 ? tones.reduce((s, t) => s + Math.abs(t.avgCents), 0) / tones.length : 0,
      };
    });
    bumpHistoryVersion();
  } catch (error) {
    reportPersistenceReadFailure(error);
    // If persistence is unavailable keep whatever was in memory
  }
}

function isToneRecord(value: unknown): value is ToneRecord {
  if (!value || typeof value !== 'object') return false;
  const tone = value as Partial<ToneRecord>;
  return (
    typeof tone.note === 'string' &&
    tone.note.length > 0 &&
    typeof tone.avgCents === 'number' &&
    Number.isFinite(tone.avgCents) &&
    typeof tone.stability === 'number' &&
    Number.isFinite(tone.stability) &&
    typeof tone.passed === 'boolean'
  );
}

// ── CRUD ──

/**
 * Read the full session history from the in-memory cache.
 *
 * @returns Array of all session records, oldest first.
 */
export function getHistory(): SessionRecord[] {
  return _history;
}

/**
 * Append a session record to the in-memory store and persist it.
 *
 * @param record - Completed session to save.
 */
export async function saveSession(record: SessionRecord): Promise<PersistenceResult> {
  _history.push(record);
  // Keep last 500 sessions max in memory
  if (_history.length > 500) {
    _history = _history.slice(-500);
  }
  bumpHistoryVersion();

  return insertSession({
    id: record.id,
    date: record.date,
    exerciseType: record.exerciseType,
    durationSeconds: record.durationSeconds,
    accuracy: record.accuracy,
    tones: JSON.stringify(record.tones),
  });
}

// ── Derived stats ──

/** Get sessions for a specific date (YYYY-MM-DD). */
export function getSessionsForDate(date: string): SessionRecord[] {
  return getHistory().filter((s) => s.date === date);
}

/** Get sessions within a date range. */
export function getSessionsInRange(from: string, to: string): SessionRecord[] {
  return getHistory().filter((s) => s.date >= from && s.date <= to);
}

/** Today's date as YYYY-MM-DD. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Date string N days ago. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Get the day-of-week index (0=Mon, 6=Sun) for a Date. */
function dayOfWeek(d: Date): number {
  return (d.getDay() + 6) % 7; // JS Sunday=0, we want Monday=0
}

/** Calculate current streak (consecutive days with at least 1 session). */
export function getStreak(): number {
  const history = getHistory();
  if (history.length === 0) return 0;

  // Get unique practice dates, sorted desc
  const dates = [...new Set(history.map((s) => s.date))].sort().reverse();

  const todayStr = today();
  const yesterdayStr = daysAgo(1);

  // Streak must start from today or yesterday
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const expected = daysAgo(dates[0] === todayStr ? i : i + 1);
    if (dates[i] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** Which days of the current week (Mon-Sun) have sessions. Returns boolean[7]. */
export function getWeekDays(): boolean[] {
  const now = new Date();
  const dow = dayOfWeek(now); // 0=Mon
  const result: boolean[] = Array(7).fill(false);

  const history = getHistory();
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - dow);

  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    result[i] = history.some((s) => s.date === dateStr);
  }
  return result;
}

/** Week progress: practiced days / target days. */
export function getWeekProgress(targetDays: number): number {
  const days = getWeekDays();
  const practiced = days.filter(Boolean).length;
  return targetDays > 0 ? Math.min(1, practiced / targetDays) : 0;
}

/** Total practice time this week in minutes. */
export function getWeekMinutes(): number {
  const now = new Date();
  const dow = dayOfWeek(now);
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - dow);
  const mondayStr = mondayDate.toISOString().slice(0, 10);
  const todayStr = today();

  const sessions = getSessionsInRange(mondayStr, todayStr);
  return Math.round(sessions.reduce((s, r) => s + r.durationSeconds, 0) / 60);
}

/** Get per-note averages across all sessions (for weak spots). */
export function getNoteTendencies(
  lastNDays = 30,
): Array<{ note: string; avgCents: number; count: number }> {
  const cutoff = daysAgo(lastNDays);
  const sessions = getHistory().filter((s) => s.date >= cutoff);

  const map = new Map<string, { sum: number; count: number }>();
  for (const session of sessions) {
    for (const tone of session.tones) {
      if (!tone.passed) continue;
      const existing = map.get(tone.note);
      if (existing) {
        existing.sum += tone.avgCents;
        existing.count++;
      } else {
        map.set(tone.note, { sum: tone.avgCents, count: 1 });
      }
    }
  }

  const result: Array<{ note: string; avgCents: number; count: number }> = [];
  for (const [note, val] of map) {
    result.push({ note, avgCents: val.sum / val.count, count: val.count });
  }
  // Sort by absolute deviation descending (worst first)
  result.sort((a, b) => Math.abs(b.avgCents) - Math.abs(a.avgCents));
  return result;
}

/** Last N sessions for the practice diary. */
export function getRecentSessions(n = 20): SessionRecord[] {
  return getHistory().slice(-n).reverse();
}

/** Average accuracy across sessions in last N days. */
export function getAvgAccuracy(lastNDays = 30): number {
  const cutoff = daysAgo(lastNDays);
  const sessions = getHistory().filter((s) => s.date >= cutoff);
  if (sessions.length === 0) return 0;
  return sessions.reduce((s, r) => s + r.accuracy, 0) / sessions.length;
}

/**
 * Get daily aggregates for charting.
 *
 * @param lastNDays - Number of days to include, or null for all time.
 * @returns Array of daily aggregate objects sorted chronologically.
 */
export function getDailyAggregates(lastNDays: number | null): Array<{
  date: string;
  sessions: number;
  minutes: number;
  accuracy: number;
}> {
  const history = getHistory();
  if (history.length === 0) return [];

  const cutoff = lastNDays !== null ? daysAgo(lastNDays) : '0000-00-00';
  const filtered = history.filter((s) => s.date >= cutoff);

  // Group by date
  const map = new Map<string, { sessions: number; totalSeconds: number; accSum: number }>();
  for (const s of filtered) {
    const existing = map.get(s.date);
    if (existing) {
      existing.sessions++;
      existing.totalSeconds += s.durationSeconds;
      existing.accSum += s.accuracy;
    } else {
      map.set(s.date, { sessions: 1, totalSeconds: s.durationSeconds, accSum: s.accuracy });
    }
  }

  const result: Array<{ date: string; sessions: number; minutes: number; accuracy: number }> = [];

  if (lastNDays !== null) {
    // Fill all days in range (no gaps)
    for (let i = lastNDays - 1; i >= 0; i--) {
      const d = daysAgo(i);
      const agg = map.get(d);
      result.push({
        date: d,
        sessions: agg?.sessions ?? 0,
        minutes: agg ? Math.round(agg.totalSeconds / 60) : 0,
        accuracy: agg ? agg.accSum / agg.sessions : 0,
      });
    }
  } else {
    // All time — only dates with data, sorted ascending
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [date, agg] of sorted) {
      result.push({
        date,
        sessions: agg.sessions,
        minutes: Math.round(agg.totalSeconds / 60),
        accuracy: agg.accSum / agg.sessions,
      });
    }
  }

  return result;
}

/**
 * Total sessions count in the given period.
 *
 * @param lastNDays - Number of days to look back, or null for all time.
 * @returns Session count.
 */
export function getSessionCount(lastNDays: number | null): number {
  const cutoff = lastNDays !== null ? daysAgo(lastNDays) : '0000-00-00';
  return getHistory().filter((s) => s.date >= cutoff).length;
}

/**
 * Total practice time in the given period.
 *
 * @param lastNDays - Number of days to look back, or null for all time.
 * @returns Total minutes practiced.
 */
export function getTotalMinutes(lastNDays: number | null): number {
  const cutoff = lastNDays !== null ? daysAgo(lastNDays) : '0000-00-00';
  const sessions = getHistory().filter((s) => s.date >= cutoff);
  return Math.round(sessions.reduce((s, r) => s + r.durationSeconds, 0) / 60);
}
