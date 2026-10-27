#!/usr/bin/env node
/**
 * Records one real Claude run for a demo's Claude scene (claude-recording/v1),
 * reproducibly, from the files the visitor downloads.
 *
 *   node scripts/demos/record-claude-run.mjs \
 *     --slug ki-prognosen-einschaetzen --locale de --prompt-id trauen --take 1 \
 *     --kit-zip packages/website/public/workshops/ki-prognosen-einschaetzen/prognose-pruefen-kit.zip \
 *     --kit-file prognose-pruefen-kit/daten/linsensuppe-woechentlich.csv \
 *     --kit-file prognose-pruefen-kit/daten/tool-export.txt \
 *     --prompt-file prompt.txt --skill prognose-pruefen --allow-python --allow-write \
 *     [--no-skill] [--follow-up-file b.txt] [--model claude-opus-5-5] [--dry-run]
 *
 * What it does: copies the named files out of the shipped kit zip and (unless
 * --no-skill) content/skills/<skill>/ into a fresh temporary workspace
 * (kit files in work/, the skill in .claude/skills/), runs
 * `claude -p` there with stream-json output under flags that shut out every
 * user setting, hook, plugin, MCP server and memory, timestamps every line on
 * receipt, scrubs machine paths, checks the isolation, and writes
 *
 *   packages/website/src/lib/demo-cases/<slug>/claude-runs/<id>.json
 *   packages/website/src/lib/demo-cases/<slug>/claude-runs/<id>.<produced file>
 *
 * The raw stream (session ids, thinking signatures) goes to --raw-dir, by
 * default the system temp dir, never into the repo. The workspace and the
 * CLI's project folder for it are deleted afterwards. A recording is never
 * edited by hand: re-record when the kit or the skill changes (the
 * claude-runs test fails with "stale" when a hash no longer matches).
 *
 * Auth: the run uses the CLI's own login. The script never reads environment files
 * and passes the environment through minus VERCEL_PLUGIN_BOOTSTRAP_HINTS.
 */

import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const SCHEMA = "claude-recording/v1";
export const DEFAULT_MODEL = "claude-opus-5-5";
/**
 * --allow-python: Bash runs inside the CLI's OS sandbox, the way the desktop
 * app's code sandbox runs it. Writes stay in the workspace and the network is
 * closed, so every command may run without a prompt. A per-command allowlist
 * denied ordinary loops and heredocs, and those takes had to be rejected.
 */
