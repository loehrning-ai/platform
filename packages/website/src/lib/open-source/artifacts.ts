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

export interface SoftwareArtifactRelatedLearning {
  readonly title: string;
  readonly description: string;
  /** Stable internal learning route. */
  readonly href: string;
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
  readonly relatedLearning: readonly SoftwareArtifactRelatedLearning[];
}

export const SOFTWARE_ARTIFACT_DELIVERY_MODES = [
  "source-only",
  "internal-route",
  "external-service",
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

  if (!value.screenshot || typeof value.screenshot !== "object") {
    artifactError(
      id,
      "guide.screenshot",
      "must define an accessible screenshot",
    );
  }
  assertInternalHref(id, "guide.screenshot.src", value.screenshot.src);
  assertUpstreamSourcePath(
    id,
    "guide.screenshot.sourcePath",
    value.screenshot.sourcePath,
  );
  const screenshotPath = new URL(
    value.screenshot.src,
    "https://artifact.invalid",
  ).pathname;
  if (!/\.(?:jpe?g|png|webp)$/i.test(screenshotPath)) {
    artifactError(
      id,
      "guide.screenshot.src",
      "must reference a browser-safe JPEG, PNG, or WebP image",
    );
  }
  if (!/\.(?:jpe?g|png|webp)$/i.test(value.screenshot.sourcePath)) {
    artifactError(
      id,
      "guide.screenshot.sourcePath",
      "must identify a browser-safe JPEG, PNG, or WebP image",
    );
  }
  assertText(id, "guide.screenshot.alt", value.screenshot.alt);
  assertText(id, "guide.screenshot.sha256", value.screenshot.sha256);
  if (!/^[a-f0-9]{64}$/.test(value.screenshot.sha256)) {
    artifactError(
      id,
      "guide.screenshot.sha256",
      "must be a lowercase SHA-256 digest",
    );
  }
  if (
    !Number.isSafeInteger(value.screenshot.sizeBytes) ||
    value.screenshot.sizeBytes <= 0 ||
    value.screenshot.sizeBytes > OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES
  ) {
    artifactError(
      id,
      "guide.screenshot.sizeBytes",
      `must be between 1 and ${String(OPEN_SOURCE_ARTIFACT_IMAGE_MAX_BYTES)} bytes`,
    );
  }
  for (const dimension of ["width", "height"] as const) {
    if (
      !Number.isSafeInteger(value.screenshot[dimension]) ||
      value.screenshot[dimension] <= 0
    ) {
      artifactError(
        id,
        `guide.screenshot.${dimension}`,
        "must be a positive safe integer",
      );
    }
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

// Reserved publication lanes for the loehrning-ai GitHub organization. They
// stay empty until a real repository is published there; publication requires
// complete source, license, operating-guide, and media metadata before an
// entry can satisfy its typed artifact contract.
export const OPEN_SOURCE_TOOL_ARTIFACT_CANDIDATES: readonly ToolArtifact[] = [];
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
