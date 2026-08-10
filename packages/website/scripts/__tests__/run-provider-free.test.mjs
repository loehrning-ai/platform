#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  APPLICATION_PROVIDER_ENVIRONMENT_KEYS,
  minimalVerificationEnvironment,
  PROVIDER_FREE_APPLICATION_ENVIRONMENT,
  providerFreeVerificationEnvironment,
  SYSTEM_ENVIRONMENT_KEYS,
  VERIFICATION_ENVIRONMENT_KEYS,
} from "../../../../scripts/environment-policy.mjs";
import { readStableRegularFile } from "../build-freshness.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const websiteRoot = join(here, "..", "..");
const wrapper = join(here, "..", "run-provider-free.mjs");
const probe = [
  "const keys = [",
  "'ANTHROPIC_API_KEY',",
  "'NEXT_PUBLIC_SENTRY_DSN',",
  "'SUPABASE_SERVICE_ROLE_KEY',",
  "'SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT',",
  "'RATE_LIMIT_HMAC_SECRET',",
  "'NEXT_PUBLIC_SUPABASE_URL',",
  "'NEXT_PUBLIC_TURNSTILE_SITE_KEY',",
  "'TURNSTILE_CONFIGURATION_CONFIRMED_AT',",
  "'TURBO_TOKEN',",
  "'VERCEL_OIDC_TOKEN',",
  "'E2E_AUTH_LIVE',",
  "'LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME',",
  "'LOEHRNING_LOCAL_VERIFICATION_ORIGIN',",
  "'LOEHRNING_VALIDATION_PROFILE',",
  "'NEXT_TELEMETRY_DISABLED',",
  "'SIMPLIFIED_SUPABASE_TEST_EMAIL',",
  "'SIMPLIFIED_SUPABASE_TEST_PASSWORD',",
  "'SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY',",
  "'SIMPLIFIED_SUPABASE_TEST_URL',",
  "'SIMPLIFIED_SUPABASE_PRODUCTION_URL',",
  "'SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF',",
  "'GEMINI_API_KEY',",
  "'DATABASE_URL',",
  "'STRIPE_SECRET_KEY',",
  "'SSH_AUTH_SOCK',",
  "'PLAYWRIGHT_CAPTURE_VISUALS',",
  "'PROVIDER_FREE_BENIGN_MARKER'",
  "];",
  "process.stdout.write(JSON.stringify(Object.fromEntries(keys.map((key) => [key, process.env[key]]))));",
].join("");

const result = spawnSync(
  process.execPath,
  [wrapper, process.execPath, "-e", probe],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: "sentinel-anthropic",
      NEXT_PUBLIC_SENTRY_DSN: "sentinel-sentry",
      SUPABASE_SERVICE_ROLE_KEY: "sentinel-supabase",
      SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT: "sentinel-google-oauth-date",
      RATE_LIMIT_HMAC_SECRET: `rlh1_${"a".repeat(64)}`,
      NEXT_PUBLIC_SUPABASE_URL: "https://sentinel.invalid",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "sentinel-turnstile",
      TURNSTILE_CONFIGURATION_CONFIRMED_AT: "sentinel-turnstile-date",
      TURBO_TOKEN: "sentinel-turbo",
      VERCEL_OIDC_TOKEN: "sentinel-oidc",
      E2E_AUTH_LIVE: "1",
      LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME: "sentinel-legacy-runtime",
      LOEHRNING_LOCAL_VERIFICATION_ORIGIN: "http://localhost:9999",
      LOEHRNING_VALIDATION_PROFILE: "live-auth-e2e",
      SIMPLIFIED_SUPABASE_TEST_EMAIL: "sentinel@example.test",
      SIMPLIFIED_SUPABASE_TEST_PASSWORD: "sentinel-password",
      SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY: "sentinel-test-key",
      SIMPLIFIED_SUPABASE_TEST_URL: "https://sentinel.supabase.co",
      SIMPLIFIED_SUPABASE_PRODUCTION_URL:
        "https://sentinel-production.supabase.co",
      SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF: "sentinel",
      GEMINI_API_KEY: "sentinel-gemini",
      DATABASE_URL: "postgres://sentinel.invalid/db",
      STRIPE_SECRET_KEY: "sentinel-stripe",
      SSH_AUTH_SOCK: "/tmp/sentinel-agent.sock",
      PLAYWRIGHT_CAPTURE_VISUALS: "arbitrary-untrusted-value",
      PROVIDER_FREE_BENIGN_MARKER: "preserved",
    },
  },
);

