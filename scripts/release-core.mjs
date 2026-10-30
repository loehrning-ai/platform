import { execFile, execFileSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { buildSmokeContract, MAX_RESPONSE_BYTES, PRODUCTION_ORIGINS, runSmoke, smokeSourcePaths } from "./release-smoke.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LINK_FILES = ["packages/website/.vercel/project.json", ".vercel/project.json"];
const SHA_PATTERN = /^[a-f0-9]{40}$/;
const DEPLOYMENT_ID_PATTERN = /^dpl_[A-Za-z0-9]+$/;
const FAILED_STATES = new Set(["ERROR", "CANCELED"]);
const HELP = `Usage: deploy-production.mjs [--preview] [--ref branch] [--sha sha] [--wait] [--yes]
  --preview             Preview the current branch (or --ref).
  --ref branch          Preview branch; production always uses main.
  --sha sha             Require this exact current branch-head commit.
  --wait                Wait for exact-commit verify (default limit: 30 minutes).
  --yes                 Authorize creating/staging and promoting this release.
  --observe dpl_id      Validate/smoke an existing release without promotion.
  --require-extended    Require successful Extended validation on this commit.
  --require-nightly     Compatibility alias for --require-extended.
  --deploy-timeout-min  Build/promotion observation limit (default: 12 minutes).
  --wait-timeout-min    CI wait limit (default: 30 minutes).
Smokes are mandatory. Existing builds are reused; mutation commands are never retried.`;

export function validateRef(ref) {
  if (typeof ref !== "string" || ref.length > 200 || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(ref) ||
    ref.includes("..") || ref.includes("//") || ref.endsWith("/") || ref.endsWith(".") ||
    ref.split("/").some((part) => part.endsWith(".lock") || part.startsWith("."))) throw new Error("--ref must be a bounded Git branch name");
  return ref;
}

export function parseArguments(argv) {
  const options = { sha: null, observe: null, ref: null, preview: false, wait: false, yes: false,
    smoke: true, requireExtended: false, requireNightly: false, deployTimeoutMin: 12, waitTimeoutMin: 30 };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => { const v = argv[++i]; if (!v || v.startsWith("--")) throw new Error("Release option needs a value"); return v; };
    if (flag === "--sha") options.sha = value();
    else if (flag === "--observe") options.observe = value();
    else if (flag === "--ref") options.ref = validateRef(value());
    else if (flag === "--preview") options.preview = true;
    else if (flag === "--wait") options.wait = true;
    else if (flag === "--yes") options.yes = true;
    else if (flag === "--require-extended" || flag === "--require-nightly") options.requireExtended = options.requireNightly = true;
    else if (flag === "--deploy-timeout-min") options.deployTimeoutMin = Number(value());
    else if (flag === "--wait-timeout-min") options.waitTimeoutMin = Number(value());
    else if (flag === "--help" || flag === "-h") options.help = true;
    else throw new Error("Unknown release option");
  }
  if (options.sha !== null && !SHA_PATTERN.test(options.sha)) throw new Error("--sha must be a full 40-character lowercase commit SHA");
  if (options.observe !== null && !DEPLOYMENT_ID_PATTERN.test(options.observe)) throw new Error("--observe must be a deployment id such as dpl_abc123");
  if (!options.preview && options.ref !== null && options.ref !== "main") throw new Error("Production releases only main; use --preview for another branch");
  for (const key of ["deployTimeoutMin", "waitTimeoutMin"]) {
    if (!Number.isFinite(options[key]) || options[key] <= 0 || options[key] > 120) throw new Error(`${key} must be positive and at most 120 minutes`);
  }
  return options;
}

export function evaluateCheckRuns(checkRuns, sha) {
  const candidates = checkRuns.filter((r) => r.name === "verify" && r.app?.slug === "github-actions");
  const release = candidates.reduce((a, b) => a === null || (b.id ?? 0) >= (a.id ?? 0) ? b : a, null);
  const pending = [], failed = [];
  if (!release) pending.push("verify (not reported yet)");
  else if (release.head_sha !== sha) failed.push("verify (belongs to another commit)");
  else if (release.status !== "completed") pending.push("verify");
  else if (release.conclusion !== "success") failed.push(`verify (${release.conclusion})`);
  const informational = checkRuns.filter((r) => r !== release && !candidates.includes(r))
    .filter((r) => r.status !== "completed" || r.conclusion !== "success")
    .map((r) => `${r.name} (${r.status === "completed" ? r.conclusion : r.status})`);
  return { ready: pending.length === 0 && failed.length === 0, pending, failed, informational, total: checkRuns.length };
}

