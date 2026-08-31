# Platform Design Audit: 2026 Redesign

Audited 26 August 2026. The route-family inventory below records the intended public coverage and its representative contracts. German routes own the implementation; English routes mirror the same components and require separate locale and route-parity checks. Coverage inventory is not a release-pass claim.

## Audit Standard

A surface earns its space when it does at least one job: orient, require a decision, expose evidence, support revision, or document access and limits. The release gate follows the research and interface contract in [design-research-2026.md](./design-research-2026.md) and [experience-system.md](./experience-system.md).

The audit distinguishes four kinds of proof:

- source and code review;
- deterministic component or route tests;
- provider-free browser behavior;
- provider, authenticated, deployment, and human-review evidence.

One kind never substitutes for another.

## Platform-Wide Findings

| Finding                                                                          | User cost                                                                     | Design decision                                                                                                                                                | Release evidence                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Multiple fixed reading indicators competed for the same state.                   | Visual noise and contradictory progress.                                      | Keep one copper thread at the top of the viewport.                                                                                                             | DOM count, route E2E, mobile and desktop screenshots.             |
| 9–11px metadata, large headings, and 64–80px section gaps appeared together.     | Important state became hard to scan while pages felt both sparse and crowded. | 12px minimum UI labels; 8/12/16/24/32/48px spacing; compact editorial frames.                                                                                  | Source contracts, responsive browser review, overflow checks.     |
| Course and catalogue pages repeated padded cards, badges, and calls to action.   | Choice required reading the same claim several times.                         | One primary action; flat ledgers and relationships; secondary metadata on demand.                                                                              | Route tests, CTA counts, screenshot review.                       |
| XP, streak, badge, and “mark as read” language could be mistaken for competence. | Activity state looked like learning evidence.                                 | Remove visible reward framing; distinguish navigation checkpoints from demonstrated decisions, projects, and assessments.                                      | Copy contracts, progress compatibility tests, course-flow review. |
| Autoplay tickers, pulses, hints, and looping demos competed with the task.       | Attention and motion preference were ignored.                                 | Motion must show causality, feedback, spatial change, or bounded progress; add pause and static fallbacks.                                                     | Motion policy tests, reduced-motion E2E, keyboard control.        |
| Route families used incompatible card, type, shadow, and spacing systems.        | The platform felt assembled rather than authored.                             | Keep Kalkweiß, Druckertinte, Kupfer, Loehrning Sans, Geist Mono, the editorial grid, and the landing globe. Distinguish courses through tasks and instruments. | Shared-token contracts and cross-route visual review.             |
| Strong exercises were frequently below long introductions and mission chrome.    | The product described learning before allowing it.                            | Put the first meaningful choice, experiment, or next proof in the first viewport.                                                                              | 390 × 844 and 1440 × 900 first-action checks.                     |
| Source, method, ownership, access, and limitations were scattered.               | Learners could not judge what a result meant or reuse it responsibly.         | Keep evidence and provenance adjacent to the artifact; collapse details without hiding them.                                                                   | Semantic inspection, link tests, print/export checks.             |

## Implemented Remediation

These are code-reviewed implementation claims. Their focused or aggregate verification status is recorded separately below.

- The global `ScrollProgress` is the only fixed reading indicator. The obsolete route-level reading bars and fixed Lernbegleiter strip are removed.
- The local learning-owner notice now participates in document flow, so it cannot cover a lesson task or compete with the top progress thread.
- Historical completion is migrated once into explicit, non-XP compatibility markers scoped to its current reset epoch, so existing progress and certificate eligibility remain visible without letting an older marker survive a later reset. New post-cutover read clicks cannot create those markers: Foundation and AI-Native lessons require every section checkpoint plus a submitted knowledge check or explicit transfer proof under a versioned evidence checkpoint. Data Engineering and Data Science chapters require an ephemeral, meaningful transfer decision before the same evidence marker can be written.
- Course and blog controls use a 44px independent target floor. UI labels use a 12px floor except named chart annotations, compact static previews, and print-only material.
- Ordinary spacing is capped at 48px. Larger values remain only where a full-height state, sticky offset, deliberate hero scene, or document rendering requires them.
- Passive cards, error states, completion notices, and calls to action are flat. Shadows remain for overlays, draggable objects, and the active instrument plane.
- The superseded AI-Native Operator progress component and its stale route assertion are removed; technical course landings share one progress implementation.

