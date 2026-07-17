import { get, writable } from 'svelte/store';
import { getKV, removeKV, setKV } from '$lib/db';
import { invokeTauri, isTauriRuntime } from '$lib/tauri/runtime';
import { getUserProfile, type Instrument } from '$lib/stores/onboarding';
import type { TauriAudioDeviceInfo } from '$lib/types/tauri';

const STORAGE_KEY = 'tt-microphone-device';

export const microphoneDevices = writable<TauriAudioDeviceInfo[]>([]);
export const selectedMicrophoneDevice = writable<string | null>(null);

export interface AudioAnalysisContext {
  instrument?: Instrument | null;
  tuning?: number;
  displayMode?: 'notated' | 'concert';
}

export type AudioLeaseOwner = 'session' | 'tonelab' | 'playalong' | 'onboarding' | 'settings';
export interface AudioLeaseHandle {
  readonly id: number;
  readonly owner: AudioLeaseOwner;
  readonly generation: number;
}
const activeAudioLeases = new Map<number, AudioLeaseHandle>();
let nextLeaseId = 1;
let audioGeneration = 0;
let audioTransition: Promise<unknown> = Promise.resolve();

function serializeAudioTransition<T>(operation: () => Promise<T>): Promise<T> {
  const next = audioTransition.then(operation, operation);
  audioTransition = next.catch(() => undefined);
  return next;
}

export async function loadAudioPreferences(): Promise<void> {
  const savedDevice = await getKV(STORAGE_KEY);
  selectedMicrophoneDevice.set(savedDevice || null);
  await refreshMicrophoneDevices();
}

export async function refreshMicrophoneDevices(): Promise<TauriAudioDeviceInfo[]> {
  if (!isTauriRuntime()) {
    microphoneDevices.set([]);
    return [];
  }

  try {
    const devices = await invokeTauri('get_devices');
    microphoneDevices.set(devices);

    const selected = get(selectedMicrophoneDevice);
    if (selected && !devices.some((device) => device.device_name === selected)) {
      await setSelectedMicrophoneDevice(null);
    }

    return devices;
  } catch (err) {
    console.warn('[ToneTrainer] failed to load microphone devices:', err);
    microphoneDevices.set([]);
    return [];
  }
}

export async function setSelectedMicrophoneDevice(deviceName: string | null): Promise<void> {
  selectedMicrophoneDevice.set(deviceName);

  if (deviceName) {
    await setKV(STORAGE_KEY, deviceName);
  } else {
    await removeKV(STORAGE_KEY);
  }

  if (activeAudioLeases.size > 0) await restartPreferredAudioCapture();
}

async function resolveAudioAnalysisContext(
  overrides: AudioAnalysisContext = {},
): Promise<Required<AudioAnalysisContext>> {
  const profile = getUserProfile();
  const savedTuning = await getKV('tt-tuning');
  const savedDisplayMode = await getKV('tt-display-mode');
  const parsedTuning = savedTuning ? parseInt(savedTuning, 10) : 442;

  return {
    instrument: overrides.instrument ?? profile?.instrument ?? 'horn_bb',
    tuning: overrides.tuning ?? (Number.isFinite(parsedTuning) ? parsedTuning : 442),
    displayMode: overrides.displayMode ?? (savedDisplayMode === 'concert' ? 'concert' : 'notated'),
  };
}

export async function syncAudioAnalysisContext(
  overrides: AudioAnalysisContext = {},
): Promise<boolean> {
  if (!isTauriRuntime()) {
    return false;
  }

  try {
    const context = await resolveAudioAnalysisContext(overrides);

    await Promise.all([
      invokeTauri('set_reference_tuning', { hz: context.tuning }),
      invokeTauri('set_display_mode', { mode: context.displayMode }),
      invokeTauri('set_instrument_profile', { profileName: context.instrument ?? 'horn_bb' }),
    ]);

    return true;
  } catch (err) {
    console.warn('[ToneTrainer] failed to sync audio analysis context:', err);
    return false;
  }
}

export async function ensureMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return true;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) {
      track.stop();
    }
    return true;
  } catch (err) {
    console.warn('[ToneTrainer] microphone permission request failed:', err);
    return false;
  }
}

export async function startPreferredAudioCapture(
  context: AudioAnalysisContext = {},
): Promise<boolean> {
  const accessGranted = await ensureMicrophonePermission();
  if (!accessGranted || !isTauriRuntime()) {
    return false;
  }

  try {
    const alreadyRunning = await invokeTauri('is_audio_running');
    const deviceName = get(selectedMicrophoneDevice);

    if (!alreadyRunning) {
      await invokeTauri('start_audio', { deviceName: deviceName || null });
    }

    await syncAudioAnalysisContext(context);
    return true;
  } catch (err) {
    console.warn('[ToneTrainer] failed to start audio capture:', err);
    return false;
  }
}

export async function acquireAudioLease(
  owner: AudioLeaseOwner,
  context: AudioAnalysisContext = {},
): Promise<AudioLeaseHandle | null> {
  return serializeAudioTransition(async () => {
    const started =
      activeAudioLeases.size > 0
        ? await syncAudioAnalysisContext(context)
        : await startPreferredAudioCapture(context);
    if (!started) return null;
    const handle = { id: nextLeaseId++, owner, generation: audioGeneration };
    activeAudioLeases.set(handle.id, handle);
    return handle;
  });
}

export async function releaseAudioLease(handle: AudioLeaseHandle): Promise<boolean> {
  return serializeAudioTransition(async () => {
    const released = activeAudioLeases.delete(handle.id);
    if (!released || activeAudioLeases.size > 0) return true;
    if (!isTauriRuntime()) return true;
    try {
      await invokeTauri('stop_audio');
      return true;
    } catch (err) {
      console.warn('[ToneTrainer] failed to stop audio capture:', err);
      return false;
    }
  });
}

export function hasAudioLease(owner: AudioLeaseOwner): boolean {
  return [...activeAudioLeases.values()].some((lease) => lease.owner === owner);
}

export async function restartPreferredAudioCapture(
  context: AudioAnalysisContext = {},
): Promise<boolean> {
  return serializeAudioTransition(async () => {
    const accessGranted = await ensureMicrophonePermission();
    if (!accessGranted || !isTauriRuntime()) return false;
    try {
      const deviceName = get(selectedMicrophoneDevice);
      await invokeTauri('stop_audio');
      await invokeTauri('start_audio', { deviceName: deviceName || null });
      audioGeneration++;
      await syncAudioAnalysisContext(context);
      return true;
    } catch (err) {
      console.warn('[ToneTrainer] failed to restart audio capture:', err);
      return false;
    }
  });
}
