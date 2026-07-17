/**
 * Progress report generation and export utilities.
 *
 * Aggregates session history, profile data, and note tendencies into
 * a structured ProgressReport that can be shared with a teacher.
 */

import {
  getHistory,
  getStreak,
  getAvgAccuracy,
  getNoteTendencies,
  getDailyAggregates,
} from '$lib/stores/history';
import { getUserProfile } from '$lib/stores/onboarding';

export interface ProgressReport {
  version: '1.0';
  exportedAt: string;
  studentName: string;
  profile: {
    instrument: string;
    experience: string;
    daysPerWeek: number;
    minutesPerSession: number;
  } | null;
  summary: {
    totalSessions: number;
    totalMinutes: number;
    streak: number;
    avgAccuracy: number; // 0-1
    periodDays: number;
  };
  weakSpots: Array<{ note: string; avgCents: number; count: number }>;
  dailyActivity: Array<{ date: string; sessions: number; minutes: number; accuracy: number }>;
  recentSessions: Array<{
    date: string;
    durationSeconds: number;
    exerciseType: string;
    accuracy: number;
    avgCents: number;
  }>;
}

/**
 * Generate a structured progress report for sharing.
 *
 * @param studentName - Name to embed in the report.
 * @param periodDays - How many days of history to include in summary stats (default 30).
 * @returns A fully-populated ProgressReport.
 */
export function generateProgressReport(studentName: string, periodDays = 30): ProgressReport {
  const history = getHistory();
  const profile = getUserProfile();
  const streak = getStreak();
  const avgAccuracy = getAvgAccuracy(periodDays);
  const weakSpots = getNoteTendencies(periodDays).slice(0, 10);
  const dailyActivity = getDailyAggregates(periodDays);

  const totalMinutes = Math.round(history.reduce((s, r) => s + r.durationSeconds, 0) / 60);

  const recentSessions = history
    .slice(-20)
    .reverse()
    .map((s) => ({
      date: s.date,
      durationSeconds: s.durationSeconds,
      exerciseType: s.exerciseType,
      accuracy: s.accuracy,
      avgCents: s.avgCents,
    }));

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    studentName,
    profile: profile
      ? {
          instrument: profile.instrument,
          experience: profile.experience,
          daysPerWeek: profile.daysPerWeek,
          minutesPerSession: profile.minutesPerSession,
        }
      : null,
    summary: {
      totalSessions: history.length,
      totalMinutes,
      streak,
      avgAccuracy,
      periodDays,
    },
    weakSpots,
    dailyActivity,
    recentSessions,
  };
}

/**
 * Trigger a browser download of the report as a formatted JSON file.
 *
 * @param report - The ProgressReport to serialize and download.
 */
export function exportAsJSON(report: ProgressReport): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tonetrainer-${report.studentName || 'progress'}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
