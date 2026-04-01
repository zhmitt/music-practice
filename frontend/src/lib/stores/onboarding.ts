/**
 * Onboarding state and user profile persistence.
 *
 * Synchronous Svelte stores drive the UI.  `loadProfile()` and
 * `saveProfile()` provide the async SQLite-backed persistence layer.
 */

import { writable } from 'svelte/store';
import { getKV, setKV, removeKV } from '$lib/db';

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

// ── In-memory cache ──

let _onboardingCompleted = false;
let _profile: UserProfile | null = null;

// ── Async persistence layer ──

/**
 * Load onboarding completion state and user profile from the kv store.
 * Call once during app initialisation.
 */
export async function loadProfile(): Promise<void> {
  try {
    const completed = await getKV('tt-onboarding-completed');
    _onboardingCompleted = completed === 'true';

    const raw = await getKV('tt-user-profile');
    if (raw) _profile = JSON.parse(raw) as UserProfile;
  } catch { /* non-fatal */ }
}

/**
 * Persist the current profile to the kv store.
 *
 * @param profile - Profile to save.
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
  _profile = profile;
  try {
    await setKV('tt-user-profile', JSON.stringify(profile));
  } catch { /* non-fatal */ }
}

// ── Synchronous API (backward-compatible) ──

/**
 * Check if onboarding was completed.
 *
 * Reads from the in-memory cache populated by `loadProfile()`.
 *
 * @returns `true` if onboarding has been completed.
 */
export function checkOnboardingCompleted(): boolean {
  return _onboardingCompleted;
}

/**
 * Mark onboarding as completed and persist the profile.
 *
 * @param profile - The profile collected during onboarding.
 */
export function completeOnboarding(profile: UserProfile): void {
  _onboardingCompleted = true;
  _profile = profile;
  onboardingVisible.set(false);

  // Fire-and-forget async persistence
  Promise.all([
    setKV('tt-onboarding-completed', 'true'),
    setKV('tt-user-profile', JSON.stringify(profile)),
  ]).catch(() => { /* non-fatal */ });
}

/**
 * Get the saved user profile from the in-memory cache.
 *
 * @returns The user profile, or `null` if not yet set.
 */
export function getUserProfile(): UserProfile | null {
  return _profile;
}

/**
 * Clear the onboarding completion flag and profile from the kv store.
 * Used by the data-reset flow.
 */
export async function clearProfile(): Promise<void> {
  _onboardingCompleted = false;
  _profile = null;
  try {
    await removeKV('tt-onboarding-completed');
    await removeKV('tt-user-profile');
  } catch { /* non-fatal */ }
}
