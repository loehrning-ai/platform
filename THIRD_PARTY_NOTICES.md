# Third-Party Notices

This file records third-party material distributed or transformed by the repository. Package dependencies retain the licenses declared by their package manifests and bundled license files. Bun's lockfile pins package versions but is not a complete license inventory.

## Inter-derived fonts

`Loehrning Sans` and `Typing` are modified, renamed derivatives of Inter by Rasmus Andersson and The Inter Project Authors. They are redistributed under SIL Open Font License 1.1. See `LICENSES/OFL-1.1.txt` and `ASSET_MANIFEST.json`.

## Geist

The application uses the `geist` package, distributed under the SIL Open Font License. It is installed from the package lock and is not checked into this repository.

## Geographic outline data

`packages/website/src/lib/country-polylines-3d.ts` contains transformed geographic outline data from `world-atlas`'s `countries-50m.json`, processed with `topojson-client`. Both packages are distributed under the ISC License. The generated file retains source and transformation attribution. The complete upstream notices, including their distinct copyright years, are reproduced in `LICENSES/world-atlas-ISC.txt` and `LICENSES/topojson-client-ISC.txt`.

## Imported interactive-course assets

Imported screenshots and license copies under `packages/website/public/imported-courses/` come from commit-pinned interactive-course projects. Source paths, commits, SHA-256 values, and corresponding license locations are recorded in the course catalog and asset manifest.

### Imported course provenance convention

Every course ported from `github.com/Mavengence/interactive-courses` (six as of plan 007: `data-engineering-fundamentals`, `data-science`, `data-infrastructure`, `codex`, `claude`, `ai-native-operator`) follows the same three-part provenance convention, established here so each course's own plan (008-013) can apply it mechanically without re-deriving the pattern:

1. **One `ASSET_MANIFEST.json` entry per asset.** Every screenshot and license copy checked into `packages/website/public/imported-courses/` gets its own entry (`path`, `sizeBytes`, `sha256`, `owner`, `source`, `license`, `redistribution`), matching the existing entries for the six courses landed so far. `catalog.test.ts`'s hash/size assertions read directly from this manifest, so a stale or missing entry fails CI rather than silently drifting from the checked-in file.
2. **One `THIRD_PARTY_NOTICES.md` paragraph per course**, added by that course's own plan in the same commit that lands its assets — not batched here. Each paragraph names the course, its upstream source path (commit-pinned, matching `IMPORTED_COURSE_SOURCE_COMMIT` in `catalog.ts`), its license, and its copyright holder.
3. **The codex distinct-copyright-holder template sentence.** Five of the six courses' license files read `Copyright (c) 2026 Tim Löhr` (or `Tim Löhr (Mavengence)`); `codex/LICENSE.txt` is the one exception, reading `Copyright (c) 2026 Codex Course`. Any course plan whose upstream license file names a copyright holder other than Tim Löhr must call this out explicitly in its notices paragraph, using this template sentence: *"Unlike the other imported courses, `<course>`'s upstream license names `<copyright holder>` as the copyright holder, not Tim Löhr — see `public/imported-courses/licenses/<course>-MIT-LICENSE.txt`."* This keeps a real, non-Tim-Löhr-held copyright from being silently mis-attributed by a paragraph that assumes the common case.

The convention does not require a course to have shipped its native routes yet — provenance is about content ORIGIN, independent of `nativeStatus`.

### Claude Course

`claude` (12 English lessons on prompting, Claude Code, context engineering, agents, grounding, and evals) is ported from the pinned commit `0e5dfd327ce44663696b52eb6643bab147947101` of `github.com/Mavengence/interactive-courses`, path `claude/` (see `sourceHref` in `catalog.ts`). It is distributed under the MIT License, Copyright (c) 2026 Tim Löhr, reproduced at `public/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt` (the repository's shared root license, not a course-specific one; see `ASSET_MANIFEST.json`).

### Codex Course

`codex` (12 English lessons plus an in-lesson capstone on working with OpenAI Codex: mental model, sandbox contract, AGENTS.md, task specs, scoping, acceptance criteria, review, iteration, tool ecosystem, parallelism, and patterns) is ported from the pinned commit `0e5dfd327ce44663696b52eb6643bab147947101` of `github.com/Mavengence/interactive-courses`, path `codex/` (see `sourceHref` in `catalog.ts`). It is distributed under the MIT License, reproduced at `public/imported-courses/licenses/codex-MIT-LICENSE.txt` (see `ASSET_MANIFEST.json`). Unlike the other imported courses, `codex`'s upstream license names `Codex Course` as the copyright holder, not Tim Löhr — see `public/imported-courses/licenses/codex-MIT-LICENSE.txt`.

### Data Infrastructure

`data-infrastructure` ("An IC5 System Design Field Guide" — 12 English lessons across 4 tracks on storage internals, CAP/PACELC, data modeling, Parquet/ORC/Avro, lakehouse table formats, streaming and watermarks, CDC and Lambda/Kappa architectures, idempotency, and data SLAs, plus a full IC5 mock-interview replay) is ported from the pinned commit `0e5dfd327ce44663696b52eb6643bab147947101` of `github.com/Mavengence/interactive-courses`, path `data-infrastructure/` (see `sourceHref` in `catalog.ts`). It is distributed under the MIT License, Copyright (c) 2026 Tim Löhr, reproduced at `public/imported-courses/licenses/interactive-courses-MIT-LICENSE.txt` (the repository's shared root license, not a course-specific one; see `ASSET_MANIFEST.json`).

## Framework and library notices

Next.js, React, Tailwind CSS, Framer Motion, Lucide, Supabase clients, Sentry clients, and other dependencies are not relicensed by this repository. Consult each installed package's license and the root `bun.lock` before redistribution.

The installed dependency graph includes optional platform packages used by
image processing. In the audited macOS ARM64 install,
`@img/sharp-libvips-darwin-arm64@1.2.4` declares LGPL-3.0-or-later. It is not
stored in this source tree because `node_modules/` is excluded. Any distributor
of a container, executable, dependency cache, or other bundle containing it
must preserve and satisfy its upstream license terms. `png-js@2.0.0` omits the
`license` field from its manifest but includes an MIT `LICENSE` file;
`rgbcolor@1.0.1` declares `MIT OR SEE LICENSE IN FEEL-FREE.md` and includes its
MIT text. The installed Sentry integration also resolves `@sentry/cli@2.58.6`
and a platform CLI binary under FSL-1.1-MIT. They are optional build-time tools
and are excluded with `node_modules/` from this source tree. The dependency
license gate checks manifest or bundled-license coverage, blocks unreviewed
strong-copyleft, source-available, and other conditional identifiers, and keeps
the exact libvips and Sentry CLI package/version exceptions visible. It does
not replace legal review of a release bundle.
