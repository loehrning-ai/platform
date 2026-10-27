// The open-source registry covers only artifacts published (or prepared for
// publication) under the GitHub organization `loehrning-ai`: tools, projects,
// and videos. Imported interactive courses are catalog content of /kurse
// (src/lib/courses/catalog.ts) and are deliberately not part of this registry.
export const OPEN_SOURCE_ARTIFACT_KINDS = ["tool", "project", "video"] as const;

export type OpenSourceArtifactKind =
  (typeof OPEN_SOURCE_ARTIFACT_KINDS)[number];

export const OPEN_SOURCE_ARTIFACT_PUBLICATION_LIFECYCLES = [
  "draft",
  "published",
  "withdrawn",
] as const;

export type OpenSourceArtifactPublicationLifecycle =
  (typeof OPEN_SOURCE_ARTIFACT_PUBLICATION_LIFECYCLES)[number];

/**
 * Conservative metadata budgets for cards and social previews. Sixty Unicode
 * code points keeps titles inside common one-line preview limits; 160 keeps
 * descriptions inside the conventional search/social summary budget.
 */
export const OPEN_SOURCE_ARTIFACT_TEXT_LIMITS = {
  title: 60,
  description: 160,
} as const;

/** A license must remain small enough to inspect and serve as plain text. */
export const OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES = 256 * 1024;

/** Browser screenshots/posters stay bounded for build-time verification. */
export const OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES = 20 * 1024 * 1024;

/**
 * Media verification reads from a stable descriptor into memory. Per-role
 * limits prevent a malformed candidate from exhausting CI memory while
 * retaining enough headroom for repository-hosted publication assets.
 */
export const OPEN_SOURCE_ARTIFACT_MEDIA_MAX_BYTES = {
  video: 100 * 1024 * 1024,
  captions: 5 * 1024 * 1024,
  transcript: 5 * 1024 * 1024,
  poster: OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES,
} as const;

export interface OpenSourceArtifactSource {
  /** Commit-pinned repository or source-tree URL. */
  readonly href: string;
  /** Immutable source revision. */
  readonly revision: string;
  /** URL resolving the artifact at the immutable source revision. */
  readonly revisionHref: string;
}

export interface OpenSourceArtifactLicense {
  /** Public, locally hosted license text. */
  readonly href: string;
  /** License path in the upstream source tree. */
  readonly sourcePath: string;
  /** SHA-256 of the locally hosted license text. */
  readonly sha256: string;
  /** Exact byte size of the locally hosted license text. */
  readonly sizeBytes: number;
  /**
   * Optional SPDX or LicenseRef identifier for the license text. Present so a
   * card or data plate can name the license without parsing its full text.
   */
  readonly licenseId?: string;
}

interface OpenSourceArtifactBaseFields<Kind extends OpenSourceArtifactKind> {
  readonly id: `${Kind}:${string}`;
  readonly kind: Kind;
  readonly slug: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly description: string;
  /** Stable internal detail route. */
  readonly href: string;
  /** Human-readable label rendered in cards and data plates. */
  readonly language: string;
  readonly source: OpenSourceArtifactSource;
  readonly license: OpenSourceArtifactLicense;
}

type OpenSourceArtifactBase<Kind extends OpenSourceArtifactKind> =
  OpenSourceArtifactBaseFields<Kind> &
    (
      | {
          /** Controls public discovery; drafts remain outside public output. */
          readonly publicationLifecycle: "draft";
          /** Optional only while the record remains a non-public draft. */
          readonly languageTag?: string;
        }
      | {
          /** Published and withdrawn records retain complete discovery data. */
          readonly publicationLifecycle: "published" | "withdrawn";
          /** Canonical BCP 47 tag used directly in machine-readable metadata. */
          readonly languageTag: string;
        }
    );

export const SOFTWARE_ARTIFACT_STATUSES = [
  "experimental",
  "stable",
  "maintenance",
  "archived",
] as const;

export type SoftwareArtifactStatus =
  (typeof SOFTWARE_ARTIFACT_STATUSES)[number];

export interface SoftwareArtifactPrerequisite {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
}

export interface SoftwareArtifactStep {
  readonly title: string;
  readonly detail: string;
  /** Exact command a reader can copy; never executed by the platform. */
  readonly command?: string;
}

export interface SoftwareArtifactProcedure {
  readonly summary: string;
  readonly steps: readonly SoftwareArtifactStep[];
}

export interface SoftwareArtifactIntegration extends SoftwareArtifactProcedure {
  /** Named systems, file formats, APIs, or workflows this artifact connects to. */
  readonly targets: readonly string[];
}

export interface SoftwareArtifactDocumentation {
  readonly label: string;
  readonly href: string;
}

export interface SoftwareArtifactScreenshot {
  readonly src: string;
  /** Exact image path in the pinned upstream source tree. */
  readonly sourcePath: string;
  readonly alt: string;
  /** SHA-256 of the exact stored image. */
  readonly sha256: string;
  /** Exact byte size of the stored image. */
  readonly sizeBytes: number;
  readonly width: number;
  readonly height: number;
}

/**
 * One frame of the optional short demo. It carries the exact same provenance
 * contract as the lead screenshot (pinned upstream path, digest, byte size,
 * dimensions) plus the caption that makes the sequence readable as a story.
 * Demo frames are real captures from the pinned revision, never mock-ups.
 */
export interface SoftwareArtifactDemoStep extends SoftwareArtifactScreenshot {
  /** One sentence naming what this frame demonstrates. */
  readonly caption: string;
}

export interface SoftwareArtifactRelatedLearning {
  readonly title: string;
  readonly description: string;
  /** Stable internal learning route. */
  readonly href: string;
}

/** A specimen film is small enough to scrub on a phone without a CDN. */
export const OPEN_SOURCE_SPECIMEN_FILM_MAX_BYTES = 1_572_864;

/** A file derived from one pinned upstream file (re-encoded, never invented). */
export interface DerivedMediaFile {
  readonly src: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

/** A muted mp4 re-encoded from a pinned upstream file. */
export interface DerivedFilm extends DerivedMediaFile {
  /** Upstream path at the pin, for example `docs/media/showreel-1x1.mp4`. */
  readonly derivedFrom: string;
  readonly width: number;
  readonly height: number;
  /** True file duration in seconds. */
  readonly durationS: number;
  /** JPEG frame of the same upstream file. */
  readonly poster: DerivedMediaFile;
  /** What the film shows, in words. */
  readonly alt: string;
}

export interface SpecimenChapter {
  /** Start second, ascending, the first is 0. */
  readonly atS: number;
  readonly label: string;
}

/**
 * What the tool's stage plays as a pure function of time. `film` scrubs a
 * derived mp4; `drawn` is a component keyed by artifact id (its chapters live
 * in the component), allowed only for ids in DRAWN_SPECIMEN_IDS.
 */
export type SoftwareArtifactSpecimen =
  | {
      readonly kind: "film";
      readonly film: DerivedFilm;
      /** Rest frame: ruler end, poster frame and hold point. */
      readonly endS: number;
      /** Minor ruler ticks. */
      readonly beatS?: number;
      readonly chapters: readonly SpecimenChapter[];
    }
  | { readonly kind: "drawn" };

export const DRAWN_SPECIMEN_IDS = ["tool:cv-engine"] as const;

/** One thing the tool made for the live example, on this site. */
export interface SoftwareArtifactLiveExampleLink {
  readonly label: string;
  /** What the reader finds there, in one short sentence. */
  readonly detail: string;
  /** Repository-local route or static file. */
  readonly href: string;
}

/**
 * A finished piece of work built with the tool and published on this site,
 * linked rather than embedded: the reader opens the real output.
 */
export interface SoftwareArtifactLiveExample {
  readonly title: string;
  /** What was built, and whether the case is invented. */
  readonly summary: string;
  readonly links: readonly SoftwareArtifactLiveExampleLink[];
}

/** A live example links two to six outputs. */
export const OPEN_SOURCE_LIVE_EXAMPLE_LINKS = { min: 2, max: 6 } as const;

export interface SoftwareArtifactFormula {
  readonly input: string;
  readonly process: string;
  readonly output: string;
}

export interface SoftwareArtifactQuickstart {
  /** One line that clones the pinned revision and runs the tool. */
  readonly command: string;
  /** Prerequisites and download size, in plain words. */
  readonly note: string;
}

/**
 * Mandatory publication guide for future tools and projects. An entry cannot
 * enter the public registry with only a title and repository link: it must be
 * installable, usable, integratable, documented, illustrated, and connected
 * to a learning path.
 */
export interface SoftwareArtifactGuide {
  readonly status: SoftwareArtifactStatus;
  readonly statusNote: string;
  /**
   * Mandatory data-residency disclosure: where the artifact sends data and
   * what stays local. A fixed structured slot is auditable in a way that free
   * prose inside `statusNote` is not.
   */
  readonly dataFlow: string;
  readonly prerequisites: readonly SoftwareArtifactPrerequisite[];
  readonly installation: SoftwareArtifactProcedure;
  readonly usage: SoftwareArtifactProcedure;
  readonly integration: SoftwareArtifactIntegration;
  readonly documentation: SoftwareArtifactDocumentation;
  readonly screenshot: SoftwareArtifactScreenshot;
  /**
   * Optional ordered walkthrough shown on the detail page. Every frame is
   * verified exactly like the lead screenshot, so a demo can never introduce
   * an unpinned or unhashed image.
   */
  readonly demo?: readonly SoftwareArtifactDemoStep[];
  readonly relatedLearning: readonly SoftwareArtifactRelatedLearning[];
  /** What goes in, what happens in between, what comes out. */
  readonly formula?: SoftwareArtifactFormula;
  readonly quickstart?: SoftwareArtifactQuickstart;
  /** Without one, the stage shows the lead screenshot. */
  readonly specimen?: SoftwareArtifactSpecimen;
  /** Real output films for the detail page. */
  readonly outputFilms?: readonly DerivedFilm[];
  /** Finished work made with the tool, published on this site. */
  readonly liveExample?: SoftwareArtifactLiveExample;
}

export const SOFTWARE_ARTIFACT_DELIVERY_MODES = [
  "source-only",
  "internal-route",
  "external-service",
  "hosted-service",
] as const;

export type SoftwareArtifactDeliveryMode =
  (typeof SOFTWARE_ARTIFACT_DELIVERY_MODES)[number];

export type SoftwareArtifactDelivery =
  | {
      readonly delivery: "source-only";
      readonly launchHref?: undefined;
    }
  | {
      readonly delivery: "internal-route";
      readonly launchHref: string;
    }
  | {
      readonly delivery: "external-service";
      readonly launchHref: string;
    }
  /**
   * An instance of the published source that loehrning.ai runs itself. It is
   * separated from `external-service` because the label must not call the
   * operator's own machine a third-party service, and because the validator
   * below keeps the launch target on a loehrning.ai subdomain: a mode that
   * says "we run this" may never point at somebody else's server.
   */
  | {
      readonly delivery: "hosted-service";
      readonly launchHref: string;
    };

type SoftwareArtifactBase<Kind extends "tool" | "project"> =
  OpenSourceArtifactBase<Kind> & {
    readonly guide: SoftwareArtifactGuide;
  };

export type ToolArtifact = SoftwareArtifactBase<"tool"> &
  SoftwareArtifactDelivery;

export type ProjectArtifact = SoftwareArtifactBase<"project"> &
  SoftwareArtifactDelivery;

export interface OpenSourceMediaFile {
  /** Normalized path from the repository root. */
  readonly path: string;
  /** Exact media path in the pinned upstream source tree. */
  readonly sourcePath: string;
  /** Lowercase SHA-256 of the exact stored file. */
  readonly sha256: string;
  /** Exact size of the stored file. */
  readonly sizeBytes: number;
  /** Exact media type served for this file. */
  readonly mimeType: string;
}

export interface VideoPublicationMetadata {
  readonly owner: string;
  readonly maintainer: string;
  readonly creationMethod: string;
  readonly modificationHistory: string;
  readonly licenseId: string;
  readonly attribution: string;
  readonly redistribution: string;
  readonly storageLocation: string;
  readonly retentionOwner: string;
  readonly replacementProcedure: string;
  readonly availabilityExpectations: string;
  /** BCP 47 language tag used by the WebVTT track. */
  readonly captionLanguage: string;
  /** BCP 47 language tag for the complete transcript. */
  readonly transcriptLanguage: string;
  /** ISO calendar date of the completed human accessibility review. */
  readonly accessibilityReviewDate: `${number}-${number}-${number}`;
}

export type VideoArtifact = OpenSourceArtifactBase<"video"> & {
  readonly watchHref: string;
  readonly captionsHref: string;
  readonly transcriptHref: string;
  readonly posterSrc: string;
  readonly posterAlt: string;
  readonly publication: VideoPublicationMetadata;
  readonly mediaFiles: {
    readonly video: OpenSourceMediaFile;
    readonly captions: OpenSourceMediaFile;
    readonly transcript: OpenSourceMediaFile;
    readonly poster: OpenSourceMediaFile;
  };
  /** ISO 8601 duration, for example PT12M30S. */
  readonly duration: `PT${string}`;
  /** ISO calendar date. */
  readonly datePublished: `${number}-${number}-${number}`;
};

export type OpenSourceArtifact = ToolArtifact | ProjectArtifact | VideoArtifact;

function artifactError(id: string, field: string, message: string): never {
  throw new Error(`Invalid open-source artifact ${id} (${field}): ${message}`);
}

function assertText(
  id: string,
  field: string,
  value: unknown,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    artifactError(id, field, "must be a non-empty string");
  }
}

