import assert from "node:assert/strict";
import test from "node:test";
import {
  deploymentRequestBody,
  describeNightly,
  evaluateCheckRuns,
  evaluateNightlyRun,
  findLiveDeploymentForSha,
  parseArguments,
  readLinkedProject,
} from "../deploy-production.mjs";

const SHA = "a".repeat(40);
const run = (name, status = "completed", conclusion = "success", head_sha = SHA, extra = {}) => ({
  name,
  status,
  conclusion,
  head_sha,
  ...extra,
});

test("parseArguments defaults to a dry run of the head of main", () => {
  const options = parseArguments([]);
  assert.equal(options.yes, false);
  assert.equal(options.wait, false);
  assert.equal(options.sha, null);
  assert.equal(options.smoke, true);
  assert.equal(options.requireNightly, false);
  assert.equal(options.waitTimeoutMin, 30);
});

test("parseArguments accepts the documented flags", () => {
  const options = parseArguments([
    "--sha",
    SHA,
    "--wait",
    "--yes",
    "--no-smoke",
    "--require-nightly",
    "--deploy-timeout-min",
    "20",
    "--base-url",
    "https://example.test/",
  ]);
  assert.equal(options.sha, SHA);
  assert.equal(options.wait && options.yes, true);
  assert.equal(options.smoke, false);
  assert.equal(options.requireNightly, true);
  assert.equal(options.deployTimeoutMin, 20);
  assert.equal(options.baseUrl, "https://example.test");
});

test("parseArguments rejects malformed input instead of guessing", () => {
  assert.throws(() => parseArguments(["--sha", "main"]), /40-character/);
  assert.throws(() => parseArguments(["--observe", "abc"]), /deployment id/);
  assert.throws(() => parseArguments(["--deploy-timeout-min", "0"]), /positive/);
  assert.throws(() => parseArguments(["--sha"]), /needs a value/);
  assert.throws(() => parseArguments(["--force"]), /Unknown argument/);
});

test("evaluateCheckRuns is ready when verify alone is green", () => {
  const verdict = evaluateCheckRuns([run("verify")], SHA);
  assert.equal(verdict.ready, true);
  assert.deepEqual([verdict.pending, verdict.failed, verdict.informational], [[], [], []]);
});

test("evaluateCheckRuns never lets another check refuse a release", () => {
  const verdict = evaluateCheckRuns(
    [
      run("verify"),
      run("lighthouse", "completed", "failure"),
      run("Analyze (python)", "completed", "cancelled"),
      run("generate", "completed", "skipped"),
      run("foo", "in_progress", null),
      run("unit tests"),
    ],
    SHA,
  );
  assert.equal(verdict.ready, true);
  assert.deepEqual(verdict.pending, []);
  assert.deepEqual(verdict.failed, []);
  assert.deepEqual(verdict.informational, [
    "lighthouse (failure)",
    "Analyze (python) (cancelled)",
    "generate (skipped)",
    "foo (in_progress)",
  ]);
});

test("evaluateCheckRuns waits for verify and names it when it is not reported yet", () => {
  const verdict = evaluateCheckRuns([run("unit tests", "in_progress", null)], SHA);
  assert.equal(verdict.ready, false);
  assert.deepEqual(verdict.pending, ["verify (not reported yet)"]);
  assert.deepEqual(verdict.failed, []);
  assert.deepEqual(verdict.informational, ["unit tests (in_progress)"]);
});

test("evaluateCheckRuns treats a verify that is still running as pending, not failed", () => {
  for (const status of ["queued", "in_progress"]) {
    const verdict = evaluateCheckRuns([run("verify", status, null)], SHA);
    assert.equal(verdict.ready, false, status);
    assert.deepEqual(verdict.pending, ["verify"], status);
    assert.deepEqual(verdict.failed, [], status);
  }
});

test("evaluateCheckRuns refuses a verify that did not succeed", () => {
  for (const conclusion of ["failure", "cancelled", "skipped", "neutral", "timed_out"]) {
    const verdict = evaluateCheckRuns([run("verify", "completed", conclusion)], SHA);
    assert.equal(verdict.ready, false, conclusion);
    assert.deepEqual(verdict.failed, [`verify (${conclusion})`], conclusion);
    assert.deepEqual(verdict.pending, [], conclusion);
  }
});

test("evaluateCheckRuns rejects a verify that belongs to another commit", () => {
  const verdict = evaluateCheckRuns([run("verify", "completed", "success", "b".repeat(40))], SHA);
  assert.equal(verdict.ready, false);
  assert.deepEqual(verdict.failed, ["verify (belongs to another commit)"]);
});

test("evaluateCheckRuns ignores a verify check-run created by another app", () => {
  const impostor = run("verify", "completed", "success", SHA, { app: { slug: "some-other-app" } });
  const alone = evaluateCheckRuns([impostor], SHA);
  assert.equal(alone.ready, false);
  assert.deepEqual(alone.pending, ["verify (not reported yet)"]);
  const real = run("verify", "completed", "success", SHA, { app: { slug: "github-actions" } });
  assert.equal(evaluateCheckRuns([impostor, real], SHA).ready, true);
});

test("evaluateCheckRuns resolves a re-run to the newest verify", () => {
  const old = run("verify", "completed", "failure", SHA, { id: 1 });
  const rerun = run("verify", "completed", "success", SHA, { id: 2 });
  for (const runs of [[old, rerun], [rerun, old]]) {
    const verdict = evaluateCheckRuns(runs, SHA);
    assert.equal(verdict.ready, true);
    assert.deepEqual(verdict.informational, []);
  }
  const newestRed = evaluateCheckRuns(
    [rerun, run("verify", "completed", "failure", SHA, { id: 3 })],
    SHA,
  );
  assert.equal(newestRed.ready, false);
  assert.deepEqual(newestRed.failed, ["verify (failure)"]);
});

test("evaluateNightlyRun accepts only a completed success on this exact commit", () => {
  const nightly = (extra = {}) => ({
    status: "completed",
    conclusion: "success",
    headSha: SHA,
    ...extra,
  });
  assert.equal(evaluateNightlyRun(nightly(), SHA).ok, true);
  assert.equal(evaluateNightlyRun(nightly({ conclusion: "failure" }), SHA).ok, false);
  assert.match(evaluateNightlyRun(nightly({ conclusion: "failure" }), SHA).reason, /ended failure/);
  assert.match(evaluateNightlyRun(null, SHA).reason, /no Nightly run/);
  assert.match(evaluateNightlyRun(nightly({ headSha: "b".repeat(40) }), SHA).reason, /older commit/);
  const running = evaluateNightlyRun(nightly({ status: "in_progress", conclusion: "" }), SHA);
  assert.equal(running.ok, false);
  assert.match(running.reason, /in_progress/);
});

test("describeNightly prints one line and never throws on a missing run", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  const base = { status: "completed", conclusion: "success", headSha: SHA, createdAt: "2026-10-20T02:30:00Z" };
  assert.equal(describeNightly(base, SHA, now), "Nightly: success 10h ago, this commit");
  assert.equal(
    describeNightly({ ...base, conclusion: "failure", headSha: "b".repeat(40), createdAt: "2026-10-16T12:00:00Z" }, SHA, now),
    "Nightly: failure 4d ago, an older commit",
  );
  assert.equal(describeNightly(null, SHA, now), "Nightly: unknown");
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
