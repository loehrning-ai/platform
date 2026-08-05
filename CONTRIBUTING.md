# Contributing

Contributions that improve correctness, accessibility, teaching quality, tests, or documentation are welcome.

## Before changing code

- Read [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [LICENSE_POLICY.md](LICENSE_POLICY.md).
- Keep security reports private and follow [SECURITY.md](SECURITY.md).
- Open a focused change. Do not combine unrelated formatting, content, and dependency work.
- Do not commit credentials, personal data, generated output, internal plans, or local machine paths.

## Local verification

Install with the locked toolchain and run the repository gate:

```bash
bun install --frozen-lockfile --ignore-scripts
bun run --cwd packages/website playwright install chromium webkit
bun run verify:workspace-contract
bun run verify
```

On a minimal Linux or CI image, install browser system dependencies with
`bun run --cwd packages/website playwright install --with-deps chromium webkit`
instead.

The root workspace list is an explicit security and ownership boundary. Do not replace it with `packages/*`. Every listed package must provide a non-empty `scripts.verify` command that runs without production credentials. The root runner validates all paths before executing any workspace command.

Run `bun run test:e2e` when changing routes, navigation, responsive layout,
accessibility behavior, or interactive flows. Direct production E2E commands
build first. Do not invoke an internal `*:built` command unless `bun run verify`
has just built the same workspace. Provider-free auth coverage is
`bun run test:e2e:auth-scaffold`; it is not live login proof. The isolated live
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