function assertBcp47LanguageTag(
  id: string,
  field: string,
  value: unknown,
): asserts value is string {
  assertText(id, field, value);
  let canonical: string[];
  try {
    canonical = Intl.getCanonicalLocales(value);
  } catch {
    artifactError(id, field, "must be a valid canonical BCP 47 language tag");
  }
  if (canonical.length !== 1 || canonical[0] !== value) {
    artifactError(id, field, "must be a valid canonical BCP 47 language tag");
  }
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function assertInternalHref(id: string, field: string, value: unknown): void {
  assertText(id, field, value);
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    hasControlCharacter(value) ||
    /%(?:25)*(?:00|0a|0d|2f|5c)/i.test(value)
  ) {
    artifactError(id, field, "must be an unambiguous repository-local URL");
  }
  const parsed = new URL(value, "https://artifact.invalid");
  if (parsed.origin !== "https://artifact.invalid") {
    artifactError(id, field, "must stay on the platform origin");
  }
}

function assertHttpsHref(id: string, field: string, value: unknown): URL {
  assertText(id, field, value);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    artifactError(id, field, "must be a valid URL");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    artifactError(id, field, "must use HTTPS without embedded credentials");
  }
  return parsed;
}

/**
 * Every host that a `hosted-service` launch target may use. The suffix is
 * checked against the parsed hostname, so a lookalike such as
 * `loehrning.ai.example.com` never matches, and the apex is excluded because
 * the platform's own routes are `internal-route`, not a hosted instance.
 */
const HOSTED_SERVICE_HOST_SUFFIX = ".loehrning.ai";

function assertHostedServiceHref(
  id: string,
  field: string,
  value: unknown,
): void {
  const parsed = assertHttpsHref(id, field, value);
  if (
    !parsed.hostname.endsWith(HOSTED_SERVICE_HOST_SUFFIX) ||
    parsed.hostname.length <= HOSTED_SERVICE_HOST_SUFFIX.length
  ) {
    artifactError(
      id,
      field,
      `must be an HTTPS URL on a subdomain of ${HOSTED_SERVICE_HOST_SUFFIX.slice(1)}`,
    );
  }
}

function assertPublicHref(id: string, field: string, value: unknown): void {
  assertText(id, field, value);
  if (value.startsWith("/")) assertInternalHref(id, field, value);
  else assertHttpsHref(id, field, value);
}

function assertRevisionHrefAncestry(
  id: string,
  source: OpenSourceArtifactSource | undefined,
): string {
  const sourceHref = assertHttpsHref(id, "source.href", source?.href);
  assertText(id, "source.revision", source?.revision);
  if (!/^[a-f0-9]{40}$/.test(source.revision)) {
    artifactError(
      id,
      "source.revision",
      "must be a 40-character lowercase commit SHA",
    );
  }
  const revisionHref = assertHttpsHref(
    id,
    "source.revisionHref",
    source?.revisionHref,
  );
  const githubOrigin = "https://github.com";
  if (
    sourceHref.origin !== githubOrigin ||
    sourceHref.search ||
    sourceHref.hash
  ) {
    artifactError(
      id,
      "source.href",
      "must be a clean public github.com repository or immutable revision URL",
    );
  }
  if (
    revisionHref.origin !== githubOrigin ||
    revisionHref.search ||
    revisionHref.hash
  ) {
    artifactError(
      id,
      "source.revisionHref",
      "must be a clean public github.com immutable revision URL",
    );
  }
  const sourcePath = sourceHref.pathname.replace(/\/+$/, "");
  const revisionPath = revisionHref.pathname.replace(/\/+$/, "");
  const sourceSegments = sourcePath.split("/").filter(Boolean);
  const revisionSegments = revisionPath.split("/").filter(Boolean);

  if (sourceSegments.length < 2) {
    artifactError(id, "source.href", "must include an owner and repository");
  }
  if (sourceSegments[0] !== "loehrning-ai") {
    artifactError(
      id,
      "source.href",
      "must be owned by github.com/loehrning-ai",
    );
  }
  if (!/^[A-Za-z0-9._-]+(?:\.git)?$/.test(sourceSegments[1])) {
    artifactError(id, "source.href", "must include a clean repository name");
  }
  const normalizedRepositoryName = sourceSegments[1]
    .replace(/\.git$/i, "")
    .toLocaleLowerCase("en");
  if (normalizedRepositoryName.length === 0) {
    artifactError(id, "source.href", "must include a repository name");
  }
  const repositorySegments = sourceSegments.slice(0, 2);
  const sourceIsRepositoryRoot = sourceSegments.length === 2;
  const sourceIsPinnedTree =
    sourceSegments[2] === "tree" && sourceSegments[3] === source.revision;
  const sourceIsPinnedCommit =
    sourceSegments.length === 4 &&
    sourceSegments[2] === "commit" &&
    sourceSegments[3] === source.revision;
  if (!sourceIsRepositoryRoot && !sourceIsPinnedTree && !sourceIsPinnedCommit) {
    artifactError(
      id,
      "source.href",
      "must be the repository root or a /tree/<revision>/... or /commit/<revision> URL",
    );
  }

  const revisionHasSameRepository = repositorySegments.every(
    (segment, index) => revisionSegments[index] === segment,
  );
  const revisionIsPinnedTree =
    revisionSegments[2] === "tree" && revisionSegments[3] === source.revision;
  const revisionIsPinnedCommit =
    revisionSegments.length === 4 &&
    revisionSegments[2] === "commit" &&
    revisionSegments[3] === source.revision;
  if (
    !revisionHasSameRepository ||
    (!revisionIsPinnedTree && !revisionIsPinnedCommit)
  ) {
    artifactError(
      id,
      "source.revisionHref",
      "must use the same GitHub repository and /tree/<revision>/... or /commit/<revision> form",
    );
  }
  if (
    revisionPath !== sourcePath &&
    !revisionPath.startsWith(`${sourcePath}/`)
  ) {
    artifactError(
      id,
      "source.revisionHref",
      "must stay below the source origin and repository path",
    );
  }
  return `https://github.com/loehrning-ai/${normalizedRepositoryName}`;
}

function assertSoftwareArtifactAssetHref(
  id: string,
  field: string,
  value: unknown,
  kind: "tool" | "project",
  slug: string,
): void {
  assertInternalHref(id, field, value);
  const href = value as string;
  const parsed = new URL(href, "https://artifact.invalid");
  const expectedPrefix = `/artifacts/${kind}s/${slug}/`;
  if (
    parsed.search ||
    parsed.hash ||
    parsed.pathname !== href ||
    !parsed.pathname.startsWith(expectedPrefix) ||
    parsed.pathname.length === expectedPrefix.length
  ) {
    artifactError(
      id,
      field,
      `must be a plain asset path below ${expectedPrefix}`,
    );
  }
}

