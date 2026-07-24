# Artifact Publication Contract

This document is the mandatory admission path for a new linked course, tool,
project, or video. Two separate lanes exist:

- The open-source artifact registry (`/open-source` hub) covers only tools,
  projects, and videos published under the GitHub organization `loehrning-ai`.
- Imported linked courses are `/kurse` catalog content. They keep their own
  detail routes under `/kurse/open-source/:slug`, their reviewed license and
  screenshot assets, and their discovery surfaces (sitemap, llms.txt,
  knowledge-graph labs). They are not open-source artifacts and never enter
  the registry.

Candidate records are always complete and validated; their
`publicationLifecycle` controls public discovery. Only a `published` candidate
creates discovery data, a sitemap entry, a page-inventory row, and, for tools,
projects, and videos, a static detail route. Do not add a partial record.

No tool, project, or video is published in the current registry. The empty
arrays are deliberate release state, not placeholders.

## Canonical files

- Imported linked courses (course-catalog lane, not the artifact registry):
  `packages/website/src/lib/courses/catalog.ts`, in
  `IMPORTED_COURSE_CATALOG`.
- Tool, project, and video records:
  `packages/website/src/lib/open-source/artifacts.ts`, in
  `OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES`,
  `OPEN_SOURCE_PROJECT_ARTIFACT_CANDIDATES`, and
  `OPEN_SOURCE_VIDEO_ARTIFACT_CANDIDATES`. The corresponding
  `OPEN_SOURCE_*_ARTIFACTS` arrays are derived, published-only views; never
  edit or replace them with a second hand-maintained catalog.
- Shared tool/project detail renderer:
  `packages/website/src/components/open-source/software-artifact-guide.tsx`.
- Shared tool/project/video route:
  `packages/website/src/app/open-source/[kind]/[slug]/page.tsx`.
- Crawl policy and sitemap:
  `packages/website/src/lib/crawl/contract.ts` and
  `packages/website/src/app/sitemap.ts`.
- Generated publication inventory:
  `packages/website/docs/seo/page-inventory.md`.
- Asset ledger and admission checks: `ASSET_MANIFEST.json`,
  `scripts/scaffold-asset.mjs`, and `scripts/verify-artifact-assets.ts`.
- Media policy: `MEDIA_POLICY.md`.
- Data-driven browser admission coverage:
  `packages/website/tests/e2e/route-open-source.spec.ts`.
- Lighthouse representatives: `lighthouserc.json`, checked by
  `scripts/verify-lighthouse-routes.ts`.
- Records staged before their source commit exists:
  `packages/website/src/lib/open-source/pending/`. This is not a
  second catalog and never becomes one. A module there is imported by nothing
  but its own colocated spec, contributes no candidate, no route, no discovery
  data, and no collection count, and is typed so that its `source` field does
  not exist. It is a holding area with exactly one exit, described below; a
  record either moves into `artifacts.ts` or is deleted.

Do not create a second catalog in a page component, navigation component,
Markdown file, or route. Collection counts and routes must remain derived from
the canonical candidate registries and their published-only views.

## Publication lifecycle

Every tool, project, and video candidate must declare exactly one lifecycle:

- `draft`: complete, source-pinned, licensed, asset-backed, and valid, but not
  exposed through public discovery or a detail route;
- `published`: complete and publicly exposed through the derived
  `OPEN_SOURCE_*_ARTIFACTS` views;
- `withdrawn`: retained as a complete provenance record but removed from public
  discovery and routing.

All three states are validated by the registry validator and
`bun run artifact-assets:check`. Draft and withdrawn candidates do not form a
weaker shadow lane: their licenses, screenshots, and media must remain present
and byte-exact. Never use `draft` to store placeholders, private URLs, missing
assets, or unreviewed metadata. Withdrawal is a visibility decision, not file
deletion or evidence destruction.

## GitHub source dependency

GitHub is the intentional source-publication dependency for this project.
Provider-free application runtime does not mean provider-neutral source
publication. A new code artifact must have a public GitHub source URL and an
immutable, reachable 40-character commit pin before it appears in the registry.
The intended organization for this platform is `loehrning-ai`.

