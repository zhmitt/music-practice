/**
 * Unit tests for generateProgressReport.
 *
 * History store and onboarding store are fully mocked so tests are
 * deterministic and do not touch localStorage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('$lib/stores/history', () => ({
  getHistory: vi.fn(() => []),
  getStreak: vi.fn(() => 0),
  getAvgAccuracy: vi.fn(() => 0),
  getNoteTendencies: vi.fn(() => []),
  getDailyAggregates: vi.fn(() => []),
}));

vi.mock('$lib/stores/onboarding', () => ({
  getUserProfile: vi.fn(() => null),
}));

// Import after mocks
import { generateProgressReport } from './progressReport';
import {
  getHistory,
  getStreak,
  getAvgAccuracy,
  getNoteTendencies,
  getDailyAggregates,
} from '$lib/stores/history';
import { getUserProfile } from '$lib/stores/onboarding';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: '2026-01-01T10:00:00.000Z',
    date: '2026-01-01',
    durationSeconds: 600,
    exerciseType: 'long_tones',
    exerciseName: 'test',
    tones: [],
    accuracy: 0.75,
    avgCents: 8,
    ...overrides,
  };
}

function makeProfile() {
  return {
    instrument: 'horn_bb' as const,
    experience: 'beginner' as const,
    daysPerWeek: 5,
    minutesPerSession: 15,
  };
}

beforeEach(() => {
  vi.mocked(getHistory).mockReturnValue([]);
  vi.mocked(getStreak).mockReturnValue(0);
  vi.mocked(getAvgAccuracy).mockReturnValue(0);
  vi.mocked(getNoteTendencies).mockReturnValue([]);
  vi.mocked(getDailyAggregates).mockReturnValue([]);
  vi.mocked(getUserProfile).mockReturnValue(null);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('generateProgressReport', () => {
  describe('report structure', () => {
    it('returns a report with version "1.0"', () => {
      const report = generateProgressReport('Alice');
      expect(report.version).toBe('1.0');
    });

    it('embeds studentName in the report', () => {
      const report = generateProgressReport('Bob');
      expect(report.studentName).toBe('Bob');
    });

    it('sets exportedAt to a valid ISO date string', () => {
      const report = generateProgressReport('Alice');
      const d = new Date(report.exportedAt);
      expect(d.toString()).not.toBe('Invalid Date');
    });

    it('includes a summary field', () => {
      const report = generateProgressReport('Alice');
      expect(report).toHaveProperty('summary');
    });

    it('includes a weakSpots field', () => {
      const report = generateProgressReport('Alice');
      expect(report).toHaveProperty('weakSpots');
    });

    it('includes a dailyActivity field', () => {
      const report = generateProgressReport('Alice');
      expect(report).toHaveProperty('dailyActivity');
    });

    it('includes a recentSessions field', () => {
      const report = generateProgressReport('Alice');
      expect(report).toHaveProperty('recentSessions');
    });
  });

  describe('summary field', () => {
    it('has totalSessions matching history length', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession(), makeSession()]);
      const report = generateProgressReport('Alice');
      expect(report.summary.totalSessions).toBe(2);
    });

    it('computes totalMinutes by summing durationSeconds and rounding to minutes', () => {
      vi.mocked(getHistory).mockReturnValue([
        makeSession({ durationSeconds: 90 }),  // 1.5 min
        makeSession({ durationSeconds: 90 }),  // 1.5 min → total 3 min
      ]);
      const report = generateProgressReport('Alice');
      expect(report.summary.totalMinutes).toBe(3);
    });

    it('reflects the streak from getStreak()', () => {
      vi.mocked(getStreak).mockReturnValue(7);
      const report = generateProgressReport('Alice');
      expect(report.summary.streak).toBe(7);
    });

    it('reflects avgAccuracy from getAvgAccuracy()', () => {
      vi.mocked(getAvgAccuracy).mockReturnValue(0.85);
      const report = generateProgressReport('Alice');
      expect(report.summary.avgAccuracy).toBe(0.85);
    });

    it('passes periodDays to summary', () => {
      const report = generateProgressReport('Alice', 60);
      expect(report.summary.periodDays).toBe(60);
    });

    it('defaults periodDays to 30', () => {
      const report = generateProgressReport('Alice');
      expect(report.summary.periodDays).toBe(30);
    });

    it('sets totalSessions to 0 when no history', () => {
      vi.mocked(getHistory).mockReturnValue([]);
      const report = generateProgressReport('Alice');
      expect(report.summary.totalSessions).toBe(0);
      expect(report.summary.totalMinutes).toBe(0);
    });
  });

  describe('profile field', () => {
    it('is null when no profile is saved', () => {
      vi.mocked(getUserProfile).mockReturnValue(null);
      const report = generateProgressReport('Alice');
      expect(report.profile).toBeNull();
    });

    it('includes instrument, experience, daysPerWeek, minutesPerSession from profile', () => {
      vi.mocked(getUserProfile).mockReturnValue(makeProfile());
      const report = generateProgressReport('Alice');

      expect(report.profile).not.toBeNull();
      expect(report.profile!.instrument).toBe('horn_bb');
      expect(report.profile!.experience).toBe('beginner');
      expect(report.profile!.daysPerWeek).toBe(5);
      expect(report.profile!.minutesPerSession).toBe(15);
    });
  });

  describe('weakSpots field', () => {
    it('returns weak spots from getNoteTendencies sliced to 10', () => {
      const tendencies = Array.from({ length: 15 }, (_, i) => ({
        note: `Note${i}`,
        avgCents: i * 2,
        count: i + 1,
      }));
      vi.mocked(getNoteTendencies).mockReturnValue(tendencies);

      const report = generateProgressReport('Alice');

      // Should be at most 10 entries
      expect(report.weakSpots.length).toBeLessThanOrEqual(10);
      expect(report.weakSpots[0].note).toBe('Note0');
    });

    it('returns empty array when no tendencies', () => {
      vi.mocked(getNoteTendencies).mockReturnValue([]);
      const report = generateProgressReport('Alice');
      expect(report.weakSpots).toEqual([]);
    });

    it('each weakSpot has note, avgCents, and count fields', () => {
      vi.mocked(getNoteTendencies).mockReturnValue([
        { note: 'Bb4', avgCents: 15, count: 3 },
      ]);
      const report = generateProgressReport('Alice');

      expect(report.weakSpots[0]).toMatchObject({
        note: 'Bb4',
        avgCents: 15,
        count: 3,
      });
    });
  });

  describe('dailyActivity field', () => {
    it('returns the result of getDailyAggregates', () => {
      const agg = [
        { date: '2026-01-01', sessions: 2, minutes: 30, accuracy: 0.8 },
        { date: '2026-01-02', sessions: 1, minutes: 15, accuracy: 0.9 },
      ];
      vi.mocked(getDailyAggregates).mockReturnValue(agg);

      const report = generateProgressReport('Alice');

      expect(report.dailyActivity).toEqual(agg);
    });

    it('passes periodDays to getDailyAggregates', () => {
      generateProgressReport('Alice', 14);
      expect(vi.mocked(getDailyAggregates)).toHaveBeenCalledWith(14);
    });
  });

  describe('recentSessions field', () => {
    it('returns the last 20 sessions in reverse chronological order', () => {
      // Build 25 sessions with different dates to verify slicing and reversal
      const sessions = Array.from({ length: 25 }, (_, i) =>
        makeSession({ id: `session-${i}`, date: `2026-01-${String(i + 1).padStart(2, '0')}` }),
      );
      vi.mocked(getHistory).mockReturnValue(sessions);

      const report = generateProgressReport('Alice');

      // slice(-20) gives sessions 5..24; .reverse() makes 24 first
      expect(report.recentSessions).toHaveLength(20);
      expect(report.recentSessions[0].date).toBe('2026-01-25');
      expect(report.recentSessions[19].date).toBe('2026-01-06');
    });

    it('each recentSession has the expected fields', () => {
      vi.mocked(getHistory).mockReturnValue([
        makeSession({
          date: '2026-01-01',
          durationSeconds: 600,
          exerciseType: 'long_tones',
          accuracy: 0.8,
          avgCents: 5,
        }),
      ]);

      const report = generateProgressReport('Alice');

      expect(report.recentSessions[0]).toMatchObject({
        date: '2026-01-01',
        durationSeconds: 600,
        exerciseType: 'long_tones',
        accuracy: 0.8,
        avgCents: 5,
      });
    });

    it('returns empty array when no history', () => {
      vi.mocked(getHistory).mockReturnValue([]);
      const report = generateProgressReport('Alice');
      expect(report.recentSessions).toEqual([]);
    });
  });
});
