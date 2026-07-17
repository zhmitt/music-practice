import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  acquire: vi.fn(),
  release: vi.fn(async () => true),
  invoke: vi.fn(async (_command?: string): Promise<unknown> => undefined),
}));
vi.mock('./audioPreferences', () => ({
  acquireAudioLease: mocks.acquire,
  releaseAudioLease: mocks.release,
}));
vi.mock('$lib/tauri/runtime', () => ({ invokeTauri: mocks.invoke }));
vi.mock('$lib/db', () => ({
  getKV: vi.fn(async () => null),
  safeInvoke: vi.fn(async () => undefined),
}));

import { droneActive, startToneLab, stopToneLab, switchMode, tonelabActive } from './tonelab';

describe('ToneLab lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoke.mockReset();
    mocks.invoke.mockResolvedValue(undefined);
    mocks.release.mockResolvedValue(true);
    mocks.acquire.mockResolvedValue({ id: 1, owner: 'tonelab', generation: 0 });
  });

  it('stops a successfully started drone', async () => {
    await switchMode('drone');
    await startToneLab();
    expect(get(droneActive)).toBe(true);
    expect(mocks.invoke).toHaveBeenCalledWith('start_drone', expect.any(Object));
    await stopToneLab();
    expect(mocks.invoke).toHaveBeenCalledWith('stop_drone');
    expect(get(droneActive)).toBe(false);
  });

  it('disposes an acquisition that resolves after stop', async () => {
    let resolveAcquire!: (value: { id: number; owner: 'tonelab'; generation: number }) => void;
    mocks.acquire.mockReturnValue(
      new Promise((resolve) => {
        resolveAcquire = resolve;
      }),
    );
    const starting = startToneLab();
    await stopToneLab();
    const lateLease = { id: 9, owner: 'tonelab' as const, generation: 0 };
    resolveAcquire(lateLease);
    await starting;
    expect(mocks.release).toHaveBeenCalledWith(lateLease);
  });

  it('completes capture cleanup when drone stop rejects', async () => {
    await switchMode('drone');
    await startToneLab();
    mocks.invoke.mockImplementation(async (command?: string) => {
      if (command === 'stop_drone') throw new Error('drone owner unavailable');
    });
    await expect(stopToneLab()).resolves.toBeUndefined();
    expect(mocks.release).toHaveBeenCalled();
    expect(get(tonelabActive)).toBe(false);
    expect(get(droneActive)).toBe(false);
  });

  it('invalidates a pending drone start when mode changes', async () => {
    await switchMode('free_play');
    await startToneLab();
    let resolveStart!: () => void;
    mocks.invoke.mockImplementation((command?: string) => {
      if (command === 'start_drone')
        return new Promise<void>((resolve) => {
          resolveStart = resolve;
        });
      return Promise.resolve();
    });
    const entering = switchMode('drone');
    await Promise.resolve();
    const leaving = switchMode('free_play');
    resolveStart();
    await Promise.all([entering, leaving]);
    expect(get(droneActive)).toBe(false);
    expect(mocks.invoke).toHaveBeenCalledWith('stop_drone');
    await stopToneLab();
  });
});
