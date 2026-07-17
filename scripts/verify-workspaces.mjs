#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GLOB_OR_PATTERN = /[*?\[\]{}!]/;

function fail(message) {
  throw new Error(`Workspace contract violation: ${message}`);
}

function readJson(filePath, label) {
  let source;

  try {
    source = readFileSync(filePath, "utf8");
  } catch (error) {
    fail(`${label} cannot be read (${error.message})`);
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    fail(`${label} is not valid JSON (${error.message})`);
  }
}

function assertSafeWorkspacePath(workspacePath, index) {
  if (typeof workspacePath !== "string" || workspacePath.length === 0) {
    fail(`workspaces[${index}] must be a non-empty string`);
  }

  if (workspacePath !== workspacePath.trim()) {
    fail(`workspaces[${index}] must not contain surrounding whitespace`);
  }

  if (path.isAbsolute(workspacePath)) {
    fail(`workspace path must be relative: ${workspacePath}`);
  }

  if (workspacePath.includes("\\")) {
    fail(`workspace path must use forward slashes: ${workspacePath}`);
  }

  if (GLOB_OR_PATTERN.test(workspacePath)) {
    fail(
      `workspace path must be explicit, not a glob or pattern: ${workspacePath}`,
    );
  }

  const segments = workspacePath.split("/");
  if (
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    fail(`workspace path contains an unsafe segment: ${workspacePath}`);
  }

  if (path.posix.normalize(workspacePath) !== workspacePath) {
    fail(`workspace path is not normalized: ${workspacePath}`);
  }
}

export function inspectWorkspaceContract(repositoryRoot = REPOSITORY_ROOT) {
  const root = realpathSync(repositoryRoot);
  const rootPackagePath = path.join(root, "package.json");
  const rootPackage = readJson(rootPackagePath, "root package.json");

  if (
    !Array.isArray(rootPackage.workspaces) ||
    rootPackage.workspaces.length === 0
  ) {
    fail("root package.json must contain a non-empty workspaces array");
  }

  const seen = new Set();

  const workspaces = rootPackage.workspaces.map((workspacePath, index) => {
    assertSafeWorkspacePath(workspacePath, index);

    if (seen.has(workspacePath)) {
      fail(`workspace path is listed more than once: ${workspacePath}`);
    }
    seen.add(workspacePath);

    const candidate = path.resolve(root, workspacePath);
    if (candidate === root || !candidate.startsWith(`${root}${path.sep}`)) {
      fail(`workspace path escapes the repository: ${workspacePath}`);
    }

    let workspaceStat;
    try {
      workspaceStat = lstatSync(candidate);
    } catch (error) {
      fail(`workspace does not exist: ${workspacePath} (${error.message})`);
    }

    if (workspaceStat.isSymbolicLink() || !workspaceStat.isDirectory()) {
      fail(
        `workspace must be a real directory, not a symlink: ${workspacePath}`,
      );
    }

    const resolvedWorkspace = realpathSync(candidate);
    if (!resolvedWorkspace.startsWith(`${root}${path.sep}`)) {
      fail(`workspace resolves outside the repository: ${workspacePath}`);
    }

    const packagePath = path.join(resolvedWorkspace, "package.json");
    let packageStat;
    try {
      packageStat = lstatSync(packagePath);
    } catch (error) {
      fail(
        `workspace is missing package.json: ${workspacePath} (${error.message})`,
      );
    }

    if (packageStat.isSymbolicLink() || !packageStat.isFile()) {
      fail(`workspace package.json must be a regular file: ${workspacePath}`);
    }

    const workspacePackage = readJson(
      packagePath,
      `${workspacePath}/package.json`,
    );
    const verifyScript = workspacePackage.scripts?.verify;
    if (typeof verifyScript !== "string" || verifyScript.trim().length === 0) {
      fail(
        `${workspacePath}/package.json must expose a non-empty scripts.verify command`,
      );
    }

    return {
      name:
        typeof workspacePackage.name === "string"
          ? workspacePackage.name
          : workspacePath,
      path: workspacePath,
      verifyScript,
    };
  });

  // Every direct real directory under packages/* is a workspace boundary.
  // Requiring both a regular manifest and an explicit allowlist entry prevents
  // JavaScript, Python, and other future tool directories from bypassing CI.
  const packagesRoot = path.join(root, "packages");
  let packagesStat;
  try {
    packagesStat = lstatSync(packagesRoot);
  } catch (error) {
    fail(`packages directory cannot be read (${error.message})`);
  }
  if (packagesStat.isSymbolicLink() || !packagesStat.isDirectory()) {
    fail("packages must be a real directory, not a symlink");
  }

  const discovered = [];
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    const packageDirectory = path.join(packagesRoot, entry.name);
    const packageRelativePath = path.posix.join("packages", entry.name);
    const stat = lstatSync(packageDirectory);
    if (stat.isSymbolicLink()) {
      fail(`package directory must not be a symlink: ${packageRelativePath}`);
    }
    if (!stat.isDirectory()) continue;

    const manifestPath = path.join(packageDirectory, "package.json");
    if (!existsSync(manifestPath)) {
      fail(`package directory is missing package.json: ${packageRelativePath}`);
    }
    const manifestStat = lstatSync(manifestPath);
    if (manifestStat.isSymbolicLink() || !manifestStat.isFile()) {
      fail(
        `package manifest must be a regular file: ${packageRelativePath}/package.json`,
      );
    }
    discovered.push(packageRelativePath);
  }

  for (const packagePath of discovered) {
    if (!seen.has(packagePath)) {
      fail(`package is not listed in root workspaces: ${packagePath}`);
    }
  }
  for (const workspacePath of seen) {
    if (
      workspacePath.startsWith("packages/") &&
      !discovered.includes(workspacePath)
    ) {
      fail(
        `listed package workspace was not discovered under packages/*: ${workspacePath}`,
      );
    }
  }

  return workspaces;
}

export function verifyWorkspaces({
  checkOnly = false,
  repositoryRoot = REPOSITORY_ROOT,
} = {}) {
  const workspaces = inspectWorkspaceContract(repositoryRoot);

  console.log(
    `Workspace contract valid: ${workspaces.length} explicit workspace(s).`,
  );
  for (const workspace of workspaces) {
    console.log(`- ${workspace.path}: ${workspace.verifyScript}`);
  }

  if (checkOnly) {
    return workspaces;
  }

  for (const workspace of workspaces) {
    console.log(`\nVerifying ${workspace.name} (${workspace.path})`);
    const result = spawnSync(
      "bun",
      ["run", "--cwd", workspace.path, "verify"],
      {
        cwd: realpathSync(repositoryRoot),
        env: process.env,
        stdio: "inherit",
      },
    );

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      const outcome = result.signal
        ? `signal ${result.signal}`
        : `exit code ${result.status}`;
      throw new Error(
        `Workspace verification failed for ${workspace.path} (${outcome})`,
      );
    }
  }

  return workspaces;
}

function parseArguments(arguments_) {
  const allowed = new Set(["--check", "--check-only"]);
  const unsupported = arguments_.filter((argument) => !allowed.has(argument));
  if (unsupported.length > 0) {
    throw new Error(`Unsupported argument(s): ${unsupported.join(", ")}`);
  }

  return { checkOnly: arguments_.some((argument) => allowed.has(argument)) };
}

const entrypointUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;

if (import.meta.url === entrypointUrl) {
  try {
    verifyWorkspaces(parseArguments(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
