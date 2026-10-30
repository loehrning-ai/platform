import assert from "node:assert/strict";
import { EventEmitter, once } from "node:events";
import { createServer } from "node:net";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  REPOSITORY_ROOT,
  assertLocalInstallDirectories,
  assertToolchain,
  checkBrowserInstallations,
  main,
  parseDevArguments,
  portIsAvailable,
  readToolchain,
  resolveWorkspaceCli,
  runOwnedChild,
  selectDevPort,
} from "../development.mjs";
import { providerFreeVerificationEnvironment } from "../environment-policy.mjs";

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "loehrning-development-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, "packages/website/scripts"), { recursive: true });
  writeFileSync(path.join(root, ".nvmrc"), "24.22.1\n");
  writeFileSync(path.join(root, ".node-version"), "24.22.1\n");
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ packageManager: "bun@1.3.10" }));
  writeFileSync(path.join(root, "packages/website/package.json"), "{}");
  writeFileSync(path.join(root, "bun.lock"), "{}");
  writeFileSync(path.join(root, "bunfig.toml"), "[install]\nignoreScripts = true\n");
  return root;
}

const versions = { node: "24.22.1", bun: "1.3.10" };
const environment = { PATH: process.env.PATH, HOME: tmpdir() };

test("declared runtime pins, CI setup and verified Bun bootstrap agree", () => {
  const pins = readToolchain();
  const setup = readFileSync(path.join(REPOSITORY_ROOT, ".github/actions/setup/action.yml"), "utf8");
  const bootstrap = readFileSync(path.join(REPOSITORY_ROOT, ".github/scripts/install-verified-bun.sh"), "utf8");
  const nodeFile = /node-version-file:\s*["']?(\.nvmrc|\.node-version)["']?/.exec(setup);
  if (!nodeFile) assert.match(setup, new RegExp(`node-version:\\s*["']?${pins.node.replaceAll(".", "\\.")}["']?`));
  assert.match(bootstrap, new RegExp(`BUN_VERSION=["']${pins.bun.replaceAll(".", "\\.")}["']`));
});

test("mismatched Node pins and unsupported runtimes fail before starting commands", async (t) => {
  const root = fixture(t);
  assert.throws(() => assertToolchain(versions, { ...versions, node: "26.12.0" }), /nvm install and nvm use/);
  assert.throws(() => assertToolchain(versions, { ...versions, bun: "1.4.0" }), /Use Bun 1.3.10/);
  let started = false;
  await assert.rejects(main(["setup"], {
    root, environment, versions: { ...versions, node: "26.12.0" },
    runChild: async () => { started = true; return 0; },
  }), /Use Node/);
  assert.equal(started, false);
  writeFileSync(path.join(root, ".node-version"), "24.0.0\n");
  assert.throws(() => readToolchain(root), /consistent, exact/);
});

test("setup uses the frozen lock, denies lifecycle scripts and installs both locked engines", async (t) => {
  const root = fixture(t);
  const calls = [];
  let browserChecks = 0;
  const result = await main(["setup"], {
    root, environment, versions, log() {},
    resolveCli: (_root, cli) => cli,
    runChild: async (...args) => { calls.push(args); return 0; },
    browserCheck() { browserChecks += 1; },
  });
  assert.equal(result, 0);
  assert.deepEqual(calls[0].slice(0, 2), ["bun", ["install", "--frozen-lockfile", "--ignore-scripts"]]);
  assert.equal(calls[0][2].cwd, root);
  assert.deepEqual(calls[1][1], ["@playwright/test/cli", "install", "chromium", "webkit"]);
  assert.match(calls[0][2].env.BUN_OPTIONS, /--no-env-file/);
  assert.equal(browserChecks, 1);
});

test("setup stops on an install failure; skipping browsers is explicit", async (t) => {
  const root = fixture(t);
  let calls = 0;
  const dependencies = {
    root, environment, versions, log() {}, resolveCli: (_root, cli) => cli,
    browserCheck() { throw new Error("browser probe must not run"); },
  };
  assert.equal(await main(["setup"], { ...dependencies, runChild: async () => { calls += 1; return 9; } }), 9);
  assert.equal(calls, 1);
  calls = 0;
  assert.equal(await main(["setup", "--skip-browsers"], { ...dependencies, runChild: async () => { calls += 1; return 0; } }), 0);
  assert.equal(calls, 1);
});

test("dev supports Playwright port forwarding and rejects invalid ports or public binds", () => {
  assert.equal(parseDevArguments(["--", "-p", "3442"]).port, 3442);
  assert.equal(parseDevArguments(["--port=3443"]).port, 3443);
  assert.equal(parseDevArguments([], { LOEHRNING_DEV_PORT: "3444" }).port, 3444);
  assert.equal(parseDevArguments(["--hostname", "::1"]).host, "::1");
  for (const args of [["-p"], ["--port", "0"], ["--port", "65536"], ["--port", "3.5"], ["--port", " 3430"], ["--hostname", "0.0.0.0"], ["elsewhere"]]) {
    assert.throws(() => parseDevArguments(args));
  }
});

test("occupied default port selects another without stopping its listener; explicit port fails", async (t) => {
  const server = createServer((socket) => socket.end());
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const port = server.address().port;
  const selected = await selectDevPort({ port, host: "127.0.0.1", explicit: false });
  assert.ok(selected > port && selected < port + 20);
  assert.equal(server.listening, true);
  await assert.rejects(selectDevPort({ port, host: "127.0.0.1", explicit: true }), /existing listener was left running/);
  assert.equal(server.listening, true);
});

test("port search is bounded", async () => {
  let attempts = 0;
  await assert.rejects(selectDevPort({ port: 3430, host: "127.0.0.1", explicit: false }, async () => { attempts += 1; return false; }), /bounded range/);
  assert.equal(attempts, 20);
});

test("dev wraps its preflight and Next in the same provider-free environment", async (t) => {
  const root = fixture(t);
  const calls = [];
  const result = await main(["dev", "--", "-p", "3446", "--webpack"], {
    root, versions, log() {},
    environment: { ...environment, ANTHROPIC_API_KEY: "fixture-canary", VERCEL: "1", SSH_AUTH_SOCK: "fixture-socket", NODE_OPTIONS: "fixture-preload" },
    resolveCli: () => "/fixture/next-cli",
    portProbe: async () => true,
    runChild: async (...args) => { calls.push(args); return 0; },
  });
  assert.equal(result, 0);
  assert.equal(calls.length, 2);
  assert.match(calls[0][1][0], /generate-english-route-mirror\.mjs$/);
  assert.deepEqual(calls[0][1].slice(1), ["--check"]);
  assert.deepEqual(calls[1][1], ["/fixture/next-cli", "dev", "--experimental-next-config-strip-types", "--hostname", "127.0.0.1", "--port", "3446", "--webpack"]);
  for (const call of calls) {
    assert.equal(call[2].cwd, path.join(root, "packages/website"));
    assert.equal(call[2].env.ANTHROPIC_API_KEY, "");
    assert.equal(call[2].env.VERCEL, "");
    assert.equal(call[2].env.SSH_AUTH_SOCK, undefined);
    assert.match(call[2].env.NODE_OPTIONS, /deny-dotenv-loading\.cjs/);
    assert.equal(call[2].env.PATH.split(path.delimiter)[0], path.dirname(process.execPath));
  }
});

test("a failing dev preflight cannot start Next", async (t) => {
  const root = fixture(t);
  let calls = 0;
  assert.equal(await main(["dev"], {
    root, versions, environment, resolveCli: () => "/fixture/next-cli", log() {},
    runChild: async () => { calls += 1; return 7; },
  }), 7);
  assert.equal(calls, 1);
});

test("setup rejects shared node_modules and resolves the workspace independent of shell cwd", (t) => {
  const root = fixture(t);
  const shared = path.join(root, "shared");
  mkdirSync(shared);
  symlinkSync(shared, path.join(root, "node_modules"), "dir");
  assert.throws(() => assertLocalInstallDirectories(root), /shared symlinks are not changed/);
  rmSync(path.join(root, "node_modules"));
  const cli = path.join(root, "node_modules/next/dist/bin/next");
  mkdirSync(path.dirname(cli), { recursive: true });
  writeFileSync(cli, "// synthetic CLI fixture\n");
  assert.equal(resolveWorkspaceCli(root, "next/dist/bin/next"), realpathSync(cli));
  assert.throws(() => resolveWorkspaceCli(root, "missing-cli"), /Workspace dependencies are missing/);
});

test("dangling dependency and build-output symlinks fail before starting commands", async (t) => {
  const root = fixture(t);
  let started = false;
  const dependencies = {
    root, versions, environment, log() {}, resolveCli: () => "/fixture/next-cli",
    runChild: async () => { started = true; return 0; },
  };
  for (const [command, relative] of [
    ["setup", "node_modules"],
    ["setup", "packages/website/node_modules"],
    ["dev", "packages/website/.next"],
    ["dev", "packages/website/.next/dev"],
  ]) {
    const link = path.join(root, relative);
    mkdirSync(path.dirname(link), { recursive: true });
    symlinkSync(path.join(root, "missing-shared-target"), link, "dir");
    await assert.rejects(main([command], dependencies), /must be a real directory/);
    assert.equal(started, false, relative);
    rmSync(link);
  }
});

test("browser doctor fails when either locked executable is absent", (t) => {
  const root = fixture(t);
  const directory = path.join(root, "node_modules/@playwright/test");
  mkdirSync(directory, { recursive: true });
  const binary = path.join(root, "fixture-browser");
  writeFileSync(binary, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  writeFileSync(path.join(directory, "index.js"), `module.exports = { chromium: { executablePath: () => ${JSON.stringify(binary)} }, webkit: { executablePath: () => ${JSON.stringify(binary)} } };\n`);
  const childEnvironment = providerFreeVerificationEnvironment(environment);
  assert.doesNotThrow(() => checkBrowserInstallations(root, childEnvironment));
  rmSync(binary);
  assert.throws(() => checkBrowserInstallations(root, childEnvironment), /Locked Chromium and WebKit/);
});

test("owned child sees only scrubbed synthetic provider controls", async () => {
  let output = "";
  const result = await runOwnedChild(process.execPath, ["-e", "console.log(JSON.stringify({ key: process.env.ANTHROPIC_API_KEY, socket: process.env.SSH_AUTH_SOCK, guard: process.env.NODE_OPTIONS.includes('deny-dotenv-loading.cjs') }))"], {
    env: providerFreeVerificationEnvironment({ ...environment, ANTHROPIC_API_KEY: "fixture-canary", SSH_AUTH_SOCK: "fixture-socket" }),
    stdio: ["ignore", "pipe", "pipe"],
    onSpawn(child) { child.stdout.on("data", (chunk) => { output += chunk; }); },
  });
  assert.equal(result, 0);
  assert.deepEqual(JSON.parse(output), { key: "", guard: true });
});

for (const [signal, exitCode] of [["SIGINT", 130], ["SIGTERM", 143]]) {
  test(`owned child handles ${signal} and its unrelated listener remains running`, { timeout: 10_000, skip: process.platform === "win32" }, async (t) => {
    const server = createServer((socket) => socket.end());
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => server.close());
    const signals = new EventEmitter();
    let ready;
    const started = new Promise((resolve) => { ready = resolve; });
    let output = "";
    const childResult = runOwnedChild(process.execPath, ["-e", `process.on('${signal}', () => { console.log('stopped'); process.exit(0); }); console.log('ready'); setInterval(() => {}, 1000);`], {
      env: providerFreeVerificationEnvironment(environment),
      signalSource: signals,
      stdio: ["ignore", "pipe", "pipe"],
      onSpawn(child) {
        t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); });
        child.stdout.on("data", (chunk) => { output += chunk; if (output.includes("ready")) ready(); });
      },
    });
    await Promise.race([started, childResult.then((code) => { throw new Error(`Fixture exited before readiness: ${code}`); })]);
    signals.emit(signal);
    assert.equal(await childResult, exitCode);
    assert.match(output, /stopped/);
    assert.equal(server.listening, true);
    assert.equal(signals.listenerCount(signal), 0);
  });
}

