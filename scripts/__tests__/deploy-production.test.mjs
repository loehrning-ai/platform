import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import test from "node:test";
import {
  deploymentRequestBody,
  createDefaultAdapters,
  describeNightly,
  evaluateCheckRuns,
  evaluateNightlyRun,
  findLiveDeploymentForSha,
  executeRelease,
  parseArguments,
  readLinkedProject,
  validateDeployment,
  validateProjectMetadata,
} from "../deploy-production.mjs";

const SHA = "a".repeat(40);
const run = (name, status = "completed", conclusion = "success", head_sha = SHA, extra = {}) => ({
  name,
  status,
  conclusion,
  head_sha,
  app: { slug: "github-actions" },
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
    "--require-extended",
    "--deploy-timeout-min",
    "20",
  ]);
  assert.equal(options.sha, SHA);
  assert.equal(options.wait && options.yes, true);
  assert.equal(options.smoke, true);
  assert.equal(options.requireNightly, true);
  assert.equal(options.deployTimeoutMin, 20);
  assert.equal(options.requireExtended, true);
  assert.equal(parseArguments(["--require-nightly"]).requireExtended, true);
  assert.equal(parseArguments(["--preview", "--ref", "fix/course"]).ref, "fix/course");
});

test("parseArguments rejects malformed input instead of guessing", () => {
  assert.throws(() => parseArguments(["--sha", "main"]), /40-character/);
  assert.throws(() => parseArguments(["--observe", "abc"]), /deployment id/);
  assert.throws(() => parseArguments(["--deploy-timeout-min", "0"]), /positive/);
  assert.throws(() => parseArguments(["--sha"]), /needs a value/);
  for (const flag of ["--force", "--no-smoke", "--base-url"]) assert.throws(() => parseArguments([flag]), /Unknown release option/);
  assert.throws(() => parseArguments(["--ref", "fix/course"]), /Production releases only main/);
  for (const ref of ["../main", "a..b", "-main", "a//b", "a/b.lock", "a/", "main:prod"]) assert.throws(() => parseArguments(["--preview", "--ref", ref]), /branch name/);
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
  assert.match(evaluateNightlyRun(null, SHA).reason, /no Extended validation/);
  assert.match(evaluateNightlyRun(nightly({ headSha: "b".repeat(40) }), SHA).reason, /older commit/);
  const running = evaluateNightlyRun(nightly({ status: "in_progress", conclusion: "" }), SHA);
  assert.equal(running.ok, false);
  assert.match(running.reason, /in_progress/);
});

test("describeNightly prints one line and never throws on a missing run", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");
  const base = { status: "completed", conclusion: "success", headSha: SHA, createdAt: "2026-10-20T02:30:00Z" };
  assert.equal(describeNightly(base, SHA, now), "Extended validation: success 10h ago, this commit");
  assert.equal(
    describeNightly({ ...base, conclusion: "failure", headSha: "b".repeat(40), createdAt: "2026-10-16T12:00:00Z" }, SHA, now),
    "Extended validation: an older-commit result is not evidence for this release (optional)",
  );
  assert.equal(describeNightly(null, SHA, now), "Extended validation: not recorded (optional)");
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
    autoAssignCustomDomains: false,
    gitSource: { type: "github", repoId: 7, ref: "main", sha: SHA },
  });
});

test("preview payload omits target and domain assignment fields", () => {
  const payload = deploymentRequestBody({ projectId: "prj_1", repoId: 7, sha: SHA, ref: "fix/course", target: "preview" });
  assert.deepEqual(payload.gitSource, { type: "github", repoId: 7, ref: "fix/course", sha: SHA });
  assert.equal("target" in payload, false);
  assert.equal("autoAssignCustomDomains" in payload, false);
});

test("linked project rejects conflicting app/root links", () => {
  const files = { "/r/packages/website/.vercel/project.json": '{"projectId":"prj_1","orgId":"team_1"}', "/r/.vercel/project.json": '{"projectId":"prj_2","orgId":"team_1"}' };
  assert.throws(() => readLinkedProject((file) => files[file], (file) => file in files, "/r"), /Conflicting/);
});

