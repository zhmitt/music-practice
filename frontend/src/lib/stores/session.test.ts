/**
 * Session store unit tests.
 *
 * Tests the synchronous logic: helpers, state transitions, skip, advance,
 * repeat, pause, persistence. The async tick() is tested via direct
 * function calls with mocked Tauri.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// ── Mocks ──

const { mockSafeInvoke, mockAcquireLease, mockReleaseLease } = vi.hoisted(() => ({
  mockSafeInvoke: vi.fn(async (_command?: string): Promise<unknown> => undefined),
  mockAcquireLease: vi.fn(),
  mockReleaseLease: vi.fn(async () => true),
}));
vi.mock('$lib/db', () => ({ safeInvoke: mockSafeInvoke }));

vi.mock('./audioPreferences', () => ({
  acquireAudioLease: mockAcquireLease,
  releaseAudioLease: mockReleaseLease,
}));

vi.mock('./navigation', async () => {
  const { writable } = await import('svelte/store');
  return {
    sessionActive: writable(false),
    sessionPaused: writable(false),
  };
});

const mockSaveSession = vi.fn();
vi.mock('./history', () => ({
  saveSession: (...args: unknown[]) => mockSaveSession(...args),
  today: () => '2026-04-02',
}));

import type { SessionPlan, ExerciseDef } from '$lib/types/session';
import {
  completedExercises,
  sessionPlan,
  exerciseIndex,
  toneIndex,
  tonePhase,
  sessionPhase,
  toneResults,
  currentCents,
  currentNote,
  elapsedSeconds,
  getCurrentExercise,
  getCurrentTone,
  getOverallProgress,
  startSession,
  stopSession,
  togglePause,
  skipTone,
  nextExercise,
  repeatExercise,
} from './session';
import { sessionActive, sessionPaused } from './navigation';

// ── Test fixtures ──

function makeTone(note: string, octave: number, dur = 5) {
  return { note, octave, durationSec: dur };
}

function makeExercise(id: string, tones: ReturnType<typeof makeTone>[]): ExerciseDef {
  return { id, type: 'long_tones', nameKey: `ex.${id}`, descriptionKey: 'desc', tones };
}

function makePlan(exercises: ExerciseDef[]): SessionPlan {
  return { exercises, totalMinutes: 15 };
}

const SIMPLE_PLAN = makePlan([
  makeExercise('lt', [makeTone('Bb', 4), makeTone('C', 5)]),
  makeExercise('sc', [makeTone('D', 4), makeTone('Eb', 4), makeTone('F', 4)]),
]);

// ── Helpers ──

/** Reset all stores to a clean pre-session state. */
async function startFresh(plan: SessionPlan = SIMPLE_PLAN) {
  await startSession(plan);
  // Clear timers that startSession creates (we test synchronous logic)
  vi.clearAllTimers();
}

// ── Tests ──

