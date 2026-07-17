# Architecture

## Current shape

The repository contains one deployable Next.js application at `packages/simplified-website`. Root scripts are the stable command contract for local work and CI. The application is build-safe without credentials: optional Supabase, Anthropic, Sentry, and analytics features activate only when explicitly configured. Anthropic-backed exercises depend on the complete Supabase configuration because their durable production quota limiter fails closed without it.

The public-repository boundary is multi-license. Application code is open source, while source-visible editorial and brand material can remain rights-reserved. Route visibility, repository visibility, and reuse permission are separate decisions; `LICENSE_POLICY.md` is the canonical file-level policy.

The root `workspaces` array is an explicit allowlist, not a glob. Every direct real directory under `packages/` must contain a regular `package.json`, must be listed explicitly, and must expose a non-empty `scripts.verify` command. `scripts/verify-workspaces.mjs` also rejects absolute paths, traversal, patterns, duplicate entries, and symlinked workspace roots. This boundary applies equally to JavaScript, Python, and other future tools. `bun run verify:workspace-contract` checks it without executing package code. `bun run verify:workspaces` then runs every allowed package's verification command in declaration order.

The root `bun.lock` is the only JavaScript dependency lockfile. The platform scanner rejects Bun, npm, pnpm, and Yarn lockfiles at every other path, as well as alternative JavaScript lockfiles at the root. Frozen installation is the reproducibility gate for JavaScript packages. A future non-JavaScript workspace may carry its ecosystem-specific lockfile after scanner and license review. Clean production builds use repository-local and system fonts and do not download Google Fonts. Provider credentials are not a build dependency.

Content registries are the source of truth:

- `src/lib/courses/catalog.ts` for native courses and linked technical labs;
- `src/lib/books.ts` for books;
- `src/lib/demos.ts` for demonstrations;
- `src/lib/vorlagen.ts` for templates;
- `src/lib/blog-metadata.ts` for articles;
- `src/lib/open-source/artifacts.ts` for future tools, projects, and videos published under the `loehrning-ai` GitHub organization (imported labs stay in `src/lib/courses/catalog.ts`);
- `src/lib/crawl/contract.ts` for public indexing behavior.

New routes must be registered consistently in navigation, crawl policy, sitemap, machine-readable discovery, tests, and Lighthouse coverage.
The committed page inventory is generated from the same crawl and artifact
registries. `bun run --cwd packages/simplified-website page-inventory:check`
blocks drift; regenerate it only with the package's `page-inventory:generate`
command.

## Asset and media admission boundary

`ASSET_MANIFEST.json` is the reviewed ownership, provenance, licensing, redistribution, and integrity ledger for public assets. `scripts/scaffold-asset.mjs` accepts only an existing normalized repository-relative regular file. It rejects symlinks, path traversal, secret-bearing files, provider state, caches, generated output, and test output. It requires all descriptive metadata from the caller, computes the SHA-256 and exact byte size, and prints one candidate JSON record. It never writes the source file or manifest.

Use the helper only as a deterministic evidence generator. A human must validate the metadata and redistribution rights before adding its output to `ASSET_MANIFEST.json`. The public-tree scanner independently checks recognized assets against the reviewed manifest.

Future video and audio must satisfy [MEDIA_POLICY.md](MEDIA_POLICY.md), including captions, transcript, poster, provenance, license, hash, size, storage, privacy, Content Security Policy, and manual accessibility proof. No remote media origin or broader security-header allowance enters the application through an asset record alone.

Future tools and projects enter the public catalog only through the typed artifact registry. Their mandatory guide covers status, prerequisites, installation, usage, integration, documentation, screenshot dimensions, SHA-256, exact byte size, alternative text, and related learning. Every artifact license and tool/project screenshot must also have a matching `ASSET_MANIFEST.json` entry. `bun run artifact-assets:check` verifies registry metadata, manifest metadata, stored bytes, and cataloged image dimensions before publication. The registry validator fails closed before a partial entry can reach the shared detail-page renderer.

GitHub is the intentional public source-publication dependency for code artifacts. Provider-free runtime describes optional application integrations; it does not make source publication provider-neutral. Every new tool or project requires a public GitHub URL and immutable commit pin without a runtime credential. [ARTIFACT_PUBLICATION.md](ARTIFACT_PUBLICATION.md) defines the two-commit pinning sequence, exact registry shapes, supported launch choices, discovery updates, and proof gates.

## Adding a future module

A future course, code example, or tool belongs in a new workspace only when it has an independent package manifest and a clear runtime boundary. Before adding it:

1. establish ownership and a compatible license for every source file and asset;
2. remove secrets, local paths, internal plans, generated output, and provider state;
3. provide an environment example containing placeholders only;
4. expose a package-level `verify` script that proves its lint, type, test, and build contract without production credentials;
5. add unit, build, and browser proof that does not depend on production credentials;
6. add the package path to the explicit root workspace list;
7. extend the public-tree scanner and asset manifest when new file classes appear;
8. apply the media admission policy when the module contains video or audio;
9. add site navigation and discovery only after the module itself passes all gates.

Python and other non-JavaScript modules use a minimal `package.json` only as the root verification adapter. Its `scripts.verify` command invokes the module's native locked checks; application code and dependencies remain managed by that language's own tooling. This keeps one explicit admission path without pretending every future tool is a JavaScript package.

The root verification command retains repository-wide scanner, dependency-audit, and content gates before it delegates to workspace verification. A new workspace cannot silently bypass those checks or enter CI through a wildcard match.

Do not embed an unrelated application directly into the learning app, weaken global security headers for one module, or rely on development authentication in a public runtime.
