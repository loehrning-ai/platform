# Learning-surface overhaul: status and plan

Branch `claude/admiring-noether-1hvwqz`, PR loehrning-ai/platform#103. Written 2026-09-26 so a new session can continue.

## What the owner asked for

1. Drop the brutalist/risograph look on courses, workshops and demos (offset shadow tiles, pastel highlight blocks, mono-uppercase eyebrows, box-in-box). State of the art, calm, not AI-generic.
2. Carry the Workshop 03 deck language onto the site. The owner calls the W03 deck "insanely good" and the W03 demo weak.
3. Remove AI-slop language; research how.
4. A canonical workshop structure; courses are too broad, workshops should be more down to earth.
5. A new Workshop 04: "ESG Reporting with AI: From Raw Inputs to Clearer Insights", built like W03.

## Decisions taken (do not relitigate)

- Design direction "Werkzeichnung" (`research/design-direction.md`): deck palette as site palette (paper #f3f0e9, ink #121212, Schiefer #4f4640, one accent Mennige #b73a15, graphit #141414 bands only), square geometry, flat, 2px ink rule above section heads, 1px hairlines between rows, sentence-case labels, mono only for data, one accent group per section, final state visible first.
- Workshop standard: `packages/website/docs/workshop-standard.md` (seven-act spine, 13 components) and `research/workshop-standard.md`.
- Voice: `research/slop-language.md` (patterns, voice spec). The slop is structural: "nicht X, sondern Y", count-first fragments, colon reveals, repeated slogans, staccato.
- W04: concept A won ("same question, two data states"). Company: invented Kellbrunn Präzisionsteile GmbH (a Handelsregister/DPMA check is still open). Verified spec: `workshop-04/SPEC.md`; single-source dataset `workshop-04/build_dataset.py` → `w04-data.json`. The raw-folder AI answer is always labelled "constructed", factors are "illustrative teaching values". Slug `esg-berichte-mit-ki`, number `04`.

## Status at hand-off

Done in the tree (from the implementation logs in `impl-logs/`):

| Step | Status | Log |
| --- | --- | --- |
| A1 tokens + `src/components/werk/*` primitives (Kicker, SectionHead, CoverBand, GlobeLines, Route, QuestionCard, MaterialList, StatRow, Callout, ButtonLink, Chip, pictograms) | done | A1-foundation.md |
| A2 workshop registry schema (question, outcomes, agenda, needs, notCovered, provenance, material role/phase), rewritten W01-W03 copy, `docs/workshop-standard.md`, workshop-copy.ts strings | done | A2-workshop-schema.md |
| A3 content lint: new VOICE-* slop rules (errors only where 0 hits, else warnings) | done | A3-content-lint.md |
| A4 W01 materials + W02 deck restyled, shared `scripts/workshops/workshop-frame.css`, new card previews | done | A4-static-w01-w02.md |
| A5 W03 demo rebuilt (six beats, final state on load), guide/builder shadows removed, W03 card preview fixed | done | A5-w03-demo.md |
| B1 /workshops hub | done (critique/polish pass pending) | B1-workshops-hub.md |
| B2 /workshops/[slug] detail | done (critique/polish pending) | B2-workshop-detail.md |
| B3 /kurse hub | done (critique/polish pending) | B3-kurse-hub.md |
| B4 course landings + reader chrome | in progress at hand-off | - |
| B5 /demos hub + detail + demos copy | in progress: tsc errors in demo-detail-layout.tsx, demo-grid.tsx, tests/e2e/demos.spec.ts (copy keys renamed, components not yet switched) | - |
| B6 site chrome (nav lang chip, login pill, footer) | not started | - |
| W04 build (deck engine + scenes + presenter, demo, guide/field card/transfer, kit + registry module) | in progress at hand-off; output in `packages/website/public/workshops/esg-berichte-mit-ki/`, `scripts/workshop04/`, `src/lib/workshops-esg-reporting.ts` | - |

## Remaining plan, in order

1. **Finish B5**: switch `src/components/demos/demo-detail-layout.tsx`, `demo-grid.tsx` and `tests/e2e/demos.spec.ts` to the new keys in `src/lib/demos-ui-copy.ts` / demos copy (`bunx tsc --noEmit -p tsconfig.typecheck.json` in packages/website shows the exact errors). Blueprint: design-direction 6.14, 7.5, 7.6.
2. **Finish B4** (course landings): `src/components/course/technical-course-landing.tsx`, `lesson-shell.tsx`, `lesson-reference.tsx`, `kurs/*`. See `research/map-course-surfaces.md` "restyle leverage" and design-direction 7.4.
3. **B6 site chrome**: nav and footer per design-direction section 8.
4. **W04 completion**: deck scenes of acts 4 to end + appendix (spec section b), presenter notes, demo (`scripts/workshop04/build-demo.mjs`), guide.html, field-card.html, transfer.html, kit zip (`scripts/workshop04/kit-archive.mjs`), ASSET_MANIFEST rows for every binary (`node scripts/scaffold-asset.mjs`), card-preview.webp (1024x576 from the deck cover). Engine patches are proven in `deck-skeleton/` and described in `research/map-deck-engine.md`.
5. **Wire W04 into the registry**: append `ESG_REPORTING_WORKSHOP.de/.en` after W03 in `src/lib/workshops.ts` (W03 must stay at index 2), add the slug to `src/lib/analytics/registry.ts` ANALYTICS_WORKSHOP_SLUGS and `src/lib/i18n/content-parity.ts`, update count pins (workshops.test.ts formats/numbers, workshops-content.test.tsx, route-workshops-locales.spec.ts). Full checklist: `research/map-workshop-touchpoints.md`. Mobile WebKit e2e is at 763/768 slots: raise MOBILE_WEBKIT_SHARD_COUNT if new e2e tests are added.
6. **Verify** (repo root): `bun run scan:public`, `bun run content:lint`, then in packages/website `bun run typecheck`, `bun run lint`, `bunx vitest run`, `bun run build`, W03 publication checks (`node scripts/course03/refresh-published.mjs --check`, `node scripts/course03/overrides.mjs check`, `node --test scripts/__tests__/course03-publication.test.mjs`). Re-record `tests/e2e/__screenshots__/visual-regression.spec.ts/courses-desktop.png` because /kurse changed. Lighthouse budgets: accessibility 1.00, total ≤ 1 MiB, LCP ≤ 4.5 s.
7. **Review pass**: screenshot /workshops, each workshop detail, /kurse, two course landings, /demos, one demo, and all W04 materials at 1440 and 390; check against the design direction's removal list.

## Known gate problems at hand-off

- `bun run scan:public` fails on this `docs/overhaul-2026-09/` folder (long mixed-case path tokens read as possible secrets, and TODO-like wording). **Delete `docs/overhaul-2026-09/` before merging**; it exists only to hand the work over.
- The same scanner rule (mixed-case tokens of 40+ characters) fires on `scripts/workshop04/w04-data.json` and would fire on any W04 file that embeds the bill paths, e.g. `rohdaten_2025/Werk_Nord/Strom/2025-11-12_Strom_WN.md`. Fix by shortening/lower-casing the raw file paths in `scripts/workshop04/build_dataset.py` (e.g. `raw/wn/strom-2025-11.md`), re-running it, and rebuilding the demo and kit.
- `data-readiness-kit.zip` (W03, 1.1 MB) shows as a "large binary asset" note; it was already on main.
- Pushed commits named "WIP" are unverified snapshots; CI on them is expected to be red.

## Open questions for the owner

- Courses "too broad": the concrete per-course promises and the overlap analysis are in `research/map-course-surfaces.md` sections 6 and 7 (AI-Native claims ~12 h but its lessons sum to ~5 h; AI-Native Operator spans 39 lessons; DEF and Data Infrastructure overlap on ~6 of 12 topics). Merging or trimming courses was not done and needs a decision.
- W04 company name: run a Handelsregister/DPMA check on "Kellbrunn Präzisionsteile GmbH" and "Talbrück Beschichtung GmbH" before publishing.
- W04 regulation slide: items marked UNVERIFIED in `research/esg-regulation.md` (German CSRD law passage, Green Claims Directive status) must be clicked through or removed before the slide goes live.

## Where things are

- `research/`: the twelve research and mapping reports.
- `workshop-04/`: three concepts, the verified SPEC, the dataset script and JSON.
- `deck-skeleton/`: the verified four-slide W04 deck skeleton (text files only; fonts and images come from the W03 folder).
- `impl-logs/`: per-agent change logs.