describe('Session store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSaveSession.mockClear();
    mockSafeInvoke.mockReset();
    mockSafeInvoke.mockResolvedValue(undefined);
    mockAcquireLease.mockReset();
    mockAcquireLease.mockResolvedValue({ id: 1, owner: 'session', generation: 0 });
    mockReleaseLease.mockClear();
  });

  afterEach(async () => {
    // Clean up any running session
    try {
      await stopSession();
    } catch {
      /* ok */
    }
    vi.useRealTimers();
  });

  // ────────────────────────────────────────────
  // Derived helpers
  // ────────────────────────────────────────────

  describe('getCurrentExercise / getCurrentTone', () => {
    it('returns null when no plan is set', () => {
      sessionPlan.set(null);
      expect(getCurrentExercise()).toBeNull();
      expect(getCurrentTone()).toBeNull();
    });

    it('returns the correct exercise and tone', async () => {
      await startFresh();
      expect(getCurrentExercise()?.id).toBe('lt');
      expect(getCurrentTone()?.note).toBe('Bb');
    });

    it('returns second tone after advancing toneIndex', async () => {
      await startFresh();
      toneIndex.set(1);
      expect(getCurrentTone()?.note).toBe('C');
      expect(getCurrentTone()?.octave).toBe(5);
    });

    it('returns second exercise after advancing exerciseIndex', async () => {
      await startFresh();
      exerciseIndex.set(1);
      toneIndex.set(0);
      expect(getCurrentExercise()?.id).toBe('sc');
      expect(getCurrentTone()?.note).toBe('D');
    });

    it('returns null for out-of-range index', async () => {
      await startFresh();
      exerciseIndex.set(99);
      expect(getCurrentExercise()).toBeNull();
      expect(getCurrentTone()).toBeNull();
    });
  });

  describe('getOverallProgress', () => {
    it('returns 0 with no plan', () => {
      sessionPlan.set(null);
      expect(getOverallProgress()).toBe(0);
    });

    it('returns 0 at start', async () => {
      await startFresh();
      expect(getOverallProgress()).toBe(0);
    });

    it('returns correct progress mid-session', async () => {
      await startFresh();
      // First exercise has 2 tones, second has 3. Total = 5.
      toneIndex.set(1); // done 1 of exercise 0
      expect(getOverallProgress()).toBeCloseTo(1 / 5);
    });

    it('returns correct progress in second exercise', async () => {
      await startFresh();
      exerciseIndex.set(1);
      toneIndex.set(1);
      // exercise 0 had 2 tones (all done) + 1 of exercise 1 = 3/5
      expect(getOverallProgress()).toBeCloseTo(3 / 5);
    });

    it('handles empty exercises', () => {
      const emptyPlan = makePlan([makeExercise('empty', [])]);
      sessionPlan.set(emptyPlan);
      exerciseIndex.set(0);
      toneIndex.set(0);
      expect(getOverallProgress()).toBe(0);
    });
  });

  // ────────────────────────────────────────────
  // Session lifecycle
  // ────────────────────────────────────────────

  describe('startSession', () => {
    it('resets all state', async () => {
      // Dirty some state first
      toneIndex.set(5);
      tonePhase.set('held');
      sessionPhase.set('completed');
      toneResults.set([
        {
          target: makeTone('X', 1),
          avgCents: 99,
          stability: 99,
          durationHeld: 99,
          centsSamples: [],
          passed: true,
        },
      ]);

      await startFresh();

      expect(get(exerciseIndex)).toBe(0);
      expect(get(toneIndex)).toBe(0);
      expect(get(tonePhase)).toBe('waiting');
      expect(get(sessionPhase)).toBe('running');
      expect(get(toneResults)).toEqual([]);
      expect(get(currentCents)).toBe(0);
      expect(get(currentNote)).toBe('');
      expect(get(elapsedSeconds)).toBe(0);
    });

    it('activates session overlay', async () => {
      await startFresh();
      expect(get(sessionActive)).toBe(true);
      expect(get(sessionPaused)).toBe(false);
    });

    it('keeps delayed polling single-flight', async () => {
      let active = 0;
      let peak = 0;
      mockSafeInvoke.mockImplementation(async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 150));
        active--;
        return undefined;
      });
      await startSession(SIMPLE_PLAN);
      await vi.advanceTimersByTimeAsync(500);
      expect(peak).toBe(2); // pitch + level in one tick, never a second tick in parallel
    });

    it('does not let stale auto-advance mutate a restarted session', async () => {
      mockSafeInvoke.mockImplementation(async (command?: string) => {
        if (command === 'get_pitch') {
          return {
            frequency_hz: 466.16,
            note_name: 'Bb',
            octave: 4,
            cent_deviation: 0,
            confidence: 1,
          };
        }
        return { rms: 0.2, peak: 0.3, is_clipping: false };
      });
      const shortPlan = makePlan([makeExercise('short', [makeTone('Bb', 4, 0.05)])]);
      await startSession(shortPlan);
      for (let i = 0; i < 30 && get(toneResults).length === 0; i++) {
        await vi.advanceTimersByTimeAsync(50);
      }
      expect(get(toneResults)).toHaveLength(1);
      await stopSession();
      await startSession(SIMPLE_PLAN);
      await vi.advanceTimersByTimeAsync(600);
      expect(get(toneIndex)).toBe(0);
    });
  });

  describe('stopSession', () => {
    it('disposes an acquisition that resolves after stop', async () => {
      let resolveAcquire!: (value: { id: number; owner: 'session'; generation: number }) => void;
      mockAcquireLease.mockReturnValue(
        new Promise((resolve) => {
          resolveAcquire = resolve;
        }),
      );
      const starting = startSession(SIMPLE_PLAN);
      await stopSession();
      const lateLease = { id: 7, owner: 'session' as const, generation: 0 };
      resolveAcquire(lateLease);
      await starting;
      expect(mockReleaseLease).toHaveBeenCalledWith(lateLease);
      expect(get(sessionActive)).toBe(false);
    });

    it('deactivates session and sets completed', async () => {
      await startFresh();
      await stopSession();
      expect(get(sessionActive)).toBe(false);
      expect(get(sessionPaused)).toBe(false);
      expect(get(sessionPhase)).toBe('completed');
    });

    it('persists results on stop', async () => {
      await startFresh();
      // Simulate a completed tone
      toneResults.set([
        {
          target: makeTone('Bb', 4),
          avgCents: 3.2,
          stability: 1.5,
          durationHeld: 5,
          centsSamples: [2, 3, 4],
          passed: true,
        },
      ]);
      await stopSession();
      expect(mockSaveSession).toHaveBeenCalledTimes(1);
      const record = mockSaveSession.mock.calls[0][0];
      expect(record.accuracy).toBe(1); // 1/1 passed
      expect(record.exerciseType).toBe('long_tones');
      expect(record.tones[0].note).toBe('Bb4');
    });

    it('persists archived and current exercise results together', async () => {
      const mixedPlan = makePlan([
        SIMPLE_PLAN.exercises[0],
        { ...SIMPLE_PLAN.exercises[1], type: 'scale' },
      ]);
      await startFresh(mixedPlan);
      completedExercises.set([
        {
          exercise: mixedPlan.exercises[0],
          results: [
            {
              target: makeTone('Bb', 4),
              avgCents: 2,
              stability: 1,
              durationHeld: 5,
              centsSamples: [],
              passed: true,
            },
            {
              target: makeTone('C', 5),
              avgCents: -6,
              stability: 2,
              durationHeld: 5,
              centsSamples: [],
              passed: false,
            },
          ],
        },
      ]);
      exerciseIndex.set(1);
      toneResults.set([
        {
          target: makeTone('D', 4),
          avgCents: 4,
          stability: 1.5,
          durationHeld: 5,
          centsSamples: [],
          passed: true,
        },
      ]);

      await stopSession();

      const record = mockSaveSession.mock.calls[0][0];
      expect(record.exerciseType).toBe('mixed');
      expect(record.tones.map((tone: { note: string }) => tone.note)).toEqual(['Bb4', 'C5', 'D4']);
      expect(record.accuracy).toBeCloseTo(2 / 3);
    });

    it('does not persist when no results', async () => {
      await startFresh();
      await stopSession();
      expect(mockSaveSession).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────
  // Pause / Resume
  // ────────────────────────────────────────────

  describe('togglePause', () => {
    it('pauses a running session', async () => {
      await startFresh();
      togglePause();
      expect(get(sessionPaused)).toBe(true);
      expect(get(sessionPhase)).toBe('paused');
    });

    it('resumes a paused session', async () => {
      await startFresh();
      togglePause(); // pause
      togglePause(); // resume
      expect(get(sessionPaused)).toBe(false);
      expect(get(sessionPhase)).toBe('running');
    });
  });

  // ────────────────────────────────────────────
  // Skip tone
  // ────────────────────────────────────────────

  describe('skipTone', () => {
    it('records a failed result and advances', async () => {
      await startFresh();
      skipTone();
      const results = get(toneResults);
      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
      expect(results[0].target.note).toBe('Bb');
      // Should advance to next tone
      expect(get(toneIndex)).toBe(1);
    });

    it('skipping all tones in exercise triggers between_exercises', async () => {
      await startFresh();
      skipTone(); // Bb4
      skipTone(); // C5 — last tone in exercise 0
      expect(get(sessionPhase)).toBe('between_exercises');
      expect(get(toneResults)).toHaveLength(2);
    });

    it('does nothing when no current tone', async () => {
      await startFresh();
      exerciseIndex.set(99); // out of range
      skipTone();
      expect(get(toneResults)).toEqual([]);
    });
  });

  // ────────────────────────────────────────────
  // Exercise navigation
  // ────────────────────────────────────────────

  describe('nextExercise', () => {
    it('advances to the next exercise', async () => {
      await startFresh();
      toneResults.set([
        {
          target: makeTone('Bb', 4),
          avgCents: 1,
          stability: 1,
          durationHeld: 5,
          centsSamples: [],
          passed: true,
        },
      ]);
      nextExercise();
      expect(get(exerciseIndex)).toBe(1);
      expect(get(toneIndex)).toBe(0);
      expect(get(tonePhase)).toBe('waiting');
      expect(get(sessionPhase)).toBe('running');
      expect(get(toneResults)).toEqual([]);
      expect(get(completedExercises)).toHaveLength(1);
    });

    it('completes session when no more exercises', async () => {
      await startFresh();
      exerciseIndex.set(1); // already on last exercise
      nextExercise();
      expect(get(sessionPhase)).toBe('completed');
    });

    it('does nothing without a plan', async () => {
      sessionPlan.set(null);
      exerciseIndex.set(0);
      nextExercise(); // should not throw
      expect(get(exerciseIndex)).toBe(0);
    });
  });

  describe('repeatExercise', () => {
    it('resets tone index and results', async () => {
      await startFresh();
      toneIndex.set(1);
      toneResults.set([
        {
          target: makeTone('Bb', 4),
          avgCents: 0,
          stability: 0,
          durationHeld: 5,
          centsSamples: [],
          passed: true,
        },
      ]);
      repeatExercise();
      expect(get(toneIndex)).toBe(0);
      expect(get(toneResults)).toEqual([]);
      expect(get(tonePhase)).toBe('waiting');
      expect(get(sessionPhase)).toBe('running');
    });
  });

  // ────────────────────────────────────────────
  // Persistence: accuracy calculation
  // ────────────────────────────────────────────

  describe('persistSessionResults', () => {
    it('computes accuracy as passed/total', async () => {
      await startFresh();
      toneResults.set([
        {
          target: makeTone('Bb', 4),
          avgCents: 2,
          stability: 1,
          durationHeld: 5,
          centsSamples: [],
          passed: true,
        },
        {
          target: makeTone('C', 5),
          avgCents: 0,
          stability: 0,
          durationHeld: 0,
          centsSamples: [],
          passed: false,
        },
      ]);
      await stopSession();
      const record = mockSaveSession.mock.calls[0][0];
      expect(record.accuracy).toBe(0.5); // 1 of 2 passed
    });

    it('computes avgCents as mean of absolute values', async () => {
      await startFresh();
      toneResults.set([
        {
          target: makeTone('Bb', 4),
          avgCents: -8,
          stability: 1,
          durationHeld: 5,
          centsSamples: [],
          passed: true,
        },
        {
          target: makeTone('C', 5),
          avgCents: 4,
          stability: 1,
          durationHeld: 5,
          centsSamples: [],
          passed: true,
        },
      ]);
      await stopSession();
      const record = mockSaveSession.mock.calls[0][0];
      expect(record.avgCents).toBe(6); // (8 + 4) / 2
    });

    it('stores tone notes as "NoteName+Octave" strings', async () => {
      await startFresh();
      toneResults.set([
        {
          target: makeTone('Eb', 4),
          avgCents: 1,
          stability: 0.5,
          durationHeld: 5,
          centsSamples: [],
          passed: true,
        },
      ]);
      await stopSession();
      const record = mockSaveSession.mock.calls[0][0];
      expect(record.tones[0].note).toBe('Eb4');
    });
  });

  // ────────────────────────────────────────────
  // Multi-exercise flow
  // ────────────────────────────────────────────

  describe('full session flow', () => {
    it('skip all → next exercise → skip all → next exercise → completed', async () => {
      await startFresh();

      // Exercise 0: skip 2 tones
      skipTone();
      skipTone();
      expect(get(sessionPhase)).toBe('between_exercises');

      // Move to exercise 1
      nextExercise();
      expect(get(exerciseIndex)).toBe(1);
      expect(get(sessionPhase)).toBe('running');

      // Exercise 1: skip 3 tones
      skipTone();
      skipTone();
      skipTone();
      expect(get(sessionPhase)).toBe('completed');
    });

    it('repeat resets within same exercise', async () => {
      await startFresh();
      skipTone(); // advance to tone 1
      expect(get(toneIndex)).toBe(1);

      repeatExercise();
      expect(get(toneIndex)).toBe(0);
      expect(get(toneResults)).toEqual([]);
    });
  });
});
