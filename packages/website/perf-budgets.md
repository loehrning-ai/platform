# Performance Budgets

No CI job measures Lighthouse: the scores moved with runner load and the check
never caught a defect. Before a release that could move bundle size, Core Web
Vitals or accessibility, run Lighthouse by hand (Chrome DevTools, mobile preset)
against the Vercel preview of `/`, `/ai-native`, one blog article, `/buecher`
and one course overview, and compare with these targets:

| Metric                   | Target      |
| ------------------------ | ----------- |
| Accessibility score      | 1.00        |
| Performance score        | >= 0.80     |
| Largest Contentful Paint | <= 4500 ms  |
| Cumulative Layout Shift  | <= 0.1      |
| Total Blocking Time      | <= 200 ms   |
| Script transfer          | <= 360 KiB  |
| Total transfer           | <= 1024 KiB |
| Third-party requests     | <= 8        |

Treat a lab run as environment-sensitive evidence, not as proof of production
performance.

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
