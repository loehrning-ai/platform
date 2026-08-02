import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  linkSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { test } from "node:test";
import { minimalVerificationEnvironment } from "../../../../scripts/environment-policy.mjs";
import {
  BUILD_INPUT_SCOPES,
  buildReceiptEnvironment,
  CANONICAL_BUILD_EXECUTION_ENVIRONMENT,
  computeBuildState,
  listBuildInputPaths,
  recordBuildReceipt,
  readStableRegularFile,
  runBuildAndRecord,
  verifyBuildReceipt,
} from "../build-freshness.mjs";

const TEST_TOOLCHAIN = Object.freeze({
  nodeVersion: "24.18.0-test",
  nodeModuleAbi: "137",
  v8Version: "13.6-test",
  icuVersion: "78.3-test",
  timezoneDataVersion: "2026b-test",
  bunRevision: "1.3.10+test",
  platform: "test",
  platformRelease: "test-release",
  architecture: "test-arch",
  endianness: "LE",
});

function fixture() {
  const repositoryRoot = mkdtempSync(
    join(tmpdir(), "loehrning-build-freshness-"),
  );
  const websiteRoot = join(repositoryRoot, "packages", "website");
  mkdirSync(join(websiteRoot, ".next"), { recursive: true });
  mkdirSync(join(websiteRoot, "src"), { recursive: true });
  writeFileSync(join(websiteRoot, ".next", "BUILD_ID"), "build-one\n");
  writeFileSync(
    join(websiteRoot, "src", "page.ts"),
    "export const page = 1;\n",
  );
  return {
    repositoryRoot,
    websiteRoot,
    files: ["packages/website/src/page.ts"],
    toolchain: TEST_TOOLCHAIN,
  };
}

