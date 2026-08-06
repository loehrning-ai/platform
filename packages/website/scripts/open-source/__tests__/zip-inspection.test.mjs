import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { deflateRawSync } from "node:zlib";
import {
  MAX_ZIP_ENTRY_UNCOMPRESSED_BYTES,
  crc32,
  inspectZipArchive,
} from "../zip-inspection.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scanScript = resolve(here, "..", "scan-export.mjs");
const repositoryRoot = resolve(here, "../../../../..");
const actualKitPath = join(
  repositoryRoot,
  "packages/website/public/workshops/geschaeftsberichte-mit-ki-lesen/northwind-analyst-kit.zip",
);
const FIXED_DOS_TIME = 0;
const FIXED_DOS_DATE = 0x5821;

function zipEntry(name, content = "", overrides = {}) {
  const pathBytes = Buffer.isBuffer(name) ? name : Buffer.from(name, "utf8");
  const isDirectory =
    overrides.isDirectory ?? pathBytes[pathBytes.byteLength - 1] === 0x2f;
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const method = overrides.method ?? (isDirectory ? 0 : 8);
  const compressed =
    overrides.compressed ??
    (method === 0 ? Buffer.from(bytes) : deflateRawSync(bytes));
  const mode = isDirectory ? 0o040755 : 0o100644;
  return {
    compressed,
    compressedSize: overrides.compressedSize ?? compressed.byteLength,
    crc: overrides.crc ?? crc32(bytes),
    externalAttributes:
      overrides.externalAttributes ??
      (((mode << 16) | (isDirectory ? 0x10 : 0)) >>> 0),
    flags: overrides.flags ?? 0,
    isDirectory,
    method,
    pathBytes,
    uncompressedSize: overrides.uncompressedSize ?? bytes.byteLength,
    versionMadeBy: overrides.versionMadeBy ?? ((3 << 8) | 30),
    versionNeeded: overrides.versionNeeded ?? (method === 8 ? 20 : 10),
  };
}

function buildZip(sourceEntries, eocdOverrides = {}) {
  const locals = [];
  const centrals = [];
  let localOffset = 0;
  for (const sourceEntry of sourceEntries) {
    const entry =
      sourceEntry && sourceEntry.pathBytes
        ? sourceEntry
        : zipEntry(sourceEntry.name, sourceEntry.content, sourceEntry);
    const local = Buffer.alloc(30 + entry.pathBytes.byteLength);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(entry.versionNeeded, 4);
    local.writeUInt16LE(entry.flags, 6);
    local.writeUInt16LE(entry.method, 8);
    local.writeUInt16LE(FIXED_DOS_TIME, 10);
    local.writeUInt16LE(FIXED_DOS_DATE, 12);
    local.writeUInt32LE(entry.crc, 14);
    local.writeUInt32LE(entry.compressedSize, 18);
    local.writeUInt32LE(entry.uncompressedSize, 22);
    local.writeUInt16LE(entry.pathBytes.byteLength, 26);
    local.writeUInt16LE(0, 28);
    entry.pathBytes.copy(local, 30);
    locals.push(local, entry.compressed);

    const central = Buffer.alloc(46 + entry.pathBytes.byteLength);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(entry.versionMadeBy, 4);
    central.writeUInt16LE(entry.versionNeeded, 6);
    central.writeUInt16LE(entry.flags, 8);
    central.writeUInt16LE(entry.method, 10);
    central.writeUInt16LE(FIXED_DOS_TIME, 12);
    central.writeUInt16LE(FIXED_DOS_DATE, 14);
    central.writeUInt32LE(entry.crc, 16);
    central.writeUInt32LE(entry.compressedSize, 20);
    central.writeUInt32LE(entry.uncompressedSize, 24);
    central.writeUInt16LE(entry.pathBytes.byteLength, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(entry.externalAttributes, 38);
    central.writeUInt32LE(localOffset, 42);
    entry.pathBytes.copy(central, 46);
    centrals.push(central);
    localOffset += local.byteLength + entry.compressed.byteLength;
  }

  const centralDirectory = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(eocdOverrides.diskNumber ?? 0, 4);
  eocd.writeUInt16LE(eocdOverrides.centralDisk ?? 0, 6);
  eocd.writeUInt16LE(
    eocdOverrides.entriesOnDisk ?? sourceEntries.length,
    8,
  );
  eocd.writeUInt16LE(eocdOverrides.entryCount ?? sourceEntries.length, 10);
  eocd.writeUInt32LE(
    eocdOverrides.centralSize ?? centralDirectory.byteLength,
    12,
  );
  eocd.writeUInt32LE(eocdOverrides.centralOffset ?? localOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, centralDirectory, eocd]);
}

