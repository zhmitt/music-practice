import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('$lib/tauri/runtime', () => ({ isTauriRuntime: () => true, invokeTauri: invoke }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));
vi.mock('$lib/db', () => ({
  getKV: vi.fn(async () => null),
  setKV: vi.fn(async () => ({ ok: true })),
  removeKV: vi.fn(async () => ({ ok: true })),
}));
vi.mock('./onboarding', () => ({ getUserProfile: () => null }));

import {
  acquireAudioLease,
  releaseAudioLease,
  restartPreferredAudioCapture,
} from './audioPreferences';

describe('audio leases', () => {
  beforeEach(() => {
    invoke.mockReset();
    invoke.mockImplementation(async (command: string) =>
      command === 'is_audio_running' ? false : undefined,
    );
  });

  it('keeps capture running until the final named owner releases it', async () => {
    const sessionLease = await acquireAudioLease('session');
    const toneLabLease = await acquireAudioLease('tonelab');
    expect(sessionLease).toMatchObject({ owner: 'session', generation: 0 });
    expect(toneLabLease).toMatchObject({ owner: 'tonelab', generation: 0 });
    await releaseAudioLease(sessionLease!);
    expect(invoke).not.toHaveBeenCalledWith('stop_audio');
    await releaseAudioLease(toneLabLease!);
    expect(invoke).toHaveBeenCalledWith('stop_audio');
    expect(invoke.mock.calls.filter(([command]) => command === 'start_audio')).toHaveLength(1);
  });

  it('is idempotent when the same handle is disposed twice', async () => {
    const lease = await acquireAudioLease('session');
    expect(invoke.mock.calls.filter(([command]) => command === 'start_audio')).toHaveLength(1);
    await releaseAudioLease(lease!);
    await releaseAudioLease(lease!);
    expect(invoke.mock.calls.filter(([command]) => command === 'stop_audio')).toHaveLength(1);
  });

  it('serializes device restart with concurrent lease transitions', async () => {
    const first = await acquireAudioLease('session');
    const restart = restartPreferredAudioCapture();
    const acquiring = acquireAudioLease('tonelab');
    const second = await acquiring;
    await restart;
    expect(second?.generation).toBeGreaterThan(first?.generation ?? -1);
    const stopIndex = invoke.mock.calls.findIndex(([command]) => command === 'stop_audio');
    const startIndexes = invoke.mock.calls
      .map(([command], index) => (command === 'start_audio' ? index : -1))
      .filter((index) => index >= 0);
    expect(stopIndex).toBeGreaterThan(startIndexes[0]);
    await releaseAudioLease(first!);
    await releaseAudioLease(second!);
  });

  it('hands the onboarding lease off before the first session lease', async () => {
    const onboarding = await acquireAudioLease('onboarding');
    await releaseAudioLease(onboarding!);
    const session = await acquireAudioLease('session');
    const commands = invoke.mock.calls.map(([command]) => command);
    const stop = commands.lastIndexOf('stop_audio');
    const restart = commands.lastIndexOf('start_audio');
    expect(stop).toBeGreaterThanOrEqual(0);
    expect(restart).toBeGreaterThan(stop);
    await releaseAudioLease(session!);
  });
});