const OTHER_SHA = "b".repeat(40);
const PROJECT = { projectId: "prj_test", orgId: "team_test", file: "packages/website/.vercel/project.json" };
const REPOSITORY = { id: 7, full_name: "loehrning-ai/platform" };
const projectMetadata = () => ({ id: PROJECT.projectId, accountId: PROJECT.orgId, name: "platform", link: { type: "github", repoId: 7, productionBranch: "main" } });
const readyDeployment = (extra = {}) => ({
  id: "dpl_test", projectId: PROJECT.projectId, ownerId: PROJECT.orgId, name: "platform", target: "production", readyState: "READY",
  gitSource: { type: "github", repoId: 7, ref: "main", sha: SHA }, meta: { githubCommitSha: SHA },
  url: "platform-release.vercel.app", alias: [], ...extra,
});
const CONTEXT = { project: PROJECT, repository: REPOSITORY, sha: SHA, ref: "main", target: "production" };
const CANONICAL = ["loehrning.ai", "www.loehrning.ai"];

function fixture({ existing = null, current = false, deployment = readyDeployment(), head, checks, smoke, create, promote } = {}) {
  let clock = 0, branchReads = 0, checkReads = 0, deploymentReads = 0;
  let value = structuredClone(deployment);
  const events = [];
  const io = {
    log: () => {}, now: () => clock, sleep: async (ms) => { clock += ms; events.push(["sleep", ms]); },
    readProject: () => PROJECT, getRepository: async () => REPOSITORY, currentBranch: async () => "fix/course",
    getProject: async () => ({ ...projectMetadata(), ...(current ? { targets: { production: { id: value.id } } } : {}) }),
    getBranchHead: async () => { const count = ++branchReads; events.push(["head", count]); return head ? head(count) : SHA; },
    getCheckRuns: async () => { const count = ++checkReads; events.push(["checks", count]); return checks ? checks(count) : [run("verify")]; },
    getExtendedRun: async () => ({ status: "completed", conclusion: "success", headSha: SHA }),
    readSmokeContract: async (repo, sha) => { events.push(["contract", repo.full_name, sha]); return [{ route: "/", kind: "html" }]; },
    listDeployments: async (_project, target) => { events.push(["list", target]); return existing ? [existing] : []; },
    getDeployment: async (_project, id) => { deploymentReads++; events.push(["get", id]); return structuredClone(value); },
    createDeployment: async (_project, body) => { events.push(["create", body]); if (create) await create(body); return { id: value.id }; },
    cancelDeployment: async (_project, id) => { events.push(["cancel", id]); },
    promoteDeployment: async (_project, id) => { events.push(["promote", id]); if (promote) await promote(id); value.alias = CANONICAL; },
    smoke: async (url, _contract, mode) => { events.push(["smoke", url, mode.authenticated]); if (smoke) await smoke(url, mode); },
  };
  return { io, events, get deploymentReads() { return deploymentReads; }, setDeployment: (next) => { value = next; } };
}
const mutations = (f) => f.events.filter(([name]) => ["create", "promote", "cancel"].includes(name));
const options = (args = []) => parseArguments(["--sha", SHA, ...args]);

test("metadata rejects wrong project/team/repo/target/ref/SHA before smoke", () => {
  for (const extra of [{ projectId: "prj_other" }, { ownerId: "team_other" }, { target: null }, { gitSource: { type: "github", repoId: 8, ref: "main", sha: SHA } }, { gitSource: { type: "github", repoId: 7, ref: "fix/course", sha: SHA } }, { meta: { githubCommitSha: OTHER_SHA } }, { url: "evil.test" }]) {
    assert.throws(() => validateDeployment(readyDeployment(extra), CONTEXT, { ready: true }), /metadata mismatch|deployment URL/);
  }
  for (const extra of [{ accountId: "team_other" }, { id: "prj_other" }, { link: { type: "github", repoId: 8, productionBranch: "main" } }]) assert.throws(() => validateProjectMetadata({ ...projectMetadata(), ...extra }, PROJECT, REPOSITORY), /context mismatch/);
});

