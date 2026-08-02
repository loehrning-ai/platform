#!/usr/bin/env node
// Fixture-based test for scan-export.mjs.
//
// Runs the real scanner CLI over planted temporary directories and asserts on
// exit codes and reported findings. Every planted value is obviously fake and
// self labelled (EXAMPLE / FAKE); no real secret is used. Run with:
//   node scripts/open-source/__tests__/scan-export.test.mjs
// or: bun run test:scan-export
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  rename,
  rm,
  symlink,
  truncate,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MAX_BUFFERED_FILE_BYTES,
  MAX_SCANNED_FILE_BYTES,
  readStableRegularFile,
} from "../scan-export.mjs";
import { crc32, inspectZipArchive } from "../zip-inspection.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scanScript = join(here, "..", "scan-export.mjs");

// Obviously fake, self labelled planted values. NOT real credentials.
// Fragments are joined at runtime so scanning this fixture source does not flag
// the inert test strings themselves.
const FAKE = {
  ghp: [`gh${"p"}_`, "FAKEEXAMPLE".repeat(4)].join(""),
  jwt: [
    "eyJhbGciOi",
    "JIUzI1NiIsInR5cCI6",
    "IkpXVCJ9.eyJmYWtlIjoi",
    "ZXhhbXBsZSJ9.ZmFrZQ",
    "c2lnbmF0dXJlRXhhbXBsZQ",
  ].join(""),
  skAnt: ["sk", "ant", "EXAMPLE", "0".repeat(28)].join("-"),
  akia: ["AK", "IA", "IOSFODNN7EXAMPLE"].join(""),
  base64: "A1b2C3d4".repeat(6),
  macLocalPath: [
    ["/Users", "real-contributor"].join("/"),
    "Projects",
    "internal-notes.md",
  ].join("/"),
  linuxLocalPath: [
    ["/home", "build-contributor"].join("/"),
    "src",
    "private.ts",
  ].join("/"),
  linuxPublicNamedPath: [
    ["/home", "public"].join("/"),
    "src",
    "private.ts",
  ].join("/"),
  rateLimitHmac: ["rlh1", "a".repeat(64)].join("_"),
  supabaseSecret: [
    ["sb", "secret"].join("_"),
    "A".repeat(22),
    "B".repeat(8),
  ].join("_"),
  windowsLocalPath: [
    ["C:", "Users", "DevContributor"].join("\\"),
    "repo",
    "private.ts",
  ].join("\\"),
  tildeLocalPath: ["~", "Downloads", "private-working-copy.zip"].join("/"),
  vault: `See ${["mavengence", "obsidian"].join("_")}/INDEX.md for context.`,
  internalPlan: ["plan", "057"].join(" "),
  internalStage: ["019", "Stage", "15"].join(" "),
};
const ENV_NAMES = {
  anthropic: ["ANTHROPIC", "API", "KEY"].join("_"),
  database: ["DATABASE", "URL"].join("_"),
  rateLimitHmac: ["RATE", "LIMIT", "HMAC", "SECRET"].join("_"),
  serviceRole: ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_"),
};
const INTERNAL_REFERENCES = {
  planPath: ["plans", "roadmap.md"].join("/"),
  todoFile: ["TODO", "S.md"].join(""),
  runbookFile: ["RUN", "BOOK.md"].join(""),
};

