#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { lstatSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { providerFreeVerificationEnvironment } from "./environment-policy.mjs";

export const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BROWSERS = ["chromium", "webkit"];
const DEFAULT_PORT = 3430;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

function regularFile(file) {
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${path.basename(file)} must be a regular project file.`);
  }
  return readFileSync(file, "utf8");
}

export function readToolchain(root = REPOSITORY_ROOT) {
  const node = regularFile(path.join(root, ".nvmrc")).trim();
  const otherNode = regularFile(path.join(root, ".node-version")).trim();
  const pkg = JSON.parse(regularFile(path.join(root, "package.json")));
  const bun = /^bun@(\d+\.\d+\.\d+)$/.exec(pkg.packageManager ?? "")?.[1];
  if (!/^\d+\.\d+\.\d+$/.test(node) || node !== otherNode || !bun) {
    throw new Error("The Node pin files and packageManager must declare consistent, exact toolchain versions.");
  }
  return { node, bun };
}

export function assertToolchain(expected, actual) {
  if (actual.node.replace(/^v/, "") !== expected.node) {
    throw new Error(`Use Node ${expected.node} from .nvmrc. Run nvm install and nvm use before this command.`);
  }
  if (actual.bun !== expected.bun) {
    throw new Error(`Use Bun ${expected.bun} from packageManager before this command.`);
  }
}

function installedVersions(environment) {
  const bun = spawnSync("bun", ["--version"], { env: environment, encoding: "utf8" });
  if (bun.error || bun.status !== 0) throw new Error("Bun is unavailable. Install the version declared in packageManager.");
  return { node: process.versions.node, bun: bun.stdout.trim() };
}

export function resolveWorkspaceCli(root, cli) {
  try {
    return createRequire(path.join(root, "packages/website/package.json")).resolve(cli);
  } catch {
    throw new Error("Workspace dependencies are missing. Run node scripts/development.mjs setup from the repository root.");
  }
}

function assertOwnedDirectory(directory) {
  let stat;
  try {
    stat = lstatSync(directory);
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${path.basename(directory)} must be a real directory in this checkout; shared symlinks are not changed.`);
  }
}

export function assertLocalInstallDirectories(root) {
  assertOwnedDirectory(path.join(root, "node_modules"));
  assertOwnedDirectory(path.join(root, "packages/website/node_modules"));
}

export function parseDevArguments(input, source = {}) {
  const args = input[0] === "--" ? input.slice(1) : [...input];
  let port = source.LOEHRNING_DEV_PORT;
  let explicit = port !== undefined;
  let host = "127.0.0.1";
  const nextArguments = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "-p" || arg === "--port" || arg.startsWith("--port=")) {
      port = arg.startsWith("--port=") ? arg.slice(7) : args[++index];
      explicit = true;
    } else if (arg === "-H" || arg === "--hostname" || arg.startsWith("--hostname=")) {
      host = arg.startsWith("--hostname=") ? arg.slice(11) : args[++index];
    } else if (["--webpack", "--turbopack", "--turbo"].includes(arg)) {
      nextArguments.push(arg);
    } else {
      throw new Error("Unsupported development option. Use --help for the supported options.");
    }
  }
  const raw = explicit ? port : String(DEFAULT_PORT);
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw) || Number(raw) > 65_535) {
    throw new Error("Development port must be an integer between 1 and 65535.");
  }
  if (!LOOPBACK_HOSTS.has(host)) throw new Error("Development hostname must be a loopback host.");
  return { port: Number(raw), explicit, host, nextArguments };
}

export function portIsAvailable(port, host) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") resolve(false);
      else reject(error);
    });
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

export async function selectDevPort(options, probe = portIsAvailable) {
  const attempts = options.explicit ? 1 : Math.min(20, 65_536 - options.port);
  for (let offset = 0; offset < attempts; offset += 1) {
    const port = options.port + offset;
    if (await probe(port, options.host)) return port;
  }
  throw new Error(options.explicit
    ? "The requested development port is occupied. Choose another --port; the existing listener was left running."
    : "No development port is available in the bounded range. Choose an explicit --port.");
}

/** Own one child process group; never signal a PID discovered from a port. */
export function runOwnedChild(command, args, options = {}) {
  const signalSource = options.signalSource ?? process;
  const grouped = process.platform !== "win32";
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: options.stdio ?? "inherit",
      detached: grouped,
    });
    let requestedSignal;
    let timer;
    let settled = false;
    const signalChild = (signal) => {
      if (!child.pid) return;
      try {
        if (grouped) process.kill(-child.pid, signal);
        else child.kill(signal);
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
    };
    const stop = (signal) => {
      if (settled || requestedSignal) return;
      requestedSignal = signal;
      signalChild(signal);
      timer = setTimeout(() => signalChild("SIGKILL"), options.shutdownTimeoutMs ?? 5_000);
      timer.unref();
    };
    const interrupt = () => stop("SIGINT");
    const terminate = () => stop("SIGTERM");
    signalSource.on("SIGINT", interrupt);
    signalSource.on("SIGTERM", terminate);
    const clean = () => {
      settled = true;
      clearTimeout(timer);
      signalSource.off("SIGINT", interrupt);
      signalSource.off("SIGTERM", terminate);
    };
    child.once("error", (error) => { clean(); reject(error); });
    child.once("exit", () => {
      // Workers can inherit captured pipes and prevent close after their parent
      // exits. Stop the owned group at exit so those pipes can close as well.
      if (grouped) signalChild("SIGKILL");
    });
    child.once("close", (code) => {
      clean();
      resolve(requestedSignal === "SIGINT" ? 130 : requestedSignal === "SIGTERM" ? 143 : code ?? 1);
    });
    options.onSpawn?.(child);
  });
}