export function evaluateNightlyRun(run, sha) {
  if (!run) return { ok: false, reason: "no Extended validation run has completed yet" };
  if (run.status !== undefined && run.status !== "completed") return { ok: false, reason: `Extended validation is ${run.status}` };
  if (run.headSha !== sha) return { ok: false, reason: "Extended validation belongs to an older commit" };
  if (run.conclusion !== "success") return { ok: false, reason: `Extended validation ended ${run.conclusion}` };
  return { ok: true, reason: "Extended validation on this exact commit succeeded" };
}

export function describeNightly(run, sha, now = Date.now()) {
  if (!run) return "Extended validation: not recorded (optional)";
  if (run.headSha !== sha) return "Extended validation: an older-commit result is not evidence for this release (optional)";
  const hours = Math.max(0, Math.round((now - Date.parse(run.createdAt)) / 3_600_000));
  const age = Number.isFinite(hours) ? hours < 48 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago` : "age unknown";
  return `Extended validation: ${run.status === "completed" ? run.conclusion : run.status} ${age}, this commit`;
}

function targetMatches(deployment, target) {
  return target === "production" ? deployment.target === "production" : deployment.target == null || deployment.target === "preview";
}

export function findLiveDeploymentForSha(deployments, sha, target = "production") {
  return deployments.filter((d) => targetMatches(d, target) &&
    (d.meta?.githubCommitSha ?? d.gitSource?.sha) === sha && !FAILED_STATES.has(d.readyState ?? d.state))
    .sort((a, b) => Number((b.readyState ?? b.state) === "READY") - Number((a.readyState ?? a.state) === "READY"))[0] ?? null;
}

export function readLinkedProject(readFile, exists, root = ROOT) {
  let selected;
  for (const relative of LINK_FILES) {
    const file = path.join(root, relative);
    if (!exists(file)) continue;
    const value = JSON.parse(readFile(file));
    if (!/^prj_[A-Za-z0-9]+$/.test(value.projectId ?? "") || !/^team_[A-Za-z0-9]+$/.test(value.orgId ?? "")) throw new Error("Invalid linked Vercel project identifiers");
    if (selected && (selected.projectId !== value.projectId || selected.orgId !== value.orgId)) throw new Error("Conflicting root and app Vercel project links");
    selected ??= { projectId: value.projectId, orgId: value.orgId, file: relative };
  }
  if (!selected) throw new Error("No linked Vercel project. Run vercel link deliberately for this project first.");
  return selected;
}

export function deploymentRequestBody({ projectId, repoId, sha, ref = "main", target = "production" }) {
  const body = { name: "platform", project: projectId, gitSource: { type: "github", repoId, ref, sha } };
  if (target === "production") Object.assign(body, { target: "production", autoAssignCustomDomains: false });
  else if (target !== "preview") throw new Error("Unsupported release target");
  return body;
}

export function validateProjectMetadata(value, project, repository) {
  if (value?.id !== project.projectId || value.accountId !== project.orgId || value.name !== "platform" ||
    value.link?.type !== "github" || Number(value.link.repoId) !== repository.id ||
    value.link.productionBranch !== "main") throw new Error("Vercel project/team/GitHub repository context mismatch");
  return value;
}

export function validateDeployment(value, { project, repository, sha, ref, target }, { ready = false } = {}) {
  if (!DEPLOYMENT_ID_PATTERN.test(value?.id ?? value?.uid ?? "") || value.projectId !== project.projectId ||
    value.ownerId !== project.orgId || value.name !== "platform" || !targetMatches(value, target) ||
    value.gitSource?.type !== "github" || Number(value.gitSource.repoId) !== repository.id ||
    value.gitSource.sha !== sha || value.gitSource.ref !== ref ||
    (value.meta?.githubCommitSha !== undefined && value.meta.githubCommitSha !== sha) ||
    (ready && (value.readyState !== "READY" || value.meta?.githubCommitSha !== sha))) throw new Error("Deployment project/team/repository/target/source SHA metadata mismatch");
  if (typeof value.url !== "string" || !/^[a-z0-9][a-z0-9-]*\.vercel\.app$/.test(value.url)) throw new Error("Invalid unique deployment URL");
  return value;
}

function isCurrentProduction(deployment) {
  return deployment.target === "production" && PRODUCTION_ORIGINS.every((origin) => (deployment.alias ?? []).includes(new URL(origin).hostname));
}

/** Every external operation is injectable; tests never contact GitHub or Vercel. */
export async function executeRelease(options, io) {
  if (options.help) { io.log(HELP); return { status: "help" }; }
  const project = io.readProject();
  const repository = await io.getRepository();
  if (!Number.isSafeInteger(repository?.id) || repository.id <= 0 || repository.full_name !== "loehrning-ai/platform") throw new Error("Unexpected GitHub repository context");
  validateProjectMetadata(await io.getProject(project), project, repository);
  const target = options.preview ? "preview" : "production";
  const ref = validateRef(options.ref ?? (options.preview ? await io.currentBranch() : "main"));
  if (target === "production" && ref !== "main") throw new Error("Production releases only main");
  const sha = options.sha ?? await io.getBranchHead(repository, ref);
  if (!SHA_PATTERN.test(sha)) throw new Error("Invalid GitHub branch-head SHA");
  const assertHead = async () => {
    if (await io.getBranchHead(repository, ref) !== sha) throw new Error(`Branch ${ref} moved; release stopped before another mutation. Start again for its new head.`);
  };
  await assertHead();
  io.log(`Target ${target}; branch ${ref}; commit ${sha}`);
  const deadline = io.now() + options.waitTimeoutMin * 60_000;
  for (;;) {
    const verdict = evaluateCheckRuns(await io.getCheckRuns(repository, sha), sha);
    if (verdict.failed.length) throw new Error(`Failing checks: ${verdict.failed.join(", ")}`);
    if (verdict.ready) break;
    if (!options.wait || io.now() >= deadline) throw new Error(`Checks are not finished (${verdict.pending.join(", ")}); use --wait.`);
    io.log("Waiting for exact-commit verify");
    await io.sleep(30_000);
    await assertHead();
  }
  await assertHead();
  if (options.requireExtended || options.requireNightly) {
    const verdict = evaluateNightlyRun(await io.getExtendedRun(ref), sha);
    if (!verdict.ok) throw new Error(verdict.reason);
  }
  const context = { project, repository, sha, ref, target };
  const contract = await io.readSmokeContract(repository, sha);
  const currentProject = validateProjectMetadata(await io.getProject(project), project, repository);
  const currentId = currentProject.targets?.production?.id;
  let deployment, createdHere = false;
  if (options.observe) deployment = await io.getDeployment(project, options.observe);
  if (!deployment && target === "production" && currentId) {
    const current = await io.getDeployment(project, currentId);
    if (current.gitSource?.sha === sha || current.meta?.githubCommitSha === sha) deployment = current;
  }
  if (!deployment) {
    const existing = findLiveDeploymentForSha(await io.listDeployments(project, target), sha, target);
    if (existing) deployment = await io.getDeployment(project, existing.id ?? existing.uid);
  }
  if (!deployment) {
    if (!options.yes || options.observe) { io.log("Dry run passed; add --yes to create this verified release."); return { status: "dry-run", sha, target }; }
    await assertHead();
    const created = await io.createDeployment(project, deploymentRequestBody({ projectId: project.projectId, repoId: repository.id, sha, ref, target }));
    const id = created.id ?? created.uid;
    if (!DEPLOYMENT_ID_PATTERN.test(id ?? "")) throw new Error("Create response did not identify a deployment; inspect Vercel before retrying");
    deployment = await io.getDeployment(project, id);
    createdHere = true;
    io.log(`Created staged ${target} deployment ${id}`);
  } else io.log(`Reusing deployment ${deployment.id ?? deployment.uid}`);
  validateDeployment(deployment, context);
  const buildDeadline = io.now() + options.deployTimeoutMin * 60_000;
  while (deployment.readyState !== "READY") {
    if (FAILED_STATES.has(deployment.readyState)) throw new Error(`Deployment ${deployment.id} ended ${deployment.readyState}; not retrying the build`);
    if (io.now() >= buildDeadline) {
      if (createdHere) {
        try { await io.cancelDeployment(project, deployment.id); }
        catch { throw new Error(`Deployment ${deployment.id} timed out; cancellation could not be confirmed. Inspect it before retrying.`); }
        throw new Error(`Deployment ${deployment.id} timed out and was cancelled because this invocation created it`);
      }
      throw new Error(`Deployment ${deployment.id} is still running. It was not cancelled; repeat this command to observe the same build.`);
    }
    await io.sleep(10_000);
    deployment = validateDeployment(await io.getDeployment(project, deployment.id), context);
  }
  validateDeployment(deployment, context, { ready: true });
  await assertHead();
  if (createdHere && target === "production" && isCurrentProduction(deployment)) throw new Error("A newly created build unexpectedly owns the production domains; inspect Vercel staging configuration before another action");
  const canonicalSmoke = async () => {
    for (const origin of PRODUCTION_ORIGINS) await io.smoke(origin, contract, { project, deployment, authenticated: false });
  };
  if (target === "production" && isCurrentProduction(deployment)) {
    await canonicalSmoke();
    io.log(`Production is already current and verified: ${sha}`);
    return { status: "current", sha, target, deploymentId: deployment.id, url: deployment.url };
  }
  await io.smoke(`https://${deployment.url}`, contract, { project, deployment, authenticated: true });
  if (target === "preview" || options.observe) return { status: "ready", sha, target, deploymentId: deployment.id, url: deployment.url };
  if (!options.yes) { io.log("Staged build verified; add --yes to promote this same deployment."); return { status: "staged", sha, target, deploymentId: deployment.id }; }
  deployment = validateDeployment(await io.getDeployment(project, deployment.id), context, { ready: true });
  validateProjectMetadata(await io.getProject(project), project, repository);
  await assertHead();
  await io.promoteDeployment(project, deployment.id);
  const promotionDeadline = io.now() + options.deployTimeoutMin * 60_000;
  for (;;) {
    deployment = validateDeployment(await io.getDeployment(project, deployment.id), context, { ready: true });
    if (isCurrentProduction(deployment)) break;
    if (io.now() >= promotionDeadline) throw new Error("Promotion has not assigned the canonical domains; inspect it before taking another action");
    await io.sleep(5_000);
  }
  await canonicalSmoke();
  io.log(`Production READY: ${sha}; ${deployment.id}`);
  return { status: "promoted", sha, target, deploymentId: deployment.id, url: deployment.url };
}

