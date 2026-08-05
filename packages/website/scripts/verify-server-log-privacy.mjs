#!/usr/bin/env node

import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { minimalVerificationEnvironment } from "../../../scripts/environment-policy.mjs";

const cwd = process.cwd();
const buildId = resolve(cwd, ".next/BUILD_ID");
const nextBin = resolve(cwd, "node_modules/next/dist/bin/next");
const preload = resolve(cwd, "scripts/server-log-privacy-probe-preload.cjs");
const probeCanary = (kind, suffix) =>
  ["LOEHRNING", "SERVER", "LOG", kind, "CANARY", suffix].join("_");
const ERROR_CANARY = probeCanary("ERROR", "7f41f4d6b58a");
const PRIMITIVE_CANARY = probeCanary("PRIMITIVE", "129c3e8ad470");
const SAFE_REQUEST_ID = "123e4567-e89b-42d3-a456-426614174042";
const REDACTED_LINE = '{"event":"server-error-redacted"}';
const DONE_LINE = '{"event":"server-log-privacy-probe-done"}';
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const PROBE_TIMEOUT_MS = 30_000;

for (const path of [buildId, nextBin, preload]) {
  await access(path);
}

const port = await new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const selected =
      typeof address === "object" && address ? address.port : undefined;
    server.close((error) => {
      if (error) reject(error);
      else if (selected) resolvePort(selected);
      else reject(new Error("Could not allocate a loopback probe port."));
    });
  });
});

const env = minimalVerificationEnvironment(process.env);
for (const key of [
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_DPA_CONFIRMED_AT",
  "SENTRY_RETENTION_DAYS",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_DPA_CONFIRMED_AT",
  "ANTHROPIC_RETENTION_DAYS",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RATE_LIMIT_HMAC_SECRET",
  "SUPABASE_REGION",
  "SUPABASE_DPA_CONFIRMED_AT",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_TELEMETRY_ENABLED",
]) {
  // Explicit empty values take precedence when Next loads .env.local.
  env[key] = "";
}
Object.assign(env, {
  AI_NATIVE_PRACTICE_ENABLED: "false",
  FEEDBACK_ENABLED: "false",
  NODE_ENV: "production",
  HOSTNAME: "127.0.0.1",
  PORT: String(port),
  SERVER_LOG_PRIVACY_PROBE: "1",
  NODE_OPTIONS: `${env.NODE_OPTIONS ?? ""} --require=${preload}`.trim(),
});

const child = spawn(
  process.execPath,
  [nextBin, "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let stdout = Buffer.alloc(0);
let stderr = Buffer.alloc(0);
let outputOverflow = false;

function appendOutput(current, chunk) {
  const next = Buffer.concat([current, chunk]);
  if (next.length > MAX_OUTPUT_BYTES) {
    outputOverflow = true;
    child.kill("SIGTERM");
    return next.subarray(0, MAX_OUTPUT_BYTES);
  }
  return next;
}

child.stdout.on("data", (chunk) => {
  stdout = appendOutput(stdout, Buffer.from(chunk));
});
child.stderr.on("data", (chunk) => {
  stderr = appendOutput(stderr, Buffer.from(chunk));
});

const childExit = new Promise((resolveExit) => {
  child.once("exit", (code, signal) => resolveExit({ code, signal }));
});

const startedAt = Date.now();
let healthReady = false;
let probeDone = false;

try {
  while (Date.now() - startedAt < PROBE_TIMEOUT_MS) {
    const combined = Buffer.concat([stdout, stderr]).toString("utf8");
    probeDone = combined.includes(DONE_LINE);
    if (!healthReady) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
          signal: AbortSignal.timeout(500),
        });
        healthReady = response.ok;
      } catch {
        // Server initialization is still in progress.
      }
    }
    if (healthReady && probeDone) break;
    if (child.exitCode !== null || outputOverflow) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
} finally {
  if (child.exitCode === null) child.kill("SIGTERM");
}

const exitTimeout = new Promise((resolveExit) => {
  const timer = setTimeout(
    () => resolveExit({ code: null, signal: "probe-exit-timeout" }),
    5_000,
  );
  timer.unref();
});
const exit = await Promise.race([childExit, exitTimeout]);
if (exit.signal === "probe-exit-timeout" && child.exitCode === null) {
  child.kill("SIGKILL");
}
const combined = Buffer.concat([stdout, stderr]).toString("utf8");
const failures = [];

if (outputOverflow) failures.push("child output exceeded the 2 MiB proof budget");
if (!healthReady) failures.push("production Next health route never became ready");
if (!probeDone) failures.push("preload did not complete both runtime probes");
if (combined.includes(ERROR_CANARY)) failures.push("Error canary reached process output");
if (combined.includes(PRIMITIVE_CANARY)) {
  failures.push("primitive rejection canary reached process output");
}
if (!combined.includes(REDACTED_LINE)) {
  failures.push("fixed redaction marker was not emitted");
}
if (!combined.includes(`"requestId":"${SAFE_REQUEST_ID}"`)) {
  failures.push("validated structured API log was not preserved");
}

if (failures.length > 0) {
  process.stderr.write(
    `${JSON.stringify({
      event: "server-log-privacy-probe-failed",
      failures,
      exit,
      output: combined,
    })}\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `${JSON.stringify({
    event: "server-log-privacy-probe-passed",
    healthReady,
    redactionMarkers: combined.split(REDACTED_LINE).length - 1,
    structuredApiLog: true,
  })}\n`,
);