### 2026-08-30 addendum — design system reunification

This audit's "Route families used incompatible card, type, shadow, and spacing systems" finding was itself only partly remediated as of 26 August: `--color-brand-lilac` and three purple-tinted `globals.css` gradient washes (`.site-atmosphere`, `.berlin-hero`, `.berlin-footer`) shipped through PR #59 unremoved, reintroducing exactly the "purple glow" and "gradient ambience" anti-patterns [design-research-2026.md](./design-research-2026.md#ai-slop-signals-rejected) already named as rejected. A follow-up pass:

- retired `brand-lilac` from every call site and from `@theme`, replacing it with `brand-peach` (and `brand-pink`/`brand-teal` where an array already used peach) so no two tones in the same array collide;
- removed the three gradient-wash classes entirely rather than re-tinting them (`.berlin-hero` was later restored on request: the globe has no light of its own, so removing its radial left the sphere reading as a bare wireframe on flat paper. It is scoped to the hero alone, never a site-wide backdrop, and its colour literals are inlined so it cannot resurrect the retired token) — a prior attempt (`0de0b40`) removed only a decorative blob and left `.berlin-hero`'s radial in place, which this pass does not repeat;
- extended the expressive palette to `/einstieg`, `/hilfe`, `src/components/course`, and the `/demos` index, which previously carried zero expressive tokens.

This does not re-run or re-date the rest of this audit; the release gate table below is unchanged except where it names shadow or palette contracts this pass touched directly.

## Route-Family And Test Evidence Ledger

Listed contracts identify the intended evidence surface. A file's presence does not mean its current full suite passed; only results explicitly marked `PASS` below are verified for this review state.