test("shutdown is bounded when an owned child ignores termination", { timeout: 10_000, skip: process.platform === "win32" }, async (t) => {
  const signals = new EventEmitter();
  let ready;
  const started = new Promise((resolve) => { ready = resolve; });
  const result = runOwnedChild(process.execPath, ["-e", "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000);"], {
    env: providerFreeVerificationEnvironment(environment), signalSource: signals,
    shutdownTimeoutMs: 100, stdio: ["ignore", "pipe", "pipe"],
    onSpawn(child) {
      t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); });
      child.stdout.once("data", ready);
    },
  });
  await Promise.race([started, result.then((code) => { throw new Error(`Fixture exited before readiness: ${code}`); })]);
  signals.emit("SIGTERM");
  assert.equal(await result, 143);
  assert.equal(signals.listenerCount("SIGTERM"), 0);
});

test("owned descendants cannot keep a listener after their parent exits", { timeout: 10_000, skip: process.platform === "win32" }, async (t) => {
  const signals = new EventEmitter();
  let ready;
  const started = new Promise((resolve) => { ready = resolve; });
  let worker;
  const workerCode = "process.on('SIGTERM', () => {}); const server=require('node:net').createServer(); server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({pid:process.pid,port:server.address().port})));";
  const parentCode = `const child=require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(workerCode)}],{stdio:['ignore','pipe','ignore']}); child.stdout.pipe(process.stdout); process.on('SIGTERM',()=>process.exit(0));`;
  let output = "";
  const result = runOwnedChild(process.execPath, ["-e", parentCode], {
    env: providerFreeVerificationEnvironment(environment), signalSource: signals, stdio: ["ignore", "pipe", "pipe"],
    onSpawn(child) {
      t.after(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
        if (worker) { try { process.kill(worker.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; } }
      });
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes("\n")) { worker = JSON.parse(output.trim()); ready(); }
      });
    },
  });
  await Promise.race([started, result.then((code) => { throw new Error(`Fixture exited before readiness: ${code}`); })]);
  signals.emit("SIGTERM");
  assert.equal(await result, 143);
  let released = false;
  for (let attempt = 0; attempt < 20 && !released; attempt += 1) {
    released = await portIsAvailable(worker.port, "127.0.0.1");
    if (!released) await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(released, true, "owned worker must release its socket on shutdown");
});