export function createDefaultAdapters(root = ROOT, { exec = execFileSync, execAsync = promisify(execFile), fetch: fetchResponse = globalThis.fetch } = {}) {
  const run = (command, args, input, { cwd = root, timeout = 60_000 } = {}) => {
    try { return exec(command, args, { cwd, encoding: "utf8", input, timeout, maxBuffer: 32 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] }); }
    catch { throw new Error(`${command} command failed or timed out; no automatic retry was attempted`); }
  };
  const runAsync = async (command, args, { cwd, timeout }) => {
    try { return (await execAsync(command, args, { cwd, encoding: "utf8", timeout, maxBuffer: 32 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] })).stdout; }
    catch { throw new Error(`${command} command failed or timed out; no automatic retry was attempted`); }
  };
  const gh = (endpoint, ...flags) => run("gh", ["api", endpoint, ...flags]);
  const api = (project, endpoint, body, method = body === undefined ? "GET" : "POST") => JSON.parse(run("vercel", ["api", endpoint, "--scope", project.orgId, ...(method === "GET" ? [] : ["--method", method]), ...(body === undefined ? [] : ["--input", "-"])], body === undefined ? undefined : JSON.stringify(body)));
  const projectCwd = (p) => path.resolve(root, path.dirname(path.dirname(p.file)));
  const readPublic = async (base, route) => {
    let url = new URL(route, base);
    for (let redirects = 0; redirects <= 3; redirects++) {
      const response = await fetchResponse(url, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
      if ([301, 302, 307, 308].includes(response.status)) {
        const next = new URL(response.headers.get("location") ?? "", url);
        await response.body?.cancel();
        if (!PRODUCTION_ORIGINS.includes(next.origin) || next.pathname !== url.pathname || next.search !== url.search) throw new Error(`${route}: unexpected canonical redirect`);
        url = next; continue;
      }
      if (Number(response.headers.get("content-length") ?? "0") > MAX_RESPONSE_BYTES) throw new Error(`${route}: response too large`);
      const reader = response.body?.getReader(); const chunks = []; let size = 0;
      if (reader) for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new Error(`${route}: response too large`); }
        chunks.push(Buffer.from(value));
      }
      return { status: response.status, bytes: Buffer.concat(chunks) };
    }
    throw new Error(`${route}: too many redirects`);
  };
  return {
    log: (message) => process.stdout.write(`${message}\n`), now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    readProject: () => readLinkedProject((f) => readFileSync(f, "utf8"), existsSync, root),
    currentBranch: () => run("git", ["symbolic-ref", "--short", "HEAD"]).trim(),
    getRepository: () => JSON.parse(gh("repos/:owner/:repo")),
    getProject: (p) => api(p, `/v9/projects/${p.projectId}`),
    getBranchHead: (r, ref) => JSON.parse(gh(`repos/${r.full_name}/git/ref/heads/${ref.split("/").map(encodeURIComponent).join("/")}`)).object.sha,
    getCheckRuns: (r, sha) => JSON.parse(gh(`repos/${r.full_name}/commits/${sha}/check-runs?per_page=100`)).check_runs,
    getExtendedRun: async (ref) => JSON.parse(run("gh", ["run", "list", "--workflow=nightly.yml", `--branch=${ref}`, "--limit=1", "--json=status,conclusion,headSha,createdAt,url"]))[0] ?? null,
    getDeployment: (p, id) => api(p, `/v13/deployments/${id}`),
    listDeployments: async (p, target) => {
      const deployments = []; let until;
      for (let page = 0; page < 10; page++) {
        const value = api(p, `/v6/deployments?projectId=${p.projectId}&limit=100${target === "production" ? "&target=production" : ""}${until ? `&until=${until}` : ""}`);
        deployments.push(...(value.deployments ?? []));
        const next = value.pagination?.next;
        if (!next) return deployments;
        if (!Number.isSafeInteger(next) || next === until) throw new Error("Invalid deployment inventory pagination");
        until = next;
      }
      throw new Error("Deployment inventory exceeded its safe bound; inspect existing builds before creating another");
    },
    createDeployment: (p, body) => api(p, "/v13/deployments", body),
    cancelDeployment: (p, id) => api(p, `/v12/deployments/${id}/cancel`, undefined, "PATCH"),
    promoteDeployment: (p, id) => run("vercel", ["promote", id, "--yes", "--scope", p.orgId, "--timeout", "180s"], undefined, { cwd: projectCwd(p), timeout: 240_000 }),
    readSmokeContract: async (repository, sha) => {
      const files = {};
      for (const file of smokeSourcePaths().slice(0, 1)) {
        const value = JSON.parse(gh(`repos/${repository.full_name}/contents/${file.split("/").map(encodeURIComponent).join("/")}?ref=${sha}`));
        if (value.type !== "file" || value.encoding !== "base64" || typeof value.content !== "string") throw new Error(`Missing committed source: ${file}`);
        files[file] = Buffer.from(value.content, "base64");
      }
      const tree = JSON.parse(gh(`repos/${repository.full_name}/git/trees/${sha}?recursive=1`));
      return buildSmokeContract(files, tree);
    },
    smoke: async (baseUrl, contract, { project, deployment, authenticated }) => {
      const request = authenticated ? async (_base, route) => {
        const directory = mkdtempSync(path.join(tmpdir(), "loehrning-release-smoke-"));
        try {
          const file = path.join(directory, "body");
          const status = (await runAsync("vercel", ["curl", route, "--deployment", `https://${deployment.url}`, "--scope", project.orgId, "--", "--silent", "--show-error", "--max-time", "20", "--max-filesize", String(MAX_RESPONSE_BYTES), "--output", file, "--write-out", "%{http_code}"], { cwd: projectCwd(project), timeout: 45_000 })).trim();
          if (!/^\d{3}$/.test(status) || statSync(file).size > MAX_RESPONSE_BYTES) throw new Error(`${route}: invalid staged response`);
          return { status: Number(status), bytes: readFileSync(file) };
        } finally { rmSync(directory, { recursive: true, force: true }); }
      } : readPublic;
      return runSmoke({ baseUrl, contract, request, log: (message) => process.stdout.write(`${message}\n`) });
    },
  };
}