test("new production build is staged, smoked, and the same id promoted before canonical smoke", async () => {
  const f = fixture();
  const result = await executeRelease(options(["--yes"]), f.io);
  assert.equal(result.status, "promoted");
  const work = f.events.filter(([name]) => ["create", "smoke", "promote"].includes(name));
  assert.equal(work[0][1].target, "production");
  assert.equal(work[0][1].autoAssignCustomDomains, false);
  assert.deepEqual(work.slice(1), [["smoke", "https://platform-release.vercel.app", true], ["promote", "dpl_test"], ["smoke", "https://loehrning.ai", false], ["smoke", "https://www.loehrning.ai", false]]);
  assert.deepEqual(f.events.find(([name]) => name === "contract"), ["contract", REPOSITORY.full_name, SHA]);
  const promotionIndex = f.events.findIndex(([name]) => name === "promote");
  assert.equal(f.events[promotionIndex - 1][0], "head");
});

test("an already-current READY production repeat succeeds with canonical smoke and no mutation", async () => {
  const f = fixture({ current: true, deployment: readyDeployment({ alias: CANONICAL }) });
  for (let request = 0; request < 2; request++) assert.equal((await executeRelease(options(["--yes"]), f.io)).status, "current");
  assert.deepEqual(mutations(f), []);
  assert.equal(f.events.filter(([name]) => name === "smoke").length, 4);
  assert.equal(f.events.some(([name]) => name === "list"), false);
});

test("a staged READY build is reused rather than recreated", async () => {
  const f = fixture({ existing: readyDeployment() });
  assert.equal((await executeRelease(options(["--yes"]), f.io)).status, "promoted");
  assert.deepEqual(mutations(f), [["promote", "dpl_test"]]);
});

test("an in-flight build is reused and never cancelled on timeout", async () => {
  const f = fixture({ existing: readyDeployment({ readyState: "BUILDING" }), deployment: readyDeployment({ readyState: "BUILDING" }) });
  f.io.cancelDeployment = () => assert.fail("cancellation is not authorized");
  await assert.rejects(executeRelease(options(["--yes", "--deploy-timeout-min", "0.001"]), f.io), /not cancelled/);
  assert.deepEqual(mutations(f), []);
  assert.ok(f.deploymentReads >= 2);
});

test("timeout cancels only the staged build created by this invocation", async () => {
  const f = fixture({ deployment: readyDeployment({ readyState: "BUILDING" }) });
  await assert.rejects(executeRelease(options(["--yes", "--deploy-timeout-min", "0.001"]), f.io), /cancelled because this invocation created it/);
  assert.deepEqual(mutations(f).map(([name]) => name), ["create", "cancel"]);
  assert.equal(mutations(f)[1][1], "dpl_test");
});

test("owned timeout cancellation failure stops without another mutation attempt", async () => {
  const f = fixture({ deployment: readyDeployment({ readyState: "BUILDING" }) });
  let cancellations = 0;
  f.io.cancelDeployment = async () => { cancellations++; throw new Error("network error"); };
  await assert.rejects(executeRelease(options(["--yes", "--deploy-timeout-min", "0.001"]), f.io), /cancellation could not be confirmed/);
  assert.equal(cancellations, 1);
  assert.equal(mutations(f).length, 1);
});

test("an in-flight build can finish and promote without creating another build", async () => {
  const building = readyDeployment({ readyState: "BUILDING" });
  const f = fixture({ existing: building, deployment: building });
  f.io.sleep = async () => f.setDeployment(readyDeployment());
  assert.equal((await executeRelease(options(["--yes"]), f.io)).status, "promoted");
  assert.deepEqual(mutations(f), [["promote", "dpl_test"]]);
});

