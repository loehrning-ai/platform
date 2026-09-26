# Map: every repo touchpoint for Workshop 04 and for a new workshop hub/detail layout

Repository: `/home/user/platform` (app in `packages/website`). Date of survey: 2026-09-26.
Nothing inside the repository was modified. All paths below are repo-relative unless absolute.

Proposed identity for the new workshop (used in examples below, change freely):

| Field | DE | EN |
| --- | --- | --- |
| `slug` | `esg-berichte-mit-ki` | same |
| `number` | `"04"` | same |
| `topic` | `ESG-Berichte` | `ESG reporting` |
| `eyebrow` | `Workshop 04 · ESG-Berichte` | `Workshop 04 · ESG reporting` |
| data module | `src/lib/workshops-esg-reporting.ts` exporting `ESG_REPORTING_WORKSHOP: Readonly<Record<Locale, Workshop>>` (same pattern as `workshops-data-readiness.ts`) | |

Slug checks: lowercase kebab, 19 chars, passes the analytics `SAFE_VALUE = /^[a-z0-9][a-z0-9_-]{0,47}$/`, contains no ASCII umlaut word, and is not a mixed-case 40+ char token (the scanner's base64-secret heuristic).

---

## 0. The ten things most likely to break (read first)

1. **The public scanner forbids PDF, XLSX, DOCX and PPTX anywhere in the repo.** `packages/website/scripts/open-source/scan-export.mjs:121-126` puts `docx, pdf, pptx, xlsx` in `FAIL_CLOSED_PLATFORM_CONTAINER_EXTENSIONS`, which fails with "is an opaque or active container and is forbidden without a format-specific publication validator". `git ls-files '*.pdf' '*.xlsx' '*.docx' '*.pptx'` returns nothing today. The sibling research (`research/esg-ai-practice.md`, `research/workshop-standard.md`) plans "12 PDFs" of invoices and a "field card ... plus PDF". None of that can be committed. Follow the W02 precedent: render document pages as WebP images (`geschaeftsberichte-mit-ki-lesen/assets/report/northwind-p0X.webp`) and ship text (Markdown, CSV, HTML) in the kit. Print-to-PDF stays something the learner does in the browser.
2. **ZIP kits may contain only text files.** `zip-inspection.mjs:886-889` fails any entry whose extension is not in `ARCHIVE_TEXT_EXTENSIONS` (cjs, css, csv, graphql, gql, hbs, html, ini, js, json, jsonc, jsx, md, mdx, mjs, mts, py, scss, sh, sql, svg, toml, ts, tsx, txt, yaml, yml). Nested archives also fail. HTML/JS/SVG inside the ZIP must not contain `fetch(`, `XMLHttpRequest`, `localStorage`/`sessionStorage`, `document.cookie`, `window.open(`, `location =`, `eval(`, `new Function(`, `innerHTML =`, `insertAdjacentHTML` or `document.write(` (`zip-inspection.mjs:85-100`). The limits are 512 entries and 32 MB. Root instruction basenames (`claude.md`, `agents.md`, `notes.md`, `todo.md` …) are blocked inside archives.
3. **Every binary file needs an `ASSET_MANIFEST.json` row** with the exact `sizeBytes` and `sha256`, plus `owner`, `source`, `license` and `redistribution`. Binary means `card-preview.webp`, `.woff2`/`.ttf` fonts, `.jpg`/`.png`/`.webp` images and `.zip` kits. Without a row the scanner reports "recognized binary is missing from ASSET_MANIFEST.json" as a FAIL. A row without a matching file fails as "stale ASSET_MANIFEST.json entry". Text assets (html/md/svg/txt/vtt) may have a row; if they do, the hash must match.
4. **The German and English catalogs must list identical materials.** `workshops.test.ts:234-283` requires the same `href`, `kind` and `language` in the same order in both locales. A German-only material on the DE page next to an English-only one on the EN page will not pass as written.
5. **All materials are currently asserted to be English.** Four places assume it: `workshops.test.ts:285-296` ("states that every currently published material is English"), `route-workshops-locales.spec.ts:167-182` (the "Language: English" and "Sprache: Englisch" counts must equal `materialCount`), `workshops-data-readiness.test.ts:24`, and `analytics-reading-rules.md`. German materials for W04 mean relaxing these tests.
6. **`duration` must be exactly `~90 Minuten` / `~90 minutes`** (`workshops.test.ts:82-84`). `accessNote` may have at most 2 sentences (`:87`). `summary` may have at most 160 characters (`:59-68`). The `formats` array is index-based and needs a 4th entry (`:71-74`).
7. **W04 must be appended after W03.** `workshops-data-readiness.test.ts:15,35-36` reads `getWorkshops(locale)[2]` and expects Data Readiness.
8. **The decision lab labels are fixed for every workshop** (`workshop-decision-lab.test.tsx:67-80`): `kicker` matches `/^Entscheidung 01 · /` and `/^Decision 01 · /`, `decisionLegend` is "Deine erste Entscheidung" / "Your first decision", `evidenceLegend` is "Der stärkste Beleg" / "The strongest evidence", and `submitLabel` is "Entscheidung prüfen" / "Check decision". `facts` must have exactly 3 entries (`workshops.test.ts:172`). Use 3 choices and 3 evidence items so the anti-answer-on-top shuffle always finds a valid order.
9. **No typographic dashes in W04 copy.** `machine-surfaces/workshops.test.ts:177-179` and `api/workshops.json/route.test.ts:73-76` fail on U+2014 and U+2013 anywhere in the payload. `content-lint` errors on em dashes in every `src/lib/*.ts`, and on en dashes except in digit–digit ranges.
10. **The local mobile-WebKit shard budget is almost full.** `scripts/run-e2e-suite.mjs:18` has `MOBILE_WEBKIT_SHARD_COUNT = 24`, and `scripts/__tests__/run-e2e-suite.test.mjs:137-158` caps each shard at 32 tests, so 768 in total. The project currently lists **763** tests (measured with `playwright test --project=mobile-webkit --list`). Adding more than 5 new `test()` calls fails `bun run --cwd packages/website test:e2e-suite-contract`, which is part of `verify:static`. Raise the shard count to 25 or 26, or extend existing loops inside a test instead of adding `test()` calls. (CI's own matrix in `.github/workflows/ci.yml:162-168` uses 7 WebKit shards with no cap.)

---

## 1. Baseline: read-only checks run during this survey (all green)

| Command | Result |
| --- | --- |
| `node packages/website/scripts/generate-english-route-mirror.mjs --check` | `Verified 174 English route modules.` |
| `bun packages/website/scripts/generate-page-inventory.mjs --check` | `inventory is current` |
| `node packages/website/scripts/export-registry.mjs --check` | `Verified 31 approved date strings in src/lib/legal-registry.json.` |
| `bun scripts/verify-lighthouse-routes.ts` | `32 configured routes, 26 static routes, 6 dynamic patterns` |
| `node scripts/scan-public-candidate.mjs` (TMPDIR set to scratchpad) | passed, 2740 files, 1 asset note (the 1.1 MB W03 zip) |
| `node scripts/course03/refresh-published.mjs --check` | `Published Data Readiness workshop is up to date.` |
| `node packages/website/scripts/content-lint.mjs` | 0 errors, 141 warnings (W03 module has 5 `DEMO-LABEL-WARN`; `workshops.ts:285` has one `VOICE-AMBIGUOUS`) |
| `curl localhost:3000/api/workshops.json` | count 3: W01 6 materials, W02 2, W03 3 |

The dev server's static workshop HTML gets the site CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' …; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; … frame-src 'none'`, plus `cache-control: public, max-age=3600, s-maxage=3600`.

---

## 2. Part A: ordered checklist to add Workshop 04

Legend: **[MUST]** = a type error or failing test/gate if skipped. **[SHOULD]** = keeps a surface honest or complete; nothing fails. **[GEN]** = generated file with its regen command. **[NONE]** = derived automatically; listed so nobody edits it by hand.

### A1. Catalog data (source of truth)

**A1.1 [MUST] `packages/website/src/lib/workshops.ts`**
- Line 132: `readonly number: "01" | "02" | "03";` becomes `"01" | "02" | "03" | "04"`.
- Line 16: `import { DATA_READINESS_WORKSHOP } from "./workshops-data-readiness";`. Add `import { ESG_REPORTING_WORKSHOP } from "./workshops-esg-reporting";`.
- Lines 969-974:
  ```ts
  export const WORKSHOPS_BY_LOCALE = {
    de: [...WORKSHOPS_DE, DATA_READINESS_WORKSHOP.de],
    en: [...WORKSHOPS_EN, DATA_READINESS_WORKSHOP.en],
  };
  ```
  Append `ESG_REPORTING_WORKSHOP.de` / `.en` **after** the Data Readiness entry.
- Header comment (lines 4-12) says "der Prognose-Workshop liefert fünf, der Analyst-Workshop zwei" (it is actually six now). Optional wording fix.
- If W04 needs a material kind other than `html | zip | csv` (for example `md` or `json`), line 53 `readonly kind: "html" | "zip" | "csv";` must grow, and so must A2.1, A4.x, B2.3 and A5.1 (see §5). Recommendation: **stay with html, csv and zip.**

**A1.2 [MUST] new `packages/website/src/lib/workshops-esg-reporting.ts`**
Model it on `workshops-data-readiness.ts`: `import type { Workshop } from "./workshops"` (type-only, so no import cycle), and use `const base = "/workshops/esg-berichte-mit-ki";`. Fill every `Workshop` field in both locales and satisfy these tests:
- `eyebrow === \`Workshop 04 · ${topic}\`` (workshops.test.ts:79-81).
- `summary` at most 160 characters in both locales (:59-68).
- `duration` is `~90 Minuten` / `~90 minutes` (:82-84), unless that test changes.
- `format` must differ between DE and EN (`machine-surfaces/workshops.test.ts:50`). Examples: "Selbstlern-Kit" / "Self-study kit", or "Interaktiver Kurs" / "Interactive course".
- `outcome` is non-empty. `accessNote` has at most 2 sentences (the split is `/(?<=\.)\s+/`).
- 5 to 7 `steps` with non-empty `n`, `title`, `description`, `tool` (:139-167). EN and DE step `n` lists must be equal (:245-247).
- `decisionLab`: exactly 3 `facts`, at least 2 unique choices and 2 unique evidence items (use 3 + 3), `recommendedChoiceId` and `strongestEvidenceId` present among them, and no words `localStorage|sessionStorage|cookie|upload` anywhere in the lab JSON (:169-191). Fixed labels as in §0.8. Choice and evidence ids must be identical in both locales (:270-281).
- `caseStudy`: `isFictional` boolean, non-empty narrative, metrics, `decisionQuestion`, `dataLimitations` (:193-210). DE and EN metric counts and limitation counts must match (:261-266). Keep the practice case **synthetic**: learning-graph and knowledge-graph hard-code `evidenceMode: "synthetic"` for every workshop, and `graph.test.ts:42` asserts it.
- Optional `realWorldCase`, for example a public CSRD/ESRS sustainability statement. It needs non-empty `companyName`, `source`, `decisionQuestion` and metrics, an `https` `sourceHref`, `sourceReviewedAt` as `YYYY-MM-DD`, and a non-empty `sourceLimitation` (`workshops.test.ts:107-122`, `machine-surfaces/workshops.test.ts:119-137`). It must be present in both locales or in neither (:267-269). Do not redistribute the report: link only, as W02 does with Meta.
- `materials`: at least one. Every `href` starts with `/workshops/esg-berichte-mit-ki/` and exists under `public/` (the `#fragment` is stripped) (:212-232). Labels must not match `/\(|\)|Englisch|English|öffnen|\bOpen\b/`. A non-HTML label must end with `.zip` or `.csv`, for example `ESG-Kit · .zip` (:88-93). `description` is non-empty (`machine-surfaces` :77).
- Copy hygiene: no U+2014 or U+2013 (§0.9). Emails only `@example.com`, `*.example`, `*.invalid` or `@loehrning.ai`. No real-looking DE phone numbers. None of the banned dummy names (`Max Mustermann|Müller Maschinenbau|…|Schmidt GmbH|Meier AG|Keller KG`) (`public-content-claims.test.ts:146-181`). No banned phrases (`Mehrwert`, `Wettbewerbsvorteil`, `zukunftssicher`, `KI-Transformation`, `Paradigmenwechsel`, …; `content-lint.mjs:147-161`). Avoid "Demo" as a German label (warn; the canonical label is "Praxisbeispiel"). No `fuer`/`moeglich`-style ASCII umlauts in prose.
- The catalog regex `workshops.test.ts:298-305` needs `übertragen werden` and `may be transferred` somewhere in the whole catalog. W02 already supplies them, so this only matters if W02 copy changes.

### A2. Registries that hand-mirror the catalog

**A2.1 [MUST] `packages/website/src/lib/analytics/registry.ts:92-97`**
```ts
/** Mirror of the workshop slugs in src/lib/workshops.ts. */
export const ANALYTICS_WORKSHOP_SLUGS = [
  "ki-prognosen-einschaetzen",
  "geschaeftsberichte-mit-ki-lesen",
  "datenbereitschaft-fuer-ki",
] as const;
```
Add `"esg-berichte-mit-ki"`. The guard is `analytics/contract.test.ts:284-290` ("workshop slugs equal the workshop catalogue in every locale"). Without the slug, `workshop-material-link.tsx:18-35` silently sends no `material_opened` event for W04. A new material kind must also go into `ANALYTICS_MATERIAL_KINDS` (line 101), because a `expectTypeOf` equality with `WorkshopMaterial["kind"]` enforces it (contract.test.ts:292-299).

**A2.2 [MUST] `packages/website/src/lib/i18n/content-parity.ts:60-63`**
```ts
  "/workshops",
  "/workshops/datenbereitschaft-fuer-ki",
  "/workshops/geschaeftsberichte-mit-ki-lesen",
  "/workshops/ki-prognosen-einschaetzen",
```
Add `"/workshops/esg-berichte-mit-ki"`. Without it, `machine-surfaces/workshops.test.ts:58` fails (`available_locales` must be `["de","en"]`). The detail page would also get no hreflang alternates, the sitemap would get no `/en/…` record (`sitemap.ts:49`), and `/api/workshops.json` and knowledge-graph would omit the `en` copy.
- [SHOULD] `src/lib/i18n/content-parity.test.ts:64-66` lists W01 and W02 but not W03. Adding W03 and W04 there is optional.

**A2.3 [SHOULD] `packages/website/src/lib/learning-graph/data.ts`**
- Lines 177-178: `level: workshop.slug === "datenbereitschaft-fuer-ki" ? "entry" : "intermediate",`. W04 falls through to `"intermediate"`, which is fine for an applied ESG workshop.
- Lines 299-307: the edge target is chosen by `workshop.slug === "ki-prognosen-einschaetzen" ? "course:data-science" : workshop.slug === "datenbereitschaft-fuer-ki" ? "course:data-engineering-fundamentals" : "course:ai-native"`. W04 falls through to `course:ai-native`. Extend the ternary if another practice course fits better, for example `course:data-science` for data cleaning or `course:eu-ai-act-kurs` for regulation. The target must be an existing node id.
- Line 172: `language: "de"` is hard-coded and `graph.test.ts:40` asserts it. Keep it.

**A2.4 [SHOULD, optional] `packages/website/src/lib/courses/tracks.ts`**
`BRAINSTER_COURSE_CATALOG` (lines 30-56) and `COURSE_FACTS` entries (lines 246-267) list only W01 (`ai-forecasting`) and W02, with the badge `"Workshop · DE + EN"`. W03 is **not** there. Only `tracks.test.ts` reads this catalog (no UI renders it), so adding W04 changes nothing visible. If you add it, `tracks.test.ts:34-42` requires a matching `COURSE_FACTS[slug]` with `record: "none"` and `group: "deeper"`.

### A3. Static bundle `packages/website/public/workshops/esg-berichte-mit-ki/`

**A3.1 [MUST] `card-preview.webp`, 1024×576**
The hub (`workshops-content.tsx:192-203`, `src={\`/workshops/${workshop.slug}/card-preview.webp\`}`) and the detail OG image (`[slug]/page.tsx:35-40`) both use it. A missing file means a broken image and console errors, which fails `route-matrix` and `workshops` e2e checks that assert no console errors. Precedent sources in the manifest: "Chromium screenshot of the course cover, resized to 1024 by 576 pixels" (W03) and "Bildschirmaufnahme des eigenen Workshop-Decks (slides.html)" (W02). Resize with `sharp`, which is a devDependency.

**A3.2 [MUST] every material file referenced by `materials[].href`**
`workshops.test.ts:224-227`, `machine-surfaces/workshops.test.ts:78-81` and `api/workshops.json/route.test.ts:62-69` check `existsSync(public/<href without #>)`.

**A3.3 [MUST] conventions for static HTML materials**
- `src/lib/workshops-static-links.test.ts:16-28`: no `href` in any `public/workshops/**/*.html` may end with `/`. The comment reads "the site does not serve index.html for a folder". Link `./case/index.html`, never `./case/`.
- The CSP on static files (from `security-headers.ts:269-289`, applied via `next.config.ts` headers) forbids inline event handlers (`script-src-attr 'none'`), so use `addEventListener`. It also forbids external scripts, fonts, styles and images (only `'self'` and `data:`), iframes (`frame-src 'none'`), being iframed (`frame-ancestors 'none'`), and `fetch` to other origins (`connect-src 'self'` plus Supabase/Sentry). Inline `<script>` and `<style>` are allowed: static files are the `public-assets` class, get no nonce (`proxy.ts:66-70`), and fall back to `'unsafe-inline'`. Self-host fonts. The site-wide `/fonts/loehrning-sans-*-v1.woff2` files are already in `ASSET_MANIFEST.json` and can be referenced by absolute path, which avoids new binary rows.
- The shared "workshop family" frame introduced in commit 6f2617a is a `<header class="wf-strip" data-wf-slug="<slug>">` with a brand link, "← Back to workshop" and "Workshop-Seite auf Deutsch" links, numbered `wf-mats` material tabs, a skip link, a footer, and a referrer-based German swap script. See `public/workshops/datenbereitschaft-fuer-ki/guide.html:68-106` and `ki-prognosen-einschaetzen/lib/wf.css`. W04 pages should reuse it. The material link opens HTML in the **same tab** (`workshop-material-link.tsx:41-45`) and relies on each page's own back link.
- Caching: `/workshops/:slug/assets/:path*` is immutable for a year (`crawl/contract.ts:285-288`). Put only never-changing, content-named files there (fonts, images). Everything else under `/workshops/:slug/:path*` revalidates hourly (`contract.ts:293-298`).
- Forbidden names or dirs in the public tree (`export-denylist.mjs:86-140`, `verify-publication-clean.mjs`): basenames `claude.md`, `agents.md`, `agent.md`, `integration.md`, `notes.md`, `todo.md`, `todos.md`, `*.local.md`, `discuss-*.md`; a path segment `plans`; dot-dirs `.claude`, `.cursor`, …; dirs named `build`, `dist`, `out`, `coverage`. W03 uses `agent/CLAUDE.example.md` as the safe variant.
- Scanner text rules (FAIL): no absolute local user paths (`/Users/…`, `/home/…`); no `plans/…` or `plan-0NN` references; no `TODO.md`/`RUNBOOK.md` mentions; no 40+ char token mixing lower case, upper case and digits (for example a file name like `ESG-Report-2025-Scope3-Emissions-Q4-Draft-v2`) outside an absolute `https://` URL path. Pricing words (`Preis`, `EUR 5`) are advisory only.

**A3.4 [MUST if a kit ships] `*.zip`**
Text-only entries, the unsafe-active-content rules, no nested archives, UTF-8, safe Unix modes (§0.2). The label must end with `.zip` (for example `ESG-Kit · .zip`). It needs an `ASSET_MANIFEST.json` row, and a file above 1 MB shows as an "ASSET" note. Suggested addition (not required): a W04 kit security test modelled on `scripts/open-source/__tests__/northwind-kit-security.test.mjs`, which reads the zip through `inspectZipArchive` and asserts no HTML sinks.

**A3.5 [SHOULD] a bundle manifest and a W04 test file** mirroring `workshops-data-readiness.test.ts`: a file inventory with sha256 (`bundle-manifest.json`), local HTML/CSS reference resolution (:74-86), and "no network request" checks for any demo adapter (:107-122). This is how W03 keeps the static bundle honest. If W04 is generated from a source folder like W03, a `scripts/course04/…` pipeline plus a root `test:course04-publication` script can follow `scripts/course03/*` and `package.json:32`.

### A4. `ASSET_MANIFEST.json` (repo root)

**A4.1 [MUST] one row per binary file of W04** (card preview, images, fonts, zip):
```json
{
  "path": "packages/website/public/workshops/esg-berichte-mit-ki/card-preview.webp",
  "sizeBytes": 0,
  "sha256": "<64 lowercase hex>",
  "owner": "Tim Löhr",
  "source": "Chromium screenshot of the workshop cover, resized to 1024 by 576 pixels",
  "license": "LicenseRef-Loehrning-Brand",
  "redistribution": "Included for loehrning.ai course operation; no standalone reuse rights granted"
}
```
- Generate each row with `node scripts/scaffold-asset.mjs packages/website/public/workshops/esg-berichte-mit-ki/card-preview.webp --owner "Tim Löhr" --source "…" --license LicenseRef-Loehrning-Brand --redistribution "…"` (root script `bun run asset:record -- …`). It **prints** the JSON row; paste it into `assets[]` by hand.
- Fonts: OFL rows with `"license": "OFL-1.1"`. Ship the OFL notice text next to them (W03 ships `assets/fonts/OFL-1.1.txt`). Existing rows carry `redistributionLicenseHref`.
- Verify with `bun run scan:public` (root). The schema rules are in `scan-export.mjs:1125-1200`: normalized POSIX path, 64-hex sha256, positive safe-integer size, the four metadata strings, no duplicates.
- The top-level `"generated": "2026-08-24"` was not bumped when W03 was added. Nothing enforces it.

### A5. Unit tests (Vitest, `packages/website/src/**`) to update

**A5.1 [MUST] `src/lib/workshops.test.ts`**
- :71-74 formats per index:
  ```ts
  const formats = {
    de: ["Selbstlern-Kit", "Selbstlern-Kit", "Interaktiver Kurs"],
    en: ["Self-study kit", "Self-study kit", "Interactive course"],
  } as const;
  ```
  Append W04's DE and EN format.
- :77 `expect(workshops.map(({ number }) => number)).toEqual(["01", "02", "03"]);` becomes `["01","02","03","04"]`.
- :82-84: fixed `~90 Minuten` / `~90 minutes` for all. Keep W04 at 90 or make this per workshop.
- :285-296 "states that every currently published material is English". Relax it if W04 ships German files.
- Everything else iterates `WORKSHOPS` and applies to W04 automatically (§A1.2 constraints).

**A5.2 [MUST] `src/app/workshops/workshops-content.test.tsx`** (hub; rewrite anyway with §B)
- :38 `expect(screen.getByText(/3 guided cases/))` becomes `/4 guided cases/`, or whatever the new intro says.
- :40 `toHaveLength(3)` rows becomes 4. :46-50 heading texts: add `"Workshop 04: <EN title>"`.
- :63-67 outputs `["Go/no-go rule","Metrics skill + dashboard","Five-field template"]`: add W04's EN `outcome`.
- :68-72 row ids: add `"workshop-esg-berichte-mit-ki"`.
- :80-84 index links `[["01Forecasts","#workshop-…"], …]`: add `["04ESG reporting","#workshop-esg-berichte-mit-ki"]`.
- :125 `[data-decision-card]` `toHaveLength(3)` and :127 `img` `toHaveLength(3)` become 4.

**A5.3 [NONE, unless order changes] `src/lib/workshops-data-readiness.test.ts`**
Pins W03 at index `[2]` with exactly 3 materials. It keeps passing if W04 is appended.

**A5.4 [NONE, auto-covered] tests that loop over every workshop and therefore test W04 without edits**
`machine-surfaces/workshops.test.ts` (materials exist, `kind ∈ {html,zip,csv}`, locales `["de","en"]`, graph node `workshop:<slug>` with `access` `public`, no dashes), `api/workshops.json/route.test.ts`, `learning-graph/data.test.ts:194-207`, `learning-graph/graph.test.ts:23-50`, `app/__tests__/sitemap.test.ts:35-60,202-213`, `analytics/contract.test.ts:284-299`, `workshop-decision-lab.test.tsx:25-49` (SSR inert, 2 fieldsets) and `:149-180` (option order), `mcp/tools/registry.test.ts:216-235`, `content-freshness.test.ts`.

**A5.5 [SHOULD] `src/lib/i18n/content-parity.test.ts:64-66`**: add the W03 and W04 paths to the list of reviewed parity paths (optional).

**A5.6 [MUST only if a legal claim is added] `src/lib/legal-registry.test.ts:13`**: `expect(LEGAL_CLAIMS.length).toBe(42);` (see A7.4).

### A6. End-to-end specs (`packages/website/tests/e2e/`)

**A6.1 [MUST] `route-workshops-locales.spec.ts:4-29`**, `WORKSHOP_ROUTES`:
```ts
  { path: "/workshops/datenbereitschaft-fuer-ki", deHeading: "Sind deine Daten bereit für KI?", enHeading: "Are your data ready for AI?", materialCount: 3 },
```
Add `{ path: "/workshops/esg-berichte-mit-ki", deHeading: <DE title>, enHeading: <EN title>, materialCount: <n> }`. This adds no new `test()`: the loop runs inside the 4 per-width tests. It asserts HTTP 200, `html[lang]`, no overflow at 320/390/768/1440 px, the count of `main a[href^="/"]` matching `/\.(?:html|zip|csv)$/` (:125-127, so a new extension must be added here), material hrefs not under `/en/`, EN page links all `/en…`, the canonical, "Language: English" × materialCount on EN, and "Sprache: Englisch" × materialCount plus `GERMAN_INTERFACE_TOKENS` on DE (:31-32, :155-183). For German materials, change the label counts per route.

**A6.2 [SHOULD] `workshops.spec.ts`**: add a W04 journey (hub link → detail → decision lab → open one material → kit ZIP starts with `PK`), like the W02 and W03 tests (:4-33, :35-83). Each new `test()` adds 1 mobile-WebKit test (see §0.10).

**A6.3 [SHOULD] `learning-density.spec.ts:41-44`**, `WORKSHOP_ROUTES = ["/workshops/ki-prognosen-einschaetzen", "/workshops/geschaeftsberichte-mit-ki-lesen"]`. Add W04 (+1 test per project). It asserts `[data-workshop-decision-lab]` starts inside the first viewport and that `[data-scroll-progress]` mounts exactly once.

**A6.4 [SHOULD] `workshop-hydration.spec.ts:3-18`**: `cases` covers only W03. Adding W04 means +2 JS tests and +2 no-JS tests. Note that the no-JS test expects `a[href$="/guide.html"]` (:123), which is W03-specific.

**A6.5 [SHOULD/optional] `route-matrix.spec.ts:57-58`** (`"/workshops"`, `"/workshops/geschaeftsberichte-mit-ki-lesen"`; +1 test) and **`a11y.spec.ts:29`** (W02 detail; each route adds an axe test and a one-h1 test, so +2). Keep W02 in `a11y.spec.ts`: `scripts/__tests__/verify-lighthouse-routes.test.ts:210-227` requires `"/workshops/geschaeftsberichte-mit-ki-lesen"` in the axe sources.

**A6.6 [MUST if more than 5 e2e tests are added] `packages/website/scripts/run-e2e-suite.mjs:18`**: `export const MOBILE_WEBKIT_SHARD_COUNT = 24;` goes to 25 or 26. Verify with `bun run --cwd packages/website test:e2e-suite-contract`, which runs `playwright --list` per shard and asserts `ids.length <= 32`.

**A6.7 [NONE]** `qa-sweep.spec.ts`, `seo-meta.spec.ts`, `visual-regression.spec.ts`, `qa-visuals.spec.ts` (captures `/workshops` only with `PLAYWRIGHT_CAPTURE_VISUALS=1`), and `route-locales`/`responsive`/`mobile-shell` contain no per-workshop lists.

### A7. Lint scope, freshness, generated files, config

**A7.1 [SHOULD] voice-lint scope: `packages/website/scripts/content-prose.mjs:88-92`**
```js
export const EXTRA_COPY_MODULE_FILES = [
  "src/lib/books.ts",
  "src/lib/courses/catalog.ts",
  "src/lib/workshops.ts",
];
```
A new `src/lib/workshops-esg-reporting.ts` gets the generic checks (banned phrases, em/en dash, ASCII umlauts) through `tsDataFiles` in `content-lint.mjs:123-130`, but **not** the VOICE rules (filler, openers, hedges, paragraph length), because it is neither `*-copy.ts` nor listed here. `workshops-data-readiness.ts` is not listed either. Add both, or name the module `…-copy.ts`. To make voice findings errors rather than warnings for W04, also add the file to `scripts/content-lint.voice-scope.json` `"strict"`. Optional: add a case to `scripts/__tests__/content-lint-voice.test.mjs:402-417` (classification `"copy modules"`, `"mixed"`).

**A7.2 [SHOULD] bump the freshness date: `packages/website/src/lib/content-freshness.ts:29`** `export const SITE_CONTENT_DATE = "2026-09-05";` becomes `"2026-09-26"` (bump rule in the header: "new or rewritten page … catalog change"). It feeds `sitemap.ts`, `llms.txt`, `/api/knowledge-graph.json`, the `machine-surfaces/envelope.ts` `last_updated` for `/api/workshops.json`, and the footer. It forces A7.3.

**A7.3 [GEN] `packages/website/docs/seo/page-inventory.md`**
Generated from the crawl contract and catalogs by `scripts/generate-page-inventory.mjs`. It lists **no** workshop detail rows: it imports books, demos, blog, imported courses and OSS artifacts, not workshops. Adding W04 alone changes nothing. The file prints `canonical content date <SITE_CONTENT_DATE>` in every static row (50 occurrences), so A7.2 requires regeneration: `bun run --cwd packages/website page-inventory:generate`. The check is `page-inventory:check`, part of `verify:static:internal`.

**A7.4 [GEN, only if legal claims are added] `packages/website/src/lib/legal-registry.json`**
Generated by `scripts/export-registry.mjs` from `src/lib/legal-registry.ts`; it is the AI-Act date whitelist for content-lint. The HARDCODED-DATE check (`content-lint.mjs:375-453`) only scans `content/**/*.json|md`, **not** `src/lib/*.ts` or `public/**`, so W04 catalog copy does not need registry entries. If CSRD/ESRS/Omnibus dates are added as `LEGAL_CLAIMS`: `LegalInstrument` (:1-8) has no "CSRD" (use `"other"` or extend the union), update the `legal-registry.test.ts:13` count, and regenerate with `bun run --cwd packages/website registry:export`. `registry:check` runs in `prebuild` and `precontent:lint`.

**A7.5 [NONE] English route mirror**
`scripts/generate-english-route-mirror.mjs` mirrors every `page|layout|loading|error|not-found|template|default|opengraph-image|twitter-image.tsx` under `src/app` (except `api`, `auth`, `en`, `llms.txt`) into `src/app/en/**`. `src/app/en/workshops/page.tsx` and `src/app/en/workshops/[slug]/page.tsx` are generic re-exports:
```ts
// GENERATED by scripts/generate-english-route-mirror.mjs.
export { default, generateMetadata, generateStaticParams } from "../../../workshops/[slug]/page";
```
W04 needs **no** change. `generateStaticParams` uses `getWorkshopSlugs()`.

**A7.6 [NONE] `lighthouserc.json:24-25`** needs only one representative per dynamic pattern (`/workshops` and W02 detail). `scripts/verify-lighthouse-routes.ts:204-208` derives the candidates from `getWorkshopSlugs()`. Adding W04 is optional; if added, it must pass the budgets in §B4.

**A7.7 [NONE] crawl contract `src/lib/crawl/contract.ts:64-65, 285-298`**: generic `/workshops/:slug`, `/workshops/:slug/assets/:path*`, `/workshops/:slug/:path*`. No change.

**A7.8 [NONE] derived machine and SEO surfaces:** `src/lib/machine-surfaces/workshops.ts`, `src/app/api/workshops.json/route.ts`, `src/app/api/knowledge-graph.json/route.ts:206-230` (plus the schema `src/lib/seo/knowledge-graph-schema.ts:278-296`, no change unless new fields are exposed), `src/app/llms.txt/route.ts:112-125`, `src/app/sitemap.ts:152-154`, `src/lib/mcp/{catalog,search-index,resources}.ts`, `src/lib/mcp/tools/workshops.ts`, and the JSON-LD in `src/app/workshops/page.tsx:55-77` and `[slug]/page.tsx:75-113`.

### A8. Docs, skills, notices (no test fails, but they go stale)

- **[SHOULD] `packages/website/docs/analytics-reading-rules.md:84-85`**: "**Workshop slugs** (2): `ki-prognosen-einschaetzen`, `geschaeftsberichte-mit-ki-lesen`. **Material kinds** (2): `html`, `zip`." This is already stale (there are 3 slugs and `csv`). Make it 4 slugs and 3 kinds.
- **[SHOULD] `packages/website/content/skills/workshop-arbeiten/SKILL.md`** has no count ("Zähle nichts ab"). It makes generic claims that are already false for W02 and would be false for an AI-assisted W04: line 9 "brauchen keinen KI-Zugang, keine Installation und keine Anmeldung"; lines 76-78 "**Du brauchst keinen Schlüssel …** Ein Workshop läuft ohne KI-Zugang"; EN lines 122 and 144. The transfer questions (lines 89-93 and 150-152) are forecast-specific ("hängt an einer Schätzung"). Generalize them. Constraints from `src/app/skills/skills-collection.test.ts:84-110`: it needs `## English`, du-form, no curl|pipe, no key literals. `node scripts/skills-mirror-check.mjs` (part of `verify:static`) validates structure. The public mirror repository must receive the same bytes, which is out of repo: `--mirror ../skills`.
- **[SHOULD] `THIRD_PARTY_NOTICES.md:21-23`** "Workshop bundles" and **`LICENSE_POLICY.md:28-30`**: add a sentence for W04's synthetic case data and for any public company report it links to (link only, not redistributed) or any third-party mark it shows.
- **[optional] `content/changelog.md` and `content/changelog.en.md`** (rendered at `/neuigkeiten`): new dated entry.
- **[optional] `packages/website/docs/design-audit-2026.md:61,95-99`** and **`docs/experience-system.md:36,87,190`**: they describe workshops ("Begin with a bounded decision", "Remove decorative workshop imagery", "`shadow-card` … book and workshop tiles"). Update them if the new layout changes these rules.
- **[NONE]** `src/app/hilfe/eigene-ki/eigene-ki-copy.{de,en}.ts:143/140` and `src/lib/mcp/explainer.ts:135` use `workshop://ki-prognosen-einschaetzen` as an example. `nav.tsx`, `footer.tsx`, `home-copy.ts`, `course-hub-copy.ts`, `course-gallery-copy.ts`, `site*.webmanifest` and `layout.tsx` only link `/workshops` generically.

---

## 3. Part B: workshop hub and detail layout change

### B1. Files that render the pages

| File | Role | Notes |
| --- | --- | --- |
| `src/app/workshops/page.tsx` | Hub route, metadata (OG image = W01 card), CollectionPage JSON-LD | Metadata description uses `copy.description(workshops.length)`. |
| `src/app/workshops/workshops-content.tsx` | Hub UI (server component) | The current risograph styling lives here: `WORKSHOP_WASHES`, `INDEX_BARS`, `WORKSHOP_SHEETS` (brand-sky, pink, peach, acid pastel blocks, offset sheets `translate-x-2 translate-y-2`, `lg:-rotate-1`, rotated decorative spans, `HighlightedText` marker band on the h1, `shadow-card`). |
| `src/app/workshops/workshop-copy.ts` | DE/EN copy for hub and detail | A `*-copy.ts` module, so it is voice-linted (warnings unless strict). The `introduction(count)` string is pinned by tests (B2.1). |
| `src/app/workshops/[slug]/page.tsx` | Detail route, metadata, BreadcrumbList + LearningResource JSON-LD, `OpenWithYourAiRegion` | Must keep `OpenWithYourAiRegion` with `kind="workshop"` and `workshopUri(` (`src/components/course/open-with-your-ai-mounts.test.ts:29-33`). |
| `src/app/workshops/[slug]/workshop-detail-content.tsx` | Detail UI (server component) | Header, decision lab, materials section, 4 `<details>` reference blocks. `MATERIAL_ICONS` is typed on the `kind` union. |
| `src/app/workshops/[slug]/workshop-decision-lab.tsx` | Client component (`"use client"`) | Carries `data-workshop-decision-lab`, which is used by 3 e2e specs. |
| `src/app/workshops/[slug]/workshop-material-link.tsx` | Client link with analytics | HTML opens in the same tab; zip/csv get a bare `download` attribute. |
| `src/components/ui/highlighted-text.tsx` | Marker-band h1 accent used by the hub and /buecher | Tied to the `heading-band-geometry` e2e (B3.3). |
| `src/app/en/workshops/**` | [GEN] mirror | Regenerate only if route files are added (B5). |

### B2. Unit tests that pin hub and detail markup (update together with the redesign)

**B2.1 Hub: `src/app/workshops/workshops-content.test.tsx`**
- :17-20 h1 accessible name `/Selbstlern-Workshops[\s\S]*für konkrete Entscheidungen/`. :33-36 EN `/Self-study workshops[\s\S]*for concrete decisions/`.
- :21 `screen.getByText(/0 geführte Fälle/)` (renders with `workshops={[]}`). :24-26 empty state `role="status"` with "Derzeit ist kein Workshop veröffentlicht."
- :38 `/3 guided cases/`. :39 no "Verfügbare Workshops".
- :40-50 `data-testid="workshop-row"` × N; each row has one h3 whose `textContent` is `"Workshop 01: Can AI predict the future?"` (the ":" comes from the `sr-only` span).
- :57-59 `First decision: “1,050 units. Who gets them?”` on an element with `data-workshop-decision`.
- :60-67 `[data-workshop-output]` texts. :68-72 row `id` = `workshop-<slug>`.
- :73-84 `role="complementary"` named "In the catalogue" with jump links `"01Forecasts"` → `#workshop-ki-prognosen-einschaetzen` and so on.
- :85 no "Release with a gate". :86-90 link "Open workshop: Can AI predict the future?" → `/en/workshops/ki-prognosen-einschaetzen`.
- :91-101 each row has the class `motion-reduce:transition-none` and **exactly one** link, which has an accessible name `^Open workshop:`, the class `min-h-11`, and an `svg` with `aria-hidden="true"`. :102 no "View courses" link.
- :105-131 source-text assertions: contains `from "next/image"` and `"card-preview.webp"`; **not** `transition-all`, `feedback.aligned.title`, `text-[9|10|11px]`, `rounded-(lg|xl|2xl|3xl|full)`, `dark-section`, `data-workshop-bento`. The DOM has `[data-workshop-editorial-spread]`, `[data-decision-card]` × 3, `img` × 3, the first image `loading="eager"` + `fetchpriority="high"`, the second `loading="lazy"`.

**B2.2 Hub: `src/app/catalog-surfaces-mobile.test.ts`** (reads the source of `workshops/workshops-content.tsx`)
- :45-47 no `"use client"`.
- :49-65 every class list with `order-first` or `-order-1` must also carry `sm|md|lg|xl:order-none`.
- :67-82 the set of catalog files using `order-first`/`-order-1` must **equal** `["buecher/buecher-content.tsx", "workshops/workshops-content.tsx"]`. The redesign must keep at least one phone reorder, or this test must change.
- :84-94 every `hidden` needs a breakpoint display restore (`sm:block` and similar).
- :117-141 regex `/<h3\s+id=\{headingId\}\s+className="([^"]+)"/`: that h3 class must contain `order-first`, `md:order-none`, `text-2xl`, `sm:text-4xl`. The `data-workshop-decision` element's className contains `font-semibold` and not `order-first`. Literal strings `'<ol className="mt-5 hidden space-y-2 sm:block">'`, `"py-6 sm:py-14"`, `"gap-6 sm:gap-12"` must be present.

**B2.3 Hub: `src/lib/learning-surface-density-contract.test.ts:5-45`** (covers `app/workshops/workshops-content.tsx`): no `text-[<12px]` or `text-[0.5-0.74rem]`, no `transition-all`, no `infinite` animation, no `animate-pulse`/`animate-bounce`.

**B2.4 Hub metadata: `src/app/workshops/page.locale.test.tsx:18-41`**: titles "Workshops für KI im Mittelstand" / "Practical AI workshops for business", canonical, hreflang map, OG locale and url.

**B2.5 Detail: `src/app/workshops/[slug]/workshop-detail-content.test.tsx`**
- :9-59 (W01 DE): h1 = title; summary inside `<header>`; eyebrow text `Workshop 01 · Prognosen`; `description` inside the **first** `<details>`; access text `/Kein KI-Zugang nötig.*statisch im Browser/`; `header dl` exists with text `Material:6` (dt text "Material:" immediately followed by the dd). DOM order is lead → facts → access. The decision lab heading's `section` precedes the "Material zum Mitnehmen" `section`. **Exactly 4 `<details>`, all closed**; the first starts with "Worum es geht"; "Für wen" and "Die sechs Schritte" are present; no `mailto:`.
- :61-76 source: no `text-[9-11px]`, no `motion-safe|motion-reduce|animate-`, no `rounded-(lg|xl|2xl|3xl|full)`, **no `shadow-`**, no `"use client"`.
- :78-97 HTML links have no `target` and no `download`; zip has `download=""`.
- :99-111 the "all English" note disappears when one material is German. :113-127 the W01 CSV link has `download=""`.
- :129-162 exact text node "Kostenlos, ohne Anmeldung. Alle Materialien auf Englisch."; "Sprache: Englisch" × materials; back link named "Zurück zu allen Workshops" → `/workshops`; the materials section has exactly N links in order with `hreflang="en"`.
- :164-213 (W02 EN): heading, the Claude-access text, "Who this is for", "Practice case", "Seven steps"; clicking the "Practice case" summary reveals the h4 "Apply the method to real data", a link `/Meta Q2 2026 Results/` to the SEC URL, `/unaudited quarterly figures/` visible, `time[datetime="2026-07-29"]` and `time[datetime="2026-08-26"]`; back link "Back to all workshops" → `/en/workshops`; "Language: English" × materials; "Free, no sign-up."; no "All materials in English".

**B2.6 Detail lab: `src/app/workshops/[slug]/workshop-decision-lab.test.tsx`**
- :252-284 source must contain `"grid grid-cols-1 border-y border-border sm:grid-cols-3"`, and must not contain `text-[9-11px]`, `motion-safe|motion-reduce|animate-|shadow-`. The kicker has classes `text-xs text-brand-orange`; the choice label has `transition-colors` and no `translate|motion-*`.
- :336-376 outcome classes `border-destructive` (wrong, text `^Not quite`), `border-brand-teal` (correct, `^Correct`), `border-brand-amber` (partial, `^Almost`); the right-choice label has `border-brand-teal`; `data-outcome` and `data-option-mark` attributes; button names "Check decision", "Decide again", "Reset".
- :25-49 SSR: `form[aria-busy=true]`, 2 disabled fieldsets, disabled radios and submit, the text "The choices unlock once JavaScript has loaded." / "Die Auswahl wird freigeschaltet, sobald JavaScript geladen ist.", and a noscript text.

**B2.7 Detail metadata: `src/app/workshops/[slug]/page.locale.test.tsx:23-57`**: title `${title} · Workshop`, canonical, hreflang, OG image `/workshops/<slug>/card-preview.webp` 1024×576 with alt = title, description = summary.

**B2.8 `src/app/workshops/[slug]/workshop-material-link.test.tsx`**: link attributes and analytics calls (unchanged unless the link component changes).

**B2.9 `src/components/course/open-with-your-ai-mounts.test.ts:29-33`**: `app/workshops/[slug]/page.tsx` must mount the region with `workshopUri(`.

### B3. E2E constraints on the layout

1. **`route-workshops-locales.spec.ts`**
   - H1 names "Selbstlern-Workshops für konkrete Entscheidungen." and "Self-study workshops for concrete decisions." Playwright matches `name` as a case-insensitive substring, so a copy change needs a spec change.
   - No horizontal overflow at 320, 390, 768 and 1440 px.
   - **The hub must contain 0 material links**: `materialCount: 0` means no `main a[href^="/"]` ending in `.html`, `.zip` or `.csv`. A redesign that puts "Open slides" shortcuts on hub cards breaks this. Every internal page link on `/en/…` must stay under `/en`.
   - The DE detail must show at least one of `GERMAN_INTERFACE_TOKENS` (`Für wen|Alle Workshops|Die offene Entscheidung|Einordnung|Kostenlos und ohne Anmeldung|Material zum Mitnehmen|Verfügbare Workshops`); the EN detail must show none of them.
2. **`learning-density.spec.ts:218-231`**: on W01 and W02 detail (and W04 if added), the `[data-workshop-decision-lab]` top must lie inside the first viewport. Keep the header compact. The global `[data-scroll-progress]` must mount exactly once.
3. **`heading-band-geometry.spec.ts:30`**: `ROUTES = ["/buecher", "/en/buecher", "/workshops", "/en/workshops"]` expects `h1 span.box-decoration-clone` (from `HighlightedText`) whose painted bands do not overlap. If the hub drops the marker band (the pastel highlight the owner dislikes), remove both workshop routes here. That removes 4 tests per project and frees WebKit shard budget. `src/components/ui/highlighted-text.test.tsx:10` mentions `workshops-content.tsx` in a comment only.
4. **`workshop-hydration.spec.ts`** (W03 detail): `[data-workshop-decision-lab]` visible, 6 radios, loading text, `form[aria-busy]`, focus order submit → alert → first radio → reset; without JS the `noscript p` text is visible and `a[href$="/guide.html"]` is visible.
5. **`workshops.spec.ts:4-20`**: the hub has a link whose name matches `/Geschäftsberichte mit KI lesen/i` (first), leading to the detail page with an h1 containing "Geschäftsberichte". :35-60 on the W03 EN detail: "Check decision" button, the validation text, exact radio labels, and "Reset" focused after submit.
6. **`route-matrix.spec.ts:57-58`** and **`a11y.spec.ts:29`**: HTTP 200 and no console errors on `/workshops` and the W02 detail; axe WCAG 2.2 AA and exactly one h1 on the W02 detail.
7. **`qa-visuals.spec.ts:91`**: `/workshops` captured at review widths (opt-in, no baseline). `visual-regression.spec.ts` has **no** workshop baseline (only `/kurse`, `/buecher`, `/open-source`, `/impressum`).

### B4. Lighthouse budgets (`lighthouserc.json`; `/workshops` and the W02 detail are audited)

Performance ≥ 0.80 (error). **Accessibility = 1.00** (error). Best practices ≥ 0.9 and SEO ≥ 0.9 (warn). LCP ≤ 4500 ms. CLS ≤ 0.1. TBT ≤ 200 ms. Script ≤ 368,640 bytes. **Total transfer ≤ 1,048,576 bytes.** Third-party requests ≤ 8. A hub grid that loads all four card previews eagerly above the fold eats into the 1 MB budget. Keep the first image `eager` + `fetchPriority="high"` (the test asserts this) and the rest lazy. Run `bun run lighthouse:check` (route contract) or `bun run lighthouse:local`.

### B5. Generated and derived files affected by a layout change

- Adding a route file under `src/app/workshops/**` (`layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `opengraph-image.tsx`, `twitter-image.tsx`) needs `bun run --cwd packages/website english-routes:generate`. `english-routes:check` runs in `predev` and `prebuild`, so the next dev start or build fails otherwise. Plain component files (for example `workshop-card.tsx`) are not mirrored.
- Changing `crawl/contract.ts` needs `page-inventory:generate`.
- Docs to align: `docs/experience-system.md:36` (shadow policy mentions "workshop tiles"), `:87` (workshop routes keep the tab bar, no `data-reader`), `:190`; `docs/design-audit-2026.md:61,95-99`.

---

## 4. Generated files and their regenerate commands (summary)

| Generated artifact | Generator | Regenerate | Check (read-only) | Needed for W04? |
| --- | --- | --- | --- | --- |
| `packages/website/src/app/en/**` (incl. `en/workshops/page.tsx`, `en/workshops/[slug]/page.tsx`) | `packages/website/scripts/generate-english-route-mirror.mjs` | `bun run --cwd packages/website english-routes:generate` | `english-routes:check` (predev, prebuild) | No; only if new route files are added (B5). |
| `packages/website/docs/seo/page-inventory.md` | `packages/website/scripts/generate-page-inventory.mjs` | `bun run --cwd packages/website page-inventory:generate` | `page-inventory:check` (verify:static) | Only if `SITE_CONTENT_DATE` is bumped (recommended) or the crawl contract changes. |
| `packages/website/src/lib/legal-registry.json` | `packages/website/scripts/export-registry.mjs` | `bun run --cwd packages/website registry:export` | `registry:check` (prebuild, precontent:lint) | Only if `LEGAL_CLAIMS` changes (CSRD/ESRS dates). |
| `ASSET_MANIFEST.json` rows | `scripts/scaffold-asset.mjs` prints one row | `node scripts/scaffold-asset.mjs <path> --owner … --source … --license … --redistribution …` (or `bun run asset:record -- …`), then paste | `bun run scan:public` | **Yes**, for every W04 binary. |
| W03 `bundle-manifest.json`, `data-readiness-kit.zip`, W03 `ASSET_MANIFEST.json` rows, `guide.html`/`builder.html`/`demo.html` | `scripts/course03/refresh-published.mjs` (+ `overrides.mjs`) | `node scripts/course03/refresh-published.mjs` (after `node scripts/course03/overrides.mjs capture` if exported files such as `slides.html` or `lib/*` were edited) | `… --check`, `node scripts/course03/overrides.mjs check`, `bun run test:course03-publication` | No (needed for the W03 demo rebuild, see §7). |
| Playwright pixel baselines `tests/e2e/__screenshots__/visual-regression.spec.ts/*.png` | Playwright | `playwright test tests/e2e/visual-regression.spec.ts --update-snapshots` (desktop Chromium) | the spec itself | No workshop baseline; `courses-desktop.png` changes if `/kurse` is restyled. |
| `lighthouserc.json` | hand-maintained | - | `bun run lighthouse:check`, `bun run test:lighthouse-contract` | No. |

---

## 5. If W04 needs a material kind beyond `html | zip | csv`

Allowed extensions are text types (`md`, `json`, `txt`, `yml`, `svg`) or image types with a manifest row (`webp`, `png`, `jpg`). **Never `pdf`, `xlsx`, `docx` or `pptx`** (§0.1). These places need an edit:
1. `src/lib/workshops.ts:53`: the `kind` union.
2. `src/lib/analytics/registry.ts:101`: `ANALYTICS_MATERIAL_KINDS` (type-equality test in `analytics/contract.test.ts:292-299`).
3. `src/app/workshops/[slug]/workshop-detail-content.tsx:21-28`: the `MATERIAL_ICONS` record (a TS error otherwise).
4. `src/app/workshops/[slug]/workshop-material-link.tsx:45`: the download branch (`kind === "html"` opens, everything else downloads).
5. `src/lib/machine-surfaces/workshops.test.ts:75`: `expect(["html", "zip", "csv"]).toContain(material.kind)`.
6. `tests/e2e/route-workshops-locales.spec.ts:126`: `/\.(?:html|zip|csv)$/`.
7. `src/lib/workshops.test.ts:90-92`: a non-HTML label must end with `.<kind>`.
8. `docs/analytics-reading-rules.md:84-85`.

---

## 6. Things that look related but are not (false positives from grep "workshop")

- `workshopQuiz`, `workshopQuestions`, `workshopQuizPassThreshold`, `isWorkshopQuizPassed`, `workshop-quiz-page.tsx`, `lib/ai-native-operator/workshop-questions.ts`, `supabase/migrations/*assessment_runs*`, and the `lib/progress/*` and `konto/*` hits are the **course final-quiz** engine. They are unrelated to the workshop catalog.
- The THIRD_PARTY_NOTICES line about the "22-question workshop quiz" refers to the AI-Native Operator course quiz.
- `marketing/research/*` mentions workshops as market research, not site content.
- `scripts/course03/**` and `scripts/export-data-readiness-workshop.mjs` are the W03 publication pipeline. W04 needs its own pipeline only if it is exported from an external source.

---

## 7. Appendix: W03 interactive demo rebuild (adjacent parent task)

- Source of the published `public/workshops/datenbereitschaft-fuer-ki/demo.html` is **`scripts/course03/demo/demo.html`**, a repository-authored surface (`scripts/course03/publication.mjs:15` `DEMO_PAGE_SOURCE`). Edit the source, then run `node scripts/course03/refresh-published.mjs`. It rewrites `demo.html`, `bundle-manifest.json`, the kit zip and W03's `ASSET_MANIFEST.json` rows. `scripts/course03/demo/capture.py` recorded the PostgreSQL data.
- Guards: `src/lib/workshops-data-readiness.test.ts:63-72` (exact file inventory and hashes against `bundle-manifest.json`), `:74-86` (all local `src`/`href`/`url()` resolve), `:107-122` (the demo adapter starts in replay mode with 0 fetches); `scripts/__tests__/course03-publication.test.mjs` (`bun run test:course03-publication`); `workshops.spec.ts:35-107` (guide → deck → presenter popup pairing, the lab at `data-readiness-kit/readiness-lab.html` with fixed grades). The detail-page label "Interaktive Demo · 10 Min." / "Interactive demo · 10 min" is pinned in `workshops-data-readiness.test.ts:46-47`.
- Exported files (`slides.html`, `lib/*.js|css`, `presenter.html`, `data-readiness-kit/*`) must go through `node scripts/course03/overrides.mjs capture` after editing, or `refresh-published --check` and `overrides.mjs check` fail with "published file changed without an override".

---

## 8. Suggested verification sequence after implementing W04 plus the layout

```bash
# from /home/user/platform
bun run --cwd packages/website typecheck
bun run --cwd packages/website lint
bun run --cwd packages/website test -- src/lib/workshops src/app/workshops src/lib/machine-surfaces src/lib/analytics src/lib/learning-graph src/app/__tests__/sitemap.test.ts src/app/catalog-surfaces-mobile.test.ts src/lib/learning-surface-density-contract.test.ts src/app/api/workshops.json src/app/api/knowledge-graph.json src/lib/i18n src/components/course/open-with-your-ai-mounts.test.ts src/lib/public-content-claims.test.ts
bun run --cwd packages/website content:lint           # includes registry:check
bun run --cwd packages/website english-routes:check
bun run --cwd packages/website page-inventory:check
bun run --cwd packages/website test:e2e-suite-contract  # WebKit shard cap
bun run --cwd packages/website skills:mirror-check
bun run scan:public && bun run test:scanner            # ASSET_MANIFEST + public tree
bun run lighthouse:check && bun run test:lighthouse-contract
node scripts/course03/refresh-published.mjs --check   # W03 untouched or refreshed
# e2e (built): workshops.spec, route-workshops-locales, workshop-hydration, learning-density, heading-band-geometry, route-matrix, a11y
```
