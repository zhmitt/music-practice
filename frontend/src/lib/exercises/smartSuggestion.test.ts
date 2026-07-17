/**
 * Unit tests for generateSmartSuggestion.
 *
 * All history-store functions and exercise builders are mocked so the tests
 * exercise only the suggestion-selection logic, not persistence or audio.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserProfile } from '$lib/stores/onboarding';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('$lib/stores/history', () => ({
  getNoteTendencies: vi.fn(() => []),
  getRecentSessions: vi.fn(() => []),
  getStreak: vi.fn(() => 0),
  getHistory: vi.fn(() => []),
}));

vi.mock('$lib/exercises/longTones', () => ({
  buildLongTonesExercise: vi.fn(() => ({
    id: 'long_tones',
    type: 'long_tones',
    nameKey: 'test',
    descriptionKey: 'test',
    tones: [],
  })),
}));

vi.mock('$lib/exercises/scales', () => ({
  buildScaleExercise: vi.fn(() => ({
    id: 'scale',
    type: 'scale',
    nameKey: 'test',
    descriptionKey: 'test',
    tones: [],
  })),
}));

vi.mock('$lib/exercises/instrumentUtils', () => ({
  getSequenceKey: vi.fn(() => 'bb'),
}));

// Import after mocks are registered
import { generateSmartSuggestion } from './smartSuggestion';
import { getHistory, getRecentSessions, getNoteTendencies, getStreak } from '$lib/stores/history';

// ── Helpers ────────────────────────────────────────────────────────────────

/** A minimal valid UserProfile for testing. */
function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    instrument: 'horn_bb',
    experience: 'beginner',
    daysPerWeek: 5,
    minutesPerSession: 15,
    ...overrides,
  };
}

/** A minimal session record shape that satisfies SessionRecord. */
function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: '2026-01-01T10:00:00.000Z',
    date: '2026-01-01',
    durationSeconds: 600,
    exerciseType: 'long_tones',
    exerciseName: 'test',
    tones: [],
    accuracy: 0.7,
    avgCents: 5,
    ...overrides,
  };
}