function assertSoftwareArtifactDelivery(
  id: string,
  artifact: ToolArtifact | ProjectArtifact,
): void {
  const delivery = (artifact as { readonly delivery?: unknown }).delivery;
  const launchHref = (artifact as { readonly launchHref?: unknown }).launchHref;

  if (
    typeof delivery !== "string" ||
    !SOFTWARE_ARTIFACT_DELIVERY_MODES.includes(
      delivery as SoftwareArtifactDeliveryMode,
    )
  ) {
    artifactError(id, "delivery", "must be a supported delivery mode");
  }

  switch (delivery) {
    case "source-only":
      if (launchHref !== undefined) {
        artifactError(
          id,
          "launchHref",
          "must be omitted when delivery is source-only",
        );
      }
      return;
    case "internal-route":
      assertInternalHref(id, "launchHref", launchHref);
      return;
    case "external-service":
      assertHttpsHref(id, "launchHref", launchHref);
      return;
    case "hosted-service":
      assertHostedServiceHref(id, "launchHref", launchHref);
      return;
  }
}

function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const PUBLIC_MEDIA_PREFIX = "packages/website/public/media/";
const VIDEO_MEDIA_MIME_TYPES = {
  video: new Map<string, string>([
    ["mp4", "video/mp4"],
    ["ogg", "video/ogg"],
    ["webm", "video/webm"],
  ]),
  captions: new Map<string, string>([["vtt", "text/vtt"]]),
  transcript: new Map<string, string>([
    ["md", "text/markdown"],
    ["txt", "text/plain"],
  ]),
  poster: new Map<string, string>([
    ["jpeg", "image/jpeg"],
    ["jpg", "image/jpeg"],
    ["png", "image/png"],
    ["webp", "image/webp"],
  ]),
} as const;

type VideoMediaRole = keyof typeof VIDEO_MEDIA_MIME_TYPES;

function assertUpstreamSourcePath(
  id: string,
  field: string,
  value: unknown,
): asserts value is string {
  assertText(id, field, value);
  if (
    pathIsUnsafe(value) ||
    value.includes("?") ||
    value.includes("#") ||
    value.split("/").some((segment) => segment === ".")
  ) {
    artifactError(id, field, "must be a normalized safe upstream source path");
  }
}

function assertMediaFile(
  id: string,
  field: string,
  value: OpenSourceMediaFile | undefined,
  role: VideoMediaRole,
): void {
  if (!value || typeof value !== "object") {
    artifactError(id, field, "must identify a stored media file");
  }
  assertText(id, `${field}.path`, value.path);
  if (pathIsUnsafe(value.path) || !value.path.startsWith(PUBLIC_MEDIA_PREFIX)) {
    artifactError(
      id,
      `${field}.path`,
      `must be a safe repository path below ${PUBLIC_MEDIA_PREFIX}`,
    );
  }
  assertUpstreamSourcePath(id, `${field}.sourcePath`, value.sourcePath);
  assertText(id, `${field}.sha256`, value.sha256);
  if (!/^[a-f0-9]{64}$/.test(value.sha256)) {
    artifactError(id, `${field}.sha256`, "must be a lowercase SHA-256 digest");
  }
  const maximumSizeBytes = OPEN_SOURCE_ARTIFACT_MEDIA_MAX_BYTES[role];
  if (
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes <= 0 ||
    value.sizeBytes > maximumSizeBytes
  ) {
    artifactError(
      id,
      `${field}.sizeBytes`,
      `must be between 1 and ${String(maximumSizeBytes)} bytes`,
    );
  }
  assertText(id, `${field}.mimeType`, value.mimeType);
  const extension = value.path.split(".").at(-1)?.toLowerCase() ?? "";
  const expectedMimeType = VIDEO_MEDIA_MIME_TYPES[role].get(extension);
  if (!expectedMimeType || value.mimeType !== expectedMimeType) {
    artifactError(
      id,
      `${field}.mimeType`,
      `must match the stored file extension (${expectedMimeType ?? "unsupported"})`,
    );
  }
  const sourceExtension =
    value.sourcePath.split(".").at(-1)?.toLowerCase() ?? "";
  if (VIDEO_MEDIA_MIME_TYPES[role].get(sourceExtension) !== value.mimeType) {
    artifactError(
      id,
      `${field}.sourcePath`,
      "must identify the same supported media type as the stored file",
    );
  }
}

function assertNonEmptyArray(
  id: string,
  field: string,
  value: unknown,
): asserts value is readonly unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    artifactError(id, field, "must contain at least one entry");
  }
}

function assertUniqueTextValues(
  id: string,
  field: string,
  values: readonly string[],
): void {
  if (
    new Set(values.map((value) => value.trim().toLocaleLowerCase("en")))
      .size !== values.length
  ) {
    artifactError(id, field, "must not contain duplicate entries");
  }
}

function assertProcedure(
  id: string,
  field: string,
  value: SoftwareArtifactProcedure | undefined,
): void {
  if (!value || typeof value !== "object") {
    artifactError(id, field, "must define a publication procedure");
  }
  assertText(id, `${field}.summary`, value.summary);
  assertNonEmptyArray(id, `${field}.steps`, value.steps);
  const titles: string[] = [];
  for (const [index, step] of value.steps.entries()) {
    if (!step || typeof step !== "object") {
      artifactError(
        id,
        `${field}.steps[${index}]`,
        "must define a structured step",
      );
    }
    assertText(id, `${field}.steps[${index}].title`, step.title);
    assertText(id, `${field}.steps[${index}].detail`, step.detail);
    if (step.command !== undefined) {
      assertText(id, `${field}.steps[${index}].command`, step.command);
      if (hasControlCharacter(step.command.replaceAll("\n", ""))) {
        artifactError(
          id,
          `${field}.steps[${index}].command`,
          "must not contain control characters other than newlines",
        );
      }
    }
    titles.push(step.title);
  }
  assertUniqueTextValues(id, `${field}.steps`, titles);
}

/**
 * The provenance contract shared by the lead screenshot and every demo frame:
 * a locally stored browser-safe image, an exact path in the pinned upstream
 * tree, published alt text, and a byte-exact digest, size, and geometry.
 */
function assertSoftwareArtifactImage(
  id: string,
  field: string,
  image: SoftwareArtifactScreenshot,
): void {
  if (!image || typeof image !== "object") {
    artifactError(id, field, "must define an accessible image");
  }
  assertInternalHref(id, `${field}.src`, image.src);
  assertUpstreamSourcePath(id, `${field}.sourcePath`, image.sourcePath);
  const storedPath = new URL(image.src, "https://artifact.invalid").pathname;
  if (!/\.(?:jpe?g|png|webp)$/i.test(storedPath)) {
    artifactError(
      id,
      `${field}.src`,
      "must reference a browser-safe JPEG, PNG, or WebP image",
    );
  }
  if (!/\.(?:jpe?g|png|webp)$/i.test(image.sourcePath)) {
    artifactError(
      id,
      `${field}.sourcePath`,
      "must identify a browser-safe JPEG, PNG, or WebP image",
    );
  }
  assertText(id, `${field}.alt`, image.alt);
  assertText(id, `${field}.sha256`, image.sha256);
  if (!/^[a-f0-9]{64}$/.test(image.sha256)) {
    artifactError(id, `${field}.sha256`, "must be a lowercase SHA-256 digest");
  }
  if (
    !Number.isSafeInteger(image.sizeBytes) ||
    image.sizeBytes <= 0 ||
    image.sizeBytes > OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES
  ) {
    artifactError(
      id,
      `${field}.sizeBytes`,
      `must be between 1 and ${String(OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES)} bytes`,
    );
  }
  for (const dimension of ["width", "height"] as const) {
    if (!Number.isSafeInteger(image[dimension]) || image[dimension] <= 0) {
      artifactError(
        id,
        `${field}.${dimension}`,
        "must be a positive safe integer",
      );
    }
  }
}

function assertSoftwareArtifactGuide(
  id: string,
  value: SoftwareArtifactGuide | undefined,
): void {
  if (!value || typeof value !== "object") {
    artifactError(id, "guide", "must define the complete publication guide");
  }
  if (!SOFTWARE_ARTIFACT_STATUSES.includes(value.status)) {
    artifactError(id, "guide.status", "must be a supported publication status");
  }
  assertText(id, "guide.statusNote", value.statusNote);
  assertText(id, "guide.dataFlow", value.dataFlow);

  assertNonEmptyArray(id, "guide.prerequisites", value.prerequisites);
  const prerequisiteLabels: string[] = [];
  for (const [index, prerequisite] of value.prerequisites.entries()) {
    if (!prerequisite || typeof prerequisite !== "object") {
      artifactError(
        id,
        `guide.prerequisites[${index}]`,
        "must define a structured prerequisite",
      );
    }
    assertText(id, `guide.prerequisites[${index}].label`, prerequisite.label);
    assertText(id, `guide.prerequisites[${index}].detail`, prerequisite.detail);
    if (prerequisite.href !== undefined) {
      assertPublicHref(
        id,
        `guide.prerequisites[${index}].href`,
        prerequisite.href,
      );
    }
    prerequisiteLabels.push(prerequisite.label);
  }
  assertUniqueTextValues(id, "guide.prerequisites", prerequisiteLabels);

  assertProcedure(id, "guide.installation", value.installation);
  assertProcedure(id, "guide.usage", value.usage);
  assertProcedure(id, "guide.integration", value.integration);
  assertNonEmptyArray(
    id,
    "guide.integration.targets",
    value.integration.targets,
  );
  const targets: string[] = [];
  for (const [index, target] of value.integration.targets.entries()) {
    assertText(id, `guide.integration.targets[${index}]`, target);
    targets.push(target);
  }
  assertUniqueTextValues(id, "guide.integration.targets", targets);

  if (!value.documentation || typeof value.documentation !== "object") {
    artifactError(
      id,
      "guide.documentation",
      "must define public documentation",
    );
  }
  assertText(id, "guide.documentation.label", value.documentation.label);
  assertPublicHref(id, "guide.documentation.href", value.documentation.href);

  assertSoftwareArtifactImage(id, "guide.screenshot", value.screenshot);

  // The optional demo is verified frame by frame with the SAME contract as
  // the lead screenshot: a walkthrough can never smuggle in an unpinned,
  // unhashed, or foreign image, and its captions must be real prose.
  if (value.demo !== undefined) {
    assertNonEmptyArray(id, "guide.demo", value.demo);
    const demoSources: string[] = [];
    for (const [index, step] of value.demo.entries()) {
      const field = `guide.demo[${index}]`;
      if (!step || typeof step !== "object") {
        artifactError(id, field, "must define a structured demo step");
      }
      assertSoftwareArtifactImage(id, field, step);
      assertText(id, `${field}.caption`, step.caption);
      if (step.src === value.screenshot.src) {
        artifactError(
          id,
          `${field}.src`,
          "must not repeat the lead screenshot",
        );
      }
      demoSources.push(step.src);
    }
    assertUniqueTextValues(id, "guide.demo", demoSources);
  }

  assertNonEmptyArray(id, "guide.relatedLearning", value.relatedLearning);
  const relatedHrefs: string[] = [];
  for (const [index, related] of value.relatedLearning.entries()) {
    if (!related || typeof related !== "object") {
      artifactError(
        id,
        `guide.relatedLearning[${index}]`,
        "must define a structured learning reference",
      );
    }
    assertText(id, `guide.relatedLearning[${index}].title`, related.title);
    assertText(
      id,
      `guide.relatedLearning[${index}].description`,
      related.description,
    );
    assertInternalHref(
      id,
      `guide.relatedLearning[${index}].href`,
      related.href,
    );
    relatedHrefs.push(related.href);
  }
  if (new Set(relatedHrefs).size !== relatedHrefs.length) {
    artifactError(
      id,
      "guide.relatedLearning",
      "must not contain duplicate routes",
    );
  }
}

