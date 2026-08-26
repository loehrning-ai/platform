# Performance Budgets

`lighthouserc.json` at the repository root is the repeatable Lighthouse budget
configuration for this package. GitHub Actions runs a five-route, one-run smoke
against the already verified production build. `bun run verify:release`
enforces the full 35-route, three-run measurement against that release build.

## Routes audited (`collect.url`)

`numberOfRuns: 3` with `aggregationMethod: "median"` (LHCI evaluates the
middle result of the three runs per URL). The server starts through the
provider-free wrapper and `next start`, matched on
`startServerReadyPattern: "Ready in"`.

The `collect.url` array in the root `lighthouserc.json` is the only route
inventory. It covers every static, public, indexable page plus at least one
published representative for every dynamic public route pattern. This includes
the homepage and learning entry points, course and book readers, editorial and
open-source pages, interactive demos, informational pages, and legal pages.
`bun run lighthouse:check` fails on missing, duplicate, stale, non-canonical,
or non-indexable entries. The documentation deliberately does not copy the
route list, preventing a second inventory from drifting.

## Assertions (`assert.assertions`)

What `lhci assert` passes or fails when the local Lighthouse command runs:

| Assertion                            | Threshold   | Severity          |
| ------------------------------------ | ----------- | ----------------- |
| `categories:accessibility`           | 1.00        | **error, blocks** |
| `categories:performance`             | >= 0.80     | **error, blocks** |
| `categories:best-practices`          | >= 0.9      | warn              |
| `categories:seo`                     | >= 0.9      | warn              |
| `largest-contentful-paint`           | <= 4500 ms  | **error, blocks** |
| `cumulative-layout-shift`            | <= 0.1      | **error, blocks** |
| `total-blocking-time`                | <= 200 ms   | **error, blocks** |
| `resource-summary:script:size`       | <= 360 KiB  | **error, blocks** |
| `resource-summary:total:size`        | <= 1024 KiB | **error, blocks** |
| `resource-summary:third-party:count` | <= 8        | **error, blocks** |

Accessibility and every performance budget are hard assertions. Best practices
and SEO remain diagnostic warnings because their category scores can change
with browser-version audits that do not represent a runtime regression. The
0.80 performance and 4.5-second LCP limits are blocking regression guardrails,
not claims about production field performance. CLS, blocking time, transfer,
and request limits remain independently blocking. Reports are written only to
`.lighthouseci/reports`; no report is uploaded.

## How to run it

```bash
bun run lighthouse:local
```

The command performs a fresh provider-free production build, writes a
content-and-environment-bound build receipt, verifies that receipt, then starts
the provider-free production server and runs LHCI from the repository root.
The `lighthouse:local:built` variant is internal reuse only and rejects a
missing or stale receipt.

Ordinary CI reuses that verified receipt and measures `/`, `/ai-native`, the published
blog article, `/buecher`, and the data-science course overview once each. This
keeps pull-request latency bounded while spanning the main rendering modes. The
release runner uses `lighthouse:release:built` after deterministic verification;
it rejects a changed build receipt and covers every configured route three
times using the median result before the browser journey gates.

Run it locally before shipping a change that could move bundle size, Core Web
Vitals, or the accessibility score. Treat it as environment-sensitive evidence,
not as proof of production performance.

To inspect webpack bundle composition (a different, complementary signal from
the transfer budgets above):

```bash
node packages/website/scripts/run-provider-free.mjs bun run --cwd packages/website analyze
```

## Rules of the road (what keeps script weight down)

- Framer Motion: import `m` + hooks only; never the full `motion` component
  (`MotionProvider` runs `<LazyMotion strict>`, so a stray `motion.*` throws in
  dev). domMax (layout/drag) loads are scoped to
  `widgets/interactive-diagram.tsx` inside the lazy widget chunk. New
  layout/drag animations must use the same isolated pattern.
- Lucide icons stay tree-shaken via `optimizePackageImports` (next.config.ts).
- Heavy client deps (`@react-pdf/renderer`, widgets) stay behind dynamic
  imports or server-only routes, never in the shared client bundle.
