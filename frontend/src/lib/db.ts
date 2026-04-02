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

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

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
  if (!isTauri) return fallback;
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
  if (!isTauri) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  const db = await getDb();
  const rows = await db.select<Array<{ value: string }>>(
    'SELECT value FROM kv WHERE key = ?',
    [key],
  );
  return rows.length > 0 ? rows[0].value : null;
}

/**
 * Write a value to the key-value store.
 *
 * @param key - Storage key.
 * @param value - Value to store.
 */
export async function setKV(key: string, value: string): Promise<void> {
  if (!isTauri) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore quota errors
    }
    return;
  }

  const db = await getDb();
  await db.execute(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

/**
 * Delete a key from the key-value store.
 *
 * @param key - Storage key to remove.
 */
export async function removeKV(key: string): Promise<void> {
  if (!isTauri) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }

  const db = await getDb();
  await db.execute('DELETE FROM kv WHERE key = ?', [key]);
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
  if (!isTauri) {
    // Browser fallback: read from localStorage kv blob
    try {
      const raw = localStorage.getItem('tt-session-history');
      if (!raw) return [];
      // The localStorage format stores full SessionRecord objects (with tones as array).
      // Wrap them so callers always get the DB-shaped record.
      const parsed: Array<Record<string, unknown>> = JSON.parse(raw);
      return parsed.map((r) => ({
        id: String(r.id ?? ''),
        date: String(r.date ?? ''),
        exerciseType: String(r.exerciseType ?? ''),
        durationSeconds: Number(r.durationSeconds ?? 0),
        accuracy: Number(r.accuracy ?? 0),
        tones: typeof r.tones === 'string' ? r.tones : JSON.stringify(r.tones ?? []),
      }));
    } catch {
      return [];
    }
  }

  const db = await getDb();
  const rows = await db.select<Array<{
    id: string;
    date: string;
    exercise_type: string;
    duration_seconds: number;
    accuracy: number;
    tones: string;
    created_at: string;
  }>>('SELECT * FROM sessions ORDER BY date ASC, created_at ASC');

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    exerciseType: r.exercise_type,
    durationSeconds: r.duration_seconds,
    accuracy: r.accuracy,
    tones: r.tones,
    createdAt: r.created_at,
  }));
}

/**
 * Insert a single session record.
 *
 * @param record - The session record to persist.
 */
export async function insertSession(record: SessionRecord): Promise<void> {
  if (!isTauri) {
    // Browser fallback: append to localStorage blob
    try {
      const raw = localStorage.getItem('tt-session-history');
      const existing: unknown[] = raw ? JSON.parse(raw) : [];
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
      localStorage.setItem('tt-session-history', JSON.stringify(trimmed));
    } catch {
      // ignore
    }
    return;
  }

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
}

/**
 * Delete all application data from both the kv and sessions tables.
 */
export async function clearAllData(): Promise<void> {
  if (!isTauri) {
    try {
      // Clear all tt-prefixed keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tt')) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    return;
  }

  const db = await getDb();
  await db.execute('DELETE FROM kv');
  await db.execute('DELETE FROM sessions');
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
  if (!isTauri) return; // browser: nothing to initialise
  await getDb();
}