function assertTextWithin(
  id: string,
  field: string,
  value: unknown,
  limit: number,
): asserts value is string {
  assertText(id, field, value);
  if (Array.from(value).length > limit) {
    artifactError(id, field, `must not exceed ${String(limit)} Unicode code points`);
  }
}

function assertDerivedFile(
  id: string,
  field: string,
  file: DerivedMediaFile | undefined,
  pattern: RegExp,
  maxBytes: number,
): void {
  if (!file || typeof file !== "object") {
    artifactError(id, field, "must define a stored derived file");
  }
  assertInternalHref(id, `${field}.src`, file.src);
  if (!pattern.test(file.src)) {
    artifactError(id, `${field}.src`, `must match ${pattern.source}`);
  }
  if (typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256)) {
    artifactError(id, `${field}.sha256`, "must be a lowercase SHA-256 digest");
  }
  if (
    !Number.isSafeInteger(file.sizeBytes) ||
    file.sizeBytes <= 0 ||
    file.sizeBytes > maxBytes
  ) {
    artifactError(
      id,
      `${field}.sizeBytes`,
      `must be between 1 and ${String(maxBytes)} bytes`,
    );
  }
}

function assertDerivedFilm(
  id: string,
  field: string,
  film: DerivedFilm | undefined,
  mediaPrefix: string,
): void {
  const prefix = mediaPrefix.replaceAll("/", "\\/");
  assertDerivedFile(
    id,
    field,
    film,
    new RegExp(`^${prefix}[a-z0-9-]+\\.mp4$`),
    OPEN_SOURCE_SPECIMEN_FILM_MAX_BYTES,
  );
  const checked = film as DerivedFilm;
  assertDerivedFile(
    id,
    `${field}.poster`,
    checked.poster,
    new RegExp(`^${prefix}[a-z0-9-]+\\.jpg$`),
    OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES,
  );
  assertUpstreamSourcePath(id, `${field}.derivedFrom`, checked.derivedFrom);
  for (const dimension of ["width", "height"] as const) {
    if (!Number.isSafeInteger(checked[dimension]) || checked[dimension] <= 0) {
      artifactError(id, `${field}.${dimension}`, "must be a positive safe integer");
    }
  }
  if (
    typeof checked.durationS !== "number" ||
    !(checked.durationS > 0 && checked.durationS <= 60)
  ) {
    artifactError(id, `${field}.durationS`, "must be above 0 and at most 60 seconds");
  }
  assertText(id, `${field}.alt`, checked.alt);
}

/**
 * The optional showcase fields of a tool or project: the formula line, the
 * one-line quickstart pinned to the reviewed revision, the specimen the
 * stage plays, and derived output films. Every film is a muted re-encode
 * of a named upstream file below the artifact's own media folder.
 */
function assertSoftwareArtifactShowcase(
  id: string,
  artifact: ToolArtifact | ProjectArtifact,
): void {
  const { guide } = artifact;
  if (guide.formula !== undefined) {
    assertTextWithin(id, "guide.formula.input", guide.formula.input, 40);
    assertTextWithin(id, "guide.formula.process", guide.formula.process, 120);
    assertTextWithin(id, "guide.formula.output", guide.formula.output, 60);
  }

  if (guide.quickstart !== undefined) {
    const { command, note } = guide.quickstart;
    assertTextWithin(id, "guide.quickstart.command", command, 400);
    if (/[\r\n]/.test(command) || hasControlCharacter(command)) {
      artifactError(id, "guide.quickstart.command", "must be one line");
    }
    if (!command.includes(`git checkout ${artifact.source.revision}`)) {
      artifactError(
        id,
        "guide.quickstart.command",
        "must check out the full pinned source revision",
      );
    }
    if (command.includes(".env")) {
      artifactError(id, "guide.quickstart.command", "must not touch .env files");
    }
    assertTextWithin(id, "guide.quickstart.note", note, 240);
  }

  const mediaPrefix = `/media/${artifact.kind}s/${artifact.slug}/`;
  const specimen = guide.specimen;
  if (specimen !== undefined) {
    if (specimen.kind === "drawn") {
      if (!(DRAWN_SPECIMEN_IDS as readonly string[]).includes(id)) {
        artifactError(id, "guide.specimen", "has no drawn stage for this id");
      }
    } else if (specimen.kind === "film") {
      assertDerivedFilm(id, "guide.specimen.film", specimen.film, mediaPrefix);
      if (
        typeof specimen.endS !== "number" ||
        !(specimen.endS > 0 && specimen.endS <= specimen.film.durationS)
      ) {
        artifactError(id, "guide.specimen.endS", "must lie inside the film");
      }
      if (
        specimen.beatS !== undefined &&
        !(typeof specimen.beatS === "number" && specimen.beatS > 0)
      ) {
        artifactError(id, "guide.specimen.beatS", "must be positive");
      }
      assertNonEmptyArray(id, "guide.specimen.chapters", specimen.chapters);
      specimen.chapters.forEach((chapter, index) => {
        const field = `guide.specimen.chapters[${index}]`;
        assertText(id, `${field}.label`, chapter.label);
        const previous = specimen.chapters[index - 1];
        if (
          typeof chapter.atS !== "number" ||
          (index === 0 ? chapter.atS !== 0 : !(chapter.atS > previous.atS)) ||
          chapter.atS >= specimen.endS
        ) {
          artifactError(
            id,
            `${field}.atS`,
            "must start at 0, ascend strictly and stay before endS",
          );
        }
      });
      assertUniqueTextValues(
        id,
        "guide.specimen.chapters",
        specimen.chapters.map((chapter) => chapter.label),
      );
    } else {
      artifactError(id, "guide.specimen.kind", "must be film or drawn");
    }
  }

  if (guide.outputFilms !== undefined) {
    if (guide.outputFilms.length > 2) {
      artifactError(id, "guide.outputFilms", "must hold at most two films");
    }
    guide.outputFilms.forEach((film, index) =>
      assertDerivedFilm(id, `guide.outputFilms[${index}]`, film, mediaPrefix),
    );
    const sources = guide.outputFilms.map((film) => film.src);
    if (specimen?.kind === "film") sources.push(specimen.film.src);
    if (new Set(sources).size !== sources.length) {
      artifactError(id, "guide.outputFilms", "must not repeat a film");
    }
  }

  if (guide.liveExample !== undefined) {
    assertLiveExample(id, guide.liveExample);
  }
}

/** Every link stays on this site, so the example can never become an embed. */
function assertLiveExample(id: string, example: SoftwareArtifactLiveExample): void {
  assertTextWithin(id, "guide.liveExample.title", example.title, 60);
  assertTextWithin(id, "guide.liveExample.summary", example.summary, 320);
  const { min, max } = OPEN_SOURCE_LIVE_EXAMPLE_LINKS;
  if (
    !Array.isArray(example.links) ||
    example.links.length < min ||
    example.links.length > max
  ) {
    artifactError(id, "guide.liveExample.links", `must hold ${min} to ${max} links`);
  }
  example.links.forEach((link, index) => {
    const field = `guide.liveExample.links[${index}]`;
    assertTextWithin(id, `${field}.label`, link.label, 40);
    assertTextWithin(id, `${field}.detail`, link.detail, 140);
    assertInternalHref(id, `${field}.href`, link.href);
  });
  assertUniqueTextValues(
    id,
    "guide.liveExample.links",
    example.links.map((link) => link.href),
  );
}

function publicHrefForMediaFile(file: OpenSourceMediaFile): string {
  return file.path.slice("packages/website/public".length);
}

