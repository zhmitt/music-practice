import { describe, expect, it } from 'vitest';
import { runSqliteCrudSmoke, type SqliteSmokeDatabase } from './sqliteRuntimeSmoke';

function fakeDatabase(): SqliteSmokeDatabase {
  const rows = new Map<string, string>();
  return {
    async execute(query, values = []) {
      if (query.startsWith('INSERT')) rows.set(String(values[0]), String(values[1]));
      if (query.startsWith('UPDATE')) rows.set(String(values[1]), String(values[0]));
      if (query.startsWith('DELETE')) rows.delete(String(values[0]));
    },
    async select<T>(query: string, values: unknown[] = []) {
      const value = rows.get(String(values[0]));
      return (
        query.includes('COUNT')
          ? [{ count: value === undefined ? 0 : 1 }]
          : value
            ? [{ value }]
            : []
      ) as T;
    },
  };
}

describe('WebView SQLite CRUD smoke', () => {
  it('proves create insert read update and delete', async () => {
    const result = await runSqliteCrudSmoke(fakeDatabase());
    expect(result).toEqual({
      smoke: 'sqlite-webview-crud',
      success: true,
      stages: ['create', 'insert', 'read', 'update', 'delete'],
      error: null,
    });
  });

  it('returns a machine-readable failure with completed stages', async () => {
    const db = fakeDatabase();
    db.select = async () => {
      throw new Error('plugin select failed');
    };
    expect(await runSqliteCrudSmoke(db)).toMatchObject({
      smoke: 'sqlite-webview-crud',
      success: false,
      stages: ['create', 'insert'],
      error: 'plugin select failed',
    });
  });
});
