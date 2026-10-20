# Build and test

Use Node.js 24 and pnpm 10. Source assets, upstream license notices and lockfiles are included.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
```

`pnpm test` runs the portable test selection. Official-host tests require a supported Harness installation or unpacked SDK:

```powershell
$env:DSH_ACCEPTANCE_SDK = 'C:\path\to\dsh\node_modules'
node scripts/test.mjs --integration
```

Optional fixtures: `DSER_TRANSLATOR_CLIENT` points to an installed compatible translation plugin for an opt-in compatibility test. `DSER_CANVAS_RUNTIME` points to an installed `@napi-rs/canvas` directory for CPU-canvas editor tests. Those tests explicitly skip when the optional fixture is absent. Never point test data at a production conversation/profile directory. Tests use `audit/`, which is excluded from Git and source exports except for non-personal upstream provenance metadata.

Release assets:

```sh
node scripts/public-check.mjs
pnpm release
```

The install stage is built from the package manifest's file allowlist. The source export starts from a separate source allowlist and has no parent Git history. Packaging checks reject execution-policy modules and machine-specific installation paths. The output directory is excluded from Git. Put compiled `.tgz`, source `.zip` and `SHA256SUMS.txt` in a GitHub Release.

The renamed plugin keeps existing document/data identifiers for compatibility. Public branding and package identity are ChatCanvas; do not change persistent wire/storage identifiers as a cosmetic rename.