assert.equal(result.status, 0, result.stderr);
const environment = JSON.parse(result.stdout);
for (const key of [
  "ANTHROPIC_API_KEY",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT",
  "RATE_LIMIT_HMAC_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_CONFIGURATION_CONFIRMED_AT",
  "E2E_AUTH_LIVE",
  "LOEHRNING_VALIDATION_PROFILE",
  "SIMPLIFIED_SUPABASE_TEST_EMAIL",
  "SIMPLIFIED_SUPABASE_TEST_PASSWORD",
  "SIMPLIFIED_SUPABASE_TEST_PUBLISHABLE_KEY",
  "SIMPLIFIED_SUPABASE_TEST_URL",
  "SIMPLIFIED_SUPABASE_PRODUCTION_URL",
  "SIMPLIFIED_SUPABASE_TEST_WRITE_PROJECT_REF",
]) {
  assert.equal(
    environment[key],
    "",
    `${key} leaked through provider-free wrapper`,
  );
}
for (const key of [
  "TURBO_TOKEN",
  "VERCEL_OIDC_TOKEN",
  "GEMINI_API_KEY",
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "SSH_AUTH_SOCK",
  "PLAYWRIGHT_CAPTURE_VISUALS",
  "PROVIDER_FREE_BENIGN_MARKER",
]) {
  assert.equal(
    environment[key],
    undefined,
    `${key} must not cross the provider-free child-process allowlist`,
  );
}
assert.equal(
  environment.NEXT_TELEMETRY_DISABLED,
  "1",
  "provider-free verification must disable Next.js CLI telemetry",
);
assert.equal(
  environment.LOEHRNING_LOCAL_PROVIDER_FREE_RUNTIME,
  "",
  "generic provider-free commands must clear the legacy redirect capability",
);
assert.equal(
  environment.LOEHRNING_LOCAL_VERIFICATION_ORIGIN,
  "",
  "generic provider-free commands must not receive redirect authority",
);

const receiptBoundE2eEnvironment = providerFreeVerificationEnvironment({
  ...process.env,
  E2E_PORT: "3399",
  E2E_SERVER_MODE: "production",
});
assert.equal(
  receiptBoundE2eEnvironment.LOEHRNING_LOCAL_VERIFICATION_ORIGIN,
  "http://localhost:3399",
  "receipt-bound production E2E must authorize only its exact loopback origin",
);
for (const E2E_PORT of ["0", "65536", "invalid", "3399/path"]) {
  assert.equal(
    providerFreeVerificationEnvironment({
      ...process.env,
      E2E_PORT,
      E2E_SERVER_MODE: "production",
    }).LOEHRNING_LOCAL_VERIFICATION_ORIGIN,
    "",
    `invalid E2E_PORT ${E2E_PORT} must not create redirect authority`,
  );
}
const reusableProviderFreeEnvironment = providerFreeVerificationEnvironment(
  Object.fromEntries(
    APPLICATION_PROVIDER_ENVIRONMENT_KEYS.map((name) => [name, "sentinel"]),
  ),
);
for (const name of APPLICATION_PROVIDER_ENVIRONMENT_KEYS) {
  assert.equal(
    reusableProviderFreeEnvironment[name],
    PROVIDER_FREE_APPLICATION_ENVIRONMENT[name],
    `${name} must be cleared or fixed by the reusable provider-free policy`,
  );
}