/** Fail closed when a future artifact lacks publication-grade metadata. */
export function assertOpenSourceArtifacts(
  artifacts: readonly OpenSourceArtifact[],
): void {
  const ids = new Set<string>();
  const slugsByKind = new Set<string>();
  const artifactByRepository = new Map<string, string>();

  for (const artifact of artifacts) {
    const id = typeof artifact?.id === "string" ? artifact.id : "<unknown>";
    if (!OPEN_SOURCE_ARTIFACT_KINDS.includes(artifact.kind)) {
      artifactError(id, "kind", "is not supported");
    }
    if (
      !OPEN_SOURCE_ARTIFACT_PUBLICATION_LIFECYCLES.includes(
        artifact.publicationLifecycle,
      )
    ) {
      artifactError(
        id,
        "publicationLifecycle",
        "must be draft, published, or withdrawn",
      );
    }
    assertText(id, "slug", artifact.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artifact.slug)) {
      artifactError(id, "slug", "must be a lowercase URL slug");
    }
    if (id !== `${artifact.kind}:${artifact.slug}`) {
      artifactError(id, "id", "must equal <kind>:<slug>");
    }
    if (ids.has(id)) artifactError(id, "id", "must be unique");
    ids.add(id);
    const kindSlug = `${artifact.kind}:${artifact.slug}`;
    if (slugsByKind.has(kindSlug))
      artifactError(id, "slug", "must be unique per kind");
    slugsByKind.add(kindSlug);

    for (const [field, value] of [
      ["title", artifact.title],
      ["eyebrow", artifact.eyebrow],
      ["description", artifact.description],
      ["language", artifact.language],
    ] as const) {
      assertText(id, field, value);
    }
    if (artifact.languageTag === undefined) {
      if (artifact.publicationLifecycle !== "draft") {
        artifactError(
          id,
          "languageTag",
          "must be present before an artifact can be published",
        );
      }
    } else {
      assertBcp47LanguageTag(id, "languageTag", artifact.languageTag);
    }
    for (const [field, value, limit] of [
      ["title", artifact.title, OPEN_SOURCE_ARTIFACT_TEXT_LIMITS.title],
      [
        "description",
        artifact.description,
        OPEN_SOURCE_ARTIFACT_TEXT_LIMITS.description,
      ],
    ] as const) {
      if (Array.from(value).length > limit) {
        artifactError(
          id,
          field,
          `must not exceed ${String(limit)} Unicode code points`,
        );
      }
    }
    assertInternalHref(id, "href", artifact.href);
    const expectedHref = `/open-source/${artifact.kind}s/${artifact.slug}`;
    if (artifact.href !== expectedHref) {
      artifactError(id, "href", `must equal ${expectedHref}`);
    }

    const normalizedRepositorySource = assertRevisionHrefAncestry(
      id,
      artifact.source,
    );
    const existingArtifactId = artifactByRepository.get(
      normalizedRepositorySource,
    );
    if (existingArtifactId !== undefined) {
      artifactError(
        id,
        "source.href",
        `must not reuse repository ${normalizedRepositorySource} already registered by ${existingArtifactId}`,
      );
    }
    artifactByRepository.set(normalizedRepositorySource, id);

    assertInternalHref(id, "license.href", artifact.license?.href);
    const licenseHref = new URL(
      artifact.license.href,
      "https://artifact.invalid",
    );
    if (
      licenseHref.search ||
      licenseHref.hash ||
      licenseHref.pathname !== artifact.license.href ||
      !licenseHref.pathname.toLowerCase().endsWith(".txt")
    ) {
      artifactError(
        id,
        "license.href",
        "must be a plain internal path to a .txt license file",
      );
    }
    assertUpstreamSourcePath(
      id,
      "license.sourcePath",
      artifact.license?.sourcePath,
    );
    if (
      pathIsUnsafe(artifact.license.sourcePath) ||
      !/(?:license|copying)/i.test(artifact.license.sourcePath)
    ) {
      artifactError(
        id,
        "license.sourcePath",
        "must be a safe upstream license path",
      );
    }
    assertText(id, "license.sha256", artifact.license?.sha256);
    if (!/^[a-f0-9]{64}$/.test(artifact.license.sha256)) {
      artifactError(id, "license.sha256", "must be a lowercase SHA-256 digest");
    }
    if (
      !Number.isSafeInteger(artifact.license?.sizeBytes) ||
      artifact.license.sizeBytes <= 0 ||
      artifact.license.sizeBytes > OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES
    ) {
      artifactError(
        id,
        "license.sizeBytes",
        `must be between 1 and ${String(OPEN_SOURCE_ARTIFACT_LICENSE_MAX_BYTES)} bytes`,
      );
    }
    if (artifact.license.licenseId !== undefined) {
      assertText(id, "license.licenseId", artifact.license.licenseId);
      if (!/^[A-Za-z0-9.-]+$/.test(artifact.license.licenseId)) {
        artifactError(
          id,
          "license.licenseId",
          "must be an SPDX or LicenseRef identifier",
        );
      }
    }

    if (artifact.kind === "tool" || artifact.kind === "project") {
      assertSoftwareArtifactDelivery(id, artifact);
      assertSoftwareArtifactGuide(id, artifact.guide);
      assertSoftwareArtifactShowcase(id, artifact);
      assertSoftwareArtifactAssetHref(
        id,
        "license.href",
        artifact.license.href,
        artifact.kind,
        artifact.slug,
      );
      if (artifact.license.href === artifact.guide.screenshot.src) {
        artifactError(
          id,
          "guide.screenshot.src",
          "must not reuse the license file path",
        );
      }
      if (
        artifact.license.sourcePath === artifact.guide.screenshot.sourcePath
      ) {
        artifactError(
          id,
          "guide.screenshot.sourcePath",
          "must not reuse the upstream license source path",
        );
      }
      assertSoftwareArtifactAssetHref(
        id,
        "guide.screenshot.src",
        artifact.guide.screenshot.src,
        artifact.kind,
        artifact.slug,
      );
    }

    if (artifact.kind === "video") {
      assertInternalHref(id, "watchHref", artifact.watchHref);
      assertInternalHref(id, "captionsHref", artifact.captionsHref);
      assertInternalHref(id, "transcriptHref", artifact.transcriptHref);
      assertInternalHref(id, "posterSrc", artifact.posterSrc);
      assertText(id, "posterAlt", artifact.posterAlt);
      assertText(id, "duration", artifact.duration);
      if (
        !/^PT(?=\d)(?:\d+H)?(?:\d+M)?(?:\d+(?:\.\d+)?S)?$/.test(
          artifact.duration,
        )
      ) {
        artifactError(id, "duration", "must be an ISO 8601 time duration");
      }
      assertText(id, "datePublished", artifact.datePublished);
      if (!isRealIsoDate(artifact.datePublished)) {
        artifactError(id, "datePublished", "must be a real ISO calendar date");
      }
      for (const field of [
        "owner",
        "maintainer",
        "creationMethod",
        "modificationHistory",
        "licenseId",
        "attribution",
        "redistribution",
        "storageLocation",
        "retentionOwner",
        "replacementProcedure",
        "availabilityExpectations",
        "captionLanguage",
        "transcriptLanguage",
        "accessibilityReviewDate",
      ] as const) {
        assertText(id, `publication.${field}`, artifact.publication?.[field]);
      }
      if (!/^[A-Za-z0-9.-]+$/.test(artifact.publication.licenseId)) {
        artifactError(
          id,
          "publication.licenseId",
          "must be an SPDX or LicenseRef identifier",
        );
      }
      for (const field of ["captionLanguage", "transcriptLanguage"] as const) {
        assertBcp47LanguageTag(
          id,
          `publication.${field}`,
          artifact.publication[field],
        );
      }
      if (!isRealIsoDate(artifact.publication.accessibilityReviewDate)) {
        artifactError(
          id,
          "publication.accessibilityReviewDate",
          "must be a real ISO calendar date",
        );
      }
      if (
        artifact.publication.accessibilityReviewDate > artifact.datePublished
      ) {
        artifactError(
          id,
          "publication.accessibilityReviewDate",
          "must not be later than the publication date",
        );
      }
      const mediaEntries = Object.entries(artifact.mediaFiles ?? {}) as Array<
        [keyof VideoArtifact["mediaFiles"], OpenSourceMediaFile]
      >;
      for (const key of [
        "video",
        "captions",
        "transcript",
        "poster",
      ] as const) {
        assertMediaFile(
          id,
          `mediaFiles.${key}`,
          artifact.mediaFiles?.[key],
          key,
        );
      }
      if (mediaEntries.length !== 4) {
        artifactError(
          id,
          "mediaFiles",
          "must contain exactly video, captions, transcript, and poster",
        );
      }
      const mediaPaths = mediaEntries.map(([, file]) => file.path);
      if (new Set(mediaPaths).size !== mediaPaths.length) {
        artifactError(id, "mediaFiles", "must not reuse the same file path");
      }
      const mediaSourcePaths = mediaEntries.map(([, file]) => file.sourcePath);
      if (new Set(mediaSourcePaths).size !== mediaSourcePaths.length) {
        artifactError(
          id,
          "mediaFiles",
          "must not reuse the same upstream source path",
        );
      }
      if (
        mediaEntries.some(
          ([, file]) => publicHrefForMediaFile(file) === artifact.license.href,
        )
      ) {
        artifactError(
          id,
          "mediaFiles",
          "must not reuse the license file path for a media role",
        );
      }
      if (
        mediaEntries.some(
          ([, file]) => file.sourcePath === artifact.license.sourcePath,
        )
      ) {
        artifactError(
          id,
          "mediaFiles",
          "must not reuse the upstream license source path for a media role",
        );
      }
      for (const [hrefField, fileKey] of [
        ["watchHref", "video"],
        ["captionsHref", "captions"],
        ["transcriptHref", "transcript"],
        ["posterSrc", "poster"],
      ] as const) {
        if (
          artifact[hrefField] !==
          publicHrefForMediaFile(artifact.mediaFiles[fileKey])
        ) {
          artifactError(
            id,
            hrefField,
            `must resolve to mediaFiles.${fileKey}.path`,
          );
        }
      }
    }
  }
}

function pathIsUnsafe(value: string): boolean {
  return (
    value.startsWith("/") ||
    value.includes("\\") ||
    value.split("/").some((segment) => segment === ".." || segment === "") ||
    hasControlCharacter(value)
  );
}

export type PublishedOpenSourceArtifact<
  Artifact extends OpenSourceArtifact = OpenSourceArtifact,
> = Artifact & {
  readonly publicationLifecycle: "published";
  readonly languageTag: string;
};

/**
 * Validates every candidate before hiding non-public lifecycle states. Draft
 * and withdrawn entries therefore cannot become an unvalidated shadow lane.
 */
export function selectPublishedOpenSourceArtifacts<
  Artifact extends OpenSourceArtifact,
>(
  candidates: readonly Artifact[],
): readonly PublishedOpenSourceArtifact<Artifact>[] {
  assertOpenSourceArtifacts(candidates);
  return candidates.filter(
    (artifact): artifact is PublishedOpenSourceArtifact<Artifact> =>
      artifact.publicationLifecycle === "published",
  );
}

/**
 * The slug matches the public repository name exactly. Everything derived from
 * it is built with template literals so id, route, and both asset paths cannot
 * drift apart. A rename after publication is a full re-admission, not an edit.
 */
const CV_ENGINE_SLUG = "cv-engine";

/**
 * Commit A of the two-commit pinning sequence: the single parentless root
 * commit of the public repository, produced from the leak-scanned clean
 * export (Gitleaks, TruffleHog, and detect-secrets over the tree, then again
 * over the one-commit history). Verified before admission, from a logged-out
 * session:
 *
 * - `/commit/<sha>` returns HTTP 200 without authentication;
 * - `git show <sha>:LICENSE | shasum -a 256` equals `license.sha256` below;
 * - `<sha>:docs/screenshots/preview-card.webp` hashes to `screenshot.sha256`.
 *
 * A source change after this commit requires a new pin and a new registry
 * review — never rewrite this reference in place.
 */
