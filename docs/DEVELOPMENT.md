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
node scripts/release-checksums.mjs
```

The install stage is built from the package manifest's file allowlist. The source export starts from a separate source allowlist and has no parent Git history. Packaging checks reject execution-policy modules and machine-specific installation paths. The output directory is excluded from Git. Put compiled `.tgz`, source `.zip` and `SHA256SUMS.txt` in a GitHub Release.

The renamed plugin keeps existing document/data identifiers for compatibility. Public branding and package identity are ChatCanvas; do not change persistent wire/storage identifiers as a cosmetic rename.

The npm distribution uses the unscoped name `dsh-chatcanvas`, starting with the published `1.4.0-rc.13`. Runtime package stages omit development previews and source maps but retain local runtime assets, licenses and host peer declarations. The full source archive retains development files. Run `pnpm package:npm` to create a prebuilt npm archive; do not publish the source root. See [publication and market verification](PUBLICATION.md). The existing `1.4.0-rc.12` Release keeps its original `@local/dsh-chatcanvas` identity and files.

Release ZIP creation uses the Windows bundled BSD tar, or Python 3 on Linux/macOS (GNU tar cannot create ZIP archives). GitHub's Ubuntu runner provides Python 3.

The repository also has a deliberate release-request workflow. A maintainer updates `.github/release-request.json` on `main` with exactly `tag` (matching `v` + package version) and `sourceCommit` (a full reviewed commit SHA). That one file change triggers build, tests, package checks, checksum creation and publication using the repository's temporary Actions token. Normal source pushes do not publish a release. Existing releases are not overwritten, and the publishing job is restricted to this repository. Build-produced archives can differ byte-for-byte from local archives; the accompanying checksum file applies to that release's actual assets.
