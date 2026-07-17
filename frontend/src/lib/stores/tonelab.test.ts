import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const mocks = vi.hoisted(() => ({
  acquire: vi.fn(),
  release: vi.fn(async () => true),
  invoke: vi.fn(async () => undefined),
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

import { droneActive, startToneLab, stopToneLab, switchMode } from './tonelab';

describe('ToneLab lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