export function checkBrowserInstallations(root, environment) {
  const probe = String.raw`
    const { createRequire } = require('node:module');
    const { accessSync, constants } = require('node:fs');
    const browsers = createRequire(process.argv[1])('@playwright/test');
    for (const name of ['chromium', 'webkit']) {
      try { accessSync(browsers[name].executablePath(), constants.X_OK); }
      catch { console.error(name + ' is missing. Run node scripts/development.mjs setup.'); process.exitCode = 1; }
    }
  `;
  const result = spawnSync(process.execPath, ["-e", probe, path.join(root, "packages/website/package.json")], {
    env: environment, encoding: "utf8",
  });
  if (result.error || result.status !== 0) {
    throw new Error("Locked Chromium and WebKit installations are required. Run node scripts/development.mjs setup.");
  }
}

export async function main(argv = process.argv.slice(2), dependencies = {}) {
  const root = dependencies.root ?? REPOSITORY_ROOT;
  const source = dependencies.environment ?? process.env;
  const environment = {
    ...providerFreeVerificationEnvironment(source),
    // An explicit pinned Node entry point must also govern tools that spawn `node` by name.
    PATH: [path.dirname(process.execPath), source.PATH].filter(Boolean).join(path.delimiter),
  };
  const run = dependencies.runChild ?? runOwnedChild;
  const cli = dependencies.resolveCli ?? resolveWorkspaceCli;
  const browserCheck = dependencies.browserCheck ?? checkBrowserInstallations;
  const log = dependencies.log ?? console.log;
  const [command, ...args] = argv;
  if (!command || command === "--help" || args.includes("--help")) {
    log("Usage: node scripts/development.mjs doctor|setup [--skip-browsers]|dev [--port N] [--hostname LOOPBACK] [--webpack|--turbopack]");
    return 0;
  }
  if (!["doctor", "setup", "dev"].includes(command)) throw new Error("Unknown development command. Use --help.");
  if (command !== "dev" && args.some((arg) => arg !== "--skip-browsers" && arg !== "--")) {
    throw new Error("doctor/setup accept only --skip-browsers.");
  }
  const pins = readToolchain(root);
  assertToolchain(pins, dependencies.versions ?? installedVersions(environment));
  assertLocalInstallDirectories(root);
  const website = path.join(root, "packages/website");
  const childOptions = { cwd: website, env: environment };
  const skipBrowsers = args.includes("--skip-browsers");
  if (command === "setup") {
    regularFile(path.join(root, "bun.lock"));
    regularFile(path.join(root, "bunfig.toml"));
    let code = await run("bun", ["install", "--frozen-lockfile", "--ignore-scripts"], { cwd: root, env: environment });
    if (code !== 0) return code;
    cli(root, "next/dist/bin/next");
    if (!skipBrowsers) {
      code = await run(process.execPath, [cli(root, "@playwright/test/cli"), "install", ...BROWSERS], childOptions);
      if (code !== 0) return code;
      browserCheck(root, environment);
    }
    log(`Setup ready: Node ${pins.node}, Bun ${pins.bun}${skipBrowsers ? "; browsers explicitly skipped" : ", Chromium and WebKit"}.`);
    return 0;
  }
  const next = cli(root, "next/dist/bin/next");
  if (command === "doctor") {
    if (!skipBrowsers) browserCheck(root, environment);
    log(`Development checks passed: Node ${pins.node}, Bun ${pins.bun}${skipBrowsers ? "; browser check explicitly skipped" : ", Chromium and WebKit"}.`);
    return 0;
  }
  assertOwnedDirectory(path.join(website, ".next"));
  assertOwnedDirectory(path.join(website, ".next/dev"));
  const options = parseDevArguments(args, source);
  const preflight = await run(process.execPath, [path.join(website, "scripts/generate-english-route-mirror.mjs"), "--check"], childOptions);
  if (preflight !== 0) return preflight;
  const port = await selectDevPort(options, dependencies.portProbe);
  const address = options.host === "::1" ? "[::1]" : options.host;
  log(`Starting provider-free development at http://${address}:${port}`);
  return run(process.execPath, [next, "dev", "--experimental-next-config-strip-types", "--hostname", options.host, "--port", String(port), ...options.nextArguments], childOptions);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then((code) => { process.exitCode = code; }, (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