const visualCaptureResult = spawnSync(
  process.execPath,
  [wrapper, process.execPath, "-e", probe],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      PLAYWRIGHT_CAPTURE_VISUALS: "1",
    },
  },
);
assert.equal(visualCaptureResult.status, 0, visualCaptureResult.stderr);
assert.equal(
  JSON.parse(visualCaptureResult.stdout).PLAYWRIGHT_CAPTURE_VISUALS,
  "1",
  "the explicit visual-capture opt-in must cross the minimal boundary",
);

const dotenvDirectory = mkdtempSync(
  join(tmpdir(), "loehrning-provider-free-dotenv-"),
);
try {
  const sentinelName = "LOEHRNING_DOTENV_SENTINEL";
  writeFileSync(
    join(dotenvDirectory, ".env.local"),
    `${sentinelName}=must-not-load\n`,
    { encoding: "utf8", mode: 0o600 },
  );

  const require = createRequire(import.meta.url);
  const nextEnvPath = require.resolve("@next/env");
  const nodeDotenvProbe = [
    `const { loadEnvConfig } = require(${JSON.stringify(nextEnvPath)});`,
    `const result = loadEnvConfig(${JSON.stringify(dotenvDirectory)}, false);`,
    `process.stdout.write(JSON.stringify({value:process.env.${sentinelName},files:result.loadedEnvFiles.map((entry)=>entry.path)}));`,
  ].join("");
  const nodeDotenvResult = spawnSync(
    process.execPath,
    [wrapper, process.execPath, "-e", nodeDotenvProbe],
    { encoding: "utf8" },
  );
  assert.equal(nodeDotenvResult.status, 0, nodeDotenvResult.stderr);
  assert.deepEqual(JSON.parse(nodeDotenvResult.stdout), {
    files: [],
  });

  const bunDotenvResult = spawnSync(
    process.execPath,
    [
      wrapper,
      "bun",
      "-e",
      [
        `const { loadEnvConfig } = require(${JSON.stringify(nextEnvPath)});`,
        `const result = loadEnvConfig(${JSON.stringify(dotenvDirectory)}, false);`,
        `process.stdout.write(JSON.stringify({value:process.env.${sentinelName},files:result.loadedEnvFiles.map((entry)=>entry.path)}));`,
      ].join(""),
    ],
    { cwd: dotenvDirectory, encoding: "utf8" },
  );
  assert.equal(bunDotenvResult.status, 0, bunDotenvResult.stderr);
  assert.deepEqual(JSON.parse(bunDotenvResult.stdout), { files: [] });
} finally {
  rmSync(dotenvDirectory, { recursive: true, force: true });
}

const playwrightConfigPath = join(websiteRoot, "playwright.config.ts");
const providerNames = APPLICATION_PROVIDER_ENVIRONMENT_KEYS.filter(
  (name) => name !== "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
);
const configProbeSource = [
  `import config from ${JSON.stringify(pathToFileURL(playwrightConfigPath).href)};`,
  `const webServer = Array.isArray(config.webServer) ? config.webServer[0] : config.webServer;`,
  `const env = webServer?.env ?? {};`,
  `const providerNames = ${JSON.stringify(providerNames)};`,
  `process.stdout.write(JSON.stringify({`,
  `bunOptions: env.BUN_OPTIONS,`,
  `nodeOptions: env.NODE_OPTIONS,`,
  `nonBlankProviders: providerNames.filter((name) => env[name] !== ""),`,
  `localOrigin: env.LOEHRNING_LOCAL_VERIFICATION_ORIGIN,`,
  `forbidOnly: config.forbidOnly,`,
  `failOnFlakyTests: config.failOnFlakyTests,`,
  `globalTimeout: config.globalTimeout`,
  `}));`,
].join("");
const configProbeEnvironment = {
  ...process.env,
  E2E_PORT: "3399",
};
delete configProbeEnvironment.CI;
delete configProbeEnvironment.GITHUB_ACTIONS;
const configProbeResult = spawnSync("bun", ["--eval", configProbeSource], {
  cwd: websiteRoot,
  encoding: "utf8",
  env: minimalVerificationEnvironment(configProbeEnvironment),
});
assert.equal(configProbeResult.status, 0, configProbeResult.stderr);
const serverEnvironmentProbe = JSON.parse(configProbeResult.stdout);
assert.match(serverEnvironmentProbe.bunOptions, /--no-env-file/);
assert.match(serverEnvironmentProbe.bunOptions, /--preload=/);
assert.match(serverEnvironmentProbe.nodeOptions, /--require=/);
assert.deepEqual(
  serverEnvironmentProbe.nonBlankProviders,
  [],
  "the Playwright app server must explicitly blank every non-public provider variable",
);
assert.equal(serverEnvironmentProbe.localOrigin, "http://localhost:3399");
assert.equal(
  serverEnvironmentProbe.forbidOnly,
  true,
  "every Playwright gate must reject focused tests",
);
assert.equal(
  serverEnvironmentProbe.failOnFlakyTests,
  true,
  "every Playwright gate must reject tests that pass only on retry",
);