test("natural child failure closes inherited worker pipes and preserves its exit code", { timeout: 10_000, skip: process.platform === "win32" }, async (t) => {
  let worker;
  let output = "";
  const workerCode = "const server=require('node:net').createServer(); server.listen(0,'127.0.0.1',()=>process.send({pid:process.pid,port:server.address().port}));";
  const parentCode = `const child=require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(workerCode)}],{stdio:['ignore','inherit','inherit','ipc']}); child.once('message',value=>process.stdout.write(JSON.stringify(value)+'\\n',()=>process.exit(4)));`;
  const result = runOwnedChild(process.execPath, ["-e", parentCode], {
    env: providerFreeVerificationEnvironment(environment), stdio: ["ignore", "pipe", "pipe"],
    onSpawn(child) {
      t.after(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
        if (worker) { try { process.kill(worker.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; } }
      });
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes("\n")) worker = JSON.parse(output.trim());
      });
    },
  });
  let deadline;
  try {
    const code = await Promise.race([
      result,
      new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error("Owned worker pipe prevented completion after parent exit")), 3_000); }),
    ]);
    assert.equal(code, 4);
    assert.ok(worker, "worker readiness was reported before the parent exited");
    let released = false;
    for (let attempt = 0; attempt < 20 && !released; attempt++) {
      released = await portIsAvailable(worker.port, "127.0.0.1");
      if (!released) await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(released, true, "naturally exited parent's worker must release its socket");
  } finally {
    clearTimeout(deadline);
  }
});

test("unexpected child failure remains a failure and help works without the pinned runtime", async () => {
  assert.equal(await runOwnedChild(process.execPath, ["-e", "process.exit(4)"], { env: providerFreeVerificationEnvironment(environment), stdio: "ignore" }), 4);
  const result = spawnSync(process.execPath, [path.join(REPOSITORY_ROOT, "scripts/development.mjs"), "--help"], { encoding: "utf8", env: providerFreeVerificationEnvironment(environment) });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /doctor\|setup/);
});
