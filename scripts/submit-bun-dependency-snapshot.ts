import lock from "../bun.lock";

type DependencyScope = "runtime" | "development";
type Relationship = "direct" | "indirect";

interface LockPackageMetadata {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

type LockPackage = readonly [
  resolution: string,
  registry: string,
  metadata: LockPackageMetadata,
  integrity?: string,
];

interface BunTextLock {
  readonly lockfileVersion: number;
  readonly workspaces: Readonly<
    Record<
      string,
      {
        readonly name?: string;
        readonly dependencies?: Readonly<Record<string, string>>;
        readonly devDependencies?: Readonly<Record<string, string>>;
        readonly optionalDependencies?: Readonly<Record<string, string>>;
      }
    >
  >;
  readonly packages: Readonly<Record<string, LockPackage>>;
}

interface SnapshotDependency {
  readonly package_url: string;
  readonly relationship: Relationship;
  readonly scope: DependencyScope;
  readonly dependencies?: readonly string[];
}

export interface DependencySnapshot {
  readonly version: 0;
  readonly sha: string;
  readonly ref: string;
  readonly job: {
    readonly correlator: string;
    readonly id: string;
    readonly html_url?: string;
  };
  readonly detector: {
    readonly name: string;
    readonly version: string;
    readonly url: string;
  };
  readonly scanned: string;
  readonly manifests: {
    readonly "bun.lock": {
      readonly name: "bun.lock";
      readonly file: { readonly source_location: "bun.lock" };
      readonly metadata: {
        readonly lockfile_version: number;
        readonly resolved_package_count: number;
      };
      readonly resolved: Readonly<Record<string, SnapshotDependency>>;
    };
  };
}

const DETECTOR = {
  name: "loehrning-bun-lock",
  version: "1.0.0",
  url: "https://github.com/loehrning-ai/platform/blob/main/scripts/submit-bun-dependency-snapshot.ts",
} as const;

const NPM_PACKAGE_NAME =
  /^(?:@[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+)$/;
const NPM_VERSION =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const REGISTRY_INTEGRITY =
  /^sha(256|384|512)-([A-Za-z0-9+/]+={0,2})$/;

function hasValidRegistryIntegrity(integrity: string | undefined): boolean {
  const match = integrity?.match(REGISTRY_INTEGRITY);
  if (!match) return false;

  const expectedByteLength = Number(match[1]) / 8;
  const encodedDigest = match[2];
  const digest = Buffer.from(encodedDigest, "base64");
  return (
    digest.byteLength === expectedByteLength &&
    digest.toString("base64") === encodedDigest
  );
}

function parseRegistryResolution(
  resolution: string,
  integrity: string | undefined,
): { readonly name: string; readonly version: string } | null {
  const separator = resolution.lastIndexOf("@");
  if (separator <= 0 || separator === resolution.length - 1) {
    throw new Error(
      `Unsupported Bun lock resolution ${JSON.stringify(resolution)}.`,
    );
  }
  const name = resolution.slice(0, separator);
  const version = resolution.slice(separator + 1);

  if (version.startsWith("workspace:")) {
    const workspacePath = version.slice("workspace:".length);
    const unsafeWorkspacePath =
      workspacePath.length === 0 ||
      workspacePath.startsWith("/") ||
      workspacePath.includes("\\") ||
      workspacePath.split("/").some(
        (segment) => segment === "" || segment === "." || segment === "..",
      );
    if (
      !NPM_PACKAGE_NAME.test(name) ||
      unsafeWorkspacePath ||
      integrity !== undefined
    ) {
      throw new Error(
        `Invalid Bun workspace resolution ${JSON.stringify(resolution)}.`,
      );
    }
    return null;
  }

  if (
    !NPM_PACKAGE_NAME.test(name) ||
    !NPM_VERSION.test(version) ||
    !hasValidRegistryIntegrity(integrity)
  ) {
    throw new Error(
      `Unsupported non-registry or integrity-free Bun lock resolution ${JSON.stringify(
        resolution,
      )}.`,
    );
  }

  return {
    name,
    version,
  };
}

function npmPackageUrl(name: string, version: string): string {
  const encodedName = name.startsWith("@")
    ? `%40${encodeURIComponent(name.slice(1).split("/")[0])}/${encodeURIComponent(
        name.slice(1).split("/").slice(1).join("/"),
      )}`
    : encodeURIComponent(name);
  return `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
}

function packageKeyPrefixes(packageKey: string): readonly string[] {
  const segments = packageKey.split("/");
  const packageNames: string[] = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const packageName = segment.startsWith("@")
      ? `${segment}/${segments[++index] ?? ""}`
      : segment;
    if (!NPM_PACKAGE_NAME.test(packageName)) {
      throw new Error(`Invalid package key ${JSON.stringify(packageKey)}.`);
    }
    packageNames.push(packageName);
  }

  return packageNames.map((_, index) =>
    packageNames.slice(0, packageNames.length - index).join("/"),
  );
}

function resolveDependencyKey(
  packages: BunTextLock["packages"],
  packageNames: ReadonlyMap<string, string>,
  parentKey: string,
  dependencyName: string,
): string | null {
  for (const prefix of packageKeyPrefixes(parentKey)) {
    const candidate = `${prefix}/${dependencyName}`;
    if (
      packages[candidate] &&
      packageNames.get(candidate) === dependencyName
    ) {
      return candidate;
    }
  }
  return packages[dependencyName] &&
    packageNames.get(dependencyName) === dependencyName
    ? dependencyName
    : null;
}

function collectDirectKeys(
  textLock: BunTextLock,
  packageNames: ReadonlyMap<string, string>,
): {
  readonly runtime: ReadonlySet<string>;
  readonly development: ReadonlySet<string>;
} {
  const runtime = new Set<string>();
  const development = new Set<string>();

  for (const workspace of Object.values(textLock.workspaces)) {
    const parentKey =
      typeof workspace.name === "string" &&
      NPM_PACKAGE_NAME.test(workspace.name)
        ? workspace.name
        : "__workspace_root__";
    const directKey = (name: string): string => {
      const resolved = resolveDependencyKey(
        textLock.packages,
        packageNames,
        parentKey,
        name,
      );
      if (!resolved) {
        throw new Error(`Direct dependency "${name}" is absent from bun.lock.`);
      }
      return resolved;
    };
    for (const name of Object.keys(workspace.dependencies ?? {})) {
      runtime.add(directKey(name));
    }
    for (const name of Object.keys(workspace.optionalDependencies ?? {})) {
      runtime.add(directKey(name));
    }
    for (const name of Object.keys(workspace.devDependencies ?? {})) {
      const key = directKey(name);
      if (!runtime.has(key)) development.add(key);
    }
  }

  return { runtime, development };
}

function reachableFrom(
  roots: ReadonlySet<string>,
  graph: ReadonlyMap<string, ReadonlySet<string>>,
): ReadonlySet<string> {
  const visited = new Set<string>();
  const pending = [...roots];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const child of graph.get(current) ?? []) {
      if (!visited.has(child)) pending.push(child);
    }
  }
  return visited;
}

export function buildDependencySnapshot(
  textLock: BunTextLock,
  context: {
    readonly sha: string;
    readonly ref: string;
    readonly runId: string;
    readonly scanned: string;
    readonly jobUrl?: string;
  },
): DependencySnapshot {
  const keyToPackageUrl = new Map<string, string>();
  const keyToPackageName = new Map<string, string>();
  const workspacePackageNames = new Set<string>();
  for (const [key, entry] of Object.entries(textLock.packages)) {
    const parsed = parseRegistryResolution(entry[0], entry[3]);
    const separator = entry[0].lastIndexOf("@");
    keyToPackageName.set(key, entry[0].slice(0, separator));
    if (parsed) {
      keyToPackageUrl.set(key, npmPackageUrl(parsed.name, parsed.version));
    } else {
      workspacePackageNames.add(key);
    }
  }

  const graph = new Map<string, Set<string>>();
  for (const [key, entry] of Object.entries(textLock.packages)) {
    const parentPackageUrl = keyToPackageUrl.get(key);
    if (!parentPackageUrl) continue;
    const children = graph.get(parentPackageUrl) ?? new Set<string>();
    const metadata = entry[2] ?? {};
    for (const dependencyName of Object.keys(metadata.dependencies ?? {})) {
      const childKey = resolveDependencyKey(
        textLock.packages,
        keyToPackageName,
        key,
        dependencyName,
      );
      const childPackageUrl = childKey && keyToPackageUrl.get(childKey);
      if (!childPackageUrl) {
        throw new Error(
          `Resolved package "${key}" is missing mandatory dependency "${dependencyName}" in bun.lock.`,
        );
      }
      children.add(childPackageUrl);
    }
    for (const dependencyName of [
      ...Object.keys(metadata.optionalDependencies ?? {}),
      ...Object.keys(metadata.peerDependencies ?? {}),
    ]) {
      const childKey = resolveDependencyKey(
        textLock.packages,
        keyToPackageName,
        key,
        dependencyName,
      );
      if (!childKey) {
        // Optional dependencies and optional peers can be absent for the
        // current platform. They are requirements, not resolved packages.
        continue;
      }
      const childPackageUrl = keyToPackageUrl.get(childKey);
      if (!childPackageUrl) {
        throw new Error(
          `Resolved package "${key}" points to unsupported dependency "${childKey}".`,
        );
      }
      children.add(childPackageUrl);
    }
    graph.set(parentPackageUrl, children);
  }

  const directKeys = collectDirectKeys(textLock, keyToPackageName);
  const directRuntime = new Set<string>();
  const directDevelopment = new Set<string>();
  for (const key of directKeys.runtime) {
    const packageUrl = keyToPackageUrl.get(key);
    if (!packageUrl && workspacePackageNames.has(key)) continue;
    if (!packageUrl) {
      throw new Error(`Runtime dependency "${key}" is absent from bun.lock.`);
    }
    directRuntime.add(packageUrl);
  }
  for (const key of directKeys.development) {
    const packageUrl = keyToPackageUrl.get(key);
    if (!packageUrl && workspacePackageNames.has(key)) continue;
    if (!packageUrl) {
      throw new Error(`Development dependency "${key}" is absent from bun.lock.`);
    }
    directDevelopment.add(packageUrl);
  }

  const runtimeReachable = reachableFrom(directRuntime, graph);
  const developmentReachable = reachableFrom(directDevelopment, graph);
  const packageUrls = new Set(keyToPackageUrl.values());
  const unreachable = [...packageUrls].filter(
    (packageUrl) =>
      !runtimeReachable.has(packageUrl) &&
      !developmentReachable.has(packageUrl),
  );
  if (unreachable.length > 0) {
    throw new Error(
      `bun.lock contains ${unreachable.length} unreachable registry package(s): ${unreachable
        .slice(0, 5)
        .join(", ")}`,
    );
  }
  const resolved: Record<string, SnapshotDependency> = {};

  for (const packageUrl of [...packageUrls].sort()) {
    const isDirect =
      directRuntime.has(packageUrl) || directDevelopment.has(packageUrl);
    const scope: DependencyScope = runtimeReachable.has(packageUrl)
      ? "runtime"
      : "development";
    const dependencies = [...(graph.get(packageUrl) ?? [])].sort();
    resolved[packageUrl] = {
      package_url: packageUrl,
      relationship: isDirect ? "direct" : "indirect",
      scope,
      ...(dependencies.length > 0 ? { dependencies } : {}),
    };
  }

  return {
    version: 0,
    sha: context.sha,
    ref: context.ref,
    job: {
      correlator: "bun-dependency-submission",
      id: context.runId,
      ...(context.jobUrl ? { html_url: context.jobUrl } : {}),
    },
    detector: DETECTOR,
    scanned: context.scanned,
    manifests: {
      "bun.lock": {
        name: "bun.lock",
        file: { source_location: "bun.lock" },
        metadata: {
          lockfile_version: textLock.lockfileVersion,
          resolved_package_count: Object.keys(resolved).length,
        },
        resolved,
      },
    },
  };
}

if (import.meta.main) {
  if (process.argv.length > 2) {
    throw new Error(
      "The Bun lock tool is generation-only. Submission is isolated in the privileged workflow job.",
    );
  }
  const repository = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const runId = process.env.GITHUB_RUN_ID ?? "local";
  const snapshot = buildDependencySnapshot(lock as BunTextLock, {
    sha: process.env.GITHUB_SHA ?? "0000000000000000000000000000000000000000",
    ref: process.env.GITHUB_REF ?? "refs/heads/local",
    runId,
    scanned: new Date().toISOString(),
    jobUrl:
      repository && runId !== "local"
        ? `${serverUrl}/${repository}/actions/runs/${runId}`
        : undefined,
  });

  console.log(JSON.stringify(snapshot, null, 2));
}
