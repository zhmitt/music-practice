import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$lib/tauri/runtime', () => ({ isTauriRuntime: () => false }));

import {
  getAllSessions,
  insertSession,
  persistenceStatus,
  retryLastPersistence,
  setKV,
} from './db';

describe('browser persistence boundary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reports quota failures and retries the retained write', async () => {
    const original = Storage.prototype.setItem;
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('quota reached', 'QuotaExceededError');
    });
    expect((await setKV('tt-test', 'value')).ok).toBe(false);
    expect(get(persistenceStatus).degraded).toBe(true);
    setItem.mockImplementation(original);
    expect((await retryLastPersistence()).ok).toBe(true);
    expect(localStorage.getItem('tt-test')).toBe('value');
    setItem.mockRestore();
  });

  it('isolates malformed session records instead of coercing them', async () => {
    localStorage.setItem('tt-session-history', '{bad json');
    expect(await getAllSessions()).toEqual([]);
    expect(get(persistenceStatus).degraded).toBe(true);
  });

  it('writes and reloads a versioned validated session envelope', async () => {
    const result = await insertSession({
      id: 'one',
      date: '2026-07-17',
      exerciseType: 'long_tones',
      durationSeconds: 20,
      accuracy: 1,
      tones: '[]',
    });
    expect(result.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem('tt-session-history') ?? '{}').version).toBe(1);
    expect(await getAllSessions()).toHaveLength(1);
  });

  it('retains an independent failed write after an unrelated write succeeds', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('quota reached', 'QuotaExceededError');
    });
    await setKV('tt-failed', 'lost');
    setItem.mockRestore();
    await setKV('tt-success', 'saved');
    expect(
      get(persistenceStatus).failures.some((item) => item.identity === 'set-kv:tt-failed'),
    ).toBe(true);
    expect(get(persistenceStatus).degraded).toBe(true);
  });

  it('retries each failed write independently', async () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new DOMException('quota one', 'QuotaExceededError');
      })
      .mockImplementationOnce(() => {
        throw new DOMException('quota two', 'QuotaExceededError');
      });
    await setKV('tt-retry-one', 'one');
    await setKV('tt-retry-two', 'two');
    setItem.mockRestore();
    expect((await retryLastPersistence()).ok).toBe(true);
    expect(localStorage.getItem('tt-retry-one')).toBe('one');
    expect(localStorage.getItem('tt-retry-two')).toBe('two');
    expect(
      get(persistenceStatus).failures.some((item) => item.identity.startsWith('set-kv:tt-retry-')),
    ).toBe(false);
  });

  it('reports partially invalid records while retaining valid records', async () => {
    localStorage.setItem(
      'tt-session-history',
      JSON.stringify({
        version: 1,
        records: [
          {
            id: 'valid',
            date: '2026-07-17',
            exerciseType: 'long_tones',
            durationSeconds: 2,
            accuracy: 1,
            tones: [],
          },
          { id: 'invalid', date: 'not-a-date', tones: [] },
        ],
      }),
    );
    expect(await getAllSessions()).toHaveLength(1);
    expect(
      get(persistenceStatus).failures.some(
        (item) => item.identity === 'session-history:partial-validation',
      ),
    ).toBe(true);
  });

  it('rejects unsupported session envelope versions', async () => {
    localStorage.setItem('tt-session-history', JSON.stringify({ version: 2, records: [] }));
    expect(await getAllSessions()).toEqual([]);
    expect(get(persistenceStatus).degraded).toBe(true);
  });

  it('clears a recovered session read failure after a valid reload', async () => {
    localStorage.setItem('tt-session-history', '{bad json');
    await getAllSessions();
    expect(
      get(persistenceStatus).failures.some((item) => item.identity === 'session-history:read'),
    ).toBe(true);
    localStorage.setItem('tt-session-history', JSON.stringify({ version: 1, records: [] }));
    await getAllSessions();
    expect(
      get(persistenceStatus).failures.some((item) => item.identity === 'session-history:read'),
    ).toBe(false);
  });

  it('clears recovered history failures when the corrupt key is removed', async () => {
    localStorage.setItem('tt-session-history', '{bad json');
    await getAllSessions();
    localStorage.removeItem('tt-session-history');
    expect(await getAllSessions()).toEqual([]);
    expect(
      get(persistenceStatus).failures.some(
        (item) =>
          item.identity === 'session-history:read' ||
          item.identity === 'session-history:partial-validation',
      ),
    ).toBe(false);
  });

  it('rejects calendar-invalid session dates', async () => {
    localStorage.setItem(
      'tt-session-history',
      JSON.stringify({
        version: 1,
        records: [
          {
            id: 'bad-date',
            date: '2026-99-99',
            exerciseType: 'long_tones',
            durationSeconds: 2,
            accuracy: 1,
            tones: [],
          },
        ],
      }),
    );
    expect(await getAllSessions()).toEqual([]);
    expect(
      get(persistenceStatus).failures.some(
        (item) => item.identity === 'session-history:partial-validation',
      ),
    ).toBe(true);
  });
});
