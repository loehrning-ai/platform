# Demos v4: Glas, the intro card and the Claude scene

The six demos under `/demos` move from the v3 shell (beat rail, square
Werkstatt look) to a v4 shell built on **Glas**, a glass material system for
the demos only. This page is the short map; the code comments carry the
detail.

## Where things live

| What | Path |
|---|---|
| Material, tones, contrast proofs, budget, radii | `src/lib/glas.ts` |
| Springs and their CSS `linear()` twins | `src/lib/glas-motion.ts` |
| Components and the only stylesheet that may draw glass | `src/components/demos/glas/` (`index.ts` exports everything, `glas.css` holds the look) |
| v4 page, stage and dock | `src/components/demos/shell/demo-page-v4.tsx`, `glas-demo-stage.tsx`, `shell-v4.css` |
| Intro card data per demo, and which shell it runs | `src/lib/demo-cases/<slug>/intro.ts` (`SHELL`, `INTRO`), collected in `src/lib/demo-intros.ts` |
| Claude scene (replay of a recorded run) | `src/components/demos/claude-scene/` |
| Recordings | `src/lib/demo-cases/<slug>/claude-runs/` (registry: `src/lib/claude-scenes.ts`) |
| Recorder | `scripts/demos/record-claude-run.mjs` (repo root) |
| Hub in Glas | `src/app/demos/page.tsx`, `src/components/demos/hub/hub-glas.css`, `demo-tile.css` |

## Glas in one paragraph

Glas has three materials (`regular`, `clear`, `thin`) and three modes on the
root's `data-glas-mode`: `live` (backdrop blur), `frost` (a pre-blurred
picture of the field, no filter) and `solid` (opaque plates). "Weniger Glas"
gives `frost`; reduced transparency, more contrast and forced colours give
`solid`. Text always sits on a reading plate whose opacity is proven in
`glas.test.ts` to reach 4.5:1 with no credit for blur. At most 3 live layers
show on a phone and 5 on a desktop, the site's nav included; the root hands
out live slots by priority (`GLAS_PRIORITY`). `backdrop-filter` and blur radii
are never animated, nothing loops, and every spring jumps (or crossfades in
150ms) under reduced motion.

Glas overrides the brand's hard-edge rules on demo routes only. The tests
keep the rest of the site as it was: `src/lib/glass.test.ts` lets only
`components/demos/glas/glas.css` set a live `backdrop-filter` (under
`[data-glas-mode="live"] .glas[data-live="on"]`), and `src/lib/glas.test.ts`
fails when a `--glas-` token or `data-glas` appears outside `app/demos/`,
`components/demos/`, `lib/demo-cases/` and `lib/glas*.ts`.

## The v4 shell

A demo opts in with `export const SHELL = "v4"` in its `intro.ts`; the route
then renders `DemoPageV4` instead of `DemoPageV3`. The clock gains a phase:

- `intro`: the intro card (title, four sentences, a start button that names
  the first action, "Frei ausprobieren") covers the stage. Nothing moves.
- `guided`: the dock shows "Schritt n von m" with the step sentence and
  "Zurück" / "Weiter". The path never locks; a skipped estimate shows
  "Vorschlag übernommen".
- `free`: every control is open, and "Zur Führung" returns to the step.

The v3 keys, deep links (`?beat=`), "Von vorn" and reduced-motion behaviour
carry over unchanged. Beats on v4 follow `validateBeatsV4` in
`src/lib/demo-beats.ts`: a commit first, exactly one own beat, the takehome
last, at most three apply beats and eight in all.

## The Claude scene

Under "Für deinen Claude" each demo may show a replay of one real Claude
Code run with the workshop's skill and kit files, drawn as a desktop window
(a phone window below 900px of container width). The scene plays only on a
press, streams at most 40 characters a second, and clamps waits but never
content. Every take carries its date, model and CLI version, the hashes of
the kit files and the skill digest; the test fails as "stale" when the kit or
the skill changes after recording. Nothing is invented: a take that broke a
rule (denied tools, a missing skill call) stays in `rejected/` and is
counted. The scene shows no Anthropic logo and is labelled "Darstellung".

## Copy rules

`scripts/copy-lint.mjs` runs the v4 language rules (`v4-symbol`, `v4-caps`,
`v4-calque`, `v4-tipp`, `v4-jargon`, `v4-long`) on every `intro.ts`, on the
folders of demos whose `SHELL` is `"v4"`, and on the `v4`, `claudeScene`,
`catalog` and `hub` blocks of `src/lib/demos-ui-copy.ts`. Labels may use the
middle dot; sentences may not.

## Checks

- Unit: `src/lib/glas.test.ts`, `src/components/demos/glas/glas.test.tsx`,
  `src/components/demos/shell/beat-clock-v4.test.tsx`, `src/lib/demo-intro.test.ts`,
  `src/lib/claude-runs.test.ts`, `src/components/demos/claude-scene/claude-scene.test.tsx`.
- Scripts: `bun run test:claude-recorder`, `bun run test:copy-lint`.
- Browser: `tests/e2e/claude-scene.spec.ts`, `tests/e2e/demos.spec.ts`,
  `tests/e2e/demo-v3-shell.spec.ts`; `tests/e2e/fixtures/glas-budget.ts`
  counts live layers against `GLAS_LIVE_BUDGET`.
