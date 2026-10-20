import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  GROUPS,
  ROOT,
  browserEnvironment,
  parseSmokeList,
  readSmokeFiles,
  smokeArguments,
} from "../ci.mjs";

const manifest = (directory) =>
  JSON.parse(readFileSync(path.join(ROOT, directory, "package.json"), "utf8"));
const rootScripts = manifest(".").scripts;
const websiteScripts = manifest("packages/website").scripts;
// Binaries a step may call directly instead of through a package script.
const DIRECT_BINARIES = new Set(["tsc"]);

test("parseSmokeList keeps one spec per line and prefixes the e2e directory", () => {
  assert.deepEqual(parseSmokeList("a.spec.ts\n\n  # note\nb.spec.ts \n"), [
    "tests/e2e/a.spec.ts",
    "tests/e2e/b.spec.ts",
  ]);
});

test("every smoke spec exists, once, and none is a known flaky or brittle spec", () => {
  const files = readSmokeFiles();
  assert.ok(files.length > 0);
  assert.equal(new Set(files).size, files.length);
  for (const file of files) {
    assert.ok(existsSync(path.join(ROOT, "packages/website", file)), file);
  }
  for (const excluded of ["workshops.spec.ts", "learning-density", "site-header-logo-mark", "visual-regression"]) {
    assert.ok(!files.some((file) => file.includes(excluded)), excluded);
  }
});

test("the smoke run is Chromium desktop and phone with one retry", () => {
  const args = smokeArguments(["tests/e2e/x.spec.ts"]);
  assert.deepEqual(args, [
    "test",
    "--project=chromium",
    "--project=mobile-chromium",
    "--workers=2",
    "--retries=1",
    "tests/e2e/x.spec.ts",
  ]);
});

test("every package script a CI step runs exists", () => {
  for (const [group, build] of Object.entries(GROUPS)) {
    for (const wave of build()) {
      for (const step of wave) {
        if (!step.command) continue;
        assert.equal(step.command, "bun", `${group}: ${step.name}`);
        const [run, first, second, third] = step.args;
        assert.equal(run, "run", `${group}: ${step.name}`);
        const [scripts, name] =
          first === "--cwd" && second === "packages/website"
            ? [websiteScripts, third]
            : [rootScripts, first];
        assert.ok(
          name in scripts || DIRECT_BINARIES.has(name),
          `${group}: ${step.name} runs a missing script "${name}"`,
        );
      }
    }
  }
});

test("the root ci scripts all run under the environment scrubber", () => {
  for (const name of ["ci", "ci:static", "ci:unit", "ci:browser", "ci:hygiene"]) {
    assert.match(
      rootScripts[name],
      /^node packages\/website\/scripts\/run-provider-free\.mjs node scripts\/ci\.mjs (all|static|unit|browser|hygiene)$/,
      name,
    );
  }
  assert.equal(rootScripts.verify, "bun run ci");
});

test("the browser steps share one build and serve environment", () => {
  assert.deepEqual(browserEnvironment({}), {
    E2E_SERVER_MODE: "production",
    E2E_PORT: "3000",
    E2E_GLOBAL_TIMEOUT: "900000",
  });
  assert.equal(browserEnvironment({ E2E_PORT: "3311" }).E2E_PORT, "3311");
});

test("the browser group builds exactly once", () => {
  const steps = GROUPS.browser().flat();
  const builds = steps.filter((step) => step.args.includes("verify:build"));
  assert.equal(builds.length, 1);
  assert.equal(steps[0], builds[0]);
});
