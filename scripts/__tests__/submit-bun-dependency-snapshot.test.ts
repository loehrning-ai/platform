import { describe, expect, it } from "bun:test";
import lock from "../../bun.lock";
import { buildDependencySnapshot } from "../submit-bun-dependency-snapshot";

const snapshot = buildDependencySnapshot(lock, {
  sha: "0123456789012345678901234567890123456789",
  ref: "refs/heads/main",
  runId: "123",
  scanned: "2026-07-28T00:00:00.000Z",
});
const resolved = snapshot.manifests["bun.lock"].resolved;
const dependencies = Object.values(resolved);
const declaredDependencyNames = new Set(
  Object.values(lock.workspaces).flatMap((workspace) => [
    ...Object.keys(workspace.dependencies ?? {}),
    ...Object.keys(workspace.optionalDependencies ?? {}),
    ...Object.keys(workspace.devDependencies ?? {}),
  ]),
);
const registryCoordinateCount = new Set(
  Object.values(lock.packages)
    .filter((entry) => entry[3] !== undefined)
    .map((entry) => entry[0]),
).size;
const FIXTURE_INTEGRITY =
  "sha512-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

type SnapshotLock = Parameters<typeof buildDependencySnapshot>[0];

function buildFixtureSnapshot(lockFixture: SnapshotLock) {
  return buildDependencySnapshot(lockFixture, {
    sha: "0123456789012345678901234567890123456789",
    ref: "refs/heads/main",
    runId: "fixture",
    scanned: "2026-07-28T00:00:00.000Z",
  });
}

function repositoryFile(path: string): Promise<string> {
  return Bun.file(new URL(`../../${path}`, import.meta.url)).text();
}

function singlePackageLock(
  resolution: string,
  integrity: string | undefined,
): SnapshotLock {
  return {
    lockfileVersion: 1,
    workspaces: {
      "packages/app": {
        dependencies: { root: "1.0.0" },
      },
    },
    packages: {
      root: ["root@1.0.0", "", {}, FIXTURE_INTEGRITY],
      candidate: [resolution, "", {}, integrity],
    },
  };
}

