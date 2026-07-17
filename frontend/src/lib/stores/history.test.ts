import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  insert: vi.fn(async () => ({ ok: true })),
}));
vi.mock('$lib/db', () => ({
  getAllSessionsWithStatus: mocks.read,
  insertSession: mocks.insert,
  clearPersistenceFailure: vi.fn(),
  reportPersistenceReadFailure: vi.fn(),
}));

import { getHistory, loadHistory, saveSession } from './history';

describe('history read recovery', () => {
  it('preserves visible history after a transient native read failure', async () => {
    await saveSession({
      id: 'existing',
      date: '2026-07-17',
      durationSeconds: 10,
      exerciseType: 'long_tones',
      exerciseName: 'tones',
      tones: [],
      accuracy: 1,
      avgCents: 0,
    });
    mocks.read.mockResolvedValue({ ok: false, records: [] });
    await loadHistory();
    expect(getHistory().map((item) => item.id)).toContain('existing');
  });
});
