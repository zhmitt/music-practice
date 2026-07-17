import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$lib/tauri/runtime', () => ({ isTauriRuntime: () => true }));
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(async () => ({
      execute: vi.fn(async () => undefined),
      select: vi.fn(async () => [
        {
          id: 'invalid',
          date: '2026-99-99',
          exercise_type: 'long_tones',
          duration_seconds: -1,
          accuracy: 2,
          tones: '[]',
          created_at: 'now',
        },
      ]),
    })),
  },
}));

import { getAllSessions, persistenceStatus } from './db';

describe('SQLite session semantic validation', () => {
  it('rejects native rows that violate browser session invariants', async () => {
    expect(await getAllSessions()).toEqual([]);
    expect(get(persistenceStatus).failures).toContainEqual(
      expect.objectContaining({ identity: 'session-history:partial-validation' }),
    );
  });
});
