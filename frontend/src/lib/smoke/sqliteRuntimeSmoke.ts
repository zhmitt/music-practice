import { invokeTauri, isTauriRuntime } from '$lib/tauri/runtime';

export interface SqliteSmokeDatabase {
  execute(query: string, bindValues?: unknown[]): Promise<unknown>;
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
}

export interface SqliteRuntimeSmokeResult {
  smoke: 'sqlite-webview-crud';
  success: boolean;
  stages: string[];
  error: string | null;
}

export async function runSqliteCrudSmoke(
  db: SqliteSmokeDatabase,
): Promise<SqliteRuntimeSmokeResult> {
  const stages: string[] = [];
  try {
    await db.execute(
      'CREATE TABLE IF NOT EXISTS runtime_smoke (id TEXT PRIMARY KEY, value TEXT NOT NULL)',
    );
    stages.push('create');
    await db.execute('DELETE FROM runtime_smoke WHERE id = ?', ['probe']);
    await db.execute('INSERT INTO runtime_smoke (id, value) VALUES (?, ?)', ['probe', 'created']);
    stages.push('insert');
    const inserted = await db.select<Array<{ value: string }>>(
      'SELECT value FROM runtime_smoke WHERE id = ?',
      ['probe'],
    );
    if (inserted[0]?.value !== 'created') throw new Error('insert verification failed');
    stages.push('read');
    await db.execute('UPDATE runtime_smoke SET value = ? WHERE id = ?', ['updated', 'probe']);
    const updated = await db.select<Array<{ value: string }>>(
      'SELECT value FROM runtime_smoke WHERE id = ?',
      ['probe'],
    );
    if (updated[0]?.value !== 'updated') throw new Error('update verification failed');
    stages.push('update');
    await db.execute('DELETE FROM runtime_smoke WHERE id = ?', ['probe']);
    const remaining = await db.select<Array<{ count: number }>>(
      'SELECT COUNT(*) AS count FROM runtime_smoke WHERE id = ?',
      ['probe'],
    );
    if (Number(remaining[0]?.count) !== 0) throw new Error('delete verification failed');
    stages.push('delete');
    return { smoke: 'sqlite-webview-crud', success: true, stages, error: null };
  } catch (error) {
    return {
      smoke: 'sqlite-webview-crud',
      success: false,
      stages,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runRuntimeSmokeIfRequested(): Promise<SqliteRuntimeSmokeResult | null> {
  if (!isTauriRuntime()) return null;
  const mode = await invokeTauri('get_runtime_smoke_mode');
  if (mode !== 'sqlite') return null;

  let result: SqliteRuntimeSmokeResult;
  try {
    const Database = (await import('@tauri-apps/plugin-sql')).default;
    const db = await Database.load('sqlite:runtime-smoke.db');
    result = await runSqliteCrudSmoke(db);
  } catch (error) {
    result = {
      smoke: 'sqlite-webview-crud',
      success: false,
      stages: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }

  await invokeTauri('complete_runtime_smoke', {
    resultJson: JSON.stringify(result),
    success: result.success,
  });
  return result;
}
