#!/usr/bin/env node
/**
 * Ship one exact commit of `main` to Vercel production.
 *
 * Merging to `main` deploys nothing: `packages/website/vercel.json` disables
 * Git-triggered production builds, so production only ever changes through
 * this deliberate, repeatable step. The guards are the ones a careful manual
 * release checks, written down once:
 *
 *   1. the commit is the current head of `main` on GitHub;
 *   2. the `verify` check-run on that exact commit is completed and
 *      successful; every other check-run (CodeQL, dependency graph, anything
 *      added later) is informational and can never refuse a release;
 *   3. no non-failed deployment already exists for the commit (observe it
 *      instead of paying for a second build);
 *   4. one deployment is created from that commit, watched to READY with a
 *      cancel guard, and never retried automatically;
 *   5. the production domains answer 200 on the key routes afterwards.
 *
 * Usage (from the repository root, `vercel` and `gh` logged in):
 *
 *   bun run deploy:production                 dry run for the head of main
 *   bun run deploy:production -- --wait       dry run, waiting for CI to finish
 *   bun run deploy:production -- --wait --yes wait for green CI, then deploy
 *   bun run deploy:production -- --sha <sha> --yes
 *   bun run deploy:production -- --require-nightly --wait --yes
 *                                             also demand a green `Nightly`
 *                                             run on this exact commit (start
 *                                             one: gh workflow run nightly.yml
 *                                             --ref main)
 *   bun run deploy:production -- --observe <deployment id>
 *
 * The Vercel project and team are read from the `vercel link` file
 * (`packages/website/.vercel/project.json`, or `.vercel/project.json` at the
 * root); nothing about the account is stored in the repository.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LINK_FILES = [
  "packages/website/.vercel/project.json",
  ".vercel/project.json",
];
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const DEPLOYMENT_ID_PATTERN = /^dpl_[A-Za-z0-9]+$/;
const POLL_CHECKS_MS = 30_000;
const POLL_DEPLOYMENT_MS = 10_000;
const DEFAULT_DEPLOY_TIMEOUT_MIN = 12;
const DEFAULT_WAIT_TIMEOUT_MIN = 30;
/**
 * The aggregate check whose success is the release signal, and the only check
 * that can refuse a release. Its name is part of the CI contract: `ci.yml`
 * keeps a job called exactly this.
 */
const RELEASE_CHECK = "verify";
/** Only a check-run created by GitHub Actions may count as the release signal. */
const RELEASE_CHECK_APP = "github-actions";
const NIGHTLY_WORKFLOW = "nightly.yml";
const SMOKE_ROUTES = [
  "/",
  "/en",
  "/kurse",
  "/login",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/api/knowledge-graph.json",
];
const FAILED_STATES = new Set(["ERROR", "CANCELED"]);

/* ─── Pure decisions (unit tested) ─────────────────────────────────────── */

