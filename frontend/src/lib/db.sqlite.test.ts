import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('$lib/tauri/runtime', () => ({ isTauriRuntime: () => true }));
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: { load: vi.fn(async () => ({ execute, select: vi.fn() })) },
}));

import { insertSession, persistenceStatus } from './db';

describe('SQLite persistence failures', () => {
  it('returns a typed degraded result when SQLite rejects a write', async () => {
    execute.mockRejectedValueOnce(new Error('database unavailable'));
    const result = await insertSession({
      id: 'one',
      date: '2026-07-17',
      exerciseType: 'long_tones',
      durationSeconds: 20,
      accuracy: 1,
      tones: '[]',
    });
    expect(result).toMatchObject({ ok: false, operation: 'insert-session', retryable: true });
    expect(get(persistenceStatus)).toMatchObject({ degraded: true, retryAvailable: true });
  });
});
