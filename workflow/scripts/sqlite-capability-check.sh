#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
capability="$repo_root/frontend/src-tauri/capabilities/default.json"

jq -e '.permissions | index("sql:allow-execute") != null' "$capability" >/dev/null
jq -e '.permissions | index("sql:default") != null' "$capability" >/dev/null

db=$(mktemp -t tonetrainer-sqlite-smoke.XXXXXX)
trap 'rm -f "$db"' EXIT
result=$(sqlite3 "$db" <<'SQL'
CREATE TABLE quality_smoke (id INTEGER PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO quality_smoke (value) VALUES ('created');
UPDATE quality_smoke SET value = 'updated' WHERE id = 1;
SELECT value FROM quality_smoke WHERE id = 1;
DELETE FROM quality_smoke WHERE id = 1;
SELECT COUNT(*) FROM quality_smoke;
SQL
)

if [[ "$result" != $'updated\n0' ]]; then
  echo "SQLite CRUD smoke returned unexpected output: $result" >&2
  exit 1
fi
echo "SQLite execute capability declared; deterministic CRUD smoke passed."
