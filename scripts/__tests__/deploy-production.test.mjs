import assert from "node:assert/strict";
import test from "node:test";
import {
  deploymentRequestBody,
  evaluateCheckRuns,
  findLiveDeploymentForSha,
  parseArguments,
  readLinkedProject,
} from "../deploy-production.mjs";

const SHA = "a".repeat(40);
const run = (name, status = "completed", conclusion = "success", head_sha = SHA) => ({
  name,
  status,
  conclusion,
  head_sha,
});

test("parseArguments defaults to a dry run of the head of main", () => {
  const options = parseArguments([]);
  assert.equal(options.yes, false);
  assert.equal(options.wait, false);
  assert.equal(options.sha, null);
  assert.equal(options.smoke, true);
});

test("parseArguments accepts the documented flags", () => {
  const options = parseArguments([
    "--sha",
    SHA,
    "--wait",
    "--yes",
    "--no-smoke",
    "--deploy-timeout-min",
    "20",
    "--base-url",
    "https://example.test/",
  ]);
  assert.equal(options.sha, SHA);
  assert.equal(options.wait && options.yes, true);
  assert.equal(options.smoke, false);
  assert.equal(options.deployTimeoutMin, 20);
  assert.equal(options.baseUrl, "https://example.test");
});

test("parseArguments requires a real reason for the CI-outage override", () => {
  assert.equal(parseArguments([]).overrideChecks, null);
  assert.equal(
    parseArguments(["--override-checks", "GitHub Actions incident, verified locally"]).overrideChecks,
    "GitHub Actions incident, verified locally",
  );
  assert.throws(() => parseArguments(["--override-checks", "skip"]), /reason/);
  assert.throws(() => parseArguments(["--override-checks"]), /needs a value/);
});

test("parseArguments rejects malformed input instead of guessing", () => {
  assert.throws(() => parseArguments(["--sha", "main"]), /40-character/);
  assert.throws(() => parseArguments(["--observe", "abc"]), /deployment id/);
  assert.throws(() => parseArguments(["--deploy-timeout-min", "0"]), /positive/);
  assert.throws(() => parseArguments(["--sha"]), /needs a value/);
  assert.throws(() => parseArguments(["--force"]), /Unknown argument/);
});

test("evaluateCheckRuns is ready only when everything is green and verify is present", () => {
  const green = evaluateCheckRuns(
    [run("verify"), run("lighthouse"), run("voice report", "completed", "skipped")],
    SHA,
  );
  assert.equal(green.ready, true);
  assert.deepEqual([green.pending, green.failed], [[], []]);
});

test("evaluateCheckRuns reports pending checks and waits for the aggregate", () => {
  const verdict = evaluateCheckRuns(
    [run("lighthouse", "in_progress", null), run("unit tests")],
    SHA,
  );
  assert.equal(verdict.ready, false);
  assert.ok(verdict.pending.includes("lighthouse"));
  assert.ok(verdict.pending.some((name) => name.startsWith("verify")));
});

test("evaluateCheckRuns refuses red, cancelled and unexpectedly skipped checks", () => {
  const verdict = evaluateCheckRuns(
    [
      run("verify", "completed", "failure"),
      run("e2e chromium 1/6", "completed", "cancelled"),
      run("lighthouse", "completed", "skipped"),
    ],
    SHA,
  );
  assert.equal(verdict.ready, false);
  assert.equal(verdict.failed.length, 3);
});

test("evaluateCheckRuns ignores the dependency-snapshot jobs but not a real gate", () => {
  const verdict = evaluateCheckRuns(
    [
      run("verify"),
      run("generate", "completed", "cancelled"),
      run("submit", "completed", "skipped"),
      run("Dependabot", "in_progress", null),
    ],
    SHA,
  );
  assert.equal(verdict.ready, true);
  const blocked = evaluateCheckRuns(
    [run("verify"), run("Analyze (python)", "completed", "cancelled")],
    SHA,
  );
  assert.equal(blocked.ready, false);
  assert.match(blocked.failed[0], /Analyze \(python\)/);
});

test("evaluateCheckRuns rejects a check-run that belongs to another commit", () => {
  const verdict = evaluateCheckRuns([run("verify", "completed", "success", "b".repeat(40))], SHA);
  assert.equal(verdict.ready, false);
  assert.match(verdict.failed[0], /another commit/);
});

test("findLiveDeploymentForSha ignores failed builds and other commits", () => {
  const deployments = [
    { uid: "dpl_error", target: "production", state: "ERROR", meta: { githubCommitSha: SHA } },
    { uid: "dpl_other", target: "production", state: "READY", meta: { githubCommitSha: "c".repeat(40) } },
    { uid: "dpl_preview", target: null, state: "READY", meta: { githubCommitSha: SHA } },
  ];
  assert.equal(findLiveDeploymentForSha(deployments, SHA), null);
  const live = { uid: "dpl_live", target: "production", state: "BUILDING", meta: { githubCommitSha: SHA } };
  assert.equal(findLiveDeploymentForSha([...deployments, live], SHA), live);
});

test("readLinkedProject reads the link file and fails clearly without one", () => {
  const files = { "/r/packages/website/.vercel/project.json": '{"projectId":"prj_1","orgId":"team_1"}' };
  const found = readLinkedProject((file) => files[file], (file) => file in files, "/r");
  assert.deepEqual(found, {
    projectId: "prj_1",
    orgId: "team_1",
    file: "packages/website/.vercel/project.json",
  });
  assert.throws(() => readLinkedProject(() => "", () => false, "/r"), /vercel link/);
});

test("deploymentRequestBody pins the exact commit on main as production", () => {
  assert.deepEqual(deploymentRequestBody({ projectId: "prj_1", repoId: 7, sha: SHA }), {
    name: "platform",
    project: "prj_1",
    target: "production",
    gitSource: { type: "github", repoId: 7, ref: "main", sha: SHA },
  });
});
