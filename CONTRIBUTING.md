# Contributing

Contributions that improve correctness, accessibility, teaching quality, tests, or documentation are welcome.

## Before changing code

- Read [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [LICENSE_POLICY.md](LICENSE_POLICY.md).
- Keep security reports private and follow [SECURITY.md](SECURITY.md).
- Open a focused change. Do not combine unrelated formatting, content, and dependency work.
- Do not commit credentials, personal data, generated output, internal plans, or local machine paths.

## Development setup

Activate the pinned toolchain before installing or starting the app:

```bash
nvm install
nvm use
node scripts/development.mjs setup
node scripts/development.mjs doctor
node scripts/development.mjs dev
```

The development runner binds to loopback, prints its selected port, clears provider configuration and denies dotenv loading in its child processes. An occupied default port selects a bounded alternative. An explicitly requested occupied port fails without stopping its listener. Stop development with Ctrl+C; the runner owns and terminates only its own child process group.

Each worktree needs its own physical dependency directories and build output. Run setup in the new worktree instead of symlinking another checkout's `node_modules`. Shared package-manager and browser download caches are reusable. [Development documentation](packages/website/docs/development.md) covers Linux browser dependencies, optional browser installation and the limits of environment isolation.

On a minimal Linux image, install Playwright's browser system libraries explicitly:

```bash
bun --no-env-file run --cwd packages/website playwright install --with-deps chromium webkit
```

This step may require administrator access to the image's package manager. The normal setup command installs browser executables without changing system packages.

## Change, check, preview and release

1. Start a focused branch from updated `main`. Keep unrelated work in separate branches or worktrees.
2. Make the change with the provider-free development runner. Keep generated source and its generator consistent.
3. Run `bun run verify`. It runs the same static, full unit, build, privacy and cross-engine capability gates as GitHub.
4. Review `git diff --check`, `git diff` and `git status --short`. Keep credentials, local reports, private paths and internal plans outside the commit. Commit and push the branch, then open a pull request.
5. Run `bun run deploy:preview -- --wait --yes` when a hosted preview is needed. The command checks the exact pushed branch commit and waits for its successful `verify` before building. Inspect that preview; a new code change requires new verification.
6. Merge only after the required `verify`, dependency-review and CodeQL checks pass. The existing main ruleset requires a squash pull request and resolved review conversations, and prevents ordinary force-pushes and deletion.
7. Run `bun run deploy:production -- --wait --yes`. It checks current `main`, stages one production build, verifies the protected deployment, promotes that same build and checks the live domains. A healthy repeat request reuses the existing release. A failed staging check leaves the current live release in place.

For dependency, workflow, shared layout, security or other broad changes, dispatch `gh workflow run nightly.yml --ref main` on the merge commit, wait for its successful result, then add `--require-extended` to the production command. The daily Extended suite retains full browser, mocked account and advisory/licence coverage.

Automatic Git deployments are disabled. Preview and release commands are deliberate operator actions using authenticated `gh` and `vercel` CLIs and the intended existing project link. CI runs without deployment credentials. Do not publish an uncommitted directory with a raw deploy command or bypass the repository's source/check gates.

## Verification contract

`bun run verify` runs static checks and the full unit suite in parallel, then a single production build, the server-log privacy probe and twenty capability cases in both languages on Chromium and WebKit. WebKit runs in short fresh batches. The smoke reporter rejects missing, duplicated, skipped, expected-failure, retried or flaky cases.

When a GitHub job fails, reproduce its exact command (`bun run ci:static`, `ci:unit` or `ci:browser`), inspect the retained evidence and fix the cause. Preserve meaningful regression coverage. A failing or skipped gate must prevent publication; repeated retries, ignored advisories and deletion of failing coverage do not repair the defect.

The root workspace list is an explicit security and ownership boundary. Do not replace it with `packages/*`. Every listed package must provide a non-empty `scripts.verify` command that runs without production credentials. The root runner validates all paths before executing any workspace command.

Run `bun run test:e2e` when changing routes, navigation, responsive layout,
accessibility behavior, or interactive flows. Direct production E2E commands
build first. Do not invoke an internal `*:built` command unless a build with the
same environment was just made in the same workspace (`bun run ci:browser` does). The isolated live
provider contract is documented in
[`packages/website/docs/ci-contract.md`](packages/website/docs/ci-contract.md).
The E2E tiers and their commands are summarized in
[`packages/website/tests/README.md`](packages/website/tests/README.md).

## Content changes

- Write German prose with real umlauts and clear source attribution for factual claims.
- Keep legal and regulatory claims dated and linked to primary sources.
- Update catalog metadata, review dates, crawl policy, sitemap tests, and machine-readable discovery together.
- Preserve the distinction between educational information and legal advice.

## License of contributions

Code and repository-documentation contributions are accepted under the MIT License. Contributions to `CODE_OF_CONDUCT.md` and the CC BY 4.0 template paths are accepted under CC BY 4.0. Do not submit editorial, font, screenshot, logo, or third-party material unless redistribution rights are documented in the same change.
