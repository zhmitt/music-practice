import type { UserProfile } from '$lib/stores/onboarding';
import type { SessionPlan } from '$lib/types/session';
import { buildLongTonesExercise } from './longTones';
import { buildScaleExercise } from './scales';

/** Generate a session plan from the user profile. */
export function generateSessionPlan(profile: UserProfile): SessionPlan {
  const longTones = buildLongTonesExercise(profile.instrument, profile.experience);
  const scale = buildScaleExercise(profile.instrument, profile.experience);

  return {
    exercises: [longTones, scale],
    totalMinutes: profile.minutesPerSession,
  };
}