Do not use `main`, another branch name, a mutable tag, a pull-request URL, a
local path, or an unpushed commit as publication evidence. The learning site
must not require a GitHub token: source and revision links are public HTTPS
links, and no GitHub credential belongs in the application, tests, examples,
asset ledger, or environment files.

## Two-commit pinning sequence

Self-referential source publication requires two changes:

1. Commit A adds and verifies the artifact source, documentation, license, and
   reviewed assets while its public artifact array remains unchanged. Publish
   Commit A to the intended public GitHub repository and record its full
   40-character SHA.
2. Commit B adds the complete candidate entry. Set `source.revision` to Commit
   A, set `source.href` to the public GitHub source location, and set
   `source.revisionHref` to a GitHub `/tree/<commit>/<path>` or
   `/commit/<commit>` URL containing the exact Commit A SHA. Use `draft` when a
   separate public-admission review remains; a later commit may change only
   the lifecycle to `published` after every release gate passes. A fully
   reviewed candidate may enter as `published` directly.

This sequence prevents a detail page from citing a revision that cannot
contain the files it describes. A source change after Commit A requires a new
pin and a new registry review. Never rewrite the old commit reference in place
without re-running the complete admission path.

### Staging a record before Commit A

Writing a candidate is often ready long before its repository is public.
Commit A does not exist yet, so no honest `source.revision` exists either. The
registry validator performs zero network I/O and checks only shape, so a
fabricated 40-character SHA would pass every gate in this repository while
encoding a provenance claim nobody can check, and a matching fabricated
`revisionHref` would even look internally consistent. Never write one, and
never park a record in `draft` with an invented pin: `draft` means complete and
verified but unexposed, not incomplete.

Stage the record instead:

1. Put it in `packages/website/src/lib/open-source/pending/<slug>.ts`,
   typed `satisfies PendingToolArtifact` (or the project equivalent), where the
   pending type is a *distributive* `Omit` of the artifact type over `"source"`.
   The distribution matters: the tool and project types are intersections with
   a three-member delivery union, and a plain `Omit` collapses that union and
   loses the correlation between `delivery` and `launchHref`. With `source`
   absent from the type, an unverified pin cannot be written at all.
2. Derive the id, the detail href, and both asset paths from one `SLUG`
   constant via template literals, so a rename before publication stays a
   single edit.
3. Export a `composeForValidation(source)` helper from that same module, not
   from its spec: `tsconfig.typecheck.json` excludes `*.test.ts`, so a
   composition proof written only in a test would never be typechecked.
4. Colocate a spec that runs the real validator over the composed record using
   an obvious fixture pin, asserts the record carries no `source` property,
   asserts its id is absent from `OPEN_SOURCE_ARTIFACT_CANDIDATES`, and rehashes
   both stored assets against the record and against `ASSET_MANIFEST.json`.
   The fixture pin is the only place a 40-character hex string may appear.
5. Land the assets and their `ASSET_MANIFEST.json` rows normally. Asset review
   does not wait for the source pin, and `bun run artifact-assets:check` keeps
   reporting empty lanes because the staged record is not a candidate.

On admission, publish Commit A, then move the record into its candidate array
in `artifacts.ts` in one commit: swap `satisfies PendingToolArtifact` for the
real artifact type, add the three `source` fields, repoint any documentation
href that pointed at an internal page while the repository was private, verify
that `git show <sha>:LICENSE | shasum -a 256` equals the recorded
`license.sha256`, update the `source` strings of both manifest rows, and delete
the pending module together with its spec. A staged record that is abandoned is
deleted, not left to rot.

## Supported code hosting and delivery

The source-publication choice and the runnable-delivery choice are separate:

- Source: public GitHub HTTPS repository and immutable commit pin. This is
  mandatory for tools and projects.
- Source-only tool/project: set `delivery: "source-only"` and omit
  `launchHref`. The detail page exposes the install, usage, integration,
  documentation, and pinned-source guide.