const ciConfigProbeResult = spawnSync("bun", ["--eval", configProbeSource], {
  cwd: websiteRoot,
  encoding: "utf8",
  env: minimalVerificationEnvironment({
    ...process.env,
    CI: "1",
    E2E_GLOBAL_TIMEOUT: "60000",
    E2E_PORT: "3398",
  }),
});
assert.equal(ciConfigProbeResult.status, 0, ciConfigProbeResult.stderr);
assert.equal(
  JSON.parse(ciConfigProbeResult.stdout).globalTimeout,
  60_000,
  "CI shards must accept the runner's final one-minute remaining budget",
);

const serverDotenvDirectory = mkdtempSync(
  join(tmpdir(), "loehrning-playwright-server-dotenv-"),
);
try {
  writeFileSync(
    join(serverDotenvDirectory, ".env.local"),
    "LOEHRNING_PLAYWRIGHT_SERVER_DOTENV_SENTINEL=must-not-load\n",
    { encoding: "utf8", mode: 0o600 },
  );
  const serverDotenvResult = spawnSync(
    "bun",
    [
      "--print",
      "Boolean(process.env.LOEHRNING_PLAYWRIGHT_SERVER_DOTENV_SENTINEL)",
    ],
    {
      cwd: serverDotenvDirectory,
      encoding: "utf8",
      env: {
        ...minimalVerificationEnvironment(process.env),
        BUN_OPTIONS: serverEnvironmentProbe.bunOptions,
      },
    },
  );
  assert.equal(serverDotenvResult.status, 0, serverDotenvResult.stderr);
  assert.equal(serverDotenvResult.stdout.trim(), "false");
} finally {
  rmSync(serverDotenvDirectory, { recursive: true, force: true });
}

const packageJson = JSON.parse(
  readFileSync(join(here, "..", "..", "package.json"), "utf8"),
);
assert.match(
  packageJson.scripts.verify,
  /^node scripts\/run-provider-free\.mjs bun run verify:internal$/,
  "the complete workspace verification command must cross the minimal environment boundary",
);
assert.ok(packageJson.scripts["verify:internal"]);
assert.equal(
  packageJson.scripts.typegen,
  "node scripts/run-provider-free.mjs env __NEXT_NODE_NATIVE_TS_LOADER_ENABLED=true bun run next typegen --webpack",
  "Next route type generation must use the provider-free environment and native TypeScript config loader",
);
assert.equal(packageJson.scripts.pretypecheck, "bun run typegen");
assert.equal(packageJson.scripts["pretypecheck:test"], "bun run typegen");
for (const scriptName of ["test:e2e", "test:e2e:built", "test:e2e:dev"]) {
  assert.match(
    packageJson.scripts[scriptName],
    /node scripts\/run-provider-free\.mjs/,
    `${scriptName} must not expose generic E2E runs to configured providers or live-auth credentials`,
  );
}