const CV_ENGINE_REVISION = "f4b2e92f0bb3e5f6844ba9e6b069b62bc9e38c2e";

const CV_ENGINE_TOOL_ARTIFACT = {
  id: `tool:${CV_ENGINE_SLUG}`,
  kind: "tool",
  publicationLifecycle: "published",
  slug: CV_ENGINE_SLUG,
  title: "CV Engine",
  eyebrow: "Werkzeug · Lebenslauf-Rendering",
  description:
    "Lokaler YAML-zu-PDF-Build für einseitige Lebensläufe, mit Browser-Editor, A4-Vorschau und optionaler KI. Eine zweite Seite lehnt der Build ab.",
  href: `/open-source/tools/${CV_ENGINE_SLUG}`,
  // Exact string, not a near miss: the detail route maps `"Englisch"` to
  // `inLanguage: "en"` in its JSON-LD and silently falls back to `"de"` for
  // every other value. The repository, its README and its commits are English.
  language: "Englisch",
  languageTag: "en",
  source: {
    href: `https://github.com/loehrning-ai/${CV_ENGINE_SLUG}`,
    revision: CV_ENGINE_REVISION,
    revisionHref: `https://github.com/loehrning-ai/${CV_ENGINE_SLUG}/commit/${CV_ENGINE_REVISION}`,
  },
  license: {
    href: `/artifacts/tools/${CV_ENGINE_SLUG}/LICENSE.txt`,
    sourcePath: "LICENSE",
    sha256: "36beaa24d27fc788e411a7fd7cc93d752878e6c51240a8abcc1156ff1451c5bd",
    sizeBytes: 1066,
    licenseId: "MIT",
  },
  // A route on this site, not a hosted instance, and a build-time constant
  // rather than an environment read: the sitemap, `llms.txt` and the
  // knowledge-graph endpoint must be identical in every environment. The
  // route shows pages the pinned engine rendered ahead of time for an
  // invented person (scripts/build-cv-engine-live.ts); it never receives a
  // visitor's CV, so the tool itself still runs only on the reader's machine.
  //
  // `hosted-service` with `launchHref: "https://cv.loehrning.ai"` requires
  // all four of these first, verified by hand, not assumed:
  //
  // - `cv.loehrning.ai` resolves in public DNS;
  // - that host answers over TLS with the pinned cv-engine revision;
  // - `CV_ENGINE_HOSTED_URL` is set in Vercel preview and production;
  // - `CV_ENGINE_HOSTED_CONFIRMED_AT` records the date it was reached.
  //
  // The same commit has to rewrite `guide.statusNote` and `guide.dataFlow`
  // below and their English twins in display-copy.ts, because both tell the
  // reader the tool runs on their own machine, and the hub eyebrow in
  // display-copy.ts, which promises a tool you run yourself.
  delivery: "internal-route",
  launchHref: `/open-source/tools/${CV_ENGINE_SLUG}/live`,
  guide: {
    status: "experimental",
    statusNote:
      "Das Schema in cv.yaml und die Vorlagen können sich noch ändern, es gibt keine gehostete Instanz, und Antworten auf Issues sind nicht garantiert. Du betreibst das Werkzeug selbst auf deinem Rechner. Das Live-Beispiel zeigt vorab gebaute Seiten einer erfundenen Person. Lies vor dem Konfigurieren docs/data-flow.md im Repository. Das Diagramm darin zeigt, welche Datenwege lokal bleiben.",
    dataFlow:
      "Der Kern rendert lokal: cv.yaml, Schriften und CSS bleiben im Checkout; der PDF-Build öffnet keinen Socket und braucht keinen API-Schlüssel. Ohne Konfiguration spricht der Editor nur mit 127.0.0.1 und hält Dokumente im Arbeitsspeicher; dauerhaft speichert nur die selbst betriebene Supabase-Variante (DEPLOY.md). Optionaler KI-Import und Textgenerierung rufen mit deinem Schlüssel nach außen oder bleiben mit Ollama lokal. Das Live-Beispiel hier im Browser lädt nur fertige Seiten einer erfundenen Person; dein eigener Lebenslauf bleibt auf deinem Rechner.",
    prerequisites: [
      {
        label: "Python 3.13",
        detail:
          "Engine und Editor laufen auf CPython 3.13; ältere Versionen sind ungetestet.",
        href: "https://www.python.org/downloads/",
      },
      {
        label: "Pango und Cairo",
        detail:
          "WeasyPrint setzt das PDF mit diesen Systembibliotheken. Fehlen sie, scheitert der erste Build mit einem Bibliotheksfehler.",
        href: "https://doc.courtbouillon.org/weasyprint/stable/first_steps.html",
      },
      {
        label: "Ein eigener API-Schlüssel, optional",
        detail:
          "Nur für den Import aus PDF oder DOCX und für generierte Texte. Formular, Vorschau und PDF-Build funktionieren ohne Schlüssel.",
      },
    ],
    installation: {
      summary:
        "Du fixierst den Checkout auf den geprüften Quellstand und installierst ihn in einer eigenen virtuellen Umgebung, ohne Account, externen Server oder Schlüssel.",
      steps: [
        {
          title: "Systembibliotheken installieren",
          detail:
            "Unter macOS genügt der Befehl unten, unter Debian oder Ubuntu sudo apt install libpango-1.0-0 libpangoft2-1.0-0 libcairo2.",
          command: "brew install pango",
        },
        {
          title: "Geprüften Quellstand auschecken",
          detail:
            "Anleitung, Screenshots und Prüfsummen gehören zu genau diesem Quellstand.",
          command:
            "(git clone https://github.com/loehrning-ai/cv-engine.git && cd cv-engine && git checkout f4b2e92f0bb3e5f6844ba9e6b069b62bc9e38c2e)",
        },
        {
          title: "Virtuelle Python-Umgebung anlegen",
          detail:
            "Sie trennt die Abhängigkeiten von deiner globalen Python-Installation.",
          command: "(cd cv-engine && python3 -m venv .venv)",
        },
        {
          title: "Abhängigkeiten hash-gepinnt installieren",
          detail:
            "requirements.lock enthält für jedes Paket den erwarteten Hash; bei einer Abweichung bricht pip ab.",
          command:
            "(cd cv-engine && .venv/bin/python -m pip install --require-hashes -r requirements.lock)",
        },
        {
          title: "Installation gegen die Testsuite prüfen",
          detail:
            "Die Suite prüft Renderer, Schema, Importer und Sicherheitsregeln ohne laufenden Server. Die End-to-End-Tests brauchen einen gestarteten Editor und bleiben außen vor.",
          command:
            "(cd cv-engine && .venv/bin/python -m pytest tests/ --ignore=tests/e2e)",
        },
      ],
    },
    usage: {
      summary:
        "Du schreibst in die YAML-Datei, probierst im Editor aus und lässt den Build die Seitenzahl prüfen.",
      steps: [
        {
          title: "Die eigene Datei anlegen und schreiben",
          detail:
            "content/cv.yaml ist die dauerhafte lokale Quelle deines Lebenslaufs. Git ignoriert die Datei, damit deine Daten nicht versehentlich in einen Fork gelangen.",
          command:
            "(cd cv-engine && cp content/cv.example.yaml content/cv.yaml)",
        },
        {
          title: "Formular und Vorschau ausprobieren",
          detail:
            "Flask bindet nur an 127.0.0.1:5567. Links stehen Formular oder YAML, rechts die A4-Seite, die WeasyPrint druckt; die Plakette zeigt die Seitenzahl, grün bei einer Seite und rot ab zwei. Der Modus hält alles im Arbeitsspeicher und schreibt nicht in content/cv.yaml, also lade das PDF vor dem Beenden herunter.",
          command:
            "(cd cv-engine && ONEPAGER_DEMO_MODE=true .venv/bin/python tools/editor/server.py)",
        },
        {
          title: "Layout wechseln, statt Inhalt zu streichen",
          detail:
            "Acht Vorlagen liegen bei: classic, modern, sidebar, executive, technical, ats-compact, consulting und minimal. Themes steuern Akzentfarbe, Schrift und Dichte; die Dichte kannst du pro Build übersteuern.",
          command:
            "(cd cv-engine && .venv/bin/python engine/build.py --density tight)",
        },
        {
          title: "Den Build entscheiden lassen",
          detail:
            "engine/build.py rendert das PDF und zählt die Seiten. Bei einer Seite endet der Befehl mit Exit-Code 0 und schreibt output/cv.pdf. Bei zwei Seiten entsteht kein PDF; der Befehl nennt auf stderr die erste Überschrift der überzähligen Seite, etwa First section on the overflow page: 'Projects', und endet mit Exit-Code 1.",
          command: "(cd cv-engine && .venv/bin/python engine/build.py)",
        },
      ],
    },
    integration: {
      summary:
        "content/cv.yaml ist eine gewöhnliche Textdatei: Git, Importer und CI arbeiten direkt mit ihr.",
      targets: [
        "YAML",
        "PDF",
        "DOCX",
        "rendercv",
        "Git",
        "Ollama",
        "OpenAI-kompatible APIs",
      ],
      steps: [
        {
          title: "Den Lebenslauf versionieren",
          detail:
            "Jede Änderung wird ein Diff, den du auch nach Jahren nachliest. Versioniere content/cv.yaml nur in deinem eigenen privaten Repository.",
        },
        {
          title: "Vorhandene Dateien einlesen",
          detail:
            "rendercv-YAML und Klartext wandelt der Importer deterministisch um, ohne Anbieter und ohne Netz. PDF und DOCX laufen über den gewählten KI-Anbieter mit deinem Schlüssel; ohne Schlüssel bricht dieser Weg mit einer Fehlermeldung ab.",
        },
        {
          title: "Den Build in eine Pipeline hängen",
          detail:
            "Der Exit-Code ist die Schnittstelle: 0 nur bei genau einer Seite. So taugt der Aufruf ohne weiteren Code als CI-Gate.",
          command:
            "(cd cv-engine && .venv/bin/python engine/build.py --output dist/cv.pdf)",
        },
      ],
    },
    // Pinned to the admitted revision, not a floating branch: the guide on
    // this page describes the repository as reviewed, and the README link
    // must keep describing exactly that state. A newer README arrives only
    // with a new pin through the full admission path.
    documentation: {
      label: "README im Repository",
      href: `https://github.com/loehrning-ai/${CV_ENGINE_SLUG}/blob/${CV_ENGINE_REVISION}/README.md`,
    },
    screenshot: {
      src: `/artifacts/tools/${CV_ENGINE_SLUG}/screenshot.webp`,
      sourcePath: "docs/screenshots/preview-card.webp",
      // Rendered once and visibly: as the figure caption, which also labels
      // the figure (the img itself carries an empty alt so screen readers
      // hear the prose exactly once). Written as publishable prose.
      alt: "Der Editor: links YAML, rechts die A4-Vorschau mit der Plakette 1 page.",
      sha256: "8c402e73a3ac46498d5fbfe6f39e03eebf532e62fe4b5ae69941211e96492aff",
      sizeBytes: 132292,
      width: 1696,
      height: 1060,
    },
    demo: [
      {
        src: `/artifacts/tools/${CV_ENGINE_SLUG}/demo/form-experience.webp`,
        sourcePath: "docs/screenshots/form-experience.png",
        alt: "Das Editor-Formular bei Experience: pro Eintrag eine Karte mit beschrifteten Feldern für Rolle, Firma, Zeitraum und Stichpunkte, dazu Pfeile zum Umsortieren.",
        caption:
          "Jedes Feld ist beschriftet. Listen sortierst und kürzt du, ohne YAML anzufassen.",
        sha256:
          "d371b4d01fefeee52337b1ce2353ce5e1e18906d4da3be7d29bb0e7ac9c5407b",
        sizeBytes: 83782,
        width: 1440,
        height: 900,
      },
      {
        src: `/artifacts/tools/${CV_ENGINE_SLUG}/demo/yaml-view.webp`,
        sourcePath: "docs/screenshots/yaml-view.png",
        alt: "Dieselbe Ansicht mit aktivem YAML-Tab: links der Rohtext mit Syntaxhervorhebung, rechts die unveränderte A4-Vorschau.",
        caption:
          "Im YAML-Tab schreibst du direkt Text. Formular und Datei teilen eine Quelle.",
        sha256:
          "49bdb3c9e7e41f2bf56f5b39a4e8808dfc23ec0a5a306152b7ad92ad915423c9",
        sizeBytes: 103048,
        width: 1440,
        height: 900,
      },
      {
        src: `/artifacts/tools/${CV_ENGINE_SLUG}/demo/theme-picker.webp`,
        sourcePath: "docs/screenshots/theme-picker.png",
        // "Darstellung", not "Vorlage": the panel in this frame sets accent,
        // font, density and paper tone. The eight Vorlagen named in the
        // Verwendung section (classic, modern, sidebar und so weiter) are a
        // different setting and are not shown here.
        alt: "Das geöffnete Darstellungsfeld über dem Formular: Regler für Akzentfarbe, Schrift, Dichte und Papierton, darunter Voreinstellungen wie Default, Forest oder Harvard Crimson.",
        caption:
          "Passt der Text nicht auf eine Seite, änderst du Akzent, Schrift oder Dichte.",
        sha256:
          "0bd73bcca2ab9b3d670a333e72b4ebcc5e5b03d9d060f7d7df4868d14dfe0bed",
        sizeBytes: 91666,
        width: 1440,
        height: 900,
      },
      {
        src: `/artifacts/tools/${CV_ENGINE_SLUG}/demo/cv.webp`,
        sourcePath: "docs/screenshots/cv.png",
        alt: "Das fertige PDF als eine A4-Seite mit Kopfzeile, Erfahrung, Ausbildung, Fähigkeiten und Projekten.",
        caption:
          "Der Build liefert genau eine Seite.",
        sha256:
          "07367fdbcfc5f3e0d85bb5780628ae4d3c6aea7bccc38623c17d753e0b4522ed",
        sizeBytes: 168864,
        width: 1241,
        height: 1754,
      },
    ],
    relatedLearning: [
      {
        title: "Mit KI arbeiten",
        description:
          "Übt, KI-Output zu prüfen, etwa den Import aus deinem alten PDF.",
        href: "/ai-native",
      },
    ],
    formula: {
      input: "cv.yaml",
      process: "WeasyPrint setzt die A4-Seite und zählt die Seiten",
      output: "cv.pdf, genau eine Seite",
    },
    // Every token comes from the installation and usage steps above.
    quickstart: {
      command: `git clone https://github.com/loehrning-ai/${CV_ENGINE_SLUG}.git && cd ${CV_ENGINE_SLUG} && git checkout ${CV_ENGINE_REVISION} && python3 -m venv .venv && .venv/bin/python -m pip install --require-hashes -r requirements.lock && cp content/cv.example.yaml content/cv.yaml && .venv/bin/python engine/build.py`,
      note: "Vorher: brew install pango. Unter Debian oder Ubuntu: Schritt 1 der Installation unten. Braucht Python 3.13, läuft lokal, kein Schlüssel nötig.",
    },
    specimen: { kind: "drawn" },
  },
} as const satisfies ToolArtifact;