export function parseArguments(argv) {
  const options = {
    sha: null,
    observe: null,
    wait: false,
    yes: false,
    smoke: true,
    requireNightly: false,
    deployTimeoutMin: DEFAULT_DEPLOY_TIMEOUT_MIN,
    waitTimeoutMin: DEFAULT_WAIT_TIMEOUT_MIN,
    baseUrl: "https://loehrning.ai",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new Error(`${flag} needs a value`);
      }
      index += 1;
      return next;
    };
    if (flag === "--sha") options.sha = value();
    else if (flag === "--observe") options.observe = value();
    else if (flag === "--wait") options.wait = true;
    else if (flag === "--yes") options.yes = true;
    else if (flag === "--no-smoke") options.smoke = false;
    else if (flag === "--require-nightly") options.requireNightly = true;
    else if (flag === "--deploy-timeout-min") options.deployTimeoutMin = Number(value());
    else if (flag === "--wait-timeout-min") options.waitTimeoutMin = Number(value());
    else if (flag === "--base-url") options.baseUrl = value().replace(/\/+$/, "");
    else if (flag === "--help" || flag === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${flag}`);
  }
  if (options.sha !== null && !SHA_PATTERN.test(options.sha)) {
    throw new Error("--sha must be a full 40-character lowercase commit SHA");
  }
  if (options.observe !== null && !DEPLOYMENT_ID_PATTERN.test(options.observe)) {
    throw new Error("--observe must be a deployment id such as dpl_abc123");
  }
  for (const [name, minutes] of [
    ["--deploy-timeout-min", options.deployTimeoutMin],
    ["--wait-timeout-min", options.waitTimeoutMin],
  ]) {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      throw new Error(`${name} must be a positive number of minutes`);
    }
  }
  return options;
}

/**
 * Classify the check-runs of one commit. `verify` is the only gate: it must be
 * reported by GitHub Actions for this exact commit, completed, and successful.
 * Every other check-run is returned as `informational` and never affects
 * `ready`. After a re-run several `verify` check-runs exist; the newest (highest
 * id) decides and the superseded ones are dropped.
 */
export function evaluateCheckRuns(checkRuns, sha) {
  const candidates = checkRuns.filter(
    (run) =>
      run.name === RELEASE_CHECK &&
      (run.app == null || run.app.slug === RELEASE_CHECK_APP),
  );
  const release = candidates.reduce(
    (newest, run) =>
      newest === null || (run.id ?? 0) >= (newest.id ?? 0) ? run : newest,
    null,
  );
  const pending = [];
  const failed = [];
  if (release === null) {
    pending.push(`${RELEASE_CHECK} (not reported yet)`);
  } else if (release.head_sha !== undefined && release.head_sha !== sha) {
    failed.push(`${RELEASE_CHECK} (belongs to another commit)`);
  } else if (release.status !== "completed") {
    pending.push(RELEASE_CHECK);
  } else if (release.conclusion !== "success") {
    failed.push(`${RELEASE_CHECK} (${release.conclusion})`);
  }
  const superseded = new Set(candidates.filter((run) => run !== release));
  const informational = checkRuns
    .filter((run) => run !== release && !superseded.has(run))
    .filter((run) => run.status !== "completed" || run.conclusion !== "success")
    .map(
      (run) =>
        `${run.name} (${run.status === "completed" ? run.conclusion : run.status})`,
    );
  return {
    ready: pending.length === 0 && failed.length === 0,
    pending,
    failed,
    informational,
    total: checkRuns.length,
  };
}

/**
 * Decide whether a `Nightly` workflow run proves this exact commit. `run` is
 * the newest completed run of nightly.yml on main (or null when none exists).
 */
export function evaluateNightlyRun(run, sha) {
  if (!run) return { ok: false, reason: "no Nightly run has completed yet" };
  if (run.status !== undefined && run.status !== "completed") {
    return { ok: false, reason: `the latest Nightly run is ${run.status}` };
  }
  if (run.headSha !== sha) {
    return { ok: false, reason: "the latest Nightly run belongs to an older commit" };
  }
  if (run.conclusion !== "success") {
    return { ok: false, reason: `the Nightly run on this commit ended ${run.conclusion}` };
  }
  return { ok: true, reason: "the Nightly run on this commit succeeded" };
}

/** One human line about the newest Nightly run, for the information output. */
export function describeNightly(run, sha, now = Date.now()) {
  if (!run) return "Nightly: unknown";
  const hours = Math.max(0, Math.round((now - Date.parse(run.createdAt)) / 3_600_000));
  const age = Number.isFinite(hours)
    ? hours < 48
      ? `${hours}h ago`
      : `${Math.round(hours / 24)}d ago`
    : "age unknown";
  const outcome = run.status === "completed" ? run.conclusion : run.status;
  return `Nightly: ${outcome} ${age}, ${run.headSha === sha ? "this commit" : "an older commit"}`;
}

/** The deployment of this commit that must be observed instead of rebuilt. */
export function findLiveDeploymentForSha(deployments, sha) {
  return (
    deployments.find((deployment) => {
      const deploymentSha =
        deployment.meta?.githubCommitSha ?? deployment.gitSource?.sha;
      const state = deployment.state ?? deployment.readyState;
      return (
        deployment.target === "production" &&
        deploymentSha === sha &&
        !FAILED_STATES.has(state)
      );
    }) ?? null
  );
}

export function readLinkedProject(readFile, exists, root = ROOT) {
  for (const relative of LINK_FILES) {
    const file = path.join(root, relative);
    if (!exists(file)) continue;
    const { projectId, orgId } = JSON.parse(readFile(file));
    if (typeof projectId === "string" && typeof orgId === "string") {
      return { projectId, orgId, file: relative };
    }
  }
  throw new Error(
    "No linked Vercel project. Run `vercel link` in packages/website first.",
  );
}

export function deploymentRequestBody({ projectId, repoId, sha }) {
  return {
    name: "platform",
    project: projectId,
    target: "production",
    gitSource: { type: "github", repoId, ref: "main", sha },
  };
}

/* ─── Side effects ─────────────────────────────────────────────────────── */

const log = (message) => process.stdout.write(`${message}\n`);

function run(command, args, input) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    input,
    timeout: 120_000,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function gh(endpoint, ...extra) {
  return run("gh", ["api", endpoint, ...extra]);
}

function vercelApi(project, endpoint, { method, body } = {}) {
  const args = ["api", endpoint, "--scope", project.orgId];
  if (method) args.push("--method", method);
  if (body) args.push("--input", "-");
  return JSON.parse(run("vercel", args, body ? JSON.stringify(body) : undefined));
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function checkRunsFor(sha) {
  const output = gh(
    `repos/:owner/:repo/commits/${sha}/check-runs?per_page=100`,
    "--paginate",
    "--jq",
    ".check_runs[]",
  );
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** Newest run of nightly.yml on main, or null when none exists or gh fails. */
function latestNightlyRun({ completedOnly }) {
  const args = [
    "run",
    "list",
    `--workflow=${NIGHTLY_WORKFLOW}`,
    "--branch=main",
    "--limit=1",
    "--json=status,conclusion,headSha,createdAt,url",
  ];
  if (completedOnly) args.push("--status=completed");
  return JSON.parse(run("gh", args))[0] ?? null;
}

async function waitForChecks(sha, options) {
  const deadline = Date.now() + options.waitTimeoutMin * 60_000;
  for (;;) {
    const verdict = evaluateCheckRuns(checkRunsFor(sha), sha);
    if (verdict.failed.length > 0 || verdict.ready || !options.wait) return verdict;
    if (Date.now() > deadline) return verdict;
    log("  waiting for verify");
    await sleep(POLL_CHECKS_MS);
  }
}

async function watchDeployment(project, id, timeoutMin) {
  const deadline = Date.now() + timeoutMin * 60_000;
  let last = "";
  for (;;) {
    const deployment = vercelApi(project, `/v13/deployments/${id}`);
    const state = deployment.readyState ?? deployment.state;
    if (state !== last) log(`  ${id}: ${state}`);
    last = state;
    if (state === "READY") return deployment;
    if (FAILED_STATES.has(state)) {
      throw new Error(
        `Deployment ${id} ended ${state}${deployment.errorCode ? ` (${deployment.errorCode})` : ""}. Inspect with: vercel inspect ${id} --logs --scope ${project.orgId}`,
      );
    }
    if (Date.now() > deadline) {
      vercelApi(project, `/v12/deployments/${id}/cancel`, { method: "PATCH" });
      throw new Error(
        `Deployment ${id} did not become READY within ${timeoutMin} minutes and was cancelled. Not retrying automatically.`,
      );
    }
    await sleep(POLL_DEPLOYMENT_MS);
  }
}

async function smoke(baseUrl) {
  const failures = [];
  for (const route of SMOKE_ROUTES) {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    const ok = response.status === 200;
    log(`  ${ok ? "ok  " : "FAIL"} ${response.status} ${route}`);
    if (!ok) failures.push(`${route} -> ${response.status}`);
  }
  return failures;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
    return 0;
  }
  const project = readLinkedProject(
    (file) => readFileSync(file, "utf8"),
    existsSync,
  );
  log(`Project ${project.projectId} (linked via ${project.file})`);

  if (options.observe) {
    const deployment = await watchDeployment(
      project,
      options.observe,
      options.deployTimeoutMin,
    );
    log(`READY ${deployment.url}`);
    return 0;
  }

  const repoId = Number(gh("repos/:owner/:repo", "--jq", ".id").trim());
  const head = gh("repos/:owner/:repo/git/ref/heads/main", "--jq", ".object.sha").trim();
  const sha = options.sha ?? head;
  log(`Commit ${sha}${sha === head ? " (head of main)" : ""}`);
  if (sha !== head) {
    throw new Error(
      `${sha} is not the head of main (${head}). Production ships the head of main only.`,
    );
  }

  const verdict = await waitForChecks(sha, options);
  log(`Checks: ${verdict.total} reported`);
  if (verdict.informational.length > 0) {
    log(`Not blocking: ${verdict.informational.join(", ")}`);
  }
  if (verdict.failed.length > 0) {
    throw new Error(`Failing checks:\n  - ${verdict.failed.join("\n  - ")}`);
  }
  if (!verdict.ready) {
    throw new Error(
      `Checks are not finished (${verdict.pending.join(", ")}). Re-run with --wait to wait for them.`,
    );
  }
  log("Checks: verify is green");

  try {
    log(describeNightly(latestNightlyRun({ completedOnly: false }), sha));
  } catch {
    log("Nightly: unknown");
  }
  if (options.requireNightly) {
    const latest = latestNightlyRun({ completedOnly: true });
    const nightly = evaluateNightlyRun(latest, sha);
    if (!nightly.ok) {
      throw new Error(
        `--require-nightly: ${nightly.reason}${latest?.url ? ` (${latest.url})` : ""}. Start one with: gh workflow run ${NIGHTLY_WORKFLOW} --ref main, wait for it, then re-run this command.`,
      );
    }
    log(`Nightly: ${nightly.reason}`);
  }

  const inventory = vercelApi(
    project,
    `/v6/deployments?projectId=${project.projectId}&target=production&limit=100`,
  ).deployments;
  const existing = findLiveDeploymentForSha(inventory, sha);
  if (existing) {
    throw new Error(
      `A production deployment for this commit already exists (${existing.uid}). Observe it instead: bun run deploy:production -- --observe ${existing.uid}`,
    );
  }
  const current = vercelApi(project, `/v9/projects/${project.projectId}`).targets
    ?.production;
  log(`Current production: ${current?.id ?? "none"}`);

  if (!options.yes) {
    log("\nDry run: every guard passed. Add --yes to create the deployment.");
    return 0;
  }

  const created = vercelApi(project, "/v13/deployments", {
    method: "POST",
    body: deploymentRequestBody({ projectId: project.projectId, repoId, sha }),
  });
  const id = created.id ?? created.uid;
  log(`Created ${id}`);
  const deployment = await watchDeployment(project, id, options.deployTimeoutMin);
  log(`READY ${deployment.url}`);
  const aliases = deployment.alias ?? [];
  log(`Aliases: ${aliases.join(", ") || "none yet"}`);

  let failures = [];
  if (options.smoke) {
    log(`\nSmoke test against ${options.baseUrl}`);
    failures = await smoke(options.baseUrl);
  }
  if (failures.length > 0) {
    log(
      `\nSmoke test failed. Roll back with: vercel rollback ${current?.id ?? "<previous id>"} --scope ${project.orgId}`,
    );
    return 1;
  }
  log(
    `\nDone. To roll back: vercel rollback ${current?.id ?? "<previous id>"} --scope ${project.orgId}`,
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      process.stderr.write(`\n${error instanceof Error ? error.message : error}\n`);
      process.exit(1);
    },
  );
}
