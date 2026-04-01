/**
 * Smart Session Suggestions.
 *
 * Analyzes practice history to generate targeted session plans
 * that focus on weak areas, vary exercises, and adapt to the
 * user's progress.
 */
import type { UserProfile } from '$lib/stores/onboarding';
import type { SessionPlan, ToneTarget, ExerciseDef } from '$lib/types/session';
import { getNoteTendencies, getRecentSessions, getStreak, getHistory } from '$lib/stores/history';
import { buildLongTonesExercise } from './longTones';
import { buildScaleExercise } from './scales';
import { getSequenceKey } from './instrumentUtils';

export interface SessionSuggestion {
  plan: SessionPlan;
  /** i18n key for the suggestion reason. */
  reasonKey: string;
  /** Dynamic values for the reason string (e.g. note names). */
  reasonParams: Record<string, string>;
}

// ── Note helpers ──

const NOTE_TO_OCTAVE: Record<string, Array<[string, number]>> = {
  bb: [
    ['Bb', 3], ['C', 4], ['D', 4], ['Eb', 4], ['F', 4], ['G', 4], ['A', 4], ['Bb', 4],
    ['C', 5], ['D', 5], ['Eb', 5], ['F', 5],
  ],
  f: [
    ['F', 3], ['G', 3], ['A', 3], ['Bb', 3], ['C', 4], ['D', 4], ['E', 4], ['F', 4],
    ['G', 4], ['A', 4], ['Bb', 4], ['C', 5],
  ],
  concert: [
    ['Bb', 3], ['C', 4], ['D', 4], ['Eb', 4], ['F', 4], ['G', 4], ['A', 4], ['Bb', 4],
    ['C', 5], ['D', 5], ['Eb', 5], ['F', 5],
  ],
};

