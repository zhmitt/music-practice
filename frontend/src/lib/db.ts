import { isTauriRuntime } from '$lib/tauri/runtime';
import { writable } from 'svelte/store';

/**
 * Database abstraction layer for ToneTrainer.
 *
 * Uses Tauri's SQLite plugin when running inside Tauri, and falls back to
 * localStorage when running in a plain browser (e.g. `vite dev`).
 *
 * All public functions are async so callers are environment-agnostic.
 */

// ---------------------------------------------------------------------------
// Environment detection
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Safe Tauri invoke wrapper
// ---------------------------------------------------------------------------

/**
 * Safely invoke a Tauri command with typed return value.
 * Logs errors to console instead of silently swallowing them.
 * Returns `fallback` if the call fails or Tauri is not available.
 */
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>,
  fallback?: T,
): Promise<T | undefined> {
  if (!isTauriRuntime()) return fallback;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(command, args);
  } catch (err) {
    console.warn(`[ToneTrainer] invoke '${command}' failed:`, err);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Mirrors the `sessions` DB table / the SessionRecord shape stored in history. */
export interface SessionRecord {
  id: string;
  date: string;
  exerciseType: string;
  durationSeconds: number;
  accuracy: number;
  tones: string; // JSON-serialised ToneRecord[]
  createdAt?: string;
}

export type PersistenceOperation = 'read' | 'set-kv' | 'remove-kv' | 'insert-session' | 'clear-all';

export interface PersistenceFailure {
  ok: false;
  identity: string;
  operation: PersistenceOperation;
  message: string;
  retryable: boolean;
  occurredAt: string;
}

export interface PersistenceSuccess {
  ok: true;
}
export type PersistenceResult = PersistenceSuccess | PersistenceFailure;

export interface PersistenceStatus {
  degraded: boolean;
  failure: PersistenceFailure | null;
  failures: PersistenceFailure[];
  retryAvailable: boolean;
}

export const persistenceStatus = writable<PersistenceStatus>({
  degraded: false,
  failure: null,
  failures: [],
  retryAvailable: false,
});

const pendingRetries = new Map<string, () => Promise<PersistenceResult>>();
const persistenceFailures = new Map<string, PersistenceFailure>();

function failure(
  identity: string,
  operation: PersistenceOperation,
  error: unknown,
): PersistenceFailure {
  return {
    ok: false,
    identity,
    operation,
    message: error instanceof Error ? error.message : String(error),
    retryable: true,
    occurredAt: new Date().toISOString(),
  };
}

function recordResult(
  identity: string,
  result: PersistenceResult,
  retry: () => Promise<PersistenceResult>,
): PersistenceResult {
  if (result.ok) {
    pendingRetries.delete(identity);
    persistenceFailures.delete(identity);
  } else {
    pendingRetries.set(identity, retry);
    persistenceFailures.set(identity, result);
  }
  publishPersistenceStatus();
  return result;
}

function publishPersistenceStatus(): void {
  const failures = [...persistenceFailures.values()];
  persistenceStatus.set({
    degraded: failures.length > 0,
    failure: failures.at(-1) ?? null,
    failures,
    retryAvailable: pendingRetries.size > 0,
  });
}

export async function retryLastPersistence(): Promise<PersistenceResult> {
  const retries = [...pendingRetries.values()];
  if (retries.length === 0) return { ok: true };
  const results = await Promise.all(retries.map((retry) => retry()));
  return results.find((result) => !result.ok) ?? { ok: true };
}

export function reportPersistenceReadFailure(
  error: unknown,
  identity = `read:${error instanceof Error ? error.message : String(error)}`,
): PersistenceFailure {
  const result = failure(identity, 'read', error);
  persistenceFailures.set(identity, result);
  publishPersistenceStatus();
  return result;
}

// ---------------------------------------------------------------------------
// SQLite singleton (Tauri path)
// ---------------------------------------------------------------------------

// We import the type only; the actual module is loaded lazily so it does not
// crash in browser environments where `@tauri-apps/plugin-sql` is absent.
let _db: import('@tauri-apps/plugin-sql').default | null = null;
let _initPromise: Promise<void> | null = null;

async function getDb(): Promise<import('@tauri-apps/plugin-sql').default> {
  if (_db) return _db;
  if (_initPromise) {
    await _initPromise;
    return _db!;
  }

  _initPromise = (async () => {
    const Database = (await import('@tauri-apps/plugin-sql')).default;
    const db = await Database.load('sqlite:tonetrainer.db');

    await db.execute(`
      CREATE TABLE IF NOT EXISTS kv (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id               TEXT PRIMARY KEY,
        date             TEXT NOT NULL,
        exercise_type    TEXT NOT NULL,
        duration_seconds REAL NOT NULL,
        accuracy         REAL NOT NULL,
        tones            TEXT NOT NULL,
        created_at       TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    _db = db;
  })();

  await _initPromise;
  return _db!;
}

// ---------------------------------------------------------------------------
// KV helpers
// ---------------------------------------------------------------------------

/**
 * Read a value from the key-value store.
 *
 * @param key - Storage key.
 * @returns The stored string value, or `null` if not found.
 */
export async function getKV(key: string): Promise<string | null> {
  if (!isTauriRuntime()) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      reportPersistenceReadFailure(error);
      return null;
    }
  }

  try {
    const db = await getDb();
    const rows = await db.select<Array<{ value: string }>>('SELECT value FROM kv WHERE key = ?', [
      key,
    ]);
    return rows.length > 0 ? rows[0].value : null;
  } catch (error) {
    reportPersistenceReadFailure(error, `get-kv:${key}`);
    return null;
  }
}

/**
 * Write a value to the key-value store.
 *
 * @param key - Storage key.
 * @param value - Value to store.
 */
export async function setKV(key: string, value: string): Promise<PersistenceResult> {
  const identity = `set-kv:${key}`;
  const retry = () => setKV(key, value);
  if (!isTauriRuntime()) {
    try {
      localStorage.setItem(key, value);
      return recordResult(identity, { ok: true }, retry);
    } catch (error) {
      return recordResult(identity, failure(identity, 'set-kv', error), retry);
    }
  }
  try {
    const db = await getDb();
    await db.execute(
      'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
    return recordResult(identity, { ok: true }, retry);
  } catch (error) {
    return recordResult(identity, failure(identity, 'set-kv', error), retry);
  }
}

/**
 * Delete a key from the key-value store.
 *
 * @param key - Storage key to remove.
 */
export async function removeKV(key: string): Promise<PersistenceResult> {
  const identity = `remove-kv:${key}`;
  const retry = () => removeKV(key);
  if (!isTauriRuntime()) {
    try {
      localStorage.removeItem(key);
      return recordResult(identity, { ok: true }, retry);
    } catch (error) {
      return recordResult(identity, failure(identity, 'remove-kv', error), retry);
    }
  }
  try {
    const db = await getDb();
    await db.execute('DELETE FROM kv WHERE key = ?', [key]);
    return recordResult(identity, { ok: true }, retry);
  } catch (error) {
    return recordResult(identity, failure(identity, 'remove-kv', error), retry);
  }
}

// ---------------------------------------------------------------------------
// Sessions helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve all session records ordered by date ascending.
 *
 * @returns Array of session records.
 */
export async function getAllSessions(): Promise<SessionRecord[]> {
  if (!isTauriRuntime()) {
    // Browser fallback: read from localStorage kv blob
    try {
      const raw = localStorage.getItem('tt-session-history');
      if (!raw) return [];
      // The localStorage format stores full SessionRecord objects (with tones as array).
      // Wrap them so callers always get the DB-shaped record.
      const decoded: unknown = JSON.parse(raw);
      const parsed = decodeBrowserSessions(decoded);
      return parsed.map((r) => ({
        id: String(r.id ?? ''),
        date: String(r.date ?? ''),
        exerciseType: String(r.exerciseType ?? ''),
        durationSeconds: Number(r.durationSeconds ?? 0),
        accuracy: Number(r.accuracy ?? 0),
        tones: typeof r.tones === 'string' ? r.tones : JSON.stringify(r.tones ?? []),
      }));
    } catch (error) {
      reportPersistenceReadFailure(error);
      return [];
    }
  }

  try {
    const db = await getDb();
    const rows = await db.select<
      Array<{
        id: string;
        date: string;
        exercise_type: string;
        duration_seconds: number;
        accuracy: number;
        tones: string;
        created_at: string;
      }>
    >('SELECT * FROM sessions ORDER BY date ASC, created_at ASC');

    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      exerciseType: r.exercise_type,
      durationSeconds: r.duration_seconds,
      accuracy: r.accuracy,
      tones: r.tones,
      createdAt: r.created_at,
    }));
  } catch (error) {
    reportPersistenceReadFailure(error, 'get-all-sessions');
    return [];
  }
}

/**
 * Insert a single session record.
 *
 * @param record - The session record to persist.
 */
export async function insertSession(record: SessionRecord): Promise<PersistenceResult> {
  const identity = `insert-session:${record.id}`;
  const retry = () => insertSession(record);
  if (!isTauriRuntime()) {
    // Browser fallback: append to localStorage blob
    try {
      const raw = localStorage.getItem('tt-session-history');
      const existing = raw ? decodeBrowserSessions(JSON.parse(raw)) : [];
      // The in-memory history stores full objects; just append
      existing.push({
        id: record.id,
        date: record.date,
        exerciseType: record.exerciseType,
        durationSeconds: record.durationSeconds,
        accuracy: record.accuracy,
        tones: typeof record.tones === 'string' ? JSON.parse(record.tones) : record.tones,
      });
      const trimmed = existing.length > 500 ? existing.slice(-500) : existing;
      localStorage.setItem('tt-session-history', JSON.stringify({ version: 1, records: trimmed }));
      return recordResult(identity, { ok: true }, retry);
    } catch (error) {
      return recordResult(identity, failure(identity, 'insert-session', error), retry);
    }
  }
  try {
    const db = await getDb();
    await db.execute(
      `INSERT OR IGNORE INTO sessions
       (id, date, exercise_type, duration_seconds, accuracy, tones)
     VALUES (?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.date,
        record.exerciseType,
        record.durationSeconds,
        record.accuracy,
        record.tones,
      ],
    );
    return recordResult(identity, { ok: true }, retry);
  } catch (error) {
    return recordResult(identity, failure(identity, 'insert-session', error), retry);
  }
}

function decodeBrowserSessions(value: unknown): Array<Record<string, unknown>> {
  const legacy = Array.isArray(value);
  if (
    !legacy &&
    value &&
    typeof value === 'object' &&
    (value as { version?: unknown }).version !== 1
  ) {
    throw new Error(
      `Unsupported session-history version: ${String((value as { version?: unknown }).version)}`,
    );
  }
  const records = legacy ? value : (value as { records?: unknown } | null)?.records;
  if (!Array.isArray(records)) throw new Error('Invalid session-history record');
  const valid = records.filter(isBrowserSessionRecord);
  if (valid.length !== records.length) {
    reportPersistenceReadFailure(
      new Error(`Rejected ${records.length - valid.length} invalid session record(s)`),
      'session-history:partial-validation',
    );
  }
  return valid;
}

function isBrowserSessionRecord(record: unknown): record is Record<string, unknown> {
  if (!record || typeof record !== 'object') return false;
  const value = record as Record<string, unknown>;
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.exerciseType === 'string' &&
    value.exerciseType.length > 0 &&
    typeof value.durationSeconds === 'number' &&
    Number.isFinite(value.durationSeconds) &&
    value.durationSeconds >= 0 &&
    typeof value.accuracy === 'number' &&
    Number.isFinite(value.accuracy) &&
    value.accuracy >= 0 &&
    value.accuracy <= 1 &&
    Array.isArray(value.tones) &&
    value.tones.every(isToneRecord)
  );
}

function isToneRecord(tone: unknown): boolean {
  if (!tone || typeof tone !== 'object') return false;
  const value = tone as Record<string, unknown>;
  return (
    typeof value.note === 'string' &&
    value.note.length > 0 &&
    typeof value.avgCents === 'number' &&
    Number.isFinite(value.avgCents) &&
    typeof value.stability === 'number' &&
    Number.isFinite(value.stability) &&
    typeof value.passed === 'boolean'
  );
}

/**
 * Delete all application data from both the kv and sessions tables.
 */
export async function clearAllData(): Promise<PersistenceResult> {
  const identity = 'clear-all';
  const retry = () => clearAllData();
  if (!isTauriRuntime()) {
    try {
      // Clear all tt-prefixed keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tt')) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      return recordResult(identity, { ok: true }, retry);
    } catch (error) {
      return recordResult(identity, failure(identity, 'clear-all', error), retry);
    }
  }
  try {
    const db = await getDb();
    await db.execute('DELETE FROM kv');
    await db.execute('DELETE FROM sessions');
    return recordResult(identity, { ok: true }, retry);
  } catch (error) {
    return recordResult(identity, failure(identity, 'clear-all', error), retry);
  }
}

// ---------------------------------------------------------------------------
// Top-level initialiser (called from layout)
// ---------------------------------------------------------------------------

/**
 * Initialise the database connection and ensure schema is ready.
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initDb(): Promise<void> {
  if (!isTauriRuntime()) return; // browser: nothing to initialise
  try {
    await getDb();
  } catch (error) {
    reportPersistenceReadFailure(error, 'db-initialization');
  }
}
