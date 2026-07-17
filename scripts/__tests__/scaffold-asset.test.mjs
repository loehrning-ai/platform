import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { createAssetRecord, parseAssetArguments } from "../scaffold-asset.mjs";

const METADATA = {
  owner: "Example Owner",
  source: "https://example.invalid/source",
  license: "MIT",
  redistribution: "Permitted under the stated license",
};

function createRepository() {
  return mkdtempSync(path.join(tmpdir(), "loehrning-asset-record-"));
}

function removeRepository(root) {
  rmSync(root, { recursive: true, force: true });
}

test("returns a deterministic manifest record without writing repository files", async () => {
  const root = createRepository();
  try {
    mkdirSync(path.join(root, "public", "media"), { recursive: true });
    const file = "public/media/example.txt";
    writeFileSync(path.join(root, file), "abc");
    const before = readdirSync(root, { recursive: true }).sort();

    const record = await createAssetRecord({ repositoryRoot: root, file, ...METADATA });

    assert.deepEqual(record, {
      path: file,
      sha256: createHash("sha256").update("abc").digest("hex"),
      sizeBytes: 3,
      ...METADATA,
    });
    assert.deepEqual(readdirSync(root, { recursive: true }).sort(), before);
    assert.equal(readFileSync(path.join(root, file), "utf8"), "abc");
  } finally {
    removeRepository(root);
  }
});

test("requires every explicit metadata flag and rejects duplicate or unknown flags", () => {
  assert.throws(
    () => parseAssetArguments(["public/a.png", "--owner", "Owner"]),
    /--source is required/,
  );
  assert.throws(
    () =>
      parseAssetArguments([
        "public/a.png",
        "--owner",
        "A",
        "--owner",
        "B",
        "--source",
        "S",
        "--license",
        "L",
        "--redistribution",
        "R",
      ]),
    /--owner may be provided only once/,
  );
  assert.throws(() => parseAssetArguments(["public/a.png", "--write", "yes"]), /unknown option/);
});

test("rejects absolute, traversal, and non-canonical paths", async () => {
  const root = createRepository();
  try {
    await assert.rejects(
      createAssetRecord({ repositoryRoot: root, file: "/tmp/a.png", ...METADATA }),
      /repository-relative/,
    );
    await assert.rejects(
      createAssetRecord({ repositoryRoot: root, file: "../a.png", ...METADATA }),
      /unsafe segment/,
    );
    await assert.rejects(
      createAssetRecord({ repositoryRoot: root, file: "public//a.png", ...METADATA }),
      /unsafe segment/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects secret, cache, generated, and local-state paths", async () => {
  const root = createRepository();
  try {
    for (const file of [
      ".env.local",
      "node_modules/example.png",
      ".next/static/example.png",
      "coverage/example.png",
      "public/private.key",
      "packages/site/build/example.png",
    ]) {
      await assert.rejects(
        createAssetRecord({ repositoryRoot: root, file, ...METADATA }),
        /not assets/,
      );
    }
  } finally {
    removeRepository(root);
  }
});

test("rejects directories and missing files", async () => {
  const root = createRepository();
  try {
    mkdirSync(path.join(root, "public"), { recursive: true });
    await assert.rejects(
      createAssetRecord({ repositoryRoot: root, file: "public", ...METADATA }),
      /regular file/,
    );
    await assert.rejects(
      createAssetRecord({ repositoryRoot: root, file: "public/missing.png", ...METADATA }),
      /does not exist/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects a symlink at the file or any parent component", async () => {
  const root = createRepository();
  const outside = createRepository();
  try {
    mkdirSync(path.join(root, "public"), { recursive: true });
    writeFileSync(path.join(outside, "outside.png"), "outside");
    symlinkSync(path.join(outside, "outside.png"), path.join(root, "public", "linked.png"));
    symlinkSync(outside, path.join(root, "linked-directory"));

    await assert.rejects(
      createAssetRecord({ repositoryRoot: root, file: "public/linked.png", ...METADATA }),
      /symbolic link/,
    );
    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file: "linked-directory/outside.png",
        ...METADATA,
      }),
      /symbolic link/,
    );
  } finally {
    removeRepository(root);
    removeRepository(outside);
  }
});