/** Build a targeted long-tone exercise focusing on specific weak notes. */
function buildWeakNoteLongTones(
  weakNotes: Array<{ note: string; avgCents: number }>,
  experience: string,
  durationSec: number,
): ExerciseDef {
  const tones: ToneTarget[] = weakNotes.slice(0, 4).map(wn => {
    // Parse "Bb4" → note="Bb", octave=4
    const match = wn.note.match(/^([A-Gb#]+)(\d)$/);
    if (!match) return { note: wn.note, octave: 4, durationSec };
    return { note: match[1], octave: parseInt(match[2]), durationSec };
  });

  return {
    id: 'targeted_long_tones',
    type: 'long_tones',
    nameKey: 'session.exercise_targeted',
    descriptionKey: 'session.hold_tone',
    tones,
  };
}

/** Build a chromatic/range exercise for flexibility. */
function buildFlexibilityExercise(
  instrument: string,
  durationSec: number,
): ExerciseDef {
  const key = getSequenceKey(instrument as any);
  const notes = NOTE_TO_OCTAVE[key] || NOTE_TO_OCTAVE['bb'];

  // Pick alternating low-high notes for flexibility
  const tones: ToneTarget[] = [
    { note: notes[0][0], octave: notes[0][1] as number, durationSec },
    { note: notes[notes.length - 3][0], octave: notes[notes.length - 3][1] as number, durationSec },
    { note: notes[2][0], octave: notes[2][1] as number, durationSec },
    { note: notes[notes.length - 1][0], octave: notes[notes.length - 1][1] as number, durationSec },
  ];

  return {
    id: 'flexibility',
    type: 'long_tones',
    nameKey: 'session.exercise_flexibility',
    descriptionKey: 'session.hold_tone',
    tones,
  };
}

// ── Main suggestion engine ──

export function generateSmartSuggestion(profile: UserProfile): SessionSuggestion {
  const history = getHistory();
  const recentSessions = getRecentSessions(10);
  const weakSpots = getNoteTendencies(14); // last 2 weeks
  const streak = getStreak();

  // No history → default plan
  if (history.length === 0) {
    return {
      plan: {
        exercises: [
          buildLongTonesExercise(profile.instrument, profile.experience),
          buildScaleExercise(profile.instrument, profile.experience),
        ],
        totalMinutes: profile.minutesPerSession,
      },
      reasonKey: 'suggestion.first_session',
      reasonParams: {},
    };
  }

  const dur = profile.experience === 'beginner_new' ? 5
    : profile.experience === 'beginner' ? 6 : 8;

  // Check for significant weak spots (|avgCents| > 10)
  const significantWeak = weakSpots.filter(w => Math.abs(w.avgCents) > 10 && w.count >= 2);

  // Check what we did recently to avoid repetition
  const lastTypes = recentSessions.slice(0, 3).map(s => s.exerciseType);
  const didLongTonesRecently = lastTypes.includes('long_tones');
  const didScaleRecently = lastTypes.includes('scale');

  // Strategy 1: Weak spots detected → targeted practice
  if (significantWeak.length >= 2) {
    const weakNames = significantWeak.slice(0, 3).map(w => w.note).join(', ');
    const targeted = buildWeakNoteLongTones(significantWeak, profile.experience, dur);
    const scale = buildScaleExercise(profile.instrument, profile.experience);

    return {
      plan: { exercises: [targeted, scale], totalMinutes: profile.minutesPerSession },
      reasonKey: 'suggestion.weak_spots',
      reasonParams: { notes: weakNames },
    };
  }

  // Strategy 2: Good streak → reward with variety (flexibility exercise)
  if (streak >= 3 && !didLongTonesRecently) {
    const flex = buildFlexibilityExercise(profile.instrument, dur);
    const scale = buildScaleExercise(profile.instrument, profile.experience);

    return {
      plan: { exercises: [flex, scale], totalMinutes: profile.minutesPerSession },
      reasonKey: 'suggestion.streak_variety',
      reasonParams: { days: String(streak) },
    };
  }

  // Strategy 3: Recent accuracy is high → push to next challenge
  const recentAccuracy = recentSessions.length > 0
    ? recentSessions.reduce((s, r) => s + r.accuracy, 0) / recentSessions.length
    : 0;

  if (recentAccuracy > 0.8 && history.length >= 5) {
    // Suggest scales (more challenging) if we did mostly long tones
    const scale = buildScaleExercise(profile.instrument, profile.experience);
    const longTones = buildLongTonesExercise(profile.instrument, profile.experience);

    return {
      plan: { exercises: [scale, longTones], totalMinutes: profile.minutesPerSession },
      reasonKey: 'suggestion.high_accuracy',
      reasonParams: { pct: String(Math.round(recentAccuracy * 100)) },
    };
  }

  // Strategy 4: Low accuracy → back to basics
  if (recentAccuracy < 0.5 && recentSessions.length >= 2) {
    const longTones = buildLongTonesExercise(profile.instrument, profile.experience);

    return {
      plan: { exercises: [longTones], totalMinutes: profile.minutesPerSession },
      reasonKey: 'suggestion.back_to_basics',
      reasonParams: {},
    };
  }

  // Strategy 5: Default rotation — alternate emphasis
  if (didScaleRecently && !didLongTonesRecently) {
    const longTones = buildLongTonesExercise(profile.instrument, profile.experience);
    const scale = buildScaleExercise(profile.instrument, profile.experience);

    return {
      plan: { exercises: [longTones, scale], totalMinutes: profile.minutesPerSession },
      reasonKey: 'suggestion.balanced',
      reasonParams: {},
    };
  }

  // Fallback: standard plan
  return {
    plan: {
      exercises: [
        buildLongTonesExercise(profile.instrument, profile.experience),
        buildScaleExercise(profile.instrument, profile.experience),
      ],
      totalMinutes: profile.minutesPerSession,
    },
    reasonKey: 'suggestion.standard',
    reasonParams: {},
  };
}