const rootPackageJson = JSON.parse(
  readFileSync(join(here, "..", "..", "..", "..", "package.json"), "utf8"),
);
assert.equal(
  rootPackageJson.scripts["verify:release"],
  "node scripts/verify-release.mjs",
);
assert.equal(
  rootPackageJson.scripts.verify,
  "node packages/website/scripts/run-provider-free.mjs bun run verify:internal",
);
assert.ok(rootPackageJson.scripts["verify:internal"]);
const releaseRunner = readFileSync(
  join(here, "..", "..", "..", "..", "scripts", "verify-release.mjs"),
  "utf8",
);
assert.match(releaseRunner, /RELEASE_VALIDATION: "1"/);
assert.match(releaseRunner, /NEXT_TELEMETRY_DISABLED: "1"/);
assert.ok(
  releaseRunner.indexOf('"provider environment preflight"') <
    releaseRunner.indexOf('"deterministic repository verification"'),
  "release verification must validate the supplied provider environment before any provider-free wrapper can clear it",
);
assert.ok(
  releaseRunner.indexOf('"deterministic repository verification"') <
    releaseRunner.indexOf('"full Lighthouse performance gate"') &&
    releaseRunner.indexOf('"full Lighthouse performance gate"') <
      releaseRunner.indexOf('"public browser gate"'),
  "release verification must measure the complete verified build before browser journey gates",
);
assert.ok(
  releaseRunner.indexOf('"launch browser gate"') <
    releaseRunner.indexOf('"configured provider build"'),
  "release verification must finish with the configured provider build",
);
assert.ok(
  releaseRunner.includes('"provider-free authentication scaffold"'),
  "release verification must exercise the credential-free auth boundary",
);
for (const name of ["SENTRY_AUTH_TOKEN", "SENTRY_ORG", "SENTRY_PROJECT"]) {
  assert.match(
    releaseRunner,
    new RegExp(`"${name}"`),
    `${name} must be removed from the configured local build`,
  );
}
assert.match(
  packageJson.scripts["test:e2e:release:built"],
  /node scripts\/run-provider-free\.mjs node scripts\/run-built-gate\.mjs/,
  "the launch browser gate must run its server under the provider-free runtime",
);
const e2eSuiteRunner = readFileSync(
  join(here, "..", "run-e2e-suite.mjs"),
  "utf8",
);
assert.match(
  e2eSuiteRunner,
  /"--grep",\s*"@launch-gate",\s*"--project=chromium",\s*"--retries=0",\s*"--trace=retain-on-failure"/,
  "the launch browser gate must select tagged tests across the complete suite",
);
assert.doesNotMatch(
  e2eSuiteRunner,
  /launch-gate\.spec\.ts/,
  "the launch browser gate may not hardcode one test file",
);
for (const scriptName of [
  "test:server-log-privacy:built",
  "test:e2e:built",
  "test:e2e:public:built",
  "test:e2e:auth-scaffold:built",
  "test:e2e:release:built",
]) {
  assert.match(
    packageJson.scripts[scriptName],
    /node scripts\/run-built-gate\.mjs/,
    `${scriptName} must verify the provider-free build before and after the long-running gate`,
  );
}
const builtGateRunner = readFileSync(
  join(here, "..", "run-built-gate.mjs"),
  "utf8",
);
assert.match(
  builtGateRunner,
  /preflightReceipt\s*=\s*verify\(\);[\s\S]*spawn\(/,
);
assert.match(
  builtGateRunner,
  /spawn\([\s\S]*postflightReceipt\s*=\s*verify\(\);[\s\S]*isDeepStrictEqual\(preflightReceipt,\s*postflightReceipt\)/,
);
assert.match(
  packageJson.scripts["test:e2e:public:built"],
  /E2E_GLOBAL_TIMEOUT=\$\{E2E_GLOBAL_TIMEOUT:-4200000\}/,
  "the complete local public matrix must inherit an explicit timeout or use the same 70-minute bound as CI",
);
for (const scriptName of [
  "test:e2e:auth-scaffold:built",
  "test:e2e:release:built",
]) {
  assert.match(
    packageJson.scripts[scriptName],
    /E2E_GLOBAL_TIMEOUT=\$\{E2E_GLOBAL_TIMEOUT:-600000\}/,
    `${scriptName} must use the bounded ten-minute focused-gate budget`,
  );
}
assert.equal(
  packageJson.scripts["test:e2e:authenticated-live:built"],
  "node scripts/run-live-auth-e2e.mjs --built",
  "the live-auth built gate must keep receipt pinning and the journey in one process",
);
const liveAuthRunner = readFileSync(
  join(here, "..", "run-live-auth-e2e.mjs"),
  "utf8",
);
assert.match(liveAuthRunner, /preflightReceipt = verifyPinnedBuild\(\)/);
assert.match(liveAuthRunner, /postflightReceipt = verifyPinnedBuild\(\)/);
assert.match(
  liveAuthRunner,
  /isDeepStrictEqual\(preflightReceipt, postflightReceipt\)/,
);
assert.match(
  releaseRunner,
  /verifyBuildReceipt/,
  "release verification must validate both provider-free and configured receipts",
);
assert.match(
  releaseRunner,
  /providerFreeVerificationEnvironment\(process\.env\)/,
  "release verification must validate the provider-free receipt under the exact build environment",
);
assert.match(
  releaseRunner,
  /isDeepStrictEqual\(receipt, providerFreeReceipt\)/,
  "release verification must pin one complete provider-free receipt across browser stages",
);
assert.match(
  releaseRunner,
  /receipt\.inputDigest !== providerFreeReceipt\.inputDigest/,
  "the configured release build must retain the provider-free source set",
);
assert.match(
  releaseRunner,
  /isDeepStrictEqual\(receipt\.toolchain, providerFreeReceipt\.toolchain\)/,
  "the configured release build must retain the provider-free toolchain",
);
assert.equal(
  rootPackageJson.scripts["lighthouse:local"],
  "node packages/website/scripts/run-provider-free.mjs bun run build && bun run lighthouse:local:built",
);
assert.equal(
  rootPackageJson.scripts["lighthouse:local:built"],
  "node packages/website/scripts/run-provider-free.mjs bun run lighthouse:local:built:internal",
);
assert.equal(
  rootPackageJson.scripts["lighthouse:local:built:internal"],
  "node packages/website/scripts/run-built-gate.mjs lhci autorun --config=lighthouserc.json",
);
assert.equal(
  rootPackageJson.scripts["lighthouse:release:built"],
  "node packages/website/scripts/run-provider-free.mjs node packages/website/scripts/run-built-gate.mjs lhci autorun --config=lighthouserc.json",
);
assert.match(releaseRunner, /"run", "lighthouse:release:built"/);

const launchListEnvironment = {
  ...process.env,
  RELEASE_VALIDATION: "1",
  RUN_LAUNCH_GATE: "1",
};
delete launchListEnvironment.CI;
delete launchListEnvironment.GITHUB_ACTIONS;
const launchList = spawnSync(
  "bun",
  [
    "run",
    "playwright",
    "test",
    "--grep",
    "@launch-gate",
    "--project=chromium",
    "--list",
  ],
  {
    cwd: websiteRoot,
    encoding: "utf8",
    env: minimalVerificationEnvironment(launchListEnvironment),
  },
);
assert.equal(launchList.status, 0, launchList.stderr);
assert.match(
  launchList.stdout,
  /Total: 3 tests in 1 file/,
  "the release selector must discover the complete non-empty launch gate",
);
const ciWorkflow = readFileSync(
  join(here, "..", "..", "..", "..", ".github", "workflows", "ci.yml"),
  "utf8",
);
// The public browser gate runs as a sharded matrix, so each shard owns a
// distinct artifact directory keyed by project and shard. That keeps the
// original guarantee — no gate can overwrite or be mistaken for another's
// output — and additionally makes every blob report independently mergeable.
assert.match(
  ciWorkflow,
  /PLAYWRIGHT_BLOB_OUTPUT_DIR: blob-report\/\$\{\{ matrix\.project \}\}-\$\{\{ matrix\.shard \}\}/,
);
assert.match(
  ciWorkflow,
  /PLAYWRIGHT_BLOB_OUTPUT_DIR: blob-report\/auth-scaffold/,
);
assert.match(
  ciWorkflow,
  /PLAYWRIGHT_OUTPUT_DIR: test-results\/\$\{\{ matrix\.project \}\}-\$\{\{ matrix\.shard \}\}/,
);
assert.match(ciWorkflow, /PLAYWRIGHT_OUTPUT_DIR: test-results\/auth-scaffold/);
const serverLogPrivacyRunner = readFileSync(
  join(here, "..", "verify-server-log-privacy.mjs"),
  "utf8",
);
assert.match(
  serverLogPrivacyRunner,
  /minimalVerificationEnvironment\(process\.env\)/,
  "the production log probe must independently minimize its child environment",
);
assert.match(
  serverLogPrivacyRunner,
  /NODE_OPTIONS: `\$\{env\.NODE_OPTIONS \?\? ""\} --require=\$\{preload\}`/,
  "the production log probe must compose its preload with the dotenv guard",
);
assert.match(
  serverLogPrivacyRunner,
  /"start",\s*"--experimental-next-config-strip-types"/,
  "the production log probe must start Next with the same TypeScript-config mode as the certified build",
);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const candidate = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(candidate);
    return entry.isFile() && /\.(?:c|m)?(?:j|t)sx?$/.test(entry.name)
      ? [candidate]
      : [];
  });
}

