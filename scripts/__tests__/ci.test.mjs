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
  smokeSteps,
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

test("the baseline selects its capability spec and retains broad coverage outside the fast path", () => {
  const files = readSmokeFiles();
  assert.deepEqual(files, ["tests/e2e/baseline-smoke.spec.ts"]);
  assert.equal(new Set(files).size, files.length);
  for (const file of files) {
    assert.ok(existsSync(path.join(ROOT, "packages/website", file)), file);
  }
  for (const name of ["route-matrix", "a11y", "seo-meta", "edge-states", "legal", "workshops"]) {
    assert.ok(existsSync(path.join(ROOT, "packages/website/tests/e2e", `${name}.spec.ts`)), name);
  }
});

test("the baseline is serialized, has zero retries and enforces capability coverage", () => {
  const args = smokeArguments(["tests/e2e/x.spec.ts"], { ci: false });
  assert.deepEqual(args, [
    "test",
    "--project=chromium",
    "--workers=1",
    "--retries=0",
    "--fail-on-flaky-tests",
    "--reporter=line,./tests/e2e/reporters/smoke-contract.mjs",
    "tests/e2e/x.spec.ts",
  ]);
});

test("CI keeps annotations and blobs; mobile batches stay bounded and strict", () => {
  const args = smokeArguments(["tests/e2e/x.spec.ts"], { ci: true, project: "mobile-webkit", shard: "2/5" });
  assert.ok(args.includes("--project=mobile-webkit"));
  assert.ok(args.includes("--shard=2/5"));
  assert.ok(args.includes("--reporter=github,blob,./tests/e2e/reporters/smoke-contract.mjs"));
  assert.throws(() => smokeArguments([], { project: "firefox" }), /Unsupported/);
  for (const text of ["", "../../outside.spec.ts", "x.spec.ts\nx.spec.ts", "x.spec.ts --grep-invert smoke"]) {
    assert.throws(() => parseSmokeList(text), /unique, bare/);
  }
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
    E2E_GLOBAL_TIMEOUT: "180000",
  });
  assert.equal(browserEnvironment({ E2E_PORT: "3311" }).E2E_PORT, "3311");
});

test("the browser group builds exactly once", () => {
  const steps = GROUPS.browser().flat();
  const builds = steps.filter((step) => step.args.includes("verify:build"));
  assert.equal(builds.length, 1);
  assert.equal(steps[0], builds[0]);
  const mobile = steps.filter((step) => step.args.includes("--project=mobile-webkit"));
  assert.equal(mobile.length, 5);
  assert.equal(new Set(mobile.map((step) => step.env.PLAYWRIGHT_OUTPUT_DIR)).size, 5);
  assert.ok(mobile.every((step) => step.args.includes("--retries=0")));
  assert.deepEqual(steps.slice(2), smokeSteps());
  assert.deepEqual(GROUPS["mobile-smoke"]().flat(), smokeSteps().slice(1));
  const baseline = smokeSteps({ ci: false });
  assert.equal(baseline.length, 6);
  assert.ok(baseline[0].args.includes("--project=chromium"));
  assert.ok(baseline.every((step) => step.args.includes("--reporter=line,./tests/e2e/reporters/smoke-contract.mjs")));
});

test("daily Extended keeps the full public suite and reuses the complete strict WebKit baseline", () => {
  const workflow = readFileSync(path.join(ROOT, ".github/workflows/nightly.yml"), "utf8");
  assert.match(workflow, /cron: "17 4 \* \* \*"/);
  assert.match(workflow, /--project=chromium[\s\S]*--shard=\$\{\{ matrix\.shard \}\}[\s\S]*--retries=0[\s\S]*--fail-on-flaky-tests/);
  assert.doesNotMatch(workflow, /--grep-invert|@quarantine|--retries=[1-9]/);
  assert.match(workflow, /run-provider-free\.mjs node scripts\/ci\.mjs mobile-smoke/);
  assert.match(workflow, /test:e2e:konto-dom-mocked/);
  assert.match(workflow, /bun run ci:hygiene/);
});