describe("Bun dependency snapshot", () => {
  it("submits the complete resolved lockfile rather than manifest-only data", () => {
    expect(Object.keys(resolved)).toHaveLength(registryCoordinateCount);
    expect(Object.keys(resolved).length).toBeGreaterThan(800);
    expect(
      dependencies.filter((entry) => entry.relationship === "direct"),
    ).toHaveLength(declaredDependencyNames.size);
    expect(
      dependencies.filter((entry) => entry.relationship === "indirect").length,
    ).toBeGreaterThan(700);
  });

  it("uses valid npm PURLs and only references submitted child packages", () => {
    const packageUrls = new Set(Object.keys(resolved));
    for (const [key, dependency] of Object.entries(resolved)) {
      expect(dependency.package_url).toBe(key);
      expect(dependency.package_url).toMatch(/^pkg:npm\//);
      for (const child of dependency.dependencies ?? []) {
        expect(packageUrls.has(child)).toBe(true);
        expect(child).not.toBe(key);
      }
    }
  });

  it("marks declared application dependencies direct and preserves transitive edges", () => {
    const next = Object.values(resolved).find(
      (dependency) =>
        dependency.relationship === "direct" &&
        dependency.package_url.startsWith("pkg:npm/next@"),
    );
    expect(next).toMatchObject({
      relationship: "direct",
      scope: "runtime",
    });
    const nextVersion = next?.package_url.slice("pkg:npm/next@".length);
    expect(nextVersion).toBeTruthy();
    expect(next?.dependencies).toContain(`pkg:npm/%40next/env@${nextVersion}`);

    const caniuseLite = Object.values(resolved).find((dependency) =>
      dependency.package_url.startsWith("pkg:npm/caniuse-lite@"),
    );
    expect(caniuseLite).toMatchObject({
      relationship: "indirect",
      scope: "runtime",
    });
  });

  it("makes every submitted registry coordinate reachable from a direct dependency", () => {
    const roots = dependencies
      .filter((dependency) => dependency.relationship === "direct")
      .map((dependency) => dependency.package_url);
    const visited = new Set<string>();
    const pending = [...roots];
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      pending.push(...(resolved[current]?.dependencies ?? []));
    }
    expect(visited.size).toBe(Object.keys(resolved).length);
  });

  it.each([
    [
      "git",
      "candidate@git+https://github.com/example/candidate.git#deadbeef",
      undefined,
    ],
    ["file", "candidate@file:../candidate", undefined],
    [
      "tarball URL",
      "candidate@https://example.invalid/candidate-1.0.0.tgz",
      FIXTURE_INTEGRITY,
    ],
    ["missing integrity", "candidate@1.0.0", undefined],
    ["invalid integrity", "candidate@1.0.0", "sha1-YWJjZA=="],
    ["truncated integrity", "candidate@1.0.0", "sha512-YWJjZA=="],
  ])("rejects a %s non-registry lock entry", (_label, resolution, integrity) => {
    expect(() =>
      buildFixtureSnapshot(singlePackageLock(resolution, integrity)),
    ).toThrow(/non-registry or integrity-free/);
  });

  it("accepts a safe workspace entry without submitting it as npm", () => {
    const fixture: SnapshotLock = {
      lockfileVersion: 1,
      workspaces: {
        "packages/app": {},
      },
      packages: {
        "@example/app": [
          "@example/app@workspace:packages/app",
          "",
          {},
        ],
      },
    };
    expect(
      Object.keys(
        buildFixtureSnapshot(fixture).manifests["bun.lock"].resolved,
      ),
    ).toHaveLength(0);
  });

  it("rejects a workspace resolution that escapes the repository", () => {
    const fixture: SnapshotLock = {
      lockfileVersion: 1,
      workspaces: {
        "packages/app": {},
      },
      packages: {
        "@example/app": [
          "@example/app@workspace:../outside",
          "",
          {},
        ],
      },
    };
    expect(() => buildFixtureSnapshot(fixture)).toThrow(
      /Invalid Bun workspace resolution/,
    );
  });

  it("rejects a missing mandatory dependency edge", () => {
    const fixture: SnapshotLock = {
      lockfileVersion: 1,
      workspaces: {
        "packages/app": {
          dependencies: { root: "1.0.0" },
        },
      },
      packages: {
        root: [
          "root@1.0.0",
          "",
          { dependencies: { missing: "1.0.0" } },
          FIXTURE_INTEGRITY,
        ],
      },
    };
    expect(() => buildFixtureSnapshot(fixture)).toThrow(
      /missing mandatory dependency "missing"/,
    );
  });

  it("rejects an unreachable registry package", () => {
    const fixture: SnapshotLock = {
      lockfileVersion: 1,
      workspaces: {
        "packages/app": {
          dependencies: { root: "1.0.0" },
        },
      },
      packages: {
        root: ["root@1.0.0", "", {}, FIXTURE_INTEGRITY],
        stray: ["stray@1.0.0", "", {}, FIXTURE_INTEGRITY],
      },
    };
    expect(() => buildFixtureSnapshot(fixture)).toThrow(
      /1 unreachable registry package/,
    );
  });

  it("does not mistake a scoped parent key for its unscoped dependency", () => {
    const fixture: SnapshotLock = {
      lockfileVersion: 1,
      workspaces: {
        "packages/app": {
          dependencies: { "@example/postcss": "1.0.0" },
        },
      },
      packages: {
        "@example/postcss": [
          "@example/postcss@1.0.0",
          "",
          { dependencies: { postcss: "8.5.19" } },
          FIXTURE_INTEGRITY,
        ],
        postcss: ["postcss@8.5.19", "", {}, FIXTURE_INTEGRITY],
      },
    };
    const fixtureResolved =
      buildFixtureSnapshot(fixture).manifests["bun.lock"].resolved;

    expect(fixtureResolved["pkg:npm/%40example/postcss@1.0.0"].dependencies)
      .toEqual(["pkg:npm/postcss@8.5.19"]);
  });

  it("marks distinct versions of one dependency direct in separate workspaces", () => {
    const fixture: SnapshotLock = {
      lockfileVersion: 1,
      workspaces: {
        "packages/a": {
          name: "@fixture/a",
          dependencies: { shared: "^1.0.0" },
        },
        "packages/b": {
          name: "@fixture/b",
          dependencies: { shared: "^2.0.0" },
        },
      },
      packages: {
        "@fixture/a": ["@fixture/a@workspace:packages/a", "", {}],
        "@fixture/b": ["@fixture/b@workspace:packages/b", "", {}],
        shared: ["shared@1.0.0", "", {}, FIXTURE_INTEGRITY],
        "@fixture/b/shared": [
          "shared@2.0.0",
          "",
          {},
          FIXTURE_INTEGRITY,
        ],
      },
    };
    const fixtureResolved =
      buildFixtureSnapshot(fixture).manifests["bun.lock"].resolved;

    expect(fixtureResolved["pkg:npm/shared@1.0.0"].relationship).toBe("direct");
    expect(fixtureResolved["pkg:npm/shared@2.0.0"].relationship).toBe("direct");
  });
});

