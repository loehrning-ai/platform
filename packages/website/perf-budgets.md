# Performance Budgets

`lighthouserc.json` at the repository root is the repeatable local Lighthouse
budget configuration for this package. It is not part of the blocking GitHub
Actions workflow yet; browser E2E and structural accessibility checks remain
the automated browser gates.

## Routes audited (`collect.url`)

`numberOfRuns: 3` (LHCI takes the median of 3 runs per URL). The server starts
via `next start`, matched on `startServerReadyPattern: "Ready in"` (Next 15's
actual ready line - the prior `"Ready on"` pattern never matched, so every run
silently ate the 120s `startServerReadyTimeout`).

| Route | Represents |
|---|---|
| `/` | Homepage |
| `/einstieg` | Learning entry point |
| `/wie-ki-funktioniert` | Public foundational explainer |
| `/ki-check` | Public self-assessment |
| `/kurse` | Course hub |
| `/ki-fuehrerschein` | Free course landing page |
| `/ki-und-gesellschaft` | Society course landing page |
| `/eu-ai-act-kurs` | Free course landing page |
| `/ai-native` | Free course landing page |
| `/kurse/open-source/data-engineering-fundamentals` | Imported course detail |
| `/buecher` | Book library |
| `/buecher/ki-arbeitsalltag/02_persoenliches_profil` | Book chapter reader (representative reading page) |
| `/demos` | Demo catalog |
| `/demos/prompt-scanner` | Interactive demo detail |
| `/vorlagen` | Template catalog |
| `/blog` | Editorial catalog |
| `/open-source` | Open-source artifact hub |
| `/impressum` | Legal page, minimal-JS floor |

## Budgets (`collect.settings.budgets`, path `/*`)

Standard Lighthouse `budget.json` shape, embedded directly in the config
instead of a separate file (LHCI accepts both forms):

| Resource | Budget |
|---|---|
| Script transfer | 400 kB |
| Total transfer | 1600 kB |
| Third-party requests | 12 |

## Assertions (`assert.assertions`)

What `lhci assert` passes or fails when the local Lighthouse command runs:

| Assertion | Threshold | Severity |
|---|---|---|
| `categories:accessibility` | >= 0.95 | **error, blocks** |
| `categories:performance` | >= 0.8 | warn |
| `categories:best-practices` | >= 0.9 | warn |
| `categories:seo` | >= 0.9 | warn |
| `largest-contentful-paint` | <= 4000 ms | warn |
| `cumulative-layout-shift` | <= 0.1 | warn |
| `total-blocking-time` | <= 600 ms | warn |
| `resource-summary:script:size` | 400 kB | warn |

Accessibility is the only hard assertion in this optional measurement: a run
scoring below 0.95 exits unsuccessfully. Everything else warns.
`resource-summary:script:size` is the only budget-table entry
with a matching assertion (its raw config value is `400000`, i.e. bytes, same
400 kB threshold as the script row above); total transfer and third-party
count still render in every report's Budgets section but have no `assert`
entry, so they cannot fail a run by themselves today. Reports upload to
`temporary-public-storage` (no persistent LHCI server).

## How to run it

```bash
bun run build
bun run lighthouse:local
```

`startServerCommand` in the config does its own
`cd packages/website && bun run start`, which only resolves
correctly when lhci itself is invoked from the repo root.

Run it locally before shipping a change that could move bundle size, Core Web
Vitals, or the accessibility score. Treat it as environment-sensitive evidence,
not as proof of production performance.

To inspect webpack bundle composition (a different, complementary signal from
the transfer budgets above):

```bash
bun run build      # route table ("First Load JS" column) printed at the end
bun run analyze    # same build + interactive treemaps in .next/analyze/{client,nodejs,edge}.html
```

## Rules of the road (what keeps script weight down)

- Framer Motion: import `m` + hooks only; never the full `motion` component
  (`MotionProvider` runs `<LazyMotion strict>`, so a stray `motion.*` throws in
  dev). domMax (layout/drag) loads are scoped: `progress/toast-provider.tsx`
  (async chunk) and `widgets/interactive-diagram.tsx` (inside the lazy widget
  chunk). New layout/drag animations must follow one of those two patterns.
- Lucide icons stay tree-shaken via `optimizePackageImports` (next.config.ts).
- Heavy client deps (`@react-pdf/renderer`, widgets) stay behind dynamic
  imports or server-only routes, never in the shared client bundle.