function runScan(flag, dir, profile = null) {
  const args = [scanScript, flag, dir];
  if (profile) args.push("--profile", profile);
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

function combined(result) {
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

async function writeTree(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function manifestAsset(path, content, overrides = {}) {
  return {
    path,
    sizeBytes: Buffer.byteLength(content),
    sha256: sha256(content),
    owner: "loehrning-ai maintainers",
    source: "repository-owned test fixture",
    license: "MIT",
    redistribution: "permitted",
    ...overrides,
  };
}

function manifestJson(assets) {
  return `${JSON.stringify({ version: 1, assets }, null, 2)}\n`;
}

function storedZip(path, content) {
  const pathBytes = Buffer.from(path, "utf8");
  const payload = Buffer.from(content);
  const checksum = crc32(payload);
  const flags = 0x0800;

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(flags, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt32LE(checksum, 14);
  local.writeUInt32LE(payload.byteLength, 18);
  local.writeUInt32LE(payload.byteLength, 22);
  local.writeUInt16LE(pathBytes.byteLength, 26);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE((3 << 8) | 20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(flags, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt32LE(checksum, 16);
  central.writeUInt32LE(payload.byteLength, 20);
  central.writeUInt32LE(payload.byteLength, 24);
  central.writeUInt16LE(pathBytes.byteLength, 28);
  central.writeUInt32LE((0o100644 * 0x10000) >>> 0, 38);

  const localRecord = Buffer.concat([local, pathBytes, payload]);
  const centralRecord = Buffer.concat([central, pathBytes]);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralRecord.byteLength, 12);
  eocd.writeUInt32LE(localRecord.byteLength, 16);
  return Buffer.concat([localRecord, centralRecord, eocd]);
}

async function main() {
  const workdir = await mkdtemp(join(tmpdir(), "scan-export-fixture-"));
  const clean = join(workdir, "clean");
  const dirty = join(workdir, "dirty");
  const advisory = join(workdir, "advisory");
  const platformClean = join(workdir, "platform-clean");
  const platformDirty = join(workdir, "platform-dirty");
  const platformGitCandidates = join(workdir, "platform-git-candidates");
  const profileOnly = join(workdir, "profile-only");
  const oversized = join(workdir, "oversized");
  const oversizedPlatform = join(workdir, "oversized-platform");
  try {
    // 1. CLEAN fixture: no findings at all. Note the teaching "claude" course
    //    directory (no leading dot) must NOT be flagged.
    await writeTree(clean, {
      "README.md": "# Interactive Courses\n\nMIT licensed teaching material.\n",
      "index.html":
        "<html><body><h1>Data Engineering</h1><p>Willkommen.</p></body></html>\n",
      "claude/js/widgets.js":
        'export const drill = { title: "Redaction" };\nconsole.log("hello");\n',
      "docs/generic-local-paths.md":
        "Generic setup examples:\n" +
        "- /Users/<username>/Projects/example\n" +
        "- /home/$USER/src/example\n" +
        "- C:\\Users\\%USERNAME%\\src\\example\n" +
        "- /Users/example-user/Projects/example\n" +
        "- C:\\Users\\Public\\Documents\\example\n" +
        "- https://docs.example.invalid/Users/real-looking-user/guide\n",
    });

    // 2. DIRTY fixture: one blocking class per planted item, across files, with
    //    the four widget secrets on distinct lines to prove full-pass reporting.
    await writeTree(dirty, {
      "claude/js/widgets.js":
        `const gh = "${FAKE.ghp}";\n` +
        `const jwt = "${FAKE.jwt}";\n` +
        `const sk = "${FAKE.skAnt}";\n` +
        `const aws = "${FAKE.akia}";\n`,
      "data/blob.txt": `const t = "${FAKE.base64}";\n`,
      "notes/local.md":
        `${FAKE.macLocalPath}\n` +
        `${FAKE.linuxLocalPath}\n` +
        `${FAKE.windowsLocalPath}\n` +
        `${FAKE.linuxPublicNamedPath}\n` +
        `Source: ${FAKE.tildeLocalPath}\n` +
        `${FAKE.vault}\n${FAKE.internalPlan}\n${FAKE.internalStage}\n`,
      "CLAUDE.md": "# internal instructions\n",
      [INTERNAL_REFERENCES.planPath]: "# internal roadmap\n",
      "docs/privacy/policy.md": "internal privacy handling\n",
    });

    // 3. ADVISORY fixture: WARN + ASSET only, must still exit 0.
    await writeTree(advisory, {
      "pricing.html":
        "<p>Der Preis beträgt EUR 5000 pro Monat. Transparent pricing.</p>\n",
      "big.txt": "Lorem ipsum dolor sit amet consectetur adipiscing.\n".repeat(
        30000,
      ),
      "bun.lock":
        '{ "pkg": { "integrity": "sha512-A1b2C3d4A1b2C3d4A1b2C3d4A1b2C3d4A1b2C3d4A1b2C3d4==" } }\n',
    });
    // >1MB binary asset with NUL bytes: ASSET note, never read as text.
    await mkdir(join(advisory, "img"), { recursive: true });
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
      Buffer.alloc(1024 * 1024 + 512),
    ]);
    await writeFile(join(advisory, "img", "logo.png"), png);

    // 4. PLATFORM CLEAN fixture: canonical env placeholders and a
    //    magic-validated binary whose exact path and SHA-256 are in the
    //    manifest.
    const font = Buffer.from([
      0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00,
    ]);
    const fontPath = "packages/website/src/assets/example.ttf";
    const logoSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1z"/></svg>\n',
    );
    const logoPath = "packages/website/public/logo.svg";
    await writeTree(platformClean, {
      "README.md":
        "# Public platform fixture\n\n" +
        "Source: https://example.com/media/20240506_DSK_Orientation_Example_Document.pdf\n" +
        "The risk-area identifier is ordinary prose, not an API credential.\n",
      "package.json": '{"name":"public-platform","private":true}\n',
      "bun.lock": '{"lockfileVersion":1}\n',
      ".env.example":
        `${ENV_NAMES.anthropic}=<your-api-key>\n` +
        "NEXT_PUBLIC_SUPABASE_URL=https://example.com\n" +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<example-publishable-key>\n",
      ".gitignore":
        `${INTERNAL_REFERENCES.todoFile}\n` +
        `${INTERNAL_REFERENCES.runbookFile}\n` +
        `${INTERNAL_REFERENCES.planPath}\n`,
      "packages/website/tests/e2e/.env.test.example":
        `${ENV_NAMES.serviceRole}=\${SUPABASE_SERVICE_ROLE_KEY}\n` +
        `${ENV_NAMES.database}=postgresql://test:test@localhost:5432/test\n`,
      [fontPath]: font,
      [logoPath]: logoSvg,
      "ASSET_MANIFEST.json": manifestJson([
        manifestAsset(fontPath, font),
        manifestAsset(logoPath, logoSvg),
      ]),
    });

    // 5. PLATFORM DIRTY fixture: every strict public-tree boundary is planted.
    const mismatchFont = Buffer.from([0x77, 0x4f, 0x46, 0x32, 0x00, 0x01]);
    const unlistedPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]);
    const disguisedZip = storedZip(
      "payload.txt",
      `const planted = "${FAKE.ghp}";\n`,
    );
    assert.equal(
      inspectZipArchive(disguisedZip, { label: "precondition" }).length,
      1,
      "binary masquerade precondition must be a valid ZIP",
    );
    const publicHash = "Z9y8X7w6".repeat(6);
    await writeTree(platformDirty, {
      "README.md": "# Dirty public platform fixture\n",
      ".env.local": "SHOULD_NOT_EXIST=1\n",
      ".netrc": "machine example.invalid login fixture password fixture\n",
      ".docker/config.json": '{"auths":{"example.invalid":{}}}\n',
      ".aws/credentials": "[default]\naws_access_key_id=fixture\n",
      ".kube/config": "current-context: fixture\n",
      ".ssh/config": "Host example.invalid\n",
      "credentials.json": '{"fixture":true}\n',
      ".env.example":
        `${ENV_NAMES.anthropic}=live-production-value\n` +
        `${["SENTRY", "AUTH", "TOKEN"].join("_")}=actual-example-credential\n`,
      ".codex/internal.md": "private agent instructions\n",
      ".claude.json": '{"private":true}\n',
      ".cursorrules": "private agent instructions\n",
      ".windsurfrules": "private agent instructions\n",
      "discuss-launch.md": "internal discussion\n",
      "notes/operator.local.md": "internal local note\n",
      ".gemini/internal.md": "private agent instructions\n",
      ".windsurf/internal.md": "private agent instructions\n",
      ".roo/internal.md": "private agent instructions\n",
      ".aider.conf.yml": "model: local\n",
      ".github/copilot-instructions.md": "private agent instructions\n",
      "unexpected/.auth/state.txt": "generated authenticated state\n",
      "src/unsafe-env.ts": `const value = \`${ENV_NAMES.database}=literal\`;\n`,
      "src/unsafe-bracket-env.ts": `process.env[\"${ENV_NAMES.anthropic}\"] = \"literal\";\n`,
      "src/unsafe-rate-limit-env.ts": `process.env[\"${ENV_NAMES.rateLimitHmac}\"] = \"literal\";\n`,
      "src/leaked-rate-limit-key.ts": `export const limiterKey = "${FAKE.rateLimitHmac}";\n`,
      "src/leaked-supabase-secret.ts": `export const serviceKey = "${FAKE.supabaseSecret}";\n`,
      "src/literal-secret.ts": `export const ${["pass", "word"].join("")} = \"${["hunter", "2"].join("")}\";\n`,
      "src/base64-context.ts":
        `const integrity = "sha256-${publicHash}"; const leaked = "${FAKE.base64}";\n` +
        `const publicRef = "https://example.invalid/assets/${publicHash}"; const copied = "${publicHash}";\n`,
      "src/split-secret.ts":
        `const token = "${FAKE.ghp.slice(0, 12)}" + ` +
        `"${FAKE.ghp.slice(12)}";\n`,
      "src/internal-references.ts":
        `export const todo = \"${INTERNAL_REFERENCES.todoFile}\";\n` +
        `export const runbook = \"${INTERNAL_REFERENCES.runbookFile}\";\n` +
        `export const plan = \"${INTERNAL_REFERENCES.planPath}\";\n`,
      "packages/website/docs/operations/internal.md": "internal operations\n",
      "packages/website/bun.lock": '{"stale":true}\n',
      "packages/legacy/bun.lockb": "legacy binary lock fixture\n",
      "examples/tool/package-lock.json": '{"lockfileVersion":3}\n',
      "nested/deeper/npm-shrinkwrap.json": '{"lockfileVersion":3}\n',
      "packages/python-tool/pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
      "docs/sample/yarn.lock": "# generated lockfile\n",
      "package-lock.json": '{"lockfileVersion":3}\n',
      "packages/website/logo/source.svg": "<svg/>\n",
      "packages/website/public/fonts/old.woff2": mismatchFont,
      "assets/mismatch.woff2": mismatchFont,
      "assets/disguised.png": disguisedZip,
      "assets/unlisted.png": unlistedPng,
      "assets/unknown.bin": Buffer.from([0x00, 0x01, 0x02]),
      "assets/late-nul.bin": Buffer.concat([
        Buffer.alloc(9_000, 0x41),
        Buffer.from([0x00, 0x42]),
      ]),
      "assets/invalid-utf8.bin": Buffer.from([0xc3, 0x28]),
      "ASSET_MANIFEST.json": manifestJson([
        manifestAsset("assets/disguised.png", disguisedZip),
        manifestAsset("assets/mismatch.woff2", mismatchFont, {
          sizeBytes: 999,
          sha256: "0".repeat(64),
        }),
        manifestAsset("assets/missing.jpg", Buffer.from("missing")),
        manifestAsset("../escape.png", Buffer.from("escape")),
        manifestAsset("assets/bad.gif", Buffer.from("bad"), {
          sha256: "invalid",
          sizeBytes: 0,
          owner: "",
          source: "",
          license: "",
          redistribution: "",
        }),
      ]),
    });
    await symlink("README.md", join(platformDirty, "linked-readme.md"));

    // 6. A Git-aware platform scan must inspect force-added candidates inside
    // generated and authenticated-state directories while leaving ignored,
    // untracked dependency output outside the publication inventory.
    await writeTree(platformGitCandidates, {
      ".gitignore": "dist/\nnode_modules/\n**/.auth/\n",
      "README.md": "# Git candidate fixture\n",
      "ASSET_MANIFEST.json": manifestJson([]),
      "dist/leaked.js": `const planted = "${FAKE.ghp}";\n`,
      "node_modules/ignored/leaked.js": `const ignored = "${FAKE.ghp}";\n`,
      "packages/website/tests/e2e/.auth/state.json": FAKE.jwt,
    });
    const initGit = spawnSync(
      "git",
      ["init", "--quiet", platformGitCandidates],
      { encoding: "utf8" },
    );
    assert.equal(initGit.status, 0, `git init failed\n${combined(initGit)}`);
    const addNormal = spawnSync(
      "git",
      [
        "-C",
        platformGitCandidates,
        "add",
        ".gitignore",
        "README.md",
        "ASSET_MANIFEST.json",
      ],
      { encoding: "utf8" },
    );
    assert.equal(
      addNormal.status,
      0,
      `git add normal candidates failed\n${combined(addNormal)}`,
    );
    const forceAdd = spawnSync(
      "git",
      [
        "-C",
        platformGitCandidates,
        "add",
        "--force",
        "dist/leaked.js",
        "packages/website/tests/e2e/.auth/state.json",
      ],
      { encoding: "utf8" },
    );
    assert.equal(
      forceAdd.status,
      0,
      `git force-add candidates failed\n${combined(forceAdd)}`,
    );

    // 7. PROFILE fixture: platform-only private paths remain compatible with the
    //    existing interactive-course exporter profile.
    await writeTree(profileOnly, {
      "ASSET_MANIFEST.json": manifestJson([]),
      "packages/website/docs/operations/internal.md": "internal operations\n",
      "packages/website/bun.lock": '{"stale":true}\n',
    });

    // 8. OVERSIZED fixtures: sparse files prove stat-time rejection without
    // allocating their declared size in the test or scanner process.
    const oversizedTextPath = join(oversized, "hostile.txt");
    await mkdir(dirname(oversizedTextPath), { recursive: true });
    await writeFile(oversizedTextPath, "");
    await truncate(oversizedTextPath, MAX_BUFFERED_FILE_BYTES + 1);

    const oversizedBinaryRel = "assets/hostile.mp4";
    const oversizedBinaryPath = join(oversizedPlatform, oversizedBinaryRel);
    const oversizedBinarySize = MAX_SCANNED_FILE_BYTES + 1;
    await mkdir(dirname(oversizedBinaryPath), { recursive: true });
    await writeFile(oversizedBinaryPath, "");
    await truncate(oversizedBinaryPath, oversizedBinarySize);
    await writeFile(
      join(oversizedPlatform, "ASSET_MANIFEST.json"),
      manifestJson([
        {
          path: oversizedBinaryRel,
          sizeBytes: oversizedBinarySize,
          sha256: "0".repeat(64),
          owner: "loehrning-ai maintainers",
          source: "repository-owned sparse test fixture",
          license: "MIT",
          redistribution: "permitted",
        },
      ]),
    );

    // --- clean: exits 0 in both modes ---
    const cleanSource = runScan("--source", clean);
    assert.equal(
      cleanSource.status,
      0,
      `clean --source should exit 0\n${combined(cleanSource)}`,
    );
    assert.match(
      combined(cleanSource),
      /no findings/,
      "clean run should report no findings",
    );

    const cleanDest = runScan("--dest", clean);
    assert.equal(
      cleanDest.status,
      0,
      `clean --dest should exit 0\n${combined(cleanDest)}`,
    );

    // --- dirty: exits non-zero and lists every planted class + every line ---
    const dirtyRes = runScan("--source", dirty);
    const dirtyOut = combined(dirtyRes);
    assert.notEqual(
      dirtyRes.status,
      0,
      `dirty --source should exit non-zero\n${dirtyOut}`,
    );
    for (const needle of [
      "claude/js/widgets.js",
      "GitHub token",
      "JWT",
      "sk- API key",
      "AWS access key",
      "high-entropy base64",
      "local machine user path",
      "private Obsidian vault reference",
      "internal plan identifier",
      "CLAUDE.md",
      "plans",
      "docs/privacy",
    ]) {
      assert.ok(
        dirtyOut.includes(needle),
        `dirty output should mention: ${needle}\n${dirtyOut}`,
      );
    }
    for (const ln of [
      "widgets.js:1",
      "widgets.js:2",
      "widgets.js:3",
      "widgets.js:4",
    ]) {
      assert.ok(
        dirtyOut.includes(ln),
        `dirty output should list line ${ln}\n${dirtyOut}`,
      );
    }
    for (const ln of [
      "notes/local.md:1",
      "notes/local.md:2",
      "notes/local.md:3",
      "notes/local.md:4",
      "notes/local.md:5",
    ]) {
      assert.ok(
        dirtyOut.includes(`${ln}  [local machine user path]`),
        `dirty output should list cross-platform local path at ${ln}\n${dirtyOut}`,
      );
    }

    // --dest parity on the same dirty tree.
    const dirtyDest = runScan("--dest", dirty);
    assert.notEqual(
      dirtyDest.status,
      0,
      "dirty --dest should exit non-zero (parity)",
    );

    // --- advisory: WARN + ASSET only, exits 0, lockfile hash not a base64 hit ---
    const advRes = runScan("--source", advisory);
    const advOut = combined(advRes);
    assert.equal(
      advRes.status,
      0,
      `advisory should exit 0 (WARN/ASSET only)\n${advOut}`,
    );
    assert.ok(/WARN/.test(advOut), "advisory should surface WARN findings");
    assert.ok(/pric|Preis/i.test(advOut), "advisory should flag pricing");
    assert.ok(
      /large file/i.test(advOut),
      "advisory should flag the large text file",
    );
    assert.ok(/ASSET/.test(advOut), "advisory should record the binary asset");
    assert.ok(
      !/base64/.test(advOut),
      "lockfile integrity hash must not trip the base64 heuristic",
    );

    // --- platform clean: strict mode accepts canonical examples, validates
    // strict text, recognizes the font magic, and validates its exact hash ---
    const platformCleanRes = runScan("--dest", platformClean, "platform");
    assert.equal(
      platformCleanRes.status,
      0,
      `clean platform fixture should exit 0\n${combined(platformCleanRes)}`,
    );
    assert.match(combined(platformCleanRes), /no findings/);

    // --- platform dirty: all public-tree policy violations block in one pass ---
    const platformDirtyRes = runScan("--dest", platformDirty, "platform");
    const platformDirtyOut = combined(platformDirtyRes);
    assert.equal(
      platformDirtyRes.status,
      1,
      `dirty platform fixture should exit 1\n${platformDirtyOut}`,
    );
    for (const needle of [
      "secret-like filename",
      "sensitive environment example",
      "DATABASE_URL assignment",
      "ANTHROPIC_API_KEY assignment",
      "RATE_LIMIT_HMAC_SECRET assignment",
      "rate-limit HMAC key (rlh1_)",
      "Supabase secret key (sb_secret_)",
      "internal TODO or operations-runbook reference",
      "internal plan identifier",
      "internal operations documentation",
      "non-canonical JavaScript lockfile",
      "redundant logo working asset kit",
      "unused duplicate public font files",
      "literal password assignment",
      "authenticated storage directory is a forbidden publication candidate",
      "AI tooling directory",
      "AI tooling instruction file",
      "internal local planning note",
      "symbolic link",
      "neither strict text nor a recognized binary asset",
      "missing from ASSET_MANIFEST.json",
      "does not match ASSET_MANIFEST.json",
      "does not match .png",
      "assembled across literals",
      "high-entropy base64 run",
      "asset sizeBytes must be a positive safe integer",
      "byte size does not match ASSET_MANIFEST.json",
      "stale ASSET_MANIFEST.json entry",
      "normalized repo-relative POSIX path",
      "asset owner must be a non-empty string",
    ]) {
      assert.ok(
        platformDirtyOut.includes(needle),
        `dirty platform output should mention: ${needle}\n${platformDirtyOut}`,
      );
    }
    for (const lockfilePath of [
      "packages/website/bun.lock",
      "packages/legacy/bun.lockb",
      "examples/tool/package-lock.json",
      "nested/deeper/npm-shrinkwrap.json",
      "packages/python-tool/pnpm-lock.yaml",
      "docs/sample/yarn.lock",
      "package-lock.json",
    ]) {
      assert.ok(
        platformDirtyOut.includes(lockfilePath),
        `dirty platform output should list forbidden lockfile: ${lockfilePath}\n${platformDirtyOut}`,
      );
    }

    const platformGitCandidateRes = runScan(
      "--dest",
      platformGitCandidates,
      "platform",
    );
    const platformGitCandidateOut = combined(platformGitCandidateRes);
    assert.equal(
      platformGitCandidateRes.status,
      1,
      `force-added generated candidates must fail\n${platformGitCandidateOut}`,
    );
    for (const needle of [
      "dist",
      "generated directory is a forbidden publication candidate",
      "GitHub token",
      "packages/website/tests/e2e/.auth",
      "authenticated storage directory is a forbidden publication candidate",
      "JWT",
    ]) {
      assert.ok(
        platformGitCandidateOut.includes(needle),
        `Git candidate output should mention ${needle}\n${platformGitCandidateOut}`,
      );
    }
    assert.ok(
      !platformGitCandidateOut.includes("node_modules/ignored/leaked.js"),
      `ignored untracked dependency output must stay outside the Git publication inventory\n${platformGitCandidateOut}`,
    );

    // --- profile boundaries and required manifest ---
    const profileDefault = runScan("--dest", profileOnly);
    assert.equal(
      profileDefault.status,
      0,
      `default profile must preserve exporter compatibility\n${combined(profileDefault)}`,
    );
    const profilePlatform = runScan("--dest", profileOnly, "platform");
    assert.equal(
      profilePlatform.status,
      1,
      "platform-only private paths must block",
    );

    const missingManifest = runScan("--dest", clean, "platform");
    assert.equal(
      missingManifest.status,
      1,
      "platform profile must require ASSET_MANIFEST.json",
    );
    assert.match(combined(missingManifest), /required asset manifest/);

    const oversizedTextScan = runScan("--source", oversized);
    assert.equal(
      oversizedTextScan.status,
      1,
      `oversized text must fail closed\n${combined(oversizedTextScan)}`,
    );
    assert.match(combined(oversizedTextScan), /EFBIG|byte size limit/);

    const oversizedBinaryScan = runScan(
      "--dest",
      oversizedPlatform,
      "platform",
    );
    assert.equal(
      oversizedBinaryScan.status,
      1,
      `oversized manifest binary must fail closed\n${combined(oversizedBinaryScan)}`,
    );
    assert.match(combined(oversizedBinaryScan), /EFBIG|byte size limit/);

    // Descriptor reads must fail closed if a path or file changes after open.
    const raceRoot = join(workdir, "race");
    await mkdir(raceRoot, { recursive: true });

    const swappedPath = join(raceRoot, "swapped.txt");
    const swappedTarget = join(workdir, "swapped-target.txt");
    await writeFile(swappedPath, "expected\n");
    await writeFile(swappedTarget, "expected\n");
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: raceRoot,
        filePath: swappedPath,
        hooks: {
          afterOpen: async ({ absolutePath }) => {
            await rm(absolutePath);
            await symlink(swappedTarget, absolutePath);
          },
        },
      }),
      /symbolic-link path component|pathname/,
      "a final-component symlink swap must be rejected",
    );

    const mutatedPath = join(raceRoot, "mutated.txt");
    await writeFile(mutatedPath, "expected\n");
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: raceRoot,
        filePath: mutatedPath,
        hooks: {
          afterRead: async ({ absolutePath }) => {
            await writeFile(absolutePath, "replaced\n");
            await utimes(absolutePath, new Date(1_000), new Date(2_000));
          },
        },
      }),
      /changed while it was being scanned/,
      "same-size mutation in the descriptor read window must be rejected",
    );

    const growingPath = join(raceRoot, "growing.txt");
    const growingOriginal = Buffer.from("bounded\n");
    let growingBytesRead = null;
    await writeFile(growingPath, growingOriginal);
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: raceRoot,
        filePath: growingPath,
        hooks: {
          afterOpen: async ({ absolutePath }) => {
            await truncate(absolutePath, MAX_SCANNED_FILE_BYTES + 1);
          },
          afterRead: async ({ bytes }) => {
            growingBytesRead = bytes?.byteLength ?? null;
          },
        },
      }),
      /changed while it was being scanned/,
      "growth after descriptor stat must be bounded and rejected",
    );
    assert.equal(
      growingBytesRead,
      growingOriginal.byteLength,
      "post-stat growth must not expand the descriptor read allocation",
    );

    const outsideParent = join(workdir, "outside-parent");
    await mkdir(outsideParent, { recursive: true });
    await writeFile(join(outsideParent, "outside.txt"), "outside\n");
    const linkedParent = join(raceRoot, "linked-parent");
    await symlink(outsideParent, linkedParent, "dir");
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: raceRoot,
        filePath: join(linkedParent, "outside.txt"),
      }),
      /symbolic-link path component|inside the scan root/,
      "a symlinked parent path must be rejected",
    );

    const swappedParent = join(raceRoot, "swapped-parent");
    const swappedParentOutside = join(workdir, "swapped-parent-outside");
    await mkdir(swappedParent, { recursive: true });
    await mkdir(swappedParentOutside, { recursive: true });
    await writeFile(join(swappedParent, "file.txt"), "expected\n");
    await writeFile(join(swappedParentOutside, "file.txt"), "expected\n");
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: raceRoot,
        filePath: join(swappedParent, "file.txt"),
        hooks: {
          afterOpen: async ({ absolutePath }) => {
            const parentPath = dirname(absolutePath);
            await rename(parentPath, `${parentPath}.original`);
            await symlink(swappedParentOutside, parentPath, "dir");
          },
        },
      }),
      /symbolic-link path component|pathname|inside the scan root/,
      "a parent-directory replacement after open must be rejected",
    );

    let oversizedTextReadStarted = false;
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: oversized,
        filePath: oversizedTextPath,
        hooks: {
          afterOpen: async () => {
            oversizedTextReadStarted = true;
          },
        },
      }),
      (error) => error?.code === "EFBIG" && /size limit/.test(error.message),
      "a sparse oversized text file must be rejected from descriptor metadata",
    );
    assert.equal(
      oversizedTextReadStarted,
      false,
      "oversized text must be rejected before allocating or reading contents",
    );

    let oversizedBinaryReadStarted = false;
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: oversizedPlatform,
        filePath: oversizedBinaryPath,
        readContents: false,
        hashContents: true,
        hooks: {
          afterOpen: async () => {
            oversizedBinaryReadStarted = true;
          },
        },
      }),
      (error) => error?.code === "EFBIG" && /size limit/.test(error.message),
      "a sparse oversized binary must be rejected before streaming its hash",
    );
    assert.equal(
      oversizedBinaryReadStarted,
      false,
      "oversized binary must be rejected before any streaming read",
    );

    const streamedPath = join(raceRoot, "streamed.bin");
    const streamedContent = Buffer.alloc(256 * 1024, 0x61);
    await writeFile(streamedPath, streamedContent);
    const streamed = await readStableRegularFile({
      rootDirectory: raceRoot,
      filePath: streamedPath,
      readContents: false,
      hashContents: true,
    });
    assert.equal(streamed.bytes, null);
    assert.equal(streamed.sha256, sha256(streamedContent));

    let streamMutated = false;
    await assert.rejects(
      readStableRegularFile({
        rootDirectory: raceRoot,
        filePath: streamedPath,
        readContents: false,
        hashContents: true,
        hooks: {
          afterChunk: async ({ absolutePath }) => {
            if (streamMutated) return;
            streamMutated = true;
            await writeFile(
              absolutePath,
              Buffer.alloc(streamedContent.byteLength, 0x62),
            );
            await utimes(absolutePath, new Date(1_000), new Date(2_000));
          },
        },
      }),
      /changed while it was being scanned/,
      "same-size mutation during streamed hashing must be rejected",
    );

    // The scanner and denylist sources themselves remain scan-safe. Warnings are
    // allowed, but inert fixture strings must never create blocking findings.
    const selfScan = runScan("--source", join(here, ".."));
    assert.equal(
      selfScan.status,
      0,
      `scanner source must self-scan cleanly\n${combined(selfScan)}`,
    );

    // --- usage guard ---
    const noArgs = spawnSync(process.execPath, [scanScript], {
      encoding: "utf8",
    });
    assert.equal(noArgs.status, 2, "no args should exit 2");
    const invalidProfile = spawnSync(
      process.execPath,
      [scanScript, "--dest", clean, "--profile", "invalid"],
      { encoding: "utf8" },
    );
    assert.equal(invalidProfile.status, 2, "invalid profile should exit 2");

    console.log("scan-export fixture test: ALL ASSERTIONS PASSED");
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