describe("Supply-chain install contract", () => {
  it("keeps every workspace dependency spec aligned with bun.lock metadata", async () => {
    type Manifest = {
      readonly workspaces?: readonly string[];
      readonly dependencies?: Readonly<Record<string, string>>;
      readonly devDependencies?: Readonly<Record<string, string>>;
      readonly optionalDependencies?: Readonly<Record<string, string>>;
      readonly peerDependencies?: Readonly<Record<string, string>>;
      readonly overrides?: Readonly<Record<string, string>>;
      readonly resolutions?: Readonly<Record<string, string>>;
      readonly catalog?: Readonly<Record<string, string>>;
      readonly catalogs?: Readonly<
        Record<string, Readonly<Record<string, string>>>
      >;
    };
    const rootManifest = JSON.parse(
      await repositoryFile("package.json"),
    ) as Manifest;
    const workspacePaths = ["", ...(rootManifest.workspaces ?? [])];
    const dependencySections = [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ] as const;

    expect(Object.keys(lock.workspaces).sort()).toEqual(
      [...workspacePaths].sort(),
    );

    for (const workspacePath of workspacePaths) {
      const manifest =
        workspacePath === ""
          ? rootManifest
          : (JSON.parse(
              await repositoryFile(`${workspacePath}/package.json`),
            ) as Manifest);
      const lockedWorkspace = lock.workspaces[workspacePath] as
        | (typeof lock.workspaces)[keyof typeof lock.workspaces]
        | undefined;

      expect(lockedWorkspace).toBeDefined();
      for (const section of dependencySections) {
        const lockedSection =
          (lockedWorkspace as Partial<Manifest> | undefined)?.[section] ?? {};
        expect(lockedSection).toEqual(manifest[section] ?? {});
      }
    }

    const lockedRootMetadata = lock as unknown as Pick<
      Manifest,
      "overrides" | "resolutions" | "catalog" | "catalogs"
    >;
    for (const section of [
      "overrides",
      "resolutions",
      "catalog",
      "catalogs",
    ] as const) {
      expect(lockedRootMetadata[section] ?? {}).toEqual(
        rootManifest[section] ?? {},
      );
    }
  });

  it("assigns the Bun lockfile to Dependabot's Bun ecosystem", async () => {
    const dependabot = await repositoryFile(".github/dependabot.yml");

    expect(dependabot).toMatch(
      /package-ecosystem:\s*["']?bun["']?[\s\S]*?directory:\s*["']?\/["']?/,
    );
    expect(dependabot).not.toMatch(
      /package-ecosystem:\s*["']?npm["']?/,
    );
  });

  it("denies lifecycle scripts consistently in Bun, CI, and Vercel", async () => {
    const [
      bunfig,
      ciWorkflow,
      ciSetupAction,
      submissionWorkflow,
      deploymentDocs,
      ciDocs,
    ] = await Promise.all([
      repositoryFile("bunfig.toml"),
      repositoryFile(".github/workflows/ci.yml"),
      repositoryFile(".github/actions/setup/action.yml"),
      repositoryFile(".github/workflows/dependency-submission.yml"),
      repositoryFile("packages/website/docs/deployment.md"),
      repositoryFile("packages/website/docs/ci-contract.md"),
    ]);
    // Verify runs as a parallel job graph, so the shared bootstrap lives in the
    // composite action rather than in every job. The guarantee is unchanged:
    // every CI install still denies lifecycle scripts.
    const ciBootstrap = `${ciWorkflow}\n${ciSetupAction}`;
    const vercel = JSON.parse(
      await repositoryFile("packages/website/vercel.json"),
    ) as { readonly installCommand?: string };
    const installCommand =
      "bun install --frozen-lockfile --ignore-scripts";

    expect(bunfig).toMatch(
      /\[install\][\s\S]*\bignoreScripts\s*=\s*true\b/,
    );
    expect(ciBootstrap).toContain(`run: ${installCommand}`);
    expect(submissionWorkflow).toContain(`run: ${installCommand}`);
    expect(vercel.installCommand).toBe(`cd ../.. && ${installCommand}`);
    expect(deploymentDocs).toContain(vercel.installCommand);
    expect(ciDocs).toContain(installCommand);
  });

  it("installs browsers with the workspace-locked Playwright CLI", async () => {
    const [ciWorkflow, ciSetupAction, contributing, testDocs] =
      await Promise.all([
        repositoryFile(".github/workflows/ci.yml"),
        repositoryFile(".github/actions/setup/action.yml"),
        repositoryFile("CONTRIBUTING.md"),
        repositoryFile("packages/website/tests/README.md"),
      ]);
    const files = [ciWorkflow, ciSetupAction, contributing, testDocs];

    // Browsers install through the composite action so a shard pulls only the
    // engine it runs. The workspace-locked CLI is still the only entry point,
    // and both engines must still be requested somewhere in the job graph.
    expect(ciSetupAction).toContain(
      "bun run --cwd packages/website playwright install --with-deps ${{ inputs.playwright-browsers }}",
    );
    expect(ciWorkflow).toContain("browsers: chromium");
    expect(ciWorkflow).toContain("browsers: webkit");
    for (const contents of files) {
      expect(contents).not.toContain("bunx playwright");
    }
  });

  it("keeps PR dependency enforcement unprivileged and audits the full Bun lock", async () => {
    const workflow = await repositoryFile(
      ".github/workflows/dependency-review.yml",
    );

    expect(workflow).toContain("on:\n  pull_request:");
    expect(workflow).not.toContain("pull_request_target:");
    expect(workflow).toMatch(/permissions:\s*\n\s*contents: read/);
    expect(workflow).toContain(
      "bun install --frozen-lockfile --ignore-scripts",
    );
    expect(workflow).toMatch(/\n\s*bun audit\s*\n/);
    expect(workflow).toContain("actions/dependency-review-action@");
  });

  it("isolates the write token from checkout, Bun, and repository scripts", async () => {
    const workflow = await repositoryFile(
      ".github/workflows/dependency-submission.yml",
    );
    const submitJob = workflow.slice(workflow.indexOf("\n  submit:"));

    expect(submitJob).not.toContain("actions/checkout@");
    expect(submitJob).not.toContain("setup-bun");
    expect(submitJob).not.toMatch(/\brun:\s*bun\b/);
    expect(submitJob).not.toContain("scripts/submit-");
    expect(submitJob).toContain("actions/download-artifact@");
    expect(submitJob).toContain("node --input-type=module");
    expect(submitJob).toContain("response.status !== 201");
    expect(submitJob).toContain('result.result !== "SUCCESS"');
    expect(submitJob).toContain('redirect: "error"');
    expect(submitJob).toContain("AbortSignal.timeout(30_000)");
    expect(submitJob).toContain("GITHUB_TOKEN: ${{ github.token }}");
    expect(submitJob).toContain("if: github.ref == 'refs/heads/main'");
    expect(submitJob).toContain("job.id !== runId");
    expect(submitJob).toContain("job.html_url !== expectedJobUrl");
    expect(submitJob).toContain("detector.url !== expectedDetectorUrl");
    expect(submitJob).toContain(
      "`https://github.com/loehrning-ai/platform/blob/main/${detectorSourcePath}`",
    );
    expect(submitJob).toContain(
      "new Date(scannedAt).toISOString() !== scanned",
    );
    expect(submitJob).toContain("scannedAt > now + 5 * 60_000");
    expect(submitJob).toContain("scannedAt < now - 24 * 60 * 60_000");
    expect(submitJob).toContain("metadata.lockfile_version !== 1");
  });

  it("runs generation without a write token and never exposes a submit flag", async () => {
    const [workflow, generator] = await Promise.all([
      repositoryFile(".github/workflows/dependency-submission.yml"),
      repositoryFile("scripts/submit-bun-dependency-snapshot.ts"),
    ]);
    const generateJob = workflow.slice(
      workflow.indexOf("\n  generate:"),
      workflow.indexOf("\n  submit:"),
    );

    expect(generateJob).toMatch(/permissions:\s*\n\s*contents: read/);
    expect(generateJob).not.toContain("GITHUB_TOKEN:");
    expect(generator).not.toContain("submitSnapshot");
    expect(generator).not.toContain("response.ok");
    expect(generator).not.toContain("await fetch(");
  });
});