- Internal launch: set `delivery: "internal-route"` and use a stable
  repository-local `launchHref` such as `/demos/<slug>` only when that route
  already satisfies the crawl, security, test, and page inventory contracts.
- External launch: set `delivery: "external-service"` and use one public
  credential-free HTTPS `launchHref`. Review ownership, redirects,
  availability, privacy, telemetry, cookies, and failure behavior. The launch
  target must not receive learner data automatically.

Do not embed an external tool, add wildcard Content Security Policy origins,
or make an optional hosted runtime necessary for reading the guide. A tool
that requires secrets must document user-supplied configuration without
shipping credentials, production identifiers, or a populated environment
file.

Video delivery is narrower: the current implementation supports only reviewed
repository-local first-party files under
`packages/website/public/media/`. Remote video, iframe, streaming,
object-storage, and third-party-player delivery are not supported by the
current schema or verifier. `MEDIA_POLICY.md` defines the change required
before any remote media design can be admitted.

## Registry templates

The snippets below are structural pseudocode. Replace every value with checked
evidence. Do not commit angle-bracket placeholders.

### Linked course

Add a complete `ImportedCourse` object to `IMPORTED_COURSE_CATALOG`. The
catalog drives the `/kurse` hub, the `/kurse/open-source/:slug` detail routes,
the sitemap, llms.txt, JSON-LD, and the knowledge-graph lab catalog. Linked
courses are not open-source artifacts; do not add a course object to
`artifacts.ts`.

```ts
{
  slug, step, title, eyebrow, tagline, description,
  href: `/kurse/open-source/${slug}`,
  imageSrc: `/imported-courses/screenshots/${slug}.jpg`,
  imageAlt,
  launchHref: credentialFreePublicHttpsUrl,
  sourceHref: githubSourcePathAtCommit,
  sourceCommitHref: githubSourcePathAtCommit,
  licenseHref: `/imported-courses/licenses/${slug}-LICENSE.txt`,
  sourceImagePath, sourceLicensePath,
  imageSha256, licenseSha256, licenseSizeBytes,
  sourceCommit: fullFortyCharacterCommitSha,
  duration, totalLessons, unitLabel, unitCount, lessonCountLabel,
  audience, language, topics, sourceFacts, integrationNote,
} satisfies ImportedCourse
```

Copy the reviewed screenshot and license into the two public paths above and
add both exact stored files to `ASSET_MANIFEST.json`.

### Tool

Add a complete object to `OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES`:

```ts
{
  id: `tool:${slug}`,
  kind: "tool",
  publicationLifecycle: "draft", // or "published" / "withdrawn"
  slug, title, eyebrow, description,
  href: `/open-source/tools/${slug}`,
  language, languageTag: canonicalBcp47LanguageTag,
  source: {
    href: githubRepositoryOrSourcePath,
    revision: fullFortyCharacterCommitSha,
    revisionHref: githubSourcePathAtThatCommit,
  },
  license: {
    href: `/artifacts/tools/${slug}/LICENSE.txt`,
    sourcePath: upstreamLicensePath,
    sha256: licenseSha256,
    sizeBytes: licenseSizeBytes,
  },
  // Required delivery contract. Choose exactly one valid pair:
  // { delivery: "source-only" } (launchHref must be absent)
  // { delivery: "internal-route", launchHref: "/demos/<slug>" }
  // { delivery: "external-service", launchHref: "https://..." }
  delivery: "source-only",
  guide: {
    status, statusNote,
    dataFlow: explicitLocalAndRemoteDataResidencyDisclosure,
    prerequisites: [{ label, detail, href }],
    installation: { summary, steps: [{ title, detail, command }] },
    usage: { summary, steps: [{ title, detail, command }] },
    integration: {
      summary,
      targets: [namedFormatApiOrWorkflow],
      steps: [{ title, detail, command }],
    },
    documentation: { label, href },
    screenshot: {
      src: `/artifacts/tools/${slug}/screenshot.webp`,
      sourcePath: exactUpstreamScreenshotPath,
      alt, sha256: screenshotSha256, sizeBytes, width, height,
    },
    relatedLearning: [{ title, description, href: internalLearningRoute }],
  },
} satisfies ToolArtifact
```

