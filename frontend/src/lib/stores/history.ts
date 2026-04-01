/**
 * Session history persistence (localStorage).
 * Stores completed session records and provides derived stats
 * for dashboard (streak, week progress) and progress view.
 */

export interface ToneRecord {
  note: string;       // "Bb4"
  avgCents: number;
  stability: number;  // std deviation
  passed: boolean;
}

export interface SessionRecord {
  id: string;              // ISO timestamp as unique key
  date: string;            // YYYY-MM-DD
  durationSeconds: number;
  exerciseType: string;    // "long_tones"
  exerciseName: string;    // i18n key
  tones: ToneRecord[];
  accuracy: number;        // fraction passed (0..1)
  avgCents: number;        // average |cent deviation|
}

const STORAGE_KEY = 'tt-session-history';

// ── CRUD ──

export function getHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveSession(record: SessionRecord) {
  const history = getHistory();
  history.push(record);
  // Keep last 500 sessions max
  const trimmed = history.length > 500 ? history.slice(-500) : history;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

// ── Derived stats ──

/** Get sessions for a specific date (YYYY-MM-DD). */
export function getSessionsForDate(date: string): SessionRecord[] {
  return getHistory().filter(s => s.date === date);
}

/** Get sessions within a date range. */
export function getSessionsInRange(from: string, to: string): SessionRecord[] {
  return getHistory().filter(s => s.date >= from && s.date <= to);
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
  const dates = [...new Set(history.map(s => s.date))].sort().reverse();

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
    result[i] = history.some(s => s.date === dateStr);
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
export function getNoteTendencies(lastNDays = 30): Array<{ note: string; avgCents: number; count: number }> {
  const cutoff = daysAgo(lastNDays);
  const sessions = getHistory().filter(s => s.date >= cutoff);

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
  const sessions = getHistory().filter(s => s.date >= cutoff);
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
  const filtered = history.filter(s => s.date >= cutoff);

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
  return getHistory().filter(s => s.date >= cutoff).length;
}

/**
 * Total practice time in the given period.
 *
 * @param lastNDays - Number of days to look back, or null for all time.
 * @returns Total minutes practiced.
 */
export function getTotalMinutes(lastNDays: number | null): number {
  const cutoff = lastNDays !== null ? daysAgo(lastNDays) : '0000-00-00';
  const sessions = getHistory().filter(s => s.date >= cutoff);
  return Math.round(sessions.reduce((s, r) => s + r.durationSeconds, 0) / 60);
}
