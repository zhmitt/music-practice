import { describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$lib/tauri/runtime', () => ({ isTauriRuntime: () => true }));
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn(async () => {
      throw new Error('schema unavailable');
    }),
  },
}));

import { initDb, persistenceStatus } from './db';

describe('database initialization failure', () => {
  it('reports initialization failure without aborting application startup', async () => {
    await expect(initDb()).resolves.toBeUndefined();
    expect(get(persistenceStatus).failures).toContainEqual(
      expect.objectContaining({ identity: 'db-initialization', operation: 'read' }),
    );
  });
});