function manifestFor(path, bytes) {
  return `${JSON.stringify(
    {
      version: 1,
      assets: [
        {
          path,
          sizeBytes: bytes.byteLength,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          owner: "loehrning-ai maintainers",
          source: "repository-owned archive security fixture",
          license: "MIT",
          redistribution: "permitted",
        },
      ],
    },
    null,
    2,
  )}\n`;
}

async function scanArchive(bytes, extension = "zip") {
  const root = await mkdtemp(join(tmpdir(), "zip-scan-fixture-"));
  const assetPath = `assets/fixture.${extension}`;
  try {
    await mkdir(join(root, "assets"), { recursive: true });
    await writeFile(join(root, assetPath), bytes);
    await writeFile(join(root, "README.md"), "# Archive fixture\n");
    await writeFile(
      join(root, "ASSET_MANIFEST.json"),
      manifestFor(assetPath, bytes),
    );
    return spawnSync(
      process.execPath,
      [scanScript, "--dest", root, "--profile", "platform"],
      { encoding: "utf8" },
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function output(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

test("accepts a bounded clean text-only ZIP and scans it through the CLI", async () => {
  const archive = buildZip([
    { name: "kit/", content: "", isDirectory: true },
    { name: "kit/README.md", content: "# Safe kit\n" },
    { name: "kit/data.csv", content: "name,value\nexample,1\n" },
  ]);
  const entries = inspectZipArchive(archive, { label: "clean.zip" });
  assert.deepEqual(
    entries.map((entry) => entry.path),
    ["kit/", "kit/README.md", "kit/data.csv"],
  );
  const result = await scanArchive(archive);
  assert.equal(result.status, 0, output(result));
});

test("finds secrets inside deflated ZIP text entries", async () => {
  const fakeToken = ["gh", "p_", "FAKEEXAMPLE".repeat(4)].join("");
  const archive = buildZip([
    {
      name: "kit/config.js",
      content: `export const fixture = "${fakeToken}";\n`,
    },
  ]);
  const result = await scanArchive(archive);
  assert.equal(result.status, 1, output(result));
  assert.match(output(result), /fixture\.zip!\/kit\/config\.js:1/);
  assert.match(output(result), /GitHub token/);
});

test("rejects traversal and non-normalized paths", () => {
  const archive = buildZip([
    { name: "../escape.txt", content: "blocked\n" },
  ]);
  assert.throws(
    () => inspectZipArchive(archive, { label: "traversal.zip" }),
    /normalized safe relative path/,
  );
});

test("rejects private and secret-like publication paths inside ZIPs", () => {
  for (const path of [
    "kit/.auth/state.json",
    "kit/.claude/private-state.json",
    "kit/.github/workflows/publish.yml",
    "kit/CLAUDE.md",
    "kit/credentials.json",
    "kit/docs/privacy/handling.md",
    ["kit", "plans", "roadmap.md"].join("/"),
  ]) {
    assert.throws(
      () =>
        inspectZipArchive(buildZip([{ name: path, content: "private\n" }]), {
          label: "private-path.zip",
        }),
      /private publication material|secret-like filename/,
      path,
    );
  }
});

test("rejects Windows-unsafe, invisible, and ambiguous entry paths", () => {
  const cases = [
    { name: "kit/CON.txt", content: "blocked\n" },
    { name: "kit/file:stream.txt", content: "blocked\n" },
    {
      name: "kit/safe\u202efdp.txt",
      content: "blocked\n",
      flags: 0x0800,
    },
    { name: "kit/folder./readme.md", content: "blocked\n" },
  ];
  for (const entry of cases) {
    assert.throws(
      () =>
        inspectZipArchive(buildZip([entry]), {
          label: "unsafe-portable-path.zip",
        }),
      /portable extraction/,
      entry.name,
    );
  }
});

test("requires the UTF-8 flag for non-ASCII paths", () => {
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([{ name: "kit/café.txt", content: "blocked\n" }]),
        { label: "ambiguous-encoding.zip" },
      ),
    /must set the UTF-8 flag/,
  );
  const accepted = inspectZipArchive(
    buildZip([
      {
        name: "kit/café.txt",
        content: "safe\n",
        flags: 0x0800,
      },
    ]),
    { label: "utf8-path.zip" },
  );
  assert.equal(accepted[0]?.path, "kit/café.txt");
});

test("rejects file-directory and ancestor-descendant path conflicts", () => {
  for (const entries of [
    [
      { name: "kit/a.txt", content: "file\n" },
      { name: "kit/a.txt/child.md", content: "child\n" },
    ],
    [
      { name: "kit/a.txt/child.md", content: "child\n" },
      { name: "kit/a.txt", content: "file\n" },
    ],
    [
      { name: "kit/a.txt/", content: "", isDirectory: true },
      { name: "kit/a.txt", content: "file\n" },
    ],
  ]) {
    assert.throws(
      () =>
        inspectZipArchive(buildZip(entries), {
          label: "hierarchy-conflict.zip",
        }),
      /already a file|child entries|file and directory paths collide/,
    );
  }
});

test("rejects symbolic links and special entries", () => {
  const symlink = zipEntry("kit/link.txt", "target", {
    externalAttributes: ((0o120777 << 16) >>> 0),
  });
  assert.throws(
    () => inspectZipArchive(buildZip([symlink]), { label: "symlink.zip" }),
    /symbolic links are forbidden/,
  );
});

test("rejects executable, writable, special-mode, and hidden metadata", () => {
  for (const entry of [
    zipEntry("kit/executable.sh", "#!/bin/sh\n", {
      externalAttributes: ((0o100755 << 16) >>> 0),
    }),
    zipEntry("kit/setuid.sh", "#!/bin/sh\n", {
      externalAttributes: ((0o104755 << 16) >>> 0),
    }),
    zipEntry("kit/writable.txt", "blocked\n", {
      externalAttributes: ((0o100666 << 16) >>> 0),
    }),
    zipEntry("kit/writable-dir/", "", {
      externalAttributes: (((0o040777 << 16) | 0x10) >>> 0),
      isDirectory: true,
    }),
    zipEntry("kit/hidden.txt", "blocked\n", {
      externalAttributes: 0x02,
      versionMadeBy: 20,
    }),
    zipEntry("kit/ambiguous-link.txt", "blocked\n", {
      externalAttributes: ((0o120777 << 16) >>> 0),
      versionMadeBy: 20,
    }),
    zipEntry("kit/unknown-attribute.txt", "blocked\n", {
      externalAttributes: 0x40,
      versionMadeBy: 20,
    }),
  ]) {
    assert.throws(
      () =>
        inspectZipArchive(buildZip([entry]), {
          label: "unsafe-metadata.zip",
        }),
      /permissions must be normalized|DOS attributes are forbidden|ambiguous Unix attributes/,
    );
  }
});

test("rejects obvious network, execution, and markup sinks in active files", () => {
  const cases = [
    {
      name: "kit/network.html",
      content:
        '<!doctype html><script>fetch("https://collector.invalid/")</script>\n',
    },
    {
      name: "kit/handler.html",
      content: '<!doctype html><img src="x" onerror="alert(1)">\n',
    },
    {
      name: "kit/process.mjs",
      content: 'import { exec } from "node:child_process";\n',
    },
    {
      name: "kit/active.svg",
      content:
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>\n',
    },
  ];
  for (const entry of cases) {
    assert.throws(
      () =>
        inspectZipArchive(buildZip([entry]), {
          label: "active-content.zip",
        }),
      /active content contains|active markup contains|forbidden active element/,
      entry.name,
    );
  }
});

test("rejects nested archives by extension and magic", () => {
  const inner = buildZip([{ name: "inner/readme.txt", content: "nested\n" }]);
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([{ name: "kit/payload.zip", content: inner }]),
        { label: "nested.zip" },
      ),
    /nested archives are forbidden/,
  );
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([{ name: "kit/disguised.txt", content: inner }]),
        { label: "nested-magic.zip" },
      ),
    /nested archives are forbidden/,
  );
});

