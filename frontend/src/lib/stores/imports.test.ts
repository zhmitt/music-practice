import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

const { getKV, setKV, reportFailure, clearFailure } = vi.hoisted(() => ({
  getKV: vi.fn(),
  setKV: vi.fn(async () => ({ ok: true })),
  reportFailure: vi.fn(),
  clearFailure: vi.fn(),
}));
vi.mock('$lib/db', () => ({
  getKV,
  setKV,
  reportPersistenceReadFailure: reportFailure,
  clearPersistenceFailure: clearFailure,
}));

import { importedPieces, loadImportedPieces } from './imports';

describe('imported-piece persistence validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('isolates malformed records and reports degraded persistence', async () => {
    getKV.mockResolvedValue('{bad json');
    await loadImportedPieces();
    expect(get(importedPieces)).toEqual([]);
    expect(reportFailure).toHaveBeenCalledOnce();
  });

  it('rejects unversioned values that are not valid legacy records', async () => {
    getKV.mockResolvedValue(JSON.stringify([{ id: 42 }]));
    await loadImportedPieces();
    expect(get(importedPieces)).toEqual([]);
    expect(reportFailure).toHaveBeenCalledOnce();
  });

  it('migrates a deeply valid legacy record', async () => {
    getKV.mockResolvedValue(
      JSON.stringify([
        {
          id: 'piece',
          title: 'Scale',
          noteCount: 1,
          importedAt: '2026-07-17',
          exercise: {
            id: 'exercise',
            type: 'scale',
            nameKey: 'scale',
            descriptionKey: 'desc',
            tones: [{ note: 'Bb', octave: 4, durationSec: 2 }],
          },
        },
      ]),
    );
    await loadImportedPieces();
    expect(get(importedPieces)).toHaveLength(1);
    expect(reportFailure).not.toHaveBeenCalled();
  });

  it('rejects unsupported imported-piece envelope versions', async () => {
    getKV.mockResolvedValue(JSON.stringify({ version: 2, records: [] }));
    await loadImportedPieces();
    expect(get(importedPieces)).toEqual([]);
    expect(reportFailure).toHaveBeenCalledOnce();
  });

  it('rejects semantic date and note-count mismatches', async () => {
    getKV.mockResolvedValue(
      JSON.stringify({
        version: 1,
        records: [
          {
            id: 'piece',
            title: 'Scale',
            noteCount: 2,
            importedAt: '2026-99-99',
            exercise: {
              id: 'exercise',
              type: 'scale',
              nameKey: 'scale',
              descriptionKey: 'desc',
              tones: [{ note: 'Bb', octave: 4, durationSec: 2 }],
            },
          },
        ],
      }),
    );
    await loadImportedPieces();
    expect(get(importedPieces)).toEqual([]);
    expect(reportFailure).toHaveBeenCalledWith(
      expect.any(Error),
      'imported-pieces:partial-validation',
    );
  });

  it('clears recovered imported-piece read and validation failures', async () => {
    getKV.mockResolvedValue(JSON.stringify({ version: 1, records: [] }));
    await loadImportedPieces();
    expect(clearFailure).toHaveBeenCalledWith('imported-pieces:partial-validation');
    expect(clearFailure).toHaveBeenCalledWith('imported-pieces:read');
  });
});