### Project

A project uses the same guide contract as a tool. Add it only to
`OPEN_SOURCE_PROJECT_ARTIFACT_CANDIDATES` and use the project route and asset
namespace:

```ts
{
  id: `project:${slug}`,
  kind: "project",
  publicationLifecycle: "draft", // or "published" / "withdrawn"
  href: `/open-source/projects/${slug}`,
  languageTag: canonicalBcp47LanguageTag,
  source: { href, revision, revisionHref },
  license: {
    href: `/artifacts/projects/${slug}/LICENSE.txt`,
    sourcePath, sha256, sizeBytes,
  },
  // Required delivery contract. Choose exactly one valid pair:
  // { delivery: "source-only" } (launchHref must be absent)
  // { delivery: "internal-route", launchHref: "/demos/<slug>" }
  // { delivery: "external-service", launchHref: "https://..." }
  delivery: "source-only",
  guide: {
    status, statusNote,
    dataFlow: explicitLocalAndRemoteDataResidencyDisclosure,
    prerequisites,
    installation, usage, integration, documentation,
    screenshot: {
      src: `/artifacts/projects/${slug}/screenshot.webp`,
      sourcePath: exactUpstreamScreenshotPath,
      alt, sha256, sizeBytes, width, height,
    },
    relatedLearning,
  },
  title, eyebrow, description, language, slug,
} satisfies ProjectArtifact
```

The distinction is semantic: publish a reusable bounded utility as a tool and
a demonstrative codebase or reference implementation as a project. Do not
duplicate one source in both lanes.

### Video

Add a complete object to `OPEN_SOURCE_VIDEO_ARTIFACT_CANDIDATES`. All four
media files must be repository-local and independently recorded in
`ASSET_MANIFEST.json`.

```ts
{
  id: `video:${slug}`,
  kind: "video",
  publicationLifecycle: "draft", // or "published" / "withdrawn"
  slug, title, eyebrow, description,
  href: `/open-source/videos/${slug}`,
  language, languageTag: canonicalBcp47LanguageTag,
  source: { href, revision, revisionHref },
  license: {
    href: `/media/${slug}/LICENSE.txt`,
    sourcePath, sha256, sizeBytes,
  },
  watchHref: `/media/${slug}/video.webm`,
  captionsHref: `/media/${slug}/captions.vtt`,
  transcriptHref: `/media/${slug}/transcript.md`,
  posterSrc: `/media/${slug}/poster.webp`,
  posterAlt,
  duration: "PT12M30S",
  datePublished: "YYYY-MM-DD",
  publication: {
    owner, maintainer, creationMethod, modificationHistory,
    licenseId, attribution, redistribution,
    storageLocation, retentionOwner, replacementProcedure,
    availabilityExpectations,
    captionLanguage, transcriptLanguage, accessibilityReviewDate,
  },
  mediaFiles: {
    video: {
      path: `packages/website/public/media/${slug}/video.webm`,
      sourcePath: exactUpstreamVideoPath,
      sha256, sizeBytes, mimeType: "video/webm",
    },
    captions: {
      path: `packages/website/public/media/${slug}/captions.vtt`,
      sourcePath: exactUpstreamCaptionsPath,
      sha256, sizeBytes, mimeType: "text/vtt",
    },
    transcript: {
      path: `packages/website/public/media/${slug}/transcript.md`,
      sourcePath: exactUpstreamTranscriptPath,
      sha256, sizeBytes, mimeType: "text/markdown",
    },
    poster: {
      path: `packages/website/public/media/${slug}/poster.webp`,
      sourcePath: exactUpstreamPosterPath,
      sha256, sizeBytes, mimeType: "image/webp",
    },
  },
} satisfies VideoArtifact
```

The `watchHref`, caption, transcript, and poster URLs must resolve exactly to
their `mediaFiles.*.path` values after removing
`packages/website/public`. The accessibility review date must be a
real date no later than `datePublished`.

## License and asset admission

