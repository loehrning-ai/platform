import {
  lstatSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export type PlaywrightArtifactKind = "blob" | "html" | "output";

const ARTIFACT_BASENAMES: Readonly<Record<PlaywrightArtifactKind, string>> = {
  blob: "blob-report",
  html: "playwright-report",
  output: "test-results",
};

const ENVIRONMENT_NAMES: Readonly<Record<PlaywrightArtifactKind, string>> = {
  blob: "PLAYWRIGHT_BLOB_OUTPUT_DIR",
  html: "PLAYWRIGHT_HTML_OUTPUT_DIR",
  output: "PLAYWRIGHT_OUTPUT_DIR",
};

const LIVE_AUTH_DIRECTORY_NAME =
  /^loehrning-live-auth-[A-Za-z0-9_-]{6,80}$/;
const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

function isContainedBy(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function assertExistingDirectoryChain(
  trustedRoot: string,
  candidate: string,
): void {
  const rootStat = lstatSync(trustedRoot);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error("Playwright artifact root must be a real directory.");
  }

  const relative = path.relative(trustedRoot, candidate);
  let current = trustedRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        break;
      }
      throw error;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(
        "Playwright artifact paths may not traverse symlinks or non-directories.",
      );
    }
  }
}

function validateRelativeArtifactPath(
  value: unknown,
  kind: PlaywrightArtifactKind,
  packageRoot: string,
): string {
  const configured =
    value === undefined ? ARTIFACT_BASENAMES[kind] : value;
  if (
    typeof configured !== "string" ||
    configured.length === 0 ||
    configured.length > 320 ||
    path.isAbsolute(configured) ||
    configured.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(configured)
  ) {
    throw new Error(
      `${ENVIRONMENT_NAMES[kind]} must be a bounded relative path.`,
    );
  }

  const segments = configured.split("/");
  if (
    segments.length > 5 ||
    segments.some((segment) => !SAFE_SEGMENT.test(segment))
  ) {
    throw new Error(
      `PLAYWRIGHT ${kind} output contains an unsafe path segment.`,
    );
  }
  if (segments[0] !== ARTIFACT_BASENAMES[kind]) {
    throw new Error(
      `${ENVIRONMENT_NAMES[kind]} must stay inside ${ARTIFACT_BASENAMES[kind]}.`,
    );
  }

  const normalizedPackageRoot = path.resolve(packageRoot);
  const allowedRoot = path.join(
    normalizedPackageRoot,
    ARTIFACT_BASENAMES[kind],
  );
  const candidate = path.resolve(normalizedPackageRoot, configured);
  if (candidate !== allowedRoot && !isContainedBy(allowedRoot, candidate)) {
    throw new Error(
      `PLAYWRIGHT ${kind} output escaped its dedicated artifact root.`,
    );
  }
  assertExistingDirectoryChain(normalizedPackageRoot, candidate);
  return candidate;
}

function validateLiveArtifactDirectory(
  liveDirectory: string,
): string {
  if (!path.isAbsolute(liveDirectory)) {
    throw new Error("Live Playwright artifacts require an absolute directory.");
  }
  const normalized = path.resolve(liveDirectory);
  const parent = path.dirname(normalized);
  if (
    !LIVE_AUTH_DIRECTORY_NAME.test(path.basename(normalized)) ||
    realpathSync(parent) !== realpathSync(tmpdir())
  ) {
    throw new Error(
      "Live Playwright artifacts must stay in the owned live-auth temp directory.",
    );
  }
  const stat = lstatSync(normalized);
  const currentUserId =
    typeof process.getuid === "function" ? process.getuid() : null;
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    (currentUserId !== null && stat.uid !== currentUserId) ||
    (stat.mode & 0o077) !== 0
  ) {
    throw new Error(
      "Live Playwright artifact root must be a private, real, user-owned temporary directory.",
    );
  }
  if (
    realpathSync(normalized) !==
    path.join(realpathSync(parent), path.basename(normalized))
  ) {
    throw new Error(
      "Live Playwright artifact root may not resolve through a symlink.",
    );
  }
  return normalized;
}

function validateLiveArtifactPath(
  value: unknown,
  kind: PlaywrightArtifactKind,
  liveDirectory: string,
): string {
  const trustedDirectory = validateLiveArtifactDirectory(liveDirectory);
  const configured =
    value === undefined
      ? path.join(trustedDirectory, ARTIFACT_BASENAMES[kind])
      : value;
  if (
    typeof configured !== "string" ||
    !path.isAbsolute(configured) ||
    /[\u0000-\u001f\u007f]/.test(configured)
  ) {
    throw new Error(
      `Live ${ENVIRONMENT_NAMES[kind]} must be an absolute temp path.`,
    );
  }
  const candidate = path.resolve(configured);
  if (
    path.dirname(candidate) !== trustedDirectory ||
    path.basename(candidate) !== ARTIFACT_BASENAMES[kind]
  ) {
    throw new Error(
      `Live ${ENVIRONMENT_NAMES[kind]} must use its fixed temp-directory basename.`,
    );
  }
  assertExistingDirectoryChain(trustedDirectory, candidate);
  return candidate;
}

export function resolvePlaywrightArtifactPath(options: {
  readonly value: unknown;
  readonly kind: PlaywrightArtifactKind;
  readonly packageRoot: string;
  readonly liveDirectory?: string;
}): string {
  if (options.liveDirectory) {
    return validateLiveArtifactPath(
      options.value,
      options.kind,
      options.liveDirectory,
    );
  }
  return validateRelativeArtifactPath(
    options.value,
    options.kind,
    options.packageRoot,
  );
}