| Route family                                | Representative deterministic contracts                                                                                                                                                                                                                                                                                                                                               | Representative browser contracts                                                                                                                                                                                                                                                                                                               | Current release evidence                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Global chrome, home, and course atlas       | [`nav.test.tsx`](../src/components/__tests__/nav.test.tsx), [`scroll-progress.test.tsx`](../src/components/ui/scroll-progress.test.tsx), [`hero.test.tsx`](../src/components/home/hero.test.tsx), [`reduced-motion-reveals.test.tsx`](../src/components/home/reduced-motion-reveals.test.tsx), [`learning-atlas.test.tsx`](../src/app/kurse/learning-atlas.test.tsx)                 | [`home-journey.spec.ts`](../tests/e2e/home-journey.spec.ts), [`route-home-locales.spec.ts`](../tests/e2e/route-home-locales.spec.ts), [`route-kurse-hub.spec.ts`](../tests/e2e/route-kurse-hub.spec.ts), [`motion-control.spec.ts`](../tests/e2e/motion-control.spec.ts)                                                                       | `NOT RUN` as a final aggregate gate.                                                                                          |
| Foundation lessons and technical courses    | [`foundation-course-block-actions.test.tsx`](../src/app/foundation-course-block-actions.test.tsx), [`lesson-mission-content-contract.test.ts`](../src/lib/course-projects/lesson-mission-content-contract.test.ts), [`progress-surface-contract.test.ts`](../src/components/course/kurs/progress-surface-contract.test.ts), [`migrate.test.ts`](../src/lib/progress/migrate.test.ts) | [`course-workspace.spec.ts`](../tests/e2e/course-workspace.spec.ts), [`route-data-engineering-fundamentals.spec.ts`](../tests/e2e/route-data-engineering-fundamentals.spec.ts), [`route-data-science.spec.ts`](../tests/e2e/route-data-science.spec.ts), [`technical-course-landings.spec.ts`](../tests/e2e/technical-course-landings.spec.ts) | `PASS` for the focused CTA contract within the 69/69 Vitest result; final aggregate gate is `NOT RUN`.                        |
| Workshops                                   | [`workshop-decision-lab.test.tsx`](../src/app/workshops/%5Bslug%5D/workshop-decision-lab.test.tsx), [`workshops-content.test.tsx`](../src/app/workshops/workshops-content.test.tsx)                                                                                                                                                                                                  | [`workshops.spec.ts`](../tests/e2e/workshops.spec.ts), [`route-workshops-locales.spec.ts`](../tests/e2e/route-workshops-locales.spec.ts)                                                                                                                                                                                                       | `NOT RUN` as a final aggregate gate.                                                                                          |
| Books and editorial                         | [`buecher-content.lcp.test.tsx`](../src/app/buecher/buecher-content.lcp.test.tsx)                                                                                                                                                                                                                                                                                                    | [`buecher-library.spec.ts`](../tests/e2e/buecher-library.spec.ts), [`buecher-reader-mobile.spec.ts`](../tests/e2e/buecher-reader-mobile.spec.ts), [`route-books-locales.spec.ts`](../tests/e2e/route-books-locales.spec.ts)                                                                                                                    | `PASS` for the focused book contract within the 69/69 Vitest result; final aggregate gate is `NOT RUN`.                       |
| Demos                                       | [`demo-design-contract.test.ts`](../src/components/demos/demo-design-contract.test.ts), [`autoplay-visibility.test.tsx`](../src/components/demos/autoplay-visibility.test.tsx), [`motion-policy-contract.test.ts`](../src/lib/motion-policy-contract.test.ts)                                                                                                                        | [`demos.spec.ts`](../tests/e2e/demos.spec.ts), [`a11y-reduced-motion.spec.ts`](../tests/e2e/a11y-reduced-motion.spec.ts)                                                                                                                                                                                                                       | `NOT RUN` as a final aggregate gate.                                                                                          |
| Account, access, open source, legal, errors | [`konto/datenschutz/page.test.tsx`](../src/app/konto/datenschutz/page.test.tsx), [`account-deletion-control.test.ts`](../src/lib/progress/account-deletion-control.test.ts), [`security-headers.test.ts`](../src/lib/security-headers.test.ts)                                                                                                                                       | [`account-datenschutz.authed.spec.ts`](../tests/e2e/account-datenschutz.authed.spec.ts), [`route-open-source.spec.ts`](../tests/e2e/route-open-source.spec.ts), [`legal.spec.ts`](../tests/e2e/legal.spec.ts), [`route-matrix.spec.ts`](../tests/e2e/route-matrix.spec.ts)                                                                     | `PASS` for the focused reset-name contract within the 69/69 Vitest result; authenticated/provider behavior remains `NOT RUN`. |

## Route-Family Decisions

### Global chrome

- Preserve the broad loehrning.ai identity and top navigation structure.
- Replace glass, shadow, pill, and decorative state treatments with flat structural boundaries.
- Keep one visible active-route signal and one global scroll thread.
- Preserve keyboard menus, inert ownership, locale switching, auth state, and 44px controls.

### Landing page

- Preserve the globe as the only spatial identity anchor.
- Remove live clocks, geographic side instruments, trust chips, duplicated actions, and content parallax.
- Run one finite desktop globe transition without an overlay control; keep mobile and reduced-motion states static.
- Route directly into the course atlas, then show Learn / Check / Apply as a compact register.

### Course atlas and entry pages

- Replace persona filters and duplicated catalogues with a goal selector, one recommended next proof, and the complete route map.
- Preserve every localized route, access boundary, certificate fact, source revision, and progress signal.
- Present the course atlas as a teaser with cover art and tonal differentiation, not the administrative ledger this audit originally specified -- reversed four days after this audit once the ledger read as flat and text-heavy in practice. All ten courses remain discoverable and every load-bearing progress/status hook is preserved; only the "no images, no card grid" framing changed.

### Lessons and workspaces

- Expose three learner-facing beats: Commit, Test, Revise. Internal persisted workflows may keep more states.
- Preserve each course’s actual engine, exercise, simulator, progress compatibility, and failure boundaries.
- Make reference prose subordinate to the active decision and keep side navigation collapsible and keyboard-operable.
- Do not equate a visit or read click with mastery.

### Workshops

- Begin with a bounded decision and immediate explanatory feedback.
- Keep reusable materials, provenance, reset behavior, and video as a future debrief surface with a named purpose.
- Remove decorative workshop imagery when it does not change the task.

### Books and editorial