test("staged smoke failure prevents promotion and retries", async () => {
  const f = fixture({ smoke: async () => { throw new Error("kit checksum differs"); } });
  await assert.rejects(executeRelease(options(["--yes"]), f.io), /checksum/);
  assert.equal(mutations(f).filter(([name]) => name === "create").length, 1);
  assert.equal(mutations(f).some(([name]) => name === "promote"), false);
});

test("create timeout is not retried", async () => {
  const f = fixture({ create: async () => { throw new Error("timeout; inspect before retry"); } });
  await assert.rejects(executeRelease(options(["--yes"]), f.io), /timeout/);
  assert.equal(mutations(f).length, 1);
});

test("promotion timeout is not retried or followed by a new build", async () => {
  const f = fixture({ existing: readyDeployment(), promote: async () => { throw new Error("promotion timeout"); } });
  await assert.rejects(executeRelease(options(["--yes"]), f.io), /promotion timeout/);
  assert.deepEqual(mutations(f), [["promote", "dpl_test"]]);
});

test("preview uses current branch, omits target, smokes unique URL, and never promotes", async () => {
  const f = fixture({ deployment: readyDeployment({ target: null, gitSource: { type: "github", repoId: 7, ref: "fix/course", sha: SHA } }) });
  assert.equal((await executeRelease(options(["--preview", "--yes"]), f.io)).status, "ready");
  const payload = mutations(f)[0][1];
  assert.equal(payload.gitSource.ref, "fix/course");
  assert.equal("target" in payload, false);
  assert.equal(mutations(f).length, 1);
  assert.deepEqual(f.events.filter(([name]) => name === "smoke"), [["smoke", "https://platform-release.vercel.app", true]]);
});

test("explicit preview ref overrides local branch without trusting local source files", async () => {
  const f = fixture({ deployment: readyDeployment({ target: null, gitSource: { type: "github", repoId: 7, ref: "review/123", sha: SHA } }) });
  f.io.currentBranch = () => assert.fail("explicit ref must override local branch");
  assert.equal((await executeRelease(options(["--preview", "--ref", "review/123", "--yes"]), f.io)).status, "ready");
  assert.equal(mutations(f)[0][1].gitSource.ref, "review/123");
});

test("observe validates and smokes a staged production without promotion even with yes", async () => {
  const f = fixture();
  assert.equal((await executeRelease(options(["--observe", "dpl_test", "--yes"]), f.io)).status, "ready");
  assert.deepEqual(mutations(f), []);
});

test("dry run cannot create, and existing staged dry run still smokes", async () => {
  const fresh = fixture();
  assert.equal((await executeRelease(options(), fresh.io)).status, "dry-run");
  assert.deepEqual(mutations(fresh), []);
  const staged = fixture({ existing: readyDeployment() });
  assert.equal((await executeRelease(options(), staged.io)).status, "staged");
  assert.deepEqual(mutations(staged), []);
  assert.equal(staged.events.filter(([name]) => name === "smoke").length, 1);
});

test("branch move during CI wait stops before build creation", async () => {
  const f = fixture({ head: (count) => count >= 2 ? OTHER_SHA : SHA, checks: () => [run("verify", "in_progress", null)] });
  await assert.rejects(executeRelease(options(["--yes", "--wait"]), f.io), /Branch main moved/);
  assert.deepEqual(mutations(f), []);
});

test("branch move as CI finishes stops before source or deployment work", async () => {
  const f = fixture({ head: (count) => count >= 2 ? OTHER_SHA : SHA });
  await assert.rejects(executeRelease(options(["--yes"]), f.io), /Branch main moved/);
  assert.equal(f.events.some(([name]) => name === "contract"), false);
  assert.deepEqual(mutations(f), []);
});

test("branch move during source/deployment inventory stops immediately before create", async () => {
  const f = fixture({ head: (count) => count >= 3 ? OTHER_SHA : SHA });
  await assert.rejects(executeRelease(options(["--yes"]), f.io), /Branch main moved/);
  assert.deepEqual(mutations(f), []);
});