/**
 * reelcode, admitted at Commit A of https://github.com/loehrning-ai/reelcode
 * Verified at this pin:
 * - `git show <sha>:LICENSE | shasum -a 256` equals `license.sha256` below;
 * - `<sha>:docs/media/social-preview.png` hashes to `screenshot.sha256`;
 * - the films and posters under /media are re-encodes of the named upstream
 *   files (ASSET_MANIFEST.json records each derivation).
 *
 * A source change after this commit requires a new pin and a new registry
 * review; never rewrite this reference in place.
 */
const REELCODE_SLUG = "reelcode";
const REELCODE_REVISION = "b9a1990f2c8ad6f480ae0a49365350f12477ff04";
const REELCODE_REPOSITORY = `https://github.com/loehrning-ai/${REELCODE_SLUG}`;
const REELCODE_ARTIFACTS = `/artifacts/tools/${REELCODE_SLUG}`;
const REELCODE_MEDIA = `/media/tools/${REELCODE_SLUG}`;

const REELCODE_TOOL_ARTIFACT = {
  id: `tool:${REELCODE_SLUG}`,
  kind: "tool",
  publicationLifecycle: "published",
  slug: REELCODE_SLUG,
  title: "reelcode",
  eyebrow: "Werkzeug · Motion Design",
  description:
    "Claude-Code-Plugin und Engine: Aus einer project.json wird ein Film mit Musik, in vier Formaten zugleich. Läuft lokal.",
  href: `/open-source/tools/${REELCODE_SLUG}`,
  language: "Englisch",
  languageTag: "en",
  source: {
    href: REELCODE_REPOSITORY,
    revision: REELCODE_REVISION,
    revisionHref: `${REELCODE_REPOSITORY}/commit/${REELCODE_REVISION}`,
  },
  license: {
    href: `${REELCODE_ARTIFACTS}/LICENSE.txt`,
    sourcePath: "LICENSE",
    sha256:
      "cc41d8f9e6580c3cd9ebe68f40af8e599d09beb147c3378ea010974ea76e07f3",
    sizeBytes: 1066,
    licenseId: "MIT",
  },
  delivery: "source-only",
  guide: {
    status: "experimental",
    statusNote:
      "Version 0.1. Getestet unter macOS, unter Linux nur in der CI, nicht unter Windows. Das Format von project.json kann sich noch ändern, Antworten auf Issues sind nicht garantiert. Du betreibst das Werkzeug selbst.",
    dataFlow:
      "Alles rendert lokal: ein Server auf 127.0.0.1, Chromium ohne Netz, capture lehnt fremde Adressen ab. Netz braucht nur das einmalige Setup (rund 1,2 GB für Chromium und Python-Pakete) und die optionale Sprachausgabe über ElevenLabs mit deinem eigenen Schlüssel.",
    prerequisites: [
      { label: "Node.js 20 oder neuer", detail: "Für CLI und Engine." },
      { label: "ffmpeg", detail: "Schneidet und kodiert die Formate." },
      {
        label: "Python 3.12 oder uv",
        detail: "Für Musik und Mischung auf dem Takt.",
      },
      {
        label: "Claude Code, optional",
        detail:
          "Für das Plugin, das Entwurf, Prüfung und Nachbessern steuert.",
      },
    ],
    installation: {
      summary: "Klonen, auf den geprüften Stand wechseln, einmal einrichten.",
      steps: [
        {
          title: "Geprüften Quellstand auschecken",
          detail:
            "Anleitung, Filme und Prüfsummen gehören zu genau diesem Quellstand.",
          command: `(git clone ${REELCODE_REPOSITORY} && cd ${REELCODE_SLUG} && git checkout ${REELCODE_REVISION})`,
        },
        {
          title: "Abhängigkeiten installieren",
          detail: "npx startet danach die Kopie in deinem Checkout.",
          command: `(cd ${REELCODE_SLUG} && npm install)`,
        },
        {
          title: "Einmal einrichten",
          detail:
            "Lädt Chromium für Playwright (rund 570 MB) und die Python-Pakete (rund 290 MB).",
          command: `(cd ${REELCODE_SLUG} && npx reelcode setup)`,
        },
        {
          title: "Installation prüfen",
          detail: "doctor sagt dir, was noch fehlt.",
          command: `(cd ${REELCODE_SLUG} && npx reelcode doctor)`,
        },
      ],
    },
    usage: {
      summary:
        "Du beschreibst den Film in project.json, reelcode rendert alle Formate.",
      steps: [
        {
          title: "Beispielfilm rendern",
          detail: "Ein Entwurf dauert auf Apple Silicon rund eine Minute.",
          command: `(cd ${REELCODE_SLUG} && npx reelcode make example-showreel --formats 1x1)`,
        },
        {
          title: "Eigenes Projekt aus einer Vorlage",
          detail:
            "Acht Vorlagen, etwa data-story, product-launch oder logo-sting.",
          command: `(cd ${REELCODE_SLUG} && npx reelcode new --template data-story --name q3-zahlen)`,
        },
        {
          title: "Final rendern",
          detail: "60 Bilder pro Sekunde mit Bewegungsunschärfe.",
          command: `(cd ${REELCODE_SLUG} && npx reelcode make q3-zahlen --quality final)`,
        },
      ],
    },
    integration: {
      summary:
        "Am stärksten mit einem Coding-Agenten: Er schreibt project.json, bewertet seinen Entwurf auf einem Kontaktbogen und bessert nach.",
      targets: ["Claude Code", "andere Coding-Agenten", "project.json", "MP4"],
      steps: [
        {
          title: "Marktplatz in Claude Code hinzufügen",
          detail: "Einmal pro Rechner.",
          command: "/plugin marketplace add loehrning-ai/reelcode",
        },
        {
          title: "Plugin installieren",
          detail: "Danach beschreibst du den Film in normalen Worten.",
          command: "/plugin install reelcode@reelcode",
        },
        {
          title: "Andere Agenten",
          detail: "Lass den Agenten zuerst docs/AGENTS_GUIDE.md lesen.",
        },
      ],
    },
    documentation: {
      label: "README im Repository",
      href: `${REELCODE_REPOSITORY}/blob/${REELCODE_REVISION}/README.md`,
    },
    screenshot: {
      src: `${REELCODE_ARTIFACTS}/screenshot.png`,
      sourcePath: "docs/media/social-preview.png",
      alt: "reelcode: dieselbe Zeile WE MAKE TYPE MOVE in 9:16, 1:1, 4:5 und 16:9.",
      sha256:
        "a43e99964d4844e0b43dff26643392eb916a8c8a57a9435cb5c390acd7362c08",
      sizeBytes: 104808,
      width: 1280,
      height: 640,
    },
    demo: [
      {
        src: `${REELCODE_ARTIFACTS}/demo/contact-example.jpg`,
        sourcePath: "docs/media/contact-example.jpg",
        alt: "Kontaktbogen mit 32 Bildern aus dem Beispielfilm, in sechs Reihen.",
        caption:
          "So prüft der Agent seinen Entwurf: Kontaktbogen ansehen, bewerten, nachbessern.",
        sha256:
          "5d1ec31012f7fea1d24e6f0a533d08aa02ce7094760c7bb5ba548dbe243e5c4e",
        sizeBytes: 229131,
        width: 900,
        height: 900,
      },
    ],
    relatedLearning: [
      {
        title: "Mit KI arbeiten",
        description:
          "Übt, Entwürfe eines Agenten zu prüfen und nachzubessern.",
        href: "/ai-native",
      },
    ],
    formula: {
      input: "project.json",
      process:
        "Chromium rendert jedes Bild als seek(t), ffmpeg kodiert, Python setzt Musik auf den Takt",
      output: "Film in vier Formaten",
    },
    quickstart: {
      command: `git clone ${REELCODE_REPOSITORY} && cd ${REELCODE_SLUG} && git checkout ${REELCODE_REVISION} && npm install && npx reelcode setup && npx reelcode make example-showreel --formats 1x1`,
      note: "Braucht Node.js 20, ffmpeg und Python 3.12 oder uv. Das Setup lädt einmal rund 1,2 GB. Danach in Claude Code: /plugin marketplace add loehrning-ai/reelcode",
    },
    specimen: {
      kind: "film",
      film: {
        src: `${REELCODE_MEDIA}/specimen.mp4`,
        sha256:
          "37aafb6991faafee6bc256b8bcd5ecde72ef5d15fa0901c4dc32a24f8a941063",
        sizeBytes: 740664,
        derivedFrom: "docs/media/showreel-1x1.mp4",
        width: 720,
        height: 720,
        durationS: 16,
        poster: {
          src: `${REELCODE_MEDIA}/specimen.jpg`,
          sha256:
            "ac9665ea1e7cb874edbc1e36e5bf8419cd221c4a4e979aa4180f4bb8d33689da",
          sizeBytes: 43469,
        },
        alt: "Der Beispielfilm: Typo im Takt, von ON THE BEAT bis REELCODE.",
      },
      // The last 0.8 s is the loop seam; 15.2 s is the end card.
      endS: 15.2,
      beatS: 0.5,
      // The eight shots of projects/example-showreel/project.json at 120 bpm.
      chapters: [
        { atS: 0, label: "scale" },
        { atS: 1, label: "kinetic" },
        { atS: 2.5, label: "slam" },
        { atS: 4.5, label: "ticker" },
        { atS: 6.5, label: "grid" },
        { atS: 8, label: "montage" },
        { atS: 11.5, label: "formats" },
        { atS: 14, label: "end" },
      ],
    },
    outputFilms: [
      {
        src: `${REELCODE_MEDIA}/formats.mp4`,
        sha256:
          "04d6befa1fb44490b09a07a370d13cd84e5bda634ef6420193a96bc5071cdc9e",
        sizeBytes: 666538,
        derivedFrom: "docs/media/hero.gif",
        width: 504,
        height: 484,
        durationS: 16,
        poster: {
          src: `${REELCODE_MEDIA}/formats.jpg`,
          sha256:
            "02cf30147e0d1959e2d2ba941277557a43c8cd39f2faea85d325cdc3dd7390ad",
          sizeBytes: 41852,
        },
        alt: "Derselbe Film in 9:16, 1:1 und 4:5, darunter 16:9, Bild für Bild synchron.",
      },
    ],
  },
} as const satisfies ToolArtifact;

