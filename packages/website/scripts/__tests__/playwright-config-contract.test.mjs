import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { minimalVerificationEnvironment } from "../../../../scripts/environment-policy.mjs";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const packageRoot = fileURLToPath(new URL("../..", import.meta.url));

function listWith(environment) {
  return spawnSync(
    process.execPath,
    [playwrightCli, "test", "--list", "--project=chromium"],
    {
      cwd: packageRoot,
      encoding: "utf8",
      env: {
        ...minimalVerificationEnvironment(process.env),
        ...environment,
      },
      maxBuffer: 32 * 1024 * 1024,
    },
  );
}

test("production verification rejects reuse of an arbitrary existing server", () => {
  const result = listWith({
    E2E_REUSE_EXISTING_SERVER: "1",
    E2E_SERVER_MODE: "production",
  });
  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Production and release Playwright runs may not reuse an existing server/,
  );
});

test("explicit development runs may reuse their deliberately started server", () => {
  const result = listWith({
    E2E_REUSE_EXISTING_SERVER: "1",
    E2E_SERVER_MODE: "development",
  });
  assert.equal(result.status, 0, result.stderr);
});

test("CI gives public and auth browser gates independent bounded budgets", () => {
  const workflow = readFileSync(
    new URL("../../../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /timeout-minutes:\s*110\b/);
  assert.match(
    workflow,
    /Public browser gate[\s\S]*?E2E_GLOBAL_TIMEOUT:\s*4200000\b/,
  );
  assert.match(
    workflow,
    /Provider-free auth scaffold gate[\s\S]*?E2E_GLOBAL_TIMEOUT:\s*600000\b/,
  );
});