test("branch move during unique smoke stops immediately before promotion", async () => {
  let moved = false;
  const f = fixture({ head: () => moved ? OTHER_SHA : SHA, smoke: async () => { moved = true; } });
  await assert.rejects(executeRelease(options(["--yes"]), f.io), /Branch main moved/);
  assert.equal(mutations(f).filter(([name]) => name === "create").length, 1);
  assert.equal(mutations(f).some(([name]) => name === "promote"), false);
});

test("wrong deployment target or source SHA cannot be smoked or promoted", async () => {
  for (const deployment of [readyDeployment({ target: null }), readyDeployment({ gitSource: { type: "github", repoId: 7, ref: "main", sha: OTHER_SHA } })]) {
    const f = fixture({ existing: readyDeployment(), deployment });
    await assert.rejects(executeRelease(options(["--yes"]), f.io), /metadata mismatch/);
    assert.deepEqual(mutations(f), []);
    assert.equal(f.events.some(([name]) => name === "smoke"), false);
  }
});

for (const alias of [[CANONICAL[0]], [CANONICAL[1]], CANONICAL]) {
  test(`newly created build must not acquire ${alias.join(" or ")} before staged smoke`, async () => {
    const f = fixture({ deployment: readyDeployment({ alias }) });
    await assert.rejects(executeRelease(options(["--yes"]), f.io), /unexpectedly owns/);
    assert.equal(mutations(f).some(([name]) => name === "promote"), false);
    assert.equal(f.events.some(([name]) => name === "smoke"), false);
  });
}

test("failed or missing exact-commit verify and Extended cannot mutate", async () => {
  for (const checks of [[], [run("verify", "completed", "failure")], [run("verify", "completed", "success", OTHER_SHA)], [run("verify", "completed", "success", SHA, { app: undefined })]]) {
    const f = fixture({ checks: () => checks });
    await assert.rejects(executeRelease(options(["--yes"]), f.io), /checks|Checks/);
    assert.deepEqual(mutations(f), []);
  }
  const f = fixture();
  f.io.getExtendedRun = async () => ({ status: "completed", conclusion: "success", headSha: OTHER_SHA });
  await assert.rejects(executeRelease(options(["--yes", "--require-extended"]), f.io), /older commit/);
  assert.deepEqual(mutations(f), []);
});

test("adapter loads every smoke source through GitHub at the exact SHA and creates once via stdin", async () => {
  const calls = [];
  const assets = ["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"].flatMap((slug) => ["de", "en"].map((lang) => ({ path: `packages/website/public/workshops/${slug}/kit-${lang}.zip`, sizeBytes: 1, sha256: "a".repeat(64) })));
  const tree = ["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"].flatMap((slug) => ["slides.html", "en/slides.html", "lib/deck.css", "lib/deck-keys.js", "lib/deck-stage.js", "lib/scenes.js", "lib/geo.js", "lib/globe.js"].map((file) => ({ path: `packages/website/public/workshops/${slug}/${file}`, type: "blob", sha: "a".repeat(40), size: 1 })));
  const io = createDefaultAdapters("/repo", { exec: (command, args, options) => {
    calls.push({ command, args, options });
    if (command === "gh") return args[1].includes("/git/trees/") ? JSON.stringify({ tree, truncated: false }) : JSON.stringify({ type: "file", encoding: "base64", content: Buffer.from(JSON.stringify({ assets })).toString("base64") });
    return JSON.stringify({ id: "dpl_test" });
  } });
  const contract = await io.readSmokeContract(REPOSITORY, SHA);
  assert.equal(contract.length, 41);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.command, "gh");
  }
  assert.equal(calls[0].args[1], `repos/loehrning-ai/platform/contents/ASSET_MANIFEST.json?ref=${SHA}`);
  assert.equal(calls[1].args[1], `repos/loehrning-ai/platform/git/trees/${SHA}?recursive=1`);
  const body = deploymentRequestBody({ projectId: PROJECT.projectId, repoId: REPOSITORY.id, sha: SHA });
  await io.createDeployment(PROJECT, body);
  const last = calls.at(-1);
  assert.equal(last.command, "vercel");
  assert.deepEqual(last.args, ["api", "/v13/deployments", "--scope", PROJECT.orgId, "--method", "POST", "--input", "-"]);
  assert.deepEqual(JSON.parse(last.options.input), body);
  assert.equal(calls.filter((call) => call.command === "vercel").length, 1);
  await io.cancelDeployment(PROJECT, "dpl_test");
  assert.deepEqual(calls.at(-1).args, ["api", "/v12/deployments/dpl_test/cancel", "--scope", PROJECT.orgId, "--method", "PATCH"]);
});