test("rejects ZIP bombs and declared entry sizes before inflation", () => {
  const bomb = zipEntry("kit/bomb.txt", "x", {
    uncompressedSize: MAX_ZIP_ENTRY_UNCOMPRESSED_BYTES + 1,
  });
  assert.throws(
    () => inspectZipArchive(buildZip([bomb]), { label: "bomb.zip" }),
    /uncompressed-size limit/,
  );
});

test("rejects invalid UTF-8, binary entries, and NUL-bearing text", () => {
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([{ name: "kit/invalid.txt", content: Buffer.from([0xff]) }]),
        { label: "invalid-text.zip" },
      ),
    /not valid UTF-8/,
  );
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([{ name: "kit/image.png", content: Buffer.from([1, 2, 3]) }]),
        { label: "binary.zip" },
      ),
    /not a recognized text file/,
  );
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([
          {
            name: "kit/zero-byte.txt",
            content: Buffer.from([0x61, 0x00, 0x62]),
          },
        ]),
        { label: "nul.zip" },
      ),
    /NUL bytes/,
  );
});

test("rejects duplicate paths, encryption, multidisk, and trailing bytes", () => {
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([
          { name: "kit/readme.md", content: "one\n" },
          { name: "KIT/README.md", content: "two\n" },
        ]),
        { label: "duplicate.zip" },
      ),
    /colliding entry path/,
  );
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([
          zipEntry("kit/encrypted.txt", "ciphertext", { flags: 0x0001 }),
        ]),
        { label: "encrypted.zip" },
      ),
    /encryption/,
  );
  assert.throws(
    () =>
      inspectZipArchive(
        buildZip([{ name: "kit/readme.md", content: "safe\n" }], {
          diskNumber: 1,
        }),
        { label: "multidisk.zip" },
      ),
    /multidisk/,
  );
  assert.throws(
    () =>
      inspectZipArchive(
        Buffer.concat([
          buildZip([{ name: "kit/readme.md", content: "safe\n" }]),
          Buffer.from([0]),
        ]),
        { label: "trailing.zip" },
      ),
    /terminal EOCD/,
  );
});

test("platform profile rejects opaque archive formats after manifest verification", async () => {
  for (const extension of ["7z", "gz", "tar"]) {
    const result = await scanArchive(Buffer.from(`opaque ${extension}\n`), extension);
    assert.equal(result.status, 1, output(result));
    assert.match(output(result), /opaque and forbidden/);
    assert.doesNotMatch(output(result), /does not match ASSET_MANIFEST/);
  }
});

test("the published NORTHWIND kit is structurally valid and fully inspectable", async () => {
  const archive = await readFile(actualKitPath);
  const entries = inspectZipArchive(archive, { label: "northwind-analyst-kit.zip" });
  // 30 entries (21 files + 9 directories) after the NORTHWIND rename.
  // Re-derive these two numbers whenever the kit gains or loses a file.
  assert.equal(entries.length, 30);
  assert.equal(entries.filter((entry) => entry.kind === "file").length, 21);
  assert.ok(
    entries.some(
      (entry) =>
        entry.path === "northwind-analyst-kit/dashboard/index.html" &&
        entry.text?.includes("NORTHWIND"),
    ),
  );
});
