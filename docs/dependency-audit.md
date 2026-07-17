# Dependency Audit Policy and Triage

`npm audit --omit=dev` runs in CI as a report-only check. Severity alone does
not prove exploitability in the static Tauri application, but every live
finding requires an owner, exposure decision, remediation and review date.

Current snapshot: 2026-07-17, seven affected package entries (three high, two
moderate, two low). Owner for all entries: ToneTrainer maintainers. Next review:
2026-07-31.

| Package         | Severity | Exposure assessment                                                                                                                                                                             | Remediation                                                                                                           |
| --------------- | -------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@sveltejs/kit` |     High | Low in packaged static adapter: affected server hooks, adapter-node request limits and query batching are not shipped as a network server. Build/preview remains developer-exposed.             | Upgrade to a release above `2.70.0`; regenerate lockfile and run canonical verify by 2026-07-31.                      |
| `cookie`        |      Low | Low/transitive through SvelteKit; ToneTrainer has no server cookie boundary.                                                                                                                    | Resolved through the SvelteKit upgrade by 2026-07-31.                                                                 |
| `devalue`       |     High | Low in packaged static app because untrusted network deserialization is not exposed; SSR/build tooling still consumes the package.                                                              | Upgrade transitive dependency beyond `5.8.0` through SvelteKit/Svelte by 2026-07-31.                                  |
| `esbuild`       |      Low | Developer-only Windows dev-server file-read path; packaged runtime does not ship the dev server.                                                                                                | Upgrade to `0.28.1` or later through Vite by 2026-07-31; keep dev server loopback-only.                               |
| `postcss`       | Moderate | Low: application CSS is repository-controlled and not generated from untrusted input.                                                                                                           | Upgrade to `8.5.10` or later through the frontend toolchain by 2026-07-31.                                            |
| `svelte`        | Moderate | Reduced but non-zero: static application avoids a public SSR server, while DOM-clobbering/XSS variants can matter if untrusted HTML reaches rendering. No such HTML path is currently intended. | Upgrade beyond `5.55.6`, verify rendering and CSP, by 2026-07-31.                                                     |
| `vite`          |     High | Developer-only dev-server traversal/file-read paths; packaged runtime does not include Vite server. Windows developers have the greatest exposure.                                              | Upgrade beyond `7.3.4` by 2026-07-31; bind development server to loopback and do not expose it to untrusted networks. |

These are time-bounded risk acceptances, not permanent suppressions. A finding
becomes blocking if its affected path is exposed in the packaged runtime, the
review date expires, or a safe upgrade is available and verification succeeds.

Future entries must include advisory identifier, dependency path, shipped-code
assessment, owner, compensating control, remediation target and review date.

`workflow/scripts/dependency-audit-check.py` normalizes the live `npm audit`
inventory to package and severity, requires an unexpired review date and owner,
and fails when the documented table is missing, adding, or misclassifying an
entry. Advisory details remain report-only; stale or incomplete triage blocks.

<!-- audit-inventory:start -->

```json
{
  "@sveltejs/kit": {
    "advisories": [
      "https://github.com/advisories/GHSA-2crg-3p73-43xp",
      "https://github.com/advisories/GHSA-3f6h-2hrp-w5wx",
      "https://github.com/advisories/GHSA-hgv7-v322-mmgr",
      "via:cookie"
    ],
    "paths": ["node_modules/@sveltejs/kit"],
    "severity": "high"
  },
  "cookie": {
    "advisories": ["https://github.com/advisories/GHSA-pxg6-pf52-xh8x"],
    "paths": ["node_modules/cookie"],
    "severity": "low"
  },
  "devalue": {
    "advisories": ["https://github.com/advisories/GHSA-77vg-94rm-hx3p"],
    "paths": ["node_modules/devalue"],
    "severity": "high"
  },
  "esbuild": {
    "advisories": ["https://github.com/advisories/GHSA-g7r4-m6w7-qqqr"],
    "paths": ["node_modules/esbuild"],
    "severity": "low"
  },
  "postcss": {
    "advisories": ["https://github.com/advisories/GHSA-qx2v-qp2m-jg93"],
    "paths": ["node_modules/postcss"],
    "severity": "moderate"
  },
  "svelte": {
    "advisories": [
      "https://github.com/advisories/GHSA-9rmh-mm8f-r9h6",
      "https://github.com/advisories/GHSA-f3cj-j4f6-wq85",
      "https://github.com/advisories/GHSA-pr6f-5x2q-rwfp",
      "https://github.com/advisories/GHSA-rcqx-6q8c-2c42"
    ],
    "paths": ["node_modules/svelte"],
    "severity": "moderate"
  },
  "vite": {
    "advisories": [
      "https://github.com/advisories/GHSA-4w7w-66w2-5vf9",
      "https://github.com/advisories/GHSA-fx2h-pf6j-xcff",
      "https://github.com/advisories/GHSA-p9ff-h696-f583",
      "https://github.com/advisories/GHSA-v2wj-q39q-566r",
      "https://github.com/advisories/GHSA-v6wh-96g9-6wx3"
    ],
    "paths": ["node_modules/vite"],
    "severity": "high"
  }
}
```

<!-- audit-inventory:end -->