test("protected smoke pins the unique deployment, uses linked app cwd and cleans public response files", async () => {
  const calls = [], temporaryFiles = [];
  const io = createDefaultAdapters("/repo", { execAsync: async (command, args, options) => {
    calls.push({ command, args, options });
    const file = args[args.indexOf("--output") + 1];
    temporaryFiles.push(file);
    writeFileSync(file, '<html lang="de"><main><h1>Workshop</h1><span data-app-hydration-marker="true"></span></main></html>');
    return { stdout: "200" };
  } });
  await io.smoke("https://platform-release.vercel.app", [{ route: "/", kind: "html", language: "de" }], { project: PROJECT, deployment: readyDeployment(), authenticated: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, "vercel");
  assert.deepEqual(calls[0].args.slice(0, 6), ["curl", "/", "--deployment", "https://platform-release.vercel.app", "--scope", PROJECT.orgId]);
  assert.equal(calls[0].options.cwd, "/repo/packages/website");
  assert.equal(calls[0].args.some((arg) => /token|bypass|authorization/i.test(arg)), false);
  assert.ok(temporaryFiles.every((file) => !existsSync(file)));
});

test("protected smoke executes four asynchronous curl children concurrently", async () => {
  let active = 0, maximum = 0;
  const io = createDefaultAdapters("/repo", { execAsync: async (_command, args) => {
    active++; maximum = Math.max(maximum, active);
    await new Promise((resolve) => setImmediate(resolve));
    writeFileSync(args[args.indexOf("--output") + 1], '<html lang="de"><main><h1>Workshop</h1><span data-app-hydration-marker="true"></span></main></html>');
    active--;
    return { stdout: "200" };
  } });
  await io.smoke("https://platform-release.vercel.app", Array.from({ length: 8 }, (_, index) => ({ route: `/${index}`, kind: "html", language: "de" })), { project: PROJECT, deployment: readyDeployment(), authenticated: true });
  assert.equal(maximum, 4);
});

test("public smoke follows only same-path canonical-domain redirects", async () => {
  const seen = [];
  const contract = [{ route: "/", kind: "html", language: "de" }];
  const html = '<html lang="de"><main><h1>Workshop</h1><span data-app-hydration-marker="true"></span></main></html>';
  const io = createDefaultAdapters("/repo", { fetch: async (url) => {
    seen.push(url.href);
    return seen.length === 1 ? new Response(null, { status: 308, headers: { location: "https://www.loehrning.ai/" } }) : new Response(html);
  } });
  await io.smoke("https://loehrning.ai", contract, { project: PROJECT, deployment: readyDeployment(), authenticated: false });
  assert.deepEqual(seen, ["https://loehrning.ai/", "https://www.loehrning.ai/"]);
  for (const destination of ["https://evil.test/", "https://www.loehrning.ai/login"]) {
    const wrong = createDefaultAdapters("/repo", { fetch: async () => new Response(null, { status: 308, headers: { location: destination } }) });
    await assert.rejects(wrong.smoke("https://loehrning.ai", contract, { project: PROJECT, deployment: readyDeployment(), authenticated: false }), /unexpected canonical redirect/);
  }
});