function readStableSourceFile(file, options = {}) {
  const rootDirectory = options.rootDirectory ?? websiteRoot;
  const relativeFile = relative(rootDirectory, file).split(sep).join("/");
  return readStableRegularFile(file, relativeFile, "Application source", {
    rootDirectory,
    afterOpen: options.afterOpen,
    invalidMessage: `${file} must be a regular source file`,
    changedMessage: `${file} changed while its environment references were inspected`,
  }).toString("utf8");
}

const sourceInspectionRoot = mkdtempSync(
  join(tmpdir(), "loehrning-provider-source-inspection-"),
);
const sourceInspectionOutside = mkdtempSync(
  join(tmpdir(), "loehrning-provider-source-outside-"),
);
try {
  const sourceDirectory = join(sourceInspectionRoot, "src");
  const displacedDirectory = join(sourceInspectionRoot, "src-original");
  const sourcePath = join(sourceDirectory, "source.ts");
  mkdirSync(sourceDirectory);
  writeFileSync(sourcePath, "export const source = true;\n");
  writeFileSync(
    join(sourceInspectionOutside, "source.ts"),
    "export const replacement = true;\n",
  );
  assert.throws(
    () =>
      readStableSourceFile(sourcePath, {
        rootDirectory: sourceInspectionRoot,
        afterOpen() {
          renameSync(sourceDirectory, displacedDirectory);
          symlinkSync(sourceInspectionOutside, sourceDirectory, "dir");
        },
      }),
    /changed while its environment references were inspected/,
  );
} finally {
  rmSync(sourceInspectionRoot, { recursive: true, force: true });
  rmSync(sourceInspectionOutside, { recursive: true, force: true });
}

const applicationEnvironmentNames = new Set();
for (const file of [
  ...sourceFiles(join(websiteRoot, "src")),
  join(websiteRoot, "next.config.ts"),
  join(websiteRoot, "sentry.edge.config.ts"),
  join(websiteRoot, "sentry.server.config.ts"),
]) {
  const source = readStableSourceFile(file);
  for (const match of source.matchAll(
    /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[["']([A-Z][A-Z0-9_]*)["']\])/g,
  )) {
    applicationEnvironmentNames.add(match[1] ?? match[2]);
  }
}
const explicitlyClassifiedApplicationEnvironment = new Set([
  ...APPLICATION_PROVIDER_ENVIRONMENT_KEYS,
  ...SYSTEM_ENVIRONMENT_KEYS,
  ...VERIFICATION_ENVIRONMENT_KEYS,
  "ANALYZE",
  "NEXT_RUNTIME",
  "NODE_ENV",
]);
assert.deepEqual(
  [...applicationEnvironmentNames]
    .filter((name) => !explicitlyClassifiedApplicationEnvironment.has(name))
    .sort(),
  [],
  "every application-owned process.env key must be explicitly classified by the child-process policy",
);
console.log("Provider-free environment isolation passed.");
