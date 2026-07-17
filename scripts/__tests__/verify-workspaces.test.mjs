import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { inspectWorkspaceContract } from "../verify-workspaces.mjs";

function createRepository({
  workspace = "packages/example",
  verify = "node --test",
} = {}) {
  const root = mkdtempSync(
    path.join(tmpdir(), "loehrning-workspace-contract-"),
  );
  writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ private: true, workspaces: [workspace] }),
  );

  if (
    !path.isAbsolute(workspace) &&
    !workspace.includes("*") &&
    !workspace.includes("..")
  ) {
    const packageDirectory = path.join(root, workspace);
    mkdirSync(packageDirectory, { recursive: true });
    writeFileSync(
      path.join(packageDirectory, "package.json"),
      JSON.stringify({
        name: "@test/example",
        scripts: verify === null ? {} : { verify },
      }),
    );
  }

  return root;
}

function removeRepository(root) {
  rmSync(root, { recursive: true, force: true });
}

test("accepts one explicit workspace with a verification command", () => {
  const root = createRepository();
  try {
    assert.deepEqual(inspectWorkspaceContract(root), [
      {
        name: "@test/example",
        path: "packages/example",
        verifyScript: "node --test",
      },
    ]);
  } finally {
    removeRepository(root);
  }
});

test("rejects workspace globs", () => {
  const root = createRepository({ workspace: "packages/*" });
  try {
    assert.throws(
      () => inspectWorkspaceContract(root),
      /must be explicit, not a glob or pattern/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects paths that escape the repository", () => {
  const root = createRepository({ workspace: "../outside" });
  try {
    assert.throws(() => inspectWorkspaceContract(root), /unsafe segment/);
  } finally {
    removeRepository(root);
  }
});

test("rejects a workspace without scripts.verify", () => {
  const root = createRepository({ verify: null });
  try {
    assert.throws(
      () => inspectWorkspaceContract(root),
      /must expose a non-empty scripts\.verify/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects duplicate workspace entries", () => {
  const root = createRepository();
  try {
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        private: true,
        workspaces: ["packages/example", "packages/example"],
      }),
    );
    assert.throws(
      () => inspectWorkspaceContract(root),
      /listed more than once/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects an unlisted package manifest that would bypass verification", () => {
  const root = createRepository();
  try {
    const unlisted = path.join(root, "packages", "unlisted-tool");
    mkdirSync(unlisted, { recursive: true });
    writeFileSync(
      path.join(unlisted, "package.json"),
      JSON.stringify({
        name: "@test/unlisted-tool",
        scripts: { verify: "node --test" },
      }),
    );
    assert.throws(
      () => inspectWorkspaceContract(root),
      /package is not listed in root workspaces: packages\/unlisted-tool/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects a direct package directory without a manifest", () => {
  const root = createRepository();
  try {
    mkdirSync(path.join(root, "packages", "python-tool"), { recursive: true });
    assert.throws(
      () => inspectWorkspaceContract(root),
      /package directory is missing package\.json: packages\/python-tool/,
    );
  } finally {
    removeRepository(root);
  }
});

test("requires a non-JavaScript package adapter to be explicitly allowlisted", () => {
  const root = createRepository();
  try {
    const pythonTool = path.join(root, "packages", "python-tool");
    mkdirSync(pythonTool, { recursive: true });
    writeFileSync(
      path.join(pythonTool, "package.json"),
      JSON.stringify({
        name: "@test/python-tool",
        private: true,
        scripts: { verify: "python -m pytest" },
      }),
    );
    assert.throws(
      () => inspectWorkspaceContract(root),
      /package is not listed in root workspaces: packages\/python-tool/,
    );
  } finally {
    removeRepository(root);
  }
});
