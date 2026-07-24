import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  linkSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  truncateSync,
  utimesSync,
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

    const record = await createAssetRecord({
      repositoryRoot: root,
      file,
      ...METADATA,
    });

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
  assert.throws(
    () => parseAssetArguments(["public/a.png", "--write", "yes"]),
    /unknown option/,
  );
});

test("rejects absolute, traversal, and non-canonical paths", async () => {
  const root = createRepository();
  try {
    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file: "/tmp/a.png",
        ...METADATA,
      }),
      /repository-relative/,
    );
    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file: "../a.png",
        ...METADATA,
      }),
      /unsafe segment/,
    );
    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file: "public//a.png",
        ...METADATA,
      }),
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
      createAssetRecord({
        repositoryRoot: root,
        file: "public/missing.png",
        ...METADATA,
      }),
      /file path changed/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects a final-component symlink swap after opening", async () => {
  const root = createRepository();
  try {
    mkdirSync(path.join(root, "public", "media"), { recursive: true });
    const file = "public/media/example.txt";
    const absolutePath = path.join(root, file);
    const targetPath = path.join(root, "replacement.txt");
    writeFileSync(absolutePath, "abc");
    writeFileSync(targetPath, "abc");

    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file,
        ...METADATA,
        hooks: {
          afterOpen({ absolutePath: openedPath }) {
            rmSync(openedPath);
            symlinkSync(targetPath, openedPath);
          },
        },
      }),
      /symbolic link|pathname/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects parent-directory replacement after opening", async () => {
  const root = createRepository();
  try {
    mkdirSync(path.join(root, "public", "media"), { recursive: true });
    writeFileSync(path.join(root, "public", "media", "example.txt"), "abc");

    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file: "public/media/example.txt",
        ...METADATA,
        hooks: {
          afterOpen({ absolutePath }) {
            const parentPath = path.dirname(absolutePath);
            const originalParentPath = `${parentPath}.original`;
            renameSync(parentPath, originalParentPath);
            mkdirSync(parentPath);
            linkSync(
              path.join(originalParentPath, path.basename(absolutePath)),
              absolutePath,
            );
          },
        },
      }),
      /path components changed identity/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects same-size mutation inside the descriptor read window", async () => {
  const root = createRepository();
  try {
    mkdirSync(path.join(root, "public", "media"), { recursive: true });
    const file = "public/media/example.txt";
    writeFileSync(path.join(root, file), "abc");

    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file,
        ...METADATA,
        hooks: {
          afterRead({ absolutePath }) {
            writeFileSync(absolutePath, "xyz");
            utimesSync(absolutePath, new Date(1_000), new Date(2_000));
          },
        },
      }),
      /changed while its record was being computed/,
    );
  } finally {
    removeRepository(root);
  }
});

test("rejects files above the bounded hashing limit before reading", async () => {
  const root = createRepository();
  try {
    mkdirSync(path.join(root, "public", "media"), { recursive: true });
    const absolutePath = path.join(root, "public", "media", "oversized.bin");
    writeFileSync(absolutePath, "");
    truncateSync(absolutePath, 100 * 1024 * 1024 + 1);

    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file: "public/media/oversized.bin",
        ...METADATA,
      }),
      /size limit/,
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
    symlinkSync(
      path.join(outside, "outside.png"),
      path.join(root, "public", "linked.png"),
    );
    symlinkSync(outside, path.join(root, "linked-directory"));

    await assert.rejects(
      createAssetRecord({
        repositoryRoot: root,
        file: "public/linked.png",
        ...METADATA,
      }),
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