export const SANDBOX_SETTINGS = JSON.stringify({ sandbox: { enabled: true, autoAllowBashIfSandboxed: true, allowUnsandboxedCommands: false } });
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");
const WEBSITE = join(ROOT, "packages/website");
/** Anything that looks like a machine path or a session secret; must never be in a recording. */
export const FORBIDDEN = /\/Users\/|\/private\/|\/var\/folders|session_id|signature|\/home\/[a-z]/;

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** The skill digest: sha256 over the sorted relative paths and bytes of every file (same as the test). */
export function skillDigest(dir) {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  walk(dir);
  files.sort((a, b) => (relative(dir, a) < relative(dir, b) ? -1 : 1));
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(relative(dir, file).split("\\").join("/"));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

/** The CLI flags for one run, without machine paths (stored in the recording as `flags`). */
export function runFlags({ model, withSkill, allowWrite, allowPython, persist }) {
  const tools = ["Read", "Skill", ...(allowWrite ? ["Write"] : []), ...(allowPython ? ["Bash"] : [])].join(",");
  const flags = [
    "--output-format", "stream-json", "--verbose", "--include-partial-messages",
    "--setting-sources", "project",
    "--strict-mcp-config",
    ...(persist ? [] : ["--no-session-persistence"]),
    "--model", model,
    "--tools", tools,
  ];
  if (allowWrite) flags.push("--permission-mode", "acceptEdits");
  // The skill's "rechnet per Code" step: any shell command, inside the sandbox (SANDBOX_SETTINGS).
  if (allowPython) flags.push("--allowedTools", "Bash", "--settings", SANDBOX_SETTINGS);
  if (!withSkill) flags.push("--disable-slash-commands");
  return flags;
}

/**
 * Removes machine paths from any JSON value: the workspace (both spellings,
 * with and without the macOS private prefix), the home folder, any other temp folder.
 */
export function scrub(value, prefixes) {
  let text = JSON.stringify(value);
  const all = [...new Set(prefixes.filter(Boolean).flatMap((prefix) => [prefix, prefix.replace(/^\/private(?=\/)/, "")]))].sort((a, b) => b.length - a.length);
  for (const prefix of all) {
    const escaped = JSON.stringify(prefix.endsWith("/") ? prefix : `${prefix}/`).slice(1, -1);
    text = text.split(escaped).join("");
    const bare = JSON.stringify(prefix.replace(/\/$/, "")).slice(1, -1);
    text = text.split(bare).join(".");
  }
  text = text
    .replace(/(?:\/private)?\/var\/folders\/[^"\s\\]*/g, "<tmp>")
    .replace(/\/tmp\/claude-rec-[^"\s\\]*/g, "<tmp>")
    .replace(/\/Users\/[^/"\s\\]+\//g, "~/")
    .replace(/\/home\/[^/"\s\\]+\//g, "~/");
  return JSON.parse(text);
}

/** One run's stream events (with receipt times) into the recording's turn fields. */
export function distill(events, prefixes) {
  const init = events.find(({ ev }) => ev.type === "system" && ev.subtype === "init")?.ev;
  const result = events.find(({ ev }) => ev.type === "result")?.ev;
  if (!init || !result) throw new Error("the stream has no init or no result event");
  const timeline = [];
  for (const { t, ev } of events) {
    if (ev.type === "stream_event" && ev.parent_tool_use_id == null) {
      const event = ev.event ?? {};
      if (event.type === "content_block_start" && event.content_block?.type === "text") timeline.push({ t_ms: t, kind: "text_start" });
      else if (event.type === "content_block_delta" && event.delta?.type === "text_delta") timeline.push({ t_ms: t, kind: "text", chunk: event.delta.text });
    } else if (ev.type === "assistant" && ev.parent_tool_use_id == null) {
      for (const block of ev.message?.content ?? []) {
        if (block.type === "tool_use") timeline.push({ t_ms: t, kind: "tool_use", tool: block.name, input: scrub(block.input ?? {}, prefixes) });
      }
    } else if (ev.type === "user" && ev.parent_tool_use_id == null && Array.isArray(ev.message?.content)) {
      for (const block of ev.message.content) {
        if (block.type === "tool_result") timeline.push({ t_ms: t, kind: "tool_result", is_error: Boolean(block.is_error) });
      }
    }
  }
  return {
    init: {
      model: init.model,
      claude_code_version: init.claude_code_version,
      skills_offered: init.skills ?? [],
      mcp_servers: init.mcp_servers ?? [],
      plugins: init.plugins ?? [],
      memory_sources: Object.keys(init.memory_paths ?? {}).sort(),
      session: init.session_id,
    },
    turn: {
      timeline,
      final_text: result.result ?? "",
      stats: {
        duration_ms: result.duration_ms ?? 0,
        duration_api_ms: result.duration_api_ms ?? 0,
        ttft_ms: result.ttft_ms ?? 0,
        num_turns: result.num_turns ?? 0,
        output_tokens: result.usage?.output_tokens ?? 0,
      },
      is_error: Boolean(result.is_error),
      stop_reason: result.stop_reason ?? "",
      permission_denials: (result.permission_denials ?? []).length,
    },
    models_used: Object.keys(result.modelUsage ?? {}).sort(),
  };
}

/** The text of the last text segment of a timeline (what the engine streams as the answer). */
export function lastSegmentText(timeline) {
  let start = -1;
  timeline.forEach((item, index) => {
    if (item.kind === "text_start") start = index;
  });
  return timeline.slice(start + 1).filter((item) => item.kind === "text").map((item) => item.chunk).join("");
}

/** Every isolation and honesty rule a take must meet; empty when it does. */
export function isolationErrors({ init, turn }, { skill, withSkill, userSkills }) {
  const errors = [];
  if (init.mcp_servers.length > 0) errors.push(`MCP servers were loaded: ${init.mcp_servers.map((server) => server.name ?? server).join(", ")}`);
  // Built-in plugins ship with the CLI ({ path: "builtin", source: "<name>@builtin" }); anything else came from the user.
  const plugins = init.plugins
    .filter((plugin) => !(typeof plugin === "object" && plugin !== null && (plugin.path === "builtin" || /@builtin$/.test(plugin.source ?? ""))))
    .map((plugin) => (typeof plugin === "string" ? plugin : plugin.name ?? "?"));
  if (plugins.length > 0) errors.push(`user plugins were loaded: ${plugins.join(", ")}`);
  if (init.memory_sources.some((source) => source !== "auto")) errors.push(`memory sources beyond auto: ${init.memory_sources.join(", ")}`);
  const offered = init.skills_offered;
  if (withSkill && !offered.includes(skill)) errors.push(`the skill ${skill} was not offered`);
  if (!withSkill && offered.includes(skill)) errors.push(`the skill ${skill} was offered in a take without it`);
  const leaked = offered.filter((name) => userSkills.includes(name) && name !== skill);
  if (leaked.length > 0) errors.push(`user skills were offered: ${leaked.join(", ")}`);
  if (turn.is_error) errors.push("the run ended with an error");
  if (turn.permission_denials > 0) errors.push(`${turn.permission_denials} tool calls were denied`);
  if (turn.stop_reason && turn.stop_reason !== "end_turn") errors.push(`stop reason ${turn.stop_reason}`);
  if (lastSegmentText(turn.timeline) !== turn.final_text) errors.push("the streamed text of the last segment differs from the final text");
  return errors;
}

/** The UTF-8 text of a produced file when it is a small text file, else undefined. */
export function producedText(bytes) {
  if (bytes.length > 256 * 1024) return undefined;
  const text = bytes.toString("utf8");
  return Buffer.from(text, "utf8").equals(bytes) && !text.includes("\u0000") ? text : undefined;
}

/**
 * --refresh-files <recording.json>: fills each produced file's `text` from
 * its stored copy after checking the sha256. Only this derived field
 * changes; the run itself (prompt, timeline, answers) is never touched.
 */
function refreshFiles(path) {
  const recording = JSON.parse(readFileSync(path, "utf8"));
  const dir = dirname(resolve(path));
  const produced = recording.produced_files.map((file) => {
    const bytes = readFileSync(join(dir, file.stored_as));
    if (sha256(bytes) !== file.sha256) throw new Error(`${file.stored_as} does not match its sha256`);
    const text = producedText(bytes);
    return text === undefined ? file : { ...file, text };
  });
  writeFileSync(path, `${JSON.stringify({ ...recording, produced_files: produced }, null, 2)}\n`);
  console.log(`${basename(path)}: ${produced.filter((file) => file.text !== undefined).length} text files attached`);
}

function parseArgs(argv) {
  const options = { kitFiles: [], followUps: [], model: DEFAULT_MODEL, take: 1 };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = () => {
      const next = argv[index + 1];
      if (next === undefined) throw new Error(`${flag} needs a value`);
      index += 1;
      return next;
    };
    switch (flag) {
      case "--slug": options.slug = value(); break;
      case "--locale": options.locale = value(); break;
      case "--prompt-id": options.promptId = value(); break;
      case "--take": options.take = Number(value()); break;
      case "--id": options.id = value(); break;
      case "--kit-zip": options.kitZip = value(); break;
      case "--kit-file": options.kitFiles.push(value()); break;
      case "--prompt-file": options.promptFile = value(); break;
      case "--follow-up-file": options.followUps.push(value()); break;
      case "--skill": options.skill = value(); break;
      case "--no-skill": options.noSkill = true; break;
      case "--allow-write": options.allowWrite = true; break;
      case "--allow-python": options.allowPython = true; break;
      case "--model": options.model = value(); break;
      case "--raw-dir": options.rawDir = value(); break;
      case "--dry-run": options.dryRun = true; break;
      default: throw new Error(`unknown flag ${flag}`);
    }
  }
  for (const key of ["slug", "locale", "promptId", "kitZip", "promptFile", "skill"]) {
    if (!options[key]) throw new Error(`--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} is required`);
  }
  if (!["de", "en"].includes(options.locale)) throw new Error("--locale is de or en");
  if (!/^[a-z0-9-]+$/.test(options.promptId)) throw new Error("--prompt-id is a lower-case slug");
  if (!Number.isInteger(options.take) || options.take < 1) throw new Error("--take is 1 or more");
  options.withSkill = !options.noSkill;
  options.id ??= `${options.locale}-${options.promptId}-${options.withSkill ? "with" : "without"}-${options.take}`;
  return options;
}

function runClaude(prompt, flags, cwd, rawLines, extra = []) {
  const { env: parentEnv } = process;
  // No auto-memory: nothing from earlier runs is loaded, and nothing is written outside the workspace.
  const env = { ...parentEnv, CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" };
  delete env.VERCEL_PLUGIN_BOOTSTRAP_HINTS;
  return new Promise((resolvePromise, reject) => {
    const started = process.hrtime.bigint();
    const child = spawn("claude", ["-p", prompt, ...flags, ...extra], { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    const events = [];
    let buffer = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        const t = Number((process.hrtime.bigint() - started) / 1_000_000n);
        try {
          const ev = JSON.parse(line);
          events.push({ t, ev });
          rawLines.push(JSON.stringify({ t_ms: t, ev }));
        } catch {
          // not a JSON line (a warning); ignore
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`claude exited ${code}: ${stderr.slice(0, 400)}`));
      else resolvePromise(events);
    });
  });
}

/** Every file under dir (relative paths), skipping the .claude folder. */
function listFiles(dir) {
  const found = [];
  const walk = (current) => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".claude") continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) found.push(relative(dir, path).split("\\").join("/"));
    }
  };
  walk(dir);
  return found;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === "--refresh-files") {
    if (!argv[1]) throw new Error("--refresh-files needs a recording path");
    refreshFiles(argv[1]);
    return;
  }
  const options = parseArgs(argv);
  const kitZip = resolve(options.kitZip);
  const skillDir = join(WEBSITE, "content/skills", options.skill);
  if (!existsSync(kitZip)) throw new Error(`no kit zip at ${options.kitZip}`);
  if (!existsSync(join(skillDir, "SKILL.md"))) throw new Error(`no skill at content/skills/${options.skill}`);
  const outDir = join(WEBSITE, "src/lib/demo-cases", options.slug, "claude-runs");
  const prompt = readFileSync(options.promptFile, "utf8").trim();
  const followUps = options.followUps.map((file) => readFileSync(file, "utf8").trim());
  const persist = followUps.length > 0;
  const flags = runFlags({ model: options.model, withSkill: options.withSkill, allowWrite: options.allowWrite, allowPython: options.allowPython, persist });

  const workspace = mkdtempSync(join(tmpdir(), "claude-rec-"));
  const work = join(workspace, "work");
  mkdirSync(work);
  const kitFiles = options.kitFiles.map((path) => {
    const bytes = execFileSync("unzip", ["-p", kitZip, path], { maxBuffer: 64 * 1024 * 1024 });
    if (bytes.length === 0) throw new Error(`${path} is not in ${basename(kitZip)}`);
    writeFileSync(join(work, basename(path)), bytes);
    return { name: basename(path), path, bytes: bytes.length, sha256: sha256(bytes) };
  });
  const extra = [];
  // The whole workspace is an added directory: the skill loads from <workspace>/.claude/skills, and
  // files Claude saves next to its work folder (the skill's script) stay inside the sandbox.
  if (options.withSkill) cpSync(skillDir, join(workspace, ".claude/skills", options.skill), { recursive: true });
  extra.push("--add-dir", workspace);
  const userSkillsDir = join(homedir(), ".claude/skills");
  const userSkills = existsSync(userSkillsDir) ? readdirSync(userSkillsDir) : [];

  if (options.dryRun) {
    console.log(JSON.stringify({ id: options.id, flags, kitFiles, followUps: followUps.length }, null, 2));
    rmSync(workspace, { recursive: true, force: true });
    return;
  }

  const prefixes = [workspace, realpathSync(workspace), work, realpathSync(work), homedir()];
  const raw = [];
  const before = new Set(listFiles(workspace));
  const cleanup = () => {
    rmSync(workspace, { recursive: true, force: true });
    // The CLI keeps a project folder named after the working directory; remove ours.
    const projects = join(homedir(), ".claude/projects");
    const tag = basename(workspace);
    if (existsSync(projects)) {
      for (const name of readdirSync(projects)) if (name.includes(tag)) rmSync(join(projects, name), { recursive: true, force: true });
    }
  };
  try {
    const first = distill(await runClaude(prompt, flags, work, raw, extra), prefixes);
    const errors = isolationErrors(first, { skill: options.skill, withSkill: options.withSkill, userSkills });
    const followTurns = [];
    for (const followUp of followUps) {
      const next = distill(await runClaude(followUp, flags, work, raw, [...extra, "--resume", first.init.session]), prefixes);
      errors.push(...isolationErrors({ init: first.init, turn: next.turn }, { skill: options.skill, withSkill: options.withSkill, userSkills }).map((error) => `follow-up: ${error}`));
      followTurns.push({ prompt: followUp, ...next.turn });
    }
    mkdirSync(outDir, { recursive: true });
    const produced = listFiles(workspace)
      .filter((path) => !before.has(path))
      .map((path) => {
        const name = basename(path);
        const bytes = readFileSync(join(workspace, path));
        if (FORBIDDEN.test(bytes.toString("utf8"))) errors.push(`the produced file ${name} contains a machine path`);
        const storedAs = `${options.id}.${name}`;
        writeFileSync(join(outDir, storedAs), bytes);
        const text = producedText(bytes);
        return { name, bytes: bytes.length, sha256: sha256(bytes), stored_as: storedAs, ...(text !== undefined ? { text } : {}) };
      });
    const strip = ({ permission_denials: _denials, ...turn }) => turn;
    const recording = {
      schema: SCHEMA,
      id: options.id,
      slug: options.slug,
      locale: options.locale,
      prompt_id: options.promptId,
      take: options.take,
      recorded_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      surface: "claude-code-cli-headless",
      claude_code_version: first.init.claude_code_version,
      model: first.init.model,
      models_used: first.models_used,
      flags,
      prompt,
      kit_zip: relative(WEBSITE, kitZip).split("\\").join("/"),
      kit_files: kitFiles,
      skill: options.withSkill ? { name: options.skill, sha256: skillDigest(skillDir) } : null,
      skill_name: options.skill,
      with_skill: options.withSkill,
      skill_invoked: first.turn.timeline.some((item) => item.kind === "tool_use" && item.tool === "Skill"),
      skills_offered: first.init.skills_offered,
      memory_sources: first.init.memory_sources,
      ...strip(first.turn),
      follow_ups: followTurns.map(strip),
      produced_files: produced,
      edited: false,
    };
    const clean = scrub(recording, prefixes);
    const text = JSON.stringify(clean, null, 2);
    if (FORBIDDEN.test(text)) errors.push("a machine path or session secret survived the scrub");
    // A private folder per run unless the caller names one.
    const rawDir = options.rawDir ?? mkdtempSync(join(tmpdir(), "claude-runs-raw-"));
    mkdirSync(rawDir, { recursive: true });
    writeFileSync(join(rawDir, `${options.id}.raw.jsonl`), `${raw.join("\n")}\n`);
    const target = join(errors.length > 0 ? join(outDir, "rejected") : outDir, `${options.id}.json`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify(errors.length > 0 ? { ...clean, rejected: errors } : clean, null, 2)}\n`);
    console.log(JSON.stringify({ id: options.id, written: relative(ROOT, target), model: clean.model, skill_invoked: clean.skill_invoked, chars: clean.final_text.length, duration_ms: clean.stats.duration_ms, produced: produced.map((file) => file.name), errors }, null, 2));
    if (errors.length > 0) process.exitCode = 2;
  } finally {
    cleanup();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