// Publication lanes for the loehrning-ai GitHub organization. An entry is
// admitted only through the two-commit pinning sequence in
// ARTIFACT_PUBLICATION.md — complete source, license, operating-guide, and
// media metadata, pinned to a reachable public revision. The project and
// video lanes stay empty until a repository of that kind is published there.
export const OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES: readonly ToolArtifact[] = [
  CV_ENGINE_TOOL_ARTIFACT,
  REELCODE_TOOL_ARTIFACT,
];
export const OPEN_SOURCE_PROJECT_ARTIFACT_CANDIDATES: readonly ProjectArtifact[] =
  [];
export const OPEN_SOURCE_VIDEO_ARTIFACT_CANDIDATES: readonly VideoArtifact[] =
  [];

export const OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY = {
  tool: OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES,
  project: OPEN_SOURCE_PROJECT_ARTIFACT_CANDIDATES,
  video: OPEN_SOURCE_VIDEO_ARTIFACT_CANDIDATES,
} as const satisfies Record<
  OpenSourceArtifactKind,
  readonly OpenSourceArtifact[]
>;

export const OPEN_SOURCE_ARTIFACT_CANDIDATES: readonly OpenSourceArtifact[] = [
  ...OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY.tool,
  ...OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY.project,
  ...OPEN_SOURCE_ARTIFACT_CANDIDATE_REGISTRY.video,
];

assertOpenSourceArtifacts(OPEN_SOURCE_ARTIFACT_CANDIDATES);

/**
 * A tool's plate number: its 1-based place in the append-only candidate
 * order, so a new tool never renumbers an older one.
 */
export function plateNumber(
  id: string,
  order: readonly { readonly id: string }[] = OPEN_SOURCE_ARTIFACT_CANDIDATES,
): string {
  const index = order.findIndex((artifact) => artifact.id === id);
  if (index < 0) throw new Error(`No plate number for ${id}`);
  return String(index + 1).padStart(2, "0");
}

/**
 * Distributive `Omit`: the tool type is an intersection with a delivery
 * union, and a plain `Omit` would collapse it and lose the tie between
 * `delivery` and `launchHref`.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * A complete tool record staged in `pending/` before its public commit
 * exists. `source` does not exist on the type, so no unverified pin can be
 * written (ARTIFACT_PUBLICATION.md, "Staging a record before Commit A").
 */
export type PendingToolArtifact = DistributiveOmit<ToolArtifact, "source">;

export const OPEN_SOURCE_TOOL_ARTIFACTS = selectPublishedOpenSourceArtifacts(
  OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES,
);
export const OPEN_SOURCE_PROJECT_ARTIFACTS = selectPublishedOpenSourceArtifacts(
  OPEN_SOURCE_PROJECT_ARTIFACT_CANDIDATES,
);
export const OPEN_SOURCE_VIDEO_ARTIFACTS = selectPublishedOpenSourceArtifacts(
  OPEN_SOURCE_VIDEO_ARTIFACT_CANDIDATES,
);

export const OPEN_SOURCE_ARTIFACT_REGISTRY = {
  tool: OPEN_SOURCE_TOOL_ARTIFACTS,
  project: OPEN_SOURCE_PROJECT_ARTIFACTS,
  video: OPEN_SOURCE_VIDEO_ARTIFACTS,
} as const satisfies Record<
  OpenSourceArtifactKind,
  readonly PublishedOpenSourceArtifact[]
>;

export const OPEN_SOURCE_ARTIFACTS: readonly PublishedOpenSourceArtifact[] = [
  ...OPEN_SOURCE_ARTIFACT_REGISTRY.tool,
  ...OPEN_SOURCE_ARTIFACT_REGISTRY.project,
  ...OPEN_SOURCE_ARTIFACT_REGISTRY.video,
];

const ROUTE_KIND_TO_ARTIFACT_KIND = {
  tools: "tool",
  projects: "project",
  videos: "video",
} as const;

export type OpenSourceArtifactRouteKind =
  keyof typeof ROUTE_KIND_TO_ARTIFACT_KIND;

export function getOpenSourceArtifactByRoute(
  routeKind: string,
  slug: string,
):
  | PublishedOpenSourceArtifact<ToolArtifact | ProjectArtifact | VideoArtifact>
  | undefined {
  const artifactKind =
    ROUTE_KIND_TO_ARTIFACT_KIND[routeKind as OpenSourceArtifactRouteKind];
  if (!artifactKind) return undefined;
  return OPEN_SOURCE_ARTIFACT_REGISTRY[artifactKind].find(
    (artifact) => artifact.slug === slug,
  );
}

export interface OpenSourceArtifactSection {
  readonly kind: OpenSourceArtifactKind;
  readonly heading: string;
  readonly artifacts: readonly PublishedOpenSourceArtifact[];
}

export const OPEN_SOURCE_ARTIFACT_SECTIONS: readonly OpenSourceArtifactSection[] =
  [
    {
      kind: "tool",
      heading: "Werkzeuge",
      artifacts: OPEN_SOURCE_ARTIFACT_REGISTRY.tool,
    },
    {
      kind: "project",
      heading: "Projekte",
      artifacts: OPEN_SOURCE_ARTIFACT_REGISTRY.project,
    },
    {
      kind: "video",
      heading: "Videos",
      artifacts: OPEN_SOURCE_ARTIFACT_REGISTRY.video,
    },
  ];