- Preserve reading measure, print behavior, cover priority, chapter navigation, JSON-LD, source notes, and PDF/account truth.
- Remove duplicate reading progress and ambient editorial motion.
- Keep book selection compact and authored; keep chapters conventional enough for sustained reading.

### Demos

- Treat each demo as a controlled model with assumptions, execution mode, external actions, and abort conditions.
- Stop autoplay after one bounded explanatory run unless the learner explicitly restarts it.
- Preserve loading motion and user-triggered causal animation; remove ambient loops.

### Account, access, identity, and open source

- Keep auth, CAPTCHA, redirects, deletion, export, feedback privacy, licenses, downloads, and provider boundaries explicit.
- Use compact evidence rows and project ledgers instead of reward cards and marketing grids.
- Keep legal descriptions of historical progress data accurate even when that data is no longer promoted in the interface.

### Information, legal, error, and empty states

- Keep these surfaces conventional, terse, semantic, and locally explicit.
- Collapse examples and secondary explanations; never collapse the current limitation, legal duty, or recovery action.
- Experimental interaction is excluded when it has no task.

## Non-Goals

- A universal visual style claimed to be “most engaging.” No such evidence exists.
- Decorative novelty, scroll hijacking, generic chat, synthetic testimonials, fake live state, or unfamiliar navigation.
- Rewriting legal truth, fabricating provider proof, or treating local tests as deployment evidence.
- Replacing a course’s working learning engine merely to make screenshots look uniform.

## Release Gate Status

Statuses describe only the verified shared context at the time of this audit. Partial evidence never promotes an aggregate gate to `PASS`.

| Gate                                                                                                | Status           | Exact evidence or boundary                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Focused repeated-control accessible-name contracts                                                  | `PASS`           | `bun run test -- src/app/buecher/buecher-content.lcp.test.tsx src/app/konto/datenschutz/page.test.tsx src/app/foundation-course-block-actions.test.tsx` completed with 3 files and 69/69 tests.                                      |
| Focused formatting and bounded diff hygiene                                                         | `PASS`           | Prettier passed for the eight files in that bounded lane; `git diff --check` passed when the lane concluded.                                                                                                                         |
| Design-document formatting, relative links, and whitespace                                          | `PASS`           | Prettier passed for all three design documents; every relative document and contract link resolved; untracked-file whitespace checks passed.                                                                                         |
| Full static validation and full unit suite                                                          | `NOT RUN`        | No final stable-tree result is recorded in this audit.                                                                                                                                                                               |
| Production build and final receipt freshness                                                        | `NOT RUN`        | A provider-free receipt exists with build ID `GKMLfpXOqA9TLsNvsLngt`, 1,991 inputs, and 2,485 artifacts. Its existence does not prove freshness after subsequent edits.                                                              |
| Complete Chromium, mobile Chromium, and WebKit matrix                                               | `NOT RUN`        | Receipt-gated provider-free run `run-32932-e6aee77f-1dd` was still active at audit time. Chromium, mobile Chromium, both specialist Chromium projects, and mobile WebKit shards 01–09 had passed; no complete matrix result existed. |
| Keyboard, focus, touch target, reduced motion, axe, overflow, console, hydration, and locale parity | `NOT RUN`        | Focused contracts and partial browser shards exist, but no final aggregate result is recorded.                                                                                                                                       |
| Post-redesign screenshots at 390, 768, 1024, and 1440px                                             | `HUMAN REQUIRED` | The pre-redesign baseline is not post-redesign visual approval. A human must inspect representative route-family screenshots.                                                                                                        |
| Evidence-domain boundary documentation                                                              | `PASS`           | This audit labels local provider-free evidence separately. It makes no live-provider, authenticated, Preview, production, or deployment claim.                                                                                       |
| Target-learner usability and learning-outcome validation                                            | `HUMAN REQUIRED` | No target-learner study, disabled-participant accessibility study, learning-outcome study, or human rehearsal is represented by repository tests.                                                                                    |
| Final diff, leak scan, root hygiene, current-main comparison, commit, push, and review PR           | `NOT RUN`        | The three design documents are untracked during this audit, and no final branch or PR evidence is recorded here.                                                                                                                     |
