import type { UserProfile } from '$lib/stores/onboarding';
import type { SessionPlan } from '$lib/types/session';
import { buildLongTonesExercise } from './longTones';

/** Generate a session plan from the user profile. For now: Long Tones only. */
export function generateSessionPlan(profile: UserProfile): SessionPlan {
  const exercise = buildLongTonesExercise(profile.instrument, profile.experience);

  return {
    exercises: [exercise],
    totalMinutes: profile.minutesPerSession,
  };
}
