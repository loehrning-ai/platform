import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseCandidatePaths } from "../scan-public-candidate.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const runner = path.join(repositoryRoot, "scripts/scan-public-candidate.mjs");

function git(root, ...arguments_) {
  const result = spawnSync("git", ["-C", root, ...arguments_], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git ${arguments_.join(" ")} failed\n${result.stderr}`,
  );
}

function run(root) {
  return spawnSync(process.execPath, [runner, "--root", root], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

test("candidate path parser rejects ambiguity and traversal", () => {
  assert.deepEqual(
    parseCandidatePaths(Buffer.from("b.txt\0a.txt\0")),
    ["a.txt", "b.txt"],
  );
  for (const invalid of [
    "../secret\0",
    "./file\0",
    "/absolute\0",
    "a\\b\0",
    "same\0same\0",
    "CON.txt\0",
    "trailing. \0",
    "safe\u202Etxt\0",
    "Case.txt\0case.txt\0",
  ]) {
    assert.throws(() => parseCandidatePaths(Buffer.from(invalid)));
  }
});

test("scanner verifies only tracked and non-ignored untracked candidates", () => {
  const fixture = mkdtempSync(
    path.join(tmpdir(), "loehrning-public-candidate-test-"),
  );
  try {
    git(fixture, "init", "--quiet");
    git(fixture, "config", "user.email", "test@example.test");
    git(fixture, "config", "user.name", "Publication Test");
    writeFileSync(
      path.join(fixture, ".gitignore"),
      ".env.local\nnode_modules/\n",
    );
    writeFileSync(
      path.join(fixture, "ASSET_MANIFEST.json"),
      `${JSON.stringify({ version: 1, assets: [] })}\n`,
    );
    writeFileSync(path.join(fixture, "README.md"), "# Clean fixture\n");
    writeFileSync(
      path.join(fixture, ".env.local"),
      "PRIVATE_TOKEN=must-stay-outside-candidate\n",
    );
    mkdirSync(path.join(fixture, "node_modules/private"), {
      recursive: true,
    });
    writeFileSync(
      path.join(fixture, "node_modules/private/leak.js"),
      "const secret = 'ignored';\n",
    );
    git(
      fixture,
      "add",
      ".gitignore",
      "ASSET_MANIFEST.json",
      "README.md",
    );
    git(fixture, "commit", "--quiet", "-m", "fixture");

    const clean = run(fixture);
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
    assert.match(clean.stdout, /3 Git-visible files/);

    rmSync(path.join(fixture, "README.md"));
    const deletedTrackedFile = run(fixture);
    assert.equal(
      deletedTrackedFile.status,
      0,
      `${deletedTrackedFile.stdout}\n${deletedTrackedFile.stderr}`,
    );
    assert.match(deletedTrackedFile.stdout, /2 Git-visible files/);

    mkdirSync(path.join(fixture, "dist"), { recursive: true });
    writeFileSync(
      path.join(fixture, "dist", "forced.txt"),
      "forced generated output\n",
    );
    git(fixture, "add", "-f", "dist/forced.txt");
    const dirty = run(fixture);
    assert.equal(dirty.status, 1, `${dirty.stdout}\n${dirty.stderr}`);
    assert.match(
      `${dirty.stdout}\n${dirty.stderr}`,
      /generated directory is a forbidden publication candidate/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
