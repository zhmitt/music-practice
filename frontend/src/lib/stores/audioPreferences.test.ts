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
  hasAudioLease,
  releaseAudioLeaseDurably,
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

  it('recovers capture on acquire after restart stopped but failed to start', async () => {
    const first = await acquireAudioLease('session');
    let failStart = true;
    invoke.mockImplementation(async (command: string) => {
      if (command === 'is_audio_running') return false;
      if (command === 'start_audio' && failStart) {
        failStart = false;
        throw new Error('device unavailable');
      }
      return undefined;
    });
    expect(await restartPreferredAudioCapture()).toBe(true);
    const recovered = await acquireAudioLease('tonelab');
    expect(recovered).not.toBeNull();
    expect(invoke.mock.calls.filter(([command]) => command === 'start_audio')).toHaveLength(3);
    await releaseAudioLease(first!);
    await releaseAudioLease(recovered!);
  });

  it('retains final ownership until a failed native stop can be retried', async () => {
    const lease = await acquireAudioLease('session');
    invoke.mockRejectedValueOnce(new Error('stop interrupted'));
    expect(await releaseAudioLease(lease!)).toBe(false);
    expect(hasAudioLease('session')).toBe(true);
    expect(await releaseAudioLease(lease!)).toBe(true);
    expect(hasAudioLease('session')).toBe(false);
  });

  it('transfers orphaned teardown ownership during the next recovered acquire', async () => {
    const orphan = await acquireAudioLease('playalong');
    invoke.mockRejectedValueOnce(new Error('unmount stop failed'));
    expect(await releaseAudioLeaseDurably(orphan!)).toBe(false);
    const replacement = await acquireAudioLease('session');
    expect(replacement).not.toBeNull();
    expect(hasAudioLease('playalong')).toBe(false);
    await releaseAudioLease(replacement!);
  });
});