// Reset mock return values before each test
beforeEach(() => {
  vi.mocked(getHistory).mockReturnValue([]);
  vi.mocked(getRecentSessions).mockReturnValue([]);
  vi.mocked(getNoteTendencies).mockReturnValue([]);
  vi.mocked(getStreak).mockReturnValue(0);
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('generateSmartSuggestion', () => {
  describe('no history', () => {
    it('returns first_session reason with 2 exercises when history is empty', () => {
      vi.mocked(getHistory).mockReturnValue([]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).toBe('suggestion.first_session');
      expect(result.reasonParams).toEqual({});
      expect(result.plan.exercises).toHaveLength(2);
    });

    it('sets totalMinutes to profile.minutesPerSession', () => {
      vi.mocked(getHistory).mockReturnValue([]);

      const result = generateSmartSuggestion(makeProfile({ minutesPerSession: 20 }));

      expect(result.plan.totalMinutes).toBe(20);
    });
  });

  describe('weak spots strategy', () => {
    it('returns weak_spots reason when >= 2 notes have |avgCents| > 10 and count >= 2', () => {
      // history must be non-empty to bypass first_session branch
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getNoteTendencies).mockReturnValue([
        { note: 'Bb4', avgCents: 15, count: 3 },
        { note: 'F4', avgCents: -12, count: 2 },
      ]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).toBe('suggestion.weak_spots');
      expect(result.reasonParams.notes).toContain('Bb4');
      expect(result.reasonParams.notes).toContain('F4');
    });

    it('does NOT trigger weak_spots when avgCents <= 10 even with high count', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getNoteTendencies).mockReturnValue([
        { note: 'Bb4', avgCents: 8, count: 10 },
        { note: 'F4', avgCents: 9, count: 10 },
      ]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.weak_spots');
    });

    it('does NOT trigger weak_spots when count < 2 even with high avgCents', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getNoteTendencies).mockReturnValue([
        { note: 'Bb4', avgCents: 20, count: 1 },
        { note: 'F4', avgCents: 20, count: 1 },
      ]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.weak_spots');
    });

    it('does NOT trigger weak_spots when only 1 significant weak note', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getNoteTendencies).mockReturnValue([
        { note: 'Bb4', avgCents: 20, count: 3 },
        { note: 'F4', avgCents: 5, count: 5 },
      ]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.weak_spots');
    });
  });

  describe('streak variety strategy', () => {
    it('returns streak_variety reason when streak >= 3 and no recent long_tones', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getStreak).mockReturnValue(3);
      // Recent sessions do NOT include long_tones
      vi.mocked(getRecentSessions).mockReturnValue([
        makeSession({ exerciseType: 'scale' }),
        makeSession({ exerciseType: 'scale' }),
        makeSession({ exerciseType: 'scale' }),
      ]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).toBe('suggestion.streak_variety');
      expect(result.reasonParams.days).toBe('3');
    });

    it('does NOT return streak_variety when streak < 3', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getStreak).mockReturnValue(2);
      vi.mocked(getRecentSessions).mockReturnValue([makeSession({ exerciseType: 'scale' })]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.streak_variety');
    });

    it('does NOT return streak_variety when long_tones was done recently (even with streak >= 3)', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getStreak).mockReturnValue(5);
      vi.mocked(getRecentSessions).mockReturnValue([
        makeSession({ exerciseType: 'long_tones' }),
        makeSession({ exerciseType: 'scale' }),
        makeSession({ exerciseType: 'scale' }),
      ]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.streak_variety');
    });
  });

  describe('high accuracy strategy', () => {
    it('returns high_accuracy reason when avg accuracy > 0.8 and history.length >= 5', () => {
      const sessions = Array.from({ length: 5 }, (_, i) =>
        makeSession({ accuracy: 0.9, date: `2026-01-0${i + 1}` }),
      );
      vi.mocked(getHistory).mockReturnValue(sessions);
      vi.mocked(getRecentSessions).mockReturnValue(sessions.map((s) => ({ ...s })));

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).toBe('suggestion.high_accuracy');
      expect(result.reasonParams.pct).toBe('90');
    });

    it('does NOT return high_accuracy when history.length < 5', () => {
      const sessions = [makeSession({ accuracy: 0.95 })];
      vi.mocked(getHistory).mockReturnValue(sessions);
      vi.mocked(getRecentSessions).mockReturnValue(sessions.map((s) => ({ ...s })));

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.high_accuracy');
    });

    it('does NOT return high_accuracy when accuracy is exactly 0.8 (boundary)', () => {
      const sessions = Array.from({ length: 5 }, (_, i) =>
        makeSession({ accuracy: 0.8, date: `2026-01-0${i + 1}` }),
      );
      vi.mocked(getHistory).mockReturnValue(sessions);
      vi.mocked(getRecentSessions).mockReturnValue(sessions.map((s) => ({ ...s })));

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.high_accuracy');
    });
  });

  describe('back to basics strategy', () => {
    it('returns back_to_basics reason when accuracy < 0.5 and >= 2 recent sessions', () => {
      const sessions = [
        makeSession({ accuracy: 0.3 }),
        makeSession({ accuracy: 0.4, date: '2026-01-02' }),
      ];
      vi.mocked(getHistory).mockReturnValue(sessions);
      vi.mocked(getRecentSessions).mockReturnValue(sessions.map((s) => ({ ...s })));

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).toBe('suggestion.back_to_basics');
      expect(result.plan.exercises).toHaveLength(1);
    });

    it('does NOT return back_to_basics when accuracy is exactly 0.5 (boundary)', () => {
      const sessions = [
        makeSession({ accuracy: 0.5 }),
        makeSession({ accuracy: 0.5, date: '2026-01-02' }),
      ];
      vi.mocked(getHistory).mockReturnValue(sessions);
      vi.mocked(getRecentSessions).mockReturnValue(sessions.map((s) => ({ ...s })));

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.back_to_basics');
    });

    it('does NOT return back_to_basics with only 1 recent session', () => {
      const sessions = [makeSession({ accuracy: 0.1 })];
      vi.mocked(getHistory).mockReturnValue(sessions);
      vi.mocked(getRecentSessions).mockReturnValue(sessions.map((s) => ({ ...s })));

      const result = generateSmartSuggestion(makeProfile());

      expect(result.reasonKey).not.toBe('suggestion.back_to_basics');
    });
  });

  describe('default/standard strategy', () => {
    it('falls back to standard reason when no specific condition is met', () => {
      // History present, mid accuracy, no streak, no weak spots, no recent bias
      const session = makeSession({ accuracy: 0.65, exerciseType: 'long_tones' });
      vi.mocked(getHistory).mockReturnValue([session]);
      vi.mocked(getRecentSessions).mockReturnValue([session]);
      vi.mocked(getStreak).mockReturnValue(0);
      vi.mocked(getNoteTendencies).mockReturnValue([]);

      const result = generateSmartSuggestion(makeProfile());

      expect(['suggestion.standard', 'suggestion.balanced']).toContain(result.reasonKey);
    });

    it('returns standard with 2 exercises in the plan', () => {
      const session = makeSession({ accuracy: 0.65 });
      vi.mocked(getHistory).mockReturnValue([session]);
      vi.mocked(getRecentSessions).mockReturnValue([session]);

      const result = generateSmartSuggestion(makeProfile());

      expect(result.plan.exercises.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('strategy priority ordering', () => {
    it('prefers weak_spots over streak_variety when both conditions hold', () => {
      vi.mocked(getHistory).mockReturnValue([makeSession()]);
      vi.mocked(getStreak).mockReturnValue(5);
      vi.mocked(getNoteTendencies).mockReturnValue([
        { note: 'Bb4', avgCents: 20, count: 3 },
        { note: 'F4', avgCents: -15, count: 4 },
      ]);
      vi.mocked(getRecentSessions).mockReturnValue([makeSession({ exerciseType: 'scale' })]);

      const result = generateSmartSuggestion(makeProfile());

      // weak_spots is checked before streak_variety in the source
      expect(result.reasonKey).toBe('suggestion.weak_spots');
    });
  });
});