test("default scope resolution binds provider-free policy mutations", () => {
  const current = fixture();
  try {
    const wrapperPath = join(
      current.websiteRoot,
      "scripts",
      "run-provider-free.mjs",
    );
    mkdirSync(join(current.websiteRoot, "scripts"), { recursive: true });
    writeFileSync(wrapperPath, "export const providerFreePolicy = 1;\n");
    const defaultScopeOptions = { ...current, files: undefined };
    assert.ok(
      BUILD_INPUT_SCOPES.includes(
        "packages/website/scripts/run-provider-free.mjs",
      ),
    );
    assert.ok(
      listBuildInputPaths(current.repositoryRoot).includes(
        "packages/website/scripts/run-provider-free.mjs",
      ),
    );
    recordBuildReceipt({ ...defaultScopeOptions, environment: {} });
    writeFileSync(wrapperPath, "export const providerFreePolicy = 2;\n");
    assert.throws(
      () => verifyBuildReceipt({ ...defaultScopeOptions, environment: {} }),
      /Stale production build/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("ignored files inside explicit source scopes remain receipt-bound", () => {
  const current = fixture();
  try {
    const ignoredPath = join(
      current.websiteRoot,
      "src",
      "generated.ignored-build",
    );
    writeFileSync(
      join(current.repositoryRoot, ".gitignore"),
      "*.ignored-build\n",
    );
    writeFileSync(ignoredPath, "build input one\n");
    const initialized = spawnSync("git", ["init", "--quiet"], {
      cwd: current.repositoryRoot,
      encoding: "utf8",
    });
    assert.equal(initialized.status, 0, initialized.stderr);
    const defaultScopeOptions = { ...current, files: undefined };
    assert.ok(
      listBuildInputPaths(current.repositoryRoot).includes(
        "packages/website/src/generated.ignored-build",
      ),
    );
    recordBuildReceipt({ ...defaultScopeOptions, environment: {} });
    writeFileSync(ignoredPath, "build input two\n");
    assert.throws(
      () => verifyBuildReceipt({ ...defaultScopeOptions, environment: {} }),
      /Stale production build/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("records and verifies one exact source and environment state", () => {
  const current = fixture();
  try {
    const options = {
      ...current,
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: "https://public-ref.supabase.co",
      },
    };
    recordBuildReceipt(options);
    assert.equal(verifyBuildReceipt(options).buildId, "build-one");

    writeFileSync(
      join(current.websiteRoot, "src", "page.ts"),
      "export const page = 2;\n",
    );
    assert.throws(() => verifyBuildReceipt(options), /Stale production build/);
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("a build without a receipt is rejected with an actionable error", () => {
  const current = fixture();
  try {
    assert.throws(
      () => verifyBuildReceipt({ ...current, environment: {} }),
      /receipt is missing.*non-:built/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("public build-environment changes invalidate a receipt", () => {
  const current = fixture();
  try {
    const original = {
      ...current,
      environment: {
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      },
    };
    recordBuildReceipt(original);
    assert.throws(
      () =>
        verifyBuildReceipt({
          ...current,
          environment: {
            NEXT_PUBLIC_TURNSTILE_SITE_KEY: "2x00000000000000000000AB",
          },
        }),
      /Stale production build/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("private build credentials are reduced to presence, never value", () => {
  const current = fixture();
  try {
    for (const key of ["ANTHROPIC_API_KEY", "RATE_LIMIT_HMAC_SECRET"]) {
      const first = computeBuildState({
        ...current,
        environment: { [key]: "first-private-value" },
      });
      const rotated = computeBuildState({
        ...current,
        environment: { [key]: "rotated-private-value" },
      });
      const absent = computeBuildState({
        ...current,
        environment: { [key]: "" },
      });
      assert.equal(
        first.environmentDigest,
        rotated.environmentDigest,
        `${key} value must never enter the receipt`,
      );
      assert.notEqual(
        first.environmentDigest,
        absent.environmentDigest,
        `${key} presence must invalidate a provider-free receipt`,
      );
    }
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("build execution environment changes invalidate a receipt", () => {
  const current = fixture();
  try {
    const original = {
      ...current,
      environment: {
        CI: "1",
        TZ: "UTC",
      },
    };
    recordBuildReceipt(original);
    assert.throws(
      () =>
        verifyBuildReceipt({
          ...current,
          environment: {
            CI: "",
            TZ: "Pacific/Kiritimati",
          },
        }),
      /Stale production build/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("receipt builds canonicalize launcher-mutated locale and telemetry controls", () => {
  const directEnvironment = buildReceiptEnvironment({
    ANALYZE: "false",
    CI: "1",
    LANG: "en_US.UTF-8",
    LC_ALL: "",
    LC_CTYPE: "UTF-8",
    NEXT_PUBLIC_SUPABASE_URL: "https://public-ref.supabase.co",
    NEXT_TELEMETRY_DISABLED: "",
    TZ: "Europe/Berlin",
  });
  const bunScriptEnvironment = buildReceiptEnvironment({
    ANALYZE: "false",
    CI: "1",
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    LC_CTYPE: "C.UTF-8",
    NEXT_PUBLIC_SUPABASE_URL: "https://public-ref.supabase.co",
    NEXT_TELEMETRY_DISABLED: "1",
    TZ: "Europe/Berlin",
  });

  assert.deepEqual(directEnvironment, bunScriptEnvironment);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(CANONICAL_BUILD_EXECUTION_ENVIRONMENT).map((key) => [
        key,
        directEnvironment[key],
      ]),
    ),
    CANONICAL_BUILD_EXECUTION_ENVIRONMENT,
  );
  assert.equal(directEnvironment.CI, "1");
  assert.equal(directEnvironment.TZ, "Europe/Berlin");
  assert.equal(
    directEnvironment.NEXT_PUBLIC_SUPABASE_URL,
    "https://public-ref.supabase.co",
  );
  assert.equal(directEnvironment.ANALYZE, "");
  assert.equal(buildReceiptEnvironment({ ANALYZE: "true" }).ANALYZE, "true");
});

test("the default composite build passes its canonical environment to the child", () => {
  const current = fixture();
  try {
    const buildIdPath = join(current.websiteRoot, ".next", "BUILD_ID");
    const environmentPath = join(
      current.websiteRoot,
      ".next",
      "build-environment.json",
    );
    runBuildAndRecord({
      ...current,
      environment: undefined,
      command: process.execPath,
      commandArguments: [
        "-e",
        [
          `const fs = require("node:fs");`,
          `const keys = ${JSON.stringify(Object.keys(CANONICAL_BUILD_EXECUTION_ENVIRONMENT))};`,
          `fs.writeFileSync(${JSON.stringify(environmentPath)}, JSON.stringify(Object.fromEntries(keys.map((key) => [key, process.env[key]]))));`,
          `fs.writeFileSync(${JSON.stringify(buildIdPath)}, "canonical-environment\\n");`,
        ].join(""),
      ],
      stdio: "pipe",
    });

    assert.deepEqual(
      JSON.parse(readFileSync(environmentPath, "utf8")),
      CANONICAL_BUILD_EXECUTION_ENVIRONMENT,
    );
    assert.equal(
      verifyBuildReceipt({
        ...current,
        environment: buildReceiptEnvironment({
          ...process.env,
          LANG: "another-launcher-locale",
          LC_ALL: "",
          LC_CTYPE: "",
          NEXT_TELEMETRY_DISABLED: "",
        }),
      }).buildId,
      "canonical-environment",
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("inputDigest remains a stable source-only comparison across build profiles", () => {
  const current = fixture();
  try {
    const providerFree = computeBuildState({
      ...current,
      environment: { TZ: "UTC" },
    });
    const configured = computeBuildState({
      ...current,
      environment: {
        TZ: "Europe/Berlin",
        NEXT_PUBLIC_SUPABASE_URL: "https://configured.supabase.co",
      },
    });
    assert.equal(providerFree.inputDigest, configured.inputDigest);
    assert.notEqual(
      providerFree.environmentDigest,
      configured.environmentDigest,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("toolchain changes invalidate a receipt without storing secrets", () => {
  const current = fixture();
  try {
    const options = {
      ...current,
      environment: {
        ANTHROPIC_API_KEY: "must-not-appear-in-receipt",
      },
    };
    recordBuildReceipt(options);
    const receiptPath = join(
      current.websiteRoot,
      ".next",
      "loehrning-build-receipt.json",
    );
    assert.doesNotMatch(
      readFileSync(receiptPath, "utf8"),
      /must-not-appear-in-receipt/,
    );
    assert.throws(
      () =>
        verifyBuildReceipt({
          ...options,
          toolchain: {
            ...TEST_TOOLCHAIN,
            bunRevision: "1.3.11+different",
          },
        }),
      /Stale production build/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("live-auth verification reproduces the runner's public-only build profile", () => {
  const current = fixture();
  try {
    const publicEnvironment = {
      NEXT_PUBLIC_SUPABASE_URL: "https://isolated-ref.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    };
    recordBuildReceipt({
      ...current,
      environment: {
        ...minimalVerificationEnvironment({}),
        ...publicEnvironment,
        E2E_AUTH_LIVE: "1",
        LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    });
    assert.equal(
      verifyBuildReceipt({
        ...current,
        environment: {
          ...publicEnvironment,
          ANTHROPIC_API_KEY: "unrelated-parent-secret",
          SIMPLIFIED_SUPABASE_TEST_PASSWORD: "not-a-build-input",
        },
        mode: "live-auth",
      }).buildId,
      "build-one",
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("symbolic-link build inputs are rejected", () => {
  const current = fixture();
  try {
    writeFileSync(join(current.repositoryRoot, "outside.ts"), "secret\n");
    symlinkSync(
      join(current.repositoryRoot, "outside.ts"),
      join(current.websiteRoot, "src", "linked.ts"),
    );
    assert.throws(
      () =>
        computeBuildState({
          ...current,
          files: ["packages/website/src/linked.ts"],
          environment: {},
        }),
      /regular non-symlink/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("stable descriptor reads reject pathname replacement after open", () => {
  const current = fixture();
  try {
    const relativePath = "packages/website/src/page.ts";
    const sourcePath = join(current.repositoryRoot, ...relativePath.split("/"));
    const displacedPath = join(current.repositoryRoot, "original-page.ts");
    assert.throws(
      () =>
        readStableRegularFile(sourcePath, relativePath, "Build input", {
          rootDirectory: current.repositoryRoot,
          afterOpen() {
            renameSync(sourcePath, displacedPath);
            writeFileSync(sourcePath, "export const attacker = true;\n");
          },
        }),
      /changed while it was being hashed/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("stable descriptor reads reject parent-directory replacement after open", () => {
  const current = fixture();
  const outsideDirectory = mkdtempSync(
    join(tmpdir(), "loehrning-build-freshness-outside-"),
  );
  try {
    const relativePath = "packages/website/src/page.ts";
    const sourcePath = join(current.repositoryRoot, ...relativePath.split("/"));
    const sourceDirectory = join(current.websiteRoot, "src");
    const displacedDirectory = join(current.websiteRoot, "src-original");
    writeFileSync(join(outsideDirectory, "page.ts"), "external source\n");

    assert.throws(
      () =>
        readStableRegularFile(sourcePath, relativePath, "Build input", {
          rootDirectory: current.repositoryRoot,
          afterOpen() {
            renameSync(sourceDirectory, displacedDirectory);
            symlinkSync(outsideDirectory, sourceDirectory, "dir");
          },
        }),
      /changed while it was being hashed/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
    rmSync(outsideDirectory, { recursive: true, force: true });
  }
});

test("stable descriptor reads reject real parent replacement with the same file inode", () => {
  const current = fixture();
  try {
    const relativePath = "packages/website/src/page.ts";
    const sourcePath = join(current.repositoryRoot, ...relativePath.split("/"));
    const sourceDirectory = join(current.websiteRoot, "src");
    const displacedDirectory = join(current.websiteRoot, "src-original");
    const replacementDirectory = join(current.websiteRoot, "src-replacement");
    mkdirSync(replacementDirectory);
    linkSync(sourcePath, join(replacementDirectory, "page.ts"));

    assert.throws(
      () =>
        readStableRegularFile(sourcePath, relativePath, "Build input", {
          rootDirectory: current.repositoryRoot,
          afterOpen() {
            renameSync(sourceDirectory, displacedDirectory);
            renameSync(replacementDirectory, sourceDirectory);
          },
        }),
      /changed while it was being hashed/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("receipt and BUILD_ID reads reject symbolic links", () => {
  const current = fixture();
  try {
    const options = { ...current, environment: {} };
    const receiptPath = join(
      current.websiteRoot,
      ".next",
      "loehrning-build-receipt.json",
    );
    const receiptCopy = join(current.repositoryRoot, "receipt-copy.json");
    recordBuildReceipt(options);
    writeFileSync(receiptCopy, readFileSync(receiptPath));
    rmSync(receiptPath);
    symlinkSync(receiptCopy, receiptPath);
    assert.throws(
      () => verifyBuildReceipt(options),
      /Build receipt must be a bounded regular file/,
    );

    recordBuildReceipt(options);
    const buildIdPath = join(current.websiteRoot, ".next", "BUILD_ID");
    const buildIdCopy = join(current.repositoryRoot, "BUILD_ID-copy");
    writeFileSync(buildIdCopy, readFileSync(buildIdPath));
    rmSync(buildIdPath);
    symlinkSync(buildIdCopy, buildIdPath);
    assert.throws(
      () => verifyBuildReceipt(options),
      /Next BUILD_ID must be a bounded regular file/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("escaping and platform-ambiguous build-input paths are rejected", () => {
  const current = fixture();
  try {
    for (const relativePath of [
      "../outside.ts",
      "packages\\website\\src\\page.ts",
    ]) {
      assert.throws(
        () =>
          computeBuildState({
            ...current,
            files: [relativePath],
            environment: {},
          }),
        /Unsafe path/,
      );
    }
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("the composite build records only a newly completed stable build", () => {
  const current = fixture();
  try {
    const buildIdPath = join(current.websiteRoot, ".next", "BUILD_ID");
    runBuildAndRecord({
      ...current,
      environment: {},
      command: process.execPath,
      commandArguments: [
        "-e",
        `require("node:fs").writeFileSync(${JSON.stringify(buildIdPath)}, "build-two\\n")`,
      ],
      stdio: "pipe",
    });
    assert.equal(
      verifyBuildReceipt({ ...current, environment: {} }).buildId,
      "build-two",
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("the default composite build cannot load unrecorded dotenv inputs", () => {
  const current = fixture();
  try {
    const sentinel = "LOEHRNING_BUILD_RECEIPT_DOTENV_SENTINEL";
    const buildIdPath = join(current.websiteRoot, ".next", "BUILD_ID");
    const nextEnvPath = createRequire(import.meta.url).resolve("@next/env");
    writeFileSync(
      join(current.websiteRoot, ".env.local"),
      `${sentinel}=must-not-reach-next\n`,
    );

    runBuildAndRecord({
      ...current,
      command: process.execPath,
      commandArguments: [
        "-e",
        [
          `const fs = require("node:fs");`,
          `const { loadEnvConfig } = require(${JSON.stringify(nextEnvPath)});`,
          `loadEnvConfig(${JSON.stringify(current.websiteRoot)}, false);`,
          `if (process.env.${sentinel}) process.exit(17);`,
          `fs.writeFileSync(${JSON.stringify(buildIdPath)}, "build-dotenv-safe\\n");`,
        ].join(""),
      ],
      stdio: "pipe",
    });

    assert.equal(verifyBuildReceipt(current).buildId, "build-dotenv-safe");
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("post-build artifact changes invalidate a receipt", () => {
  const current = fixture();
  try {
    const serverDirectory = join(current.websiteRoot, ".next", "server");
    const serverArtifact = join(serverDirectory, "output.js");
    mkdirSync(serverDirectory, { recursive: true });
    writeFileSync(serverArtifact, "export const output = 1;\n");
    const options = { ...current, environment: {} };
    recordBuildReceipt(options);
    writeFileSync(serverArtifact, "export const output = 2;\n");
    assert.throws(
      () => verifyBuildReceipt(options),
      /modified production build artifact/,
    );
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("receipt, runtime trace, and cache mutations stay outside artifact integrity", () => {
  const current = fixture();
  try {
    const options = { ...current, environment: {} };
    recordBuildReceipt(options);
    const cacheDirectory = join(current.websiteRoot, ".next", "cache");
    mkdirSync(cacheDirectory, { recursive: true });
    writeFileSync(join(cacheDirectory, "runtime-cache.bin"), "mutable\n");
    writeFileSync(
      join(current.websiteRoot, ".next", "trace"),
      "runtime trace\n",
    );
    assert.equal(verifyBuildReceipt(options).buildId, "build-one");
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("the composite build discards its receipt if an input changes mid-build", () => {
  const current = fixture();
  try {
    const sourcePath = join(current.websiteRoot, "src", "page.ts");
    const buildIdPath = join(current.websiteRoot, ".next", "BUILD_ID");
    const receiptPath = join(
      current.websiteRoot,
      ".next",
      "loehrning-build-receipt.json",
    );
    assert.throws(
      () =>
        runBuildAndRecord({
          ...current,
          environment: {},
          command: process.execPath,
          commandArguments: [
            "-e",
            [
              `const fs = require("node:fs");`,
              `fs.writeFileSync(${JSON.stringify(sourcePath)}, "changed during build\\n");`,
              `fs.writeFileSync(${JSON.stringify(buildIdPath)}, "build-three\\n");`,
            ].join(""),
          ],
          stdio: "pipe",
        }),
      /changed while Next was compiling/,
    );
    assert.equal(existsSync(receiptPath), false);
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});

test("the composite build rejects an input changed and restored mid-build", () => {
  const current = fixture();
  try {
    const sourcePath = join(current.websiteRoot, "src", "page.ts");
    const buildIdPath = join(current.websiteRoot, ".next", "BUILD_ID");
    const receiptPath = join(
      current.websiteRoot,
      ".next",
      "loehrning-build-receipt.json",
    );
    assert.throws(
      () =>
        runBuildAndRecord({
          ...current,
          environment: {},
          command: process.execPath,
          commandArguments: [
            "-e",
            [
              `const fs = require("node:fs");`,
              `fs.writeFileSync(${JSON.stringify(sourcePath)}, "temporary build input\\n");`,
              `fs.writeFileSync(${JSON.stringify(buildIdPath)}, "build-four\\n");`,
              `fs.rmSync(${JSON.stringify(sourcePath)});`,
              `fs.writeFileSync(${JSON.stringify(sourcePath)}, "export const page = 1;\\n");`,
            ].join(""),
          ],
          stdio: "pipe",
        }),
      /changed while Next was compiling/,
    );
    assert.equal(existsSync(receiptPath), false);
  } finally {
    rmSync(current.repositoryRoot, { recursive: true, force: true });
  }
});