Every artifact carries a locally served license copy. Tool/project screenshots,
course screenshots, licenses, video, captions, transcript, and poster files
must have reviewed `ASSET_MANIFEST.json` records. Registry SHA-256, exact byte
size, MIME type, and image dimensions must describe the stored bytes, not an
upstream expectation. `bun run artifact-assets:check` verifies the artifact
registry lanes; imported-course license and screenshot bytes are verified by
`packages/website/src/lib/courses/catalog.test.ts` against the
catalog hashes.

Each artifact-manifest row must identify the exact immutable upstream file at
the artifact's pinned repository and commit. A redistributed screenshot or
media row must also set `redistributionLicenseHref` to that artifact's locally
served license path. The verifier rejects mutable source URLs, mismatched
owners, repositories, revisions, or paths, local role aliases, and unlicensed
redistribution claims.

Generate each candidate record without writing the manifest:

```bash
bun run asset:record -- packages/website/public/<reviewed-path> \
  --owner "Named rights holder" \
  --source "Immutable provenance" \
  --license "SPDX or reviewed LicenseRef" \
  --redistribution "Explicit redistribution terms"
```

Review the output and add it manually. Then run:

```bash
bun run artifact-assets:check
```

Never infer a license from a repository being public. Preserve required
notices and do not assign the root MIT license to editorial, brand, media, or
third-party files without explicit rights evidence.

## Discovery and rendering admission

The shared registry drives the hub, static detail params, sitemap, `llms.txt`,
JSON-LD, and page inventory. After adding an entry:

1. Confirm its canonical detail route is `200`, indexable, and contains the
   exact canonical URL, source revision, local license, and launch behavior.
2. Regenerate the committed inventory:

   ```bash
   bun run --cwd packages/website page-inventory:generate
   bun run --cwd packages/website page-inventory:check
   ```

3. Add one real detail URL from every non-empty artifact kind to
   `lighthouserc.json`. The first published tool, project, or video must become
   the representative for that lane. Do not add a future or placeholder URL.
4. Run `bun run lighthouse:check`. This is the deterministic route contract;
   it is not a substitute for `bun run lighthouse:local`.
5. Do not hand-edit sitemap totals. Unit tests derive their expected count from
   `OPEN_SOURCE_ARTIFACTS`.

The registry-driven cases in
`packages/website/tests/e2e/route-open-source.spec.ts` automatically
exercise every published tool, project, and video. They verify page metadata,
pinned source, license, launch behavior, complete software guides, and video
caption/transcript/fallback behavior. Empty arrays register zero artifact cases.

## Required proof

Run from the repository root:

```bash
bun run scan:public
bun run artifact-assets:check
bun run lighthouse:check
bun run verify
bun run test:e2e:public:built
bun run lighthouse:local
```

`bun run verify` builds before the `:built` browser command reuses that exact
output. Use `bun run test:e2e:public` instead when no verified current build
exists. A release also requires the separate legal launch gate documented in
`README.md`.

For a tool or project, manually verify every documented install, usage, and
integration step in a clean environment. For media, complete every manual
desktop, mobile, keyboard, screen-reader, caption, transcript, and failure
check in `MEDIA_POLICY.md`.

## Rejection rules

Reject the artifact when any of the following is true:

- source code or the pinned revision is not publicly reachable on GitHub;
- the source pin is mutable, abbreviated, unpushed, or does not contain the
  described source and license;
- ownership, license, attribution, redistribution, or asset integrity is
  incomplete;
- a credential, populated environment file, personal data, customer data,
  internal plan, private endpoint, machine-local path, or provider project
  identifier would enter the public tree;
- a required provider or secret is needed to render the public guide;
- a launch target sends learner data, loads third-party code, or expands CSP
  without an explicit privacy and security review;
- a tool/project guide cannot be followed, a video lacks human-reviewed
  captions or transcript, or the browser and accessibility proof is absent;
- page inventory, scanner, verifier, browser, build, or Lighthouse gates fail.

Do not weaken a validator, skip a failing lane, fabricate evidence, or publish
an empty promise to obtain a green release.
