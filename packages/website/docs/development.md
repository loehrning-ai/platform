# Development

Use the pinned Node and Bun versions. Local development serves the public
platform with providers disabled; it needs no account, provider key or Vercel
project link.

## Start a checkout

From the repository root:

```bash
nvm install
nvm use
node scripts/development.mjs setup
node scripts/development.mjs doctor
node scripts/development.mjs dev
```

`.nvmrc` and `.node-version` declare Node 24.22.1. `packageManager` declares
Bun 1.3.10. The doctor rejects a different version before it starts an install
or application server. Activating a version in one shell does not change the
machine's global default. Activate it again in each new shell.

Setup installs `bun.lock` with `--frozen-lockfile --ignore-scripts`, then uses
the installed Playwright CLI to install Chromium and WebKit. Both engines are
needed by the baseline smoke tests. The doctor checks the workspace CLI and
both browser executables. On Linux, browser system libraries may also be
needed; [Contributing](../../../CONTRIBUTING.md) documents Playwright's explicit
`--with-deps` installation. Setup itself does not install system packages.

For an iteration that does not use browser tests, skipping those installations
and checks is explicit:

```bash
node scripts/development.mjs setup --skip-browsers
node scripts/development.mjs doctor --skip-browsers
```

This mode does not establish browser-test readiness. The default setup and
doctor remain the commands to use before the full local gate.

The root `setup`, `doctor` and `dev` package scripts are convenience aliases.
Prefer the explicit Node entry point when the launcher must not load local
dotenv files: Bun can load dotenv before a package script starts. In either
case, the development runner gives its preflight and Next child the existing
provider-free environment and dotenv-denial preloads. It does not copy, parse
or create a credential file.

## Ports and server ownership

Dev starts on `127.0.0.1:3430`. If that port is occupied, it checks at most the
next nineteen ports and prints the URL it selected. Existing listeners remain
running. To use a stable explicit port:

```bash
node scripts/development.mjs dev --port 3442
# Equivalent argument forwarding through the package script:
bun run dev -- -p 3442
```

`LOEHRNING_DEV_PORT` also selects an explicit port. An occupied explicit port
fails with an actionable error; it does not silently move the server to a URL
an automated caller did not request. Hostnames are restricted to loopback.
`--webpack`, `--turbopack` and `--turbo` are forwarded to the installed Next
CLI; the default follows Next's own development bundler.

The English-route preflight runs inside the same provider-free environment as
the server. A failed preflight stops before Next starts. Ctrl-C and termination
signals stop only the process group created by this runner, with a bounded
shutdown if it does not respond. Signal cancellation preserves its usual
nonzero shell status.

## Change and verify

1. Work on a focused branch. The helpers resolve this checkout from their own
   location, so a nested working directory cannot select another application.
2. Use dev for immediate feedback and the relevant Vitest file while editing.
3. Run `bun run ci` before opening the pull request. It runs the same mandatory
   groups as GitHub. The [CI contract](ci-contract.md) defines the baseline and
   broader tiers.
4. Merge the tested change, then use the exact-main production workflow in
   [Deployment](deployment.md). Local dev does not log in, link a Vercel
   project or activate a provider.

Next keeps development output in `.next/dev`, and the production build
cleaner preserves that folder and the compiler cache. Next still rewrites the
shared `next-env.d.ts` declaration when development starts. Stop dev before
running the full gate in the same checkout, and keep it stopped until the
gate finishes. Use a separate worktree when development and verification
must run concurrently. Starting dev during type generation or the publication
scan can invalidate those checks. The build receipt still binds production
output to the source, toolchain and environment; keep source frozen while a
built gate runs.

Use a separate `E2E_PORT` when the browser gate's default port is occupied:

```bash
E2E_PORT=3450 bun run ci:browser
```

Production tests start and own their own server. They do not reuse the dev
server or an arbitrary listener. Commands ending in `:built` are internal
reuse commands for a matching build in the same checkout and environment.

Each worktree owns its installation. Setup refuses a shared `node_modules`
symlink and dev refuses symlinked `.next` output. The helpers do not switch
branches, delete worktrees, clean edits, copy provider configuration or change
global tool defaults. Provider-backed testing remains a separate, explicitly
configured tier in the [CI contract](ci-contract.md).
