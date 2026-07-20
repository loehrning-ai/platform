# loehrning.ai Learning Platform

Open-source application code for [loehrning.ai](https://loehrning.ai), a free German-language platform for practical AI literacy and EU AI Act learning.

The application includes four native learning paths, six linked open-source technical labs, three browser-readable books, governance templates, interactive demonstrations, and public learning APIs. The public learning surface works without an account. Optional account, analytics, observability, and AI-assisted features remain disabled when their environment variables are absent. Anthropic-backed exercises additionally require the complete Supabase quota backend; production rate limiting fails closed without it.

"Open source" applies to the application code and the files explicitly assigned an open license. It does not automatically apply to every course, book, brand asset, or other source-visible editorial file. Those materials remain reviewable and buildable in this repository, but reuse is governed file-by-file by [LICENSE_POLICY.md](LICENSE_POLICY.md). This is not a repository-wide open-content license.

## Requirements

- Bun 1.3.10, matching the version pinned in `packageManager` and CI
- Node.js 24.17.0 LTS for Node-based repository scripts (`.nvmrc` and
  `.node-version`); Node.js 22 LTS remains accepted by the package manifest

Current non-LTS Node.js 26 is outside the supported runtime contract. Its
experimental Web Storage global produces warnings in transitive server
dependencies that do not occur on the declared LTS runtime.

## Run locally

```bash
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:3000`. No credentials are required for courses, books, demos, templates, or the production build. Copy `packages/website/.env.example` to an ignored local environment file only when testing optional integrations.

A clean production build uses only repository-local and system fonts. It does not download fonts from Google or require provider credentials.

## Quality gates

```bash
bun run scan:public
bun run test:scanner
bun run audit
bun run license:audit
bun run content:lint
bun run typecheck
bun run lint
bun run test
bun run build
```

`bun run verify` runs the complete repository gate, including the public-tree scanner, dependency audit, content checks, repository-contract tests, and every allowlisted workspace's verification command. `bun run verify:public` adds the desktop and mobile public-route browser smoke suite:

```bash
bun run verify:public
```

Direct production-browser commands build first, preventing stale `.next`
output from counting as proof. Commands ending in `:built` are internal reuse
commands for CI and composite verification after `bun run verify` has built the
same workspace.

`bun run test:e2e:auth-scaffold` is credential-free scaffold coverage. It does
not prove live login. The separate `bun run test:e2e:authenticated-live` gate
fails unless a dedicated Supabase test project supplies the exact six-variable
contract documented in
[`packages/website/docs/ci-contract.md`](packages/website/docs/ci-contract.md).
It has no service-role, legacy anon-key, or mock-key fallback.

`bun run verify:release` runs environment validation and the build in strict
release mode, reuses that exact build for browser verification, and additionally
enforces the legal-page service-address gate. Strict mode rejects partial or
unattested provider configuration even outside CI. It intentionally fails while
the real service address is absent; the repository never invents or derives
personal address data. The automated gate proves that every structured field is
non-placeholder and renders identically on both legal pages. It cannot prove
that the address is real or legally sufficient; that evidence requires manual
review before release.

Publication requires three distinct gates: deterministic release validation,
the real-browser Lighthouse measurement, and the post-clean pre-Git packaging
check:

```bash
bun run verify:release
bun run lighthouse:local
# After deleting dependencies, build output, and local reports from the copy
# that will be published, and before initializing Git:
bun run publication:check
```

`lighthouse:local` must complete every URL in `lighthouserc.json`; all error-level assertions must pass and every warning must be reviewed. Neither command alone is complete release proof.
`publication:check` is the final pre-initialization packaging gate. It rejects
Git metadata, generated output, caches, reports, credentials, authenticated
storage state, local-only E2E files, and symbolic links. It intentionally
rejects a root `.git` entry, so it is not a post-`git init` CI command.

## Optional provider activation

Provider-free operation is the release default. A Supabase service-role key does not activate stored feedback. Before setting `FEEDBACK_ENABLED=true`, apply every local migration, enable Supabase Cron, and create the daily cleanup job below in the intended project:

```sql
select cron.schedule(
  'prune-beta-feedback-daily',
  '17 3 * * *',
  'select public.prune_beta_feedback();'
);
```

Verify the job exists and has completed successfully before setting `FEEDBACK_RETENTION_CRON_CONFIRMED_AT` to the verification date. The API also calls the restricted pruning function before every accepted insert and returns `503` if the retention migration is unavailable. Feedback messages have a fixed maximum retention of 180 days and must be treated as potentially personal free text.

Anthropic activation requires `AI_NATIVE_PRACTICE_ENABLED=true`, its API key, the complete Supabase quota backend, a verified DPA date, and `ANTHROPIC_RETENTION_DAYS` matching the accepted API contract. Never infer this value from a marketing page or provider default.

## Repository layout

```text
packages/
  website/
    content/       Authored courses, books, and templates
    public/        Public static assets and imported-course proof
    src/           Next.js application and tests
    tests/e2e/     Playwright browser tests
scripts/           Root verification, release, and packaging gates
LICENSES/          License texts referenced by LICENSE_POLICY.md
.github/           CI workflows and issue templates
```

The repository is deliberately a one-workspace monorepo. Future standalone learning modules or tools can be added under `packages/` after they pass the licensing, secret-scan, build, and browser-proof gates documented in [ARCHITECTURE.md](ARCHITECTURE.md). The exact registry, commit-pinning, asset, discovery, and browser admission sequence is [ARTIFACT_PUBLICATION.md](ARTIFACT_PUBLICATION.md).

Provider-free runtime does not mean provider-neutral source publication. GitHub is the intentional public source and immutable-revision dependency for code artifacts; no GitHub credential is required or allowed in the application runtime.

No standalone tool, project, or hosted video has been added in this preparation pass. Future media must satisfy [MEDIA_POLICY.md](MEDIA_POLICY.md). Generate a read-only candidate asset record with explicit human-supplied metadata:

```bash
bun run asset:record -- packages/website/public/path/to/file.ext \
  --owner "Named owner" \
  --source "Immutable source or provenance" \
  --license "License identifier" \
  --redistribution "Explicit redistribution terms"
```

The command prints JSON containing the file's SHA-256 and exact size. It never modifies `ASSET_MANIFEST.json`; a reviewer must validate and add the record manually.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CONTENT_GUIDE.md](CONTENT_GUIDE.md) before submitting changes. Report vulnerabilities privately according to [SECURITY.md](SECURITY.md). General support boundaries are in [SUPPORT.md](SUPPORT.md).

## Licensing

This is a multi-license repository. Application code is MIT licensed, governance templates are CC BY 4.0, embedded fonts retain their SIL OFL 1.1 license, and some editorial or brand assets remain rights-reserved. See [LICENSE_POLICY.md](LICENSE_POLICY.md) before reusing material.
