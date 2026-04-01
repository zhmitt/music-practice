import { writable } from 'svelte/store';

export type Instrument = 'horn_bb' | 'horn_f' | 'double_horn' | 'trumpet_bb' | 'clarinet_bb' | 'flute' | 'trombone' | 'oboe';
export type ExperienceLevel = 'beginner_new' | 'beginner' | 'intermediate' | 'experienced';

export interface UserProfile {
  instrument: Instrument;
  experience: ExperienceLevel;
  daysPerWeek: number;
  minutesPerSession: number;
}

export const onboardingVisible = writable(false);
export const onboardingStep = writable(1);

export const selectedInstrument = writable<Instrument>('horn_bb');
export const selectedExperience = writable<ExperienceLevel>('beginner');
export const selectedDays = writable(5);
export const selectedMinutes = writable(15);

export const micGranted = writable(false);
export const micDenied = writable(false);
export const toneDetected = writable(false);

/** Check if onboarding was completed (from localStorage for now, SQLite later). */
export function checkOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem('tt-onboarding-completed') === 'true';
  } catch {
    return false;
  }
}

/** Mark onboarding as completed and persist profile. */
export function completeOnboarding(profile: UserProfile) {
  try {
    localStorage.setItem('tt-onboarding-completed', 'true');
    localStorage.setItem('tt-user-profile', JSON.stringify(profile));
  } catch {
    // ignore
  }
  onboardingVisible.set(false);
}

/** Get saved user profile. */
export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem('tt-user-profile');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}
