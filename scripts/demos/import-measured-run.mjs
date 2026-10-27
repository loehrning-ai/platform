#!/usr/bin/env node
/**
 * Turns one timed W04 run (the measurement of 26.10.2026: five `claude -p`
 * steps over a fresh copy of the kit, every stream-json line stamped with the
 * wall clock on receipt) into claude-recording/v1 recordings for the Claude
 * app demo, one per kit step. Step 5 ran with --resume in the session of
 * step 4, so it becomes the follow-up turn of the step 4 recording.
 *
 *   node scripts/demos/import-measured-run.mjs \
 *     --run <measure>/run-20261026b/de-3 --locale de \
 *     --kit-zip packages/website/public/workshops/esg-berichte-mit-ki/crvena-zemja-nachweisprobe.zip \
 *     [--python <python with openpyxl>]
 *
 * The same rules as record-claude-run.mjs: machine paths are scrubbed with
 * its scrub(), every kit file in the run's workspace must be byte for byte
 * the file in the shipped zip (sha256 stored), the skill digest is stored,
 * the raw stream (session ids, thinking signatures) never enters the repo,
 * and nothing is edited. Unlike the recorder these runs had no partial
 * messages, so each text block of the stream is one text chunk at the time
 * it arrived; thinking blocks are kept as timed markers without their text
 * (the CLI does not hand the thinking text out). Tool calls that the run's
 * per-command allowlist denied are kept and marked `denied`, because the
 * measured time includes them.
 *
 * Writes packages/website/src/lib/demo-cases/esg-berichte-mit-ki/claude-app/
 *   <locale>-schritt-<n>.json (the register Claude wrote kept as its hash) and
 *   <locale>-register.json (the Register sheet's cells, read with openpyxl).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { homedir } from "node:os";
import { SCHEMA, scrub, sha256, skillDigest } from "./record-claude-run.mjs";

/**
 * The recorder's FORBIDDEN, with the two secret names matched as JSON keys:
 * a recorded answer may say the word "signature" (a file "has no signature").
 */
export const FORBIDDEN_KEYS = /\/Users\/|\/private\/|\/var\/folders|\/home\/[a-z]|"session_id"|"signature"/;

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");
const WEBSITE = join(ROOT, "packages/website");
const SLUG = "esg-berichte-mit-ki";
const SKILL = "esg-nachweise";

/** The flags of tools/run.py, without paths (run.py passes the project instructions file by path). */
const ALLOWED = ["Read", "Glob", "Grep", "Write", "Edit", "Skill", "TodoWrite", "Bash(python3:*)", "Bash(python:*)", "Bash(ls:*)", "Bash(wc:*)", "Bash(cat:*)", "Bash(head:*)", "Bash(tail:*)", "Bash(grep:*)", "Bash(awk:*)", "Bash(sort:*)", "Bash(uniq:*)", "Bash(cut:*)", "Bash(file:*)", "Bash(sed -n:*)", "Bash(nl:*)", "Bash(pip show:*)"];

const EDITION = {
  de: { instructions: "projektanweisungen.md", register: "nachweisregister.xlsx", root: "crvena-zemja-nachweisprobe/", folders: ["ordner/", "anfragen/", "nachreichung/"] },
  en: { instructions: "project-instructions.md", register: "evidence_register.xlsx", root: "crvena-zemja-esg-kit/", folders: ["files/", "requests/", "late-document/"] },
};

function parseArgs(argv) {
  const options = { python: "python3" };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (value === undefined) throw new Error(`${flag} needs a value`);
    index += 1;
    if (flag === "--run") options.run = resolve(value);
    else if (flag === "--locale") options.locale = value;
    else if (flag === "--kit-zip") options.kitZip = resolve(value);
    else if (flag === "--python") options.python = value;
    else throw new Error(`unknown flag ${flag}`);
  }
  if (!options.run || !options.kitZip || !["de", "en"].includes(options.locale)) throw new Error("--run, --kit-zip and --locale de|en are required");
  return options;
}

/** Lines of "<epoch seconds>\t<json>" into { t: ms after start, ev }. */
export function readStamped(text, startSeconds) {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      const t = Math.max(0, Math.round((Number(line.slice(0, tab)) - startSeconds) * 1000));
      return { t, ev: JSON.parse(line.slice(tab + 1)) };
    });
}

/** One step's stamped events into a recording turn (timeline, final text, stats). */
export function turnFrom(events, prefixes) {
  const init = events.find(({ ev }) => ev.type === "system" && ev.subtype === "init")?.ev;
  const result = events.find(({ ev }) => ev.type === "result")?.ev;
  if (!init || !result) throw new Error("the stream has no init or no result event");
  const denied = new Set(events.filter(({ ev }) => ev.type === "system" && ev.subtype === "permission_denied").map(({ ev }) => ev.tool_use_id));
  const timeline = [];
  let lastText = "";
  for (const { t, ev } of events) {
    if (ev.parent_tool_use_id != null) continue;
    if (ev.type === "assistant") {
      for (const block of ev.message?.content ?? []) {
        if (block.type === "thinking" || block.type === "redacted_thinking") timeline.push({ t_ms: t, kind: "thinking" });
        else if (block.type === "text" && block.text) {
          timeline.push({ t_ms: t, kind: "text_start" }, { t_ms: t, kind: "text", chunk: block.text });
          lastText = block.text;
        } else if (block.type === "tool_use") timeline.push({ t_ms: t, kind: "tool_use", tool: block.name, input: scrub(block.input ?? {}, prefixes) });
      }
    } else if (ev.type === "user" && Array.isArray(ev.message?.content)) {
      for (const block of ev.message.content) {
        if (block.type !== "tool_result") continue;
        timeline.push({ t_ms: t, kind: "tool_result", is_error: Boolean(block.is_error), ...(denied.has(block.tool_use_id) ? { denied: true } : {}) });
      }
    }
  }
  const finalText = result.result ?? "";
  if (lastText !== finalText) throw new Error("the last text block differs from the result text");
  return {
    init: {
      model: init.model,
      claude_code_version: init.claude_code_version,
      skills_offered: init.skills ?? [],
      mcp_servers: init.mcp_servers ?? [],
      plugins: init.plugins ?? [],
      memory_sources: Object.keys(init.memory_paths ?? {}).sort(),
    },
    turn: {
      timeline,
      final_text: finalText,
      stats: {
        duration_ms: result.duration_ms ?? 0,
        duration_api_ms: result.duration_api_ms ?? 0,
        ttft_ms: result.ttft_ms ?? 0,
        num_turns: result.num_turns ?? 0,
        output_tokens: result.usage?.output_tokens ?? 0,
      },
      is_error: Boolean(result.is_error),
      stop_reason: result.stop_reason ?? "",
    },
    models_used: Object.keys(result.modelUsage ?? {}).sort(),
    denied: denied.size,
  };
}

/** Every workspace file below the edition's kit folders, as kit paths. */
function workspaceKitFiles(work, edition) {
  const found = [];
  for (const folder of edition.folders) {
    const dir = join(work, folder);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) found.push(`${folder}${name}`);
  }
  return found;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const edition = EDITION[options.locale];
  const run = options.run;
  const work = join(run, "work");
  const timing = JSON.parse(readFileSync(join(run, "timing.json"), "utf8"));
  const runNumber = Number(timing.run);
  const outDir = join(WEBSITE, "src/lib/demo-cases", SLUG, "claude-app");
  mkdirSync(outDir, { recursive: true });
  // The temp root of the measurement machine as well: Claude saved helper scripts there.
  const prefixes = [run, work, homedir(), "/private/tmp/claude-501"];

  // Kit files: the workspace copies must be the zip's bytes.
  const zipBytes = (path) => execFileSync("unzip", ["-p", options.kitZip, path], { maxBuffer: 64 * 1024 * 1024 });
  const kitFiles = [...workspaceKitFiles(work, edition), edition.instructions].map((relativePath) => {
    const zipPath = `${edition.root}${relativePath}`;
    const fromZip = zipBytes(zipPath);
    const local = readFileSync(relativePath === edition.instructions ? join(run, relativePath) : join(work, relativePath));
    if (sha256(local) !== sha256(fromZip)) throw new Error(`${relativePath} in the run differs from ${zipPath} in the zip`);
    return { name: basename(relativePath), path: zipPath, bytes: fromZip.length, sha256: sha256(fromZip) };
  });
  const skillDir = join(WEBSITE, "content/skills", SKILL);
  const runSkill = readFileSync(join(work, ".claude/skills", SKILL, "SKILL.md"));
  if (sha256(runSkill) !== sha256(readFileSync(join(skillDir, "SKILL.md")))) throw new Error("the run's SKILL.md differs from content/skills");

  const steps = timing.steps.map((step) => {
    const events = readStamped(readFileSync(join(run, `step-${step.step}.jsonl`), "utf8"), step.start);
    const prompt = readFileSync(join(run, `prompt-${step.step}.txt`), "utf8").trim();
    return { step: step.step, start: step.start, wall_s: step.wall_s, prompt, ...turnFrom(events, prefixes) };
  });
  const flags = ["--model", timing.model, "--setting-sources", "project", "--strict-mcp-config", "--append-system-prompt-file", edition.instructions, "--output-format", "stream-json", "--verbose", "--permission-mode", "acceptEdits", "--allowedTools", ...ALLOWED];
  const kitZipRel = relative(WEBSITE, options.kitZip).split("\\").join("/");
  const written = [];
  for (const step of steps.filter((entry) => entry.step <= 4)) {
    const id = `${options.locale}-schritt-${step.step}`;
    const followUps = step.step === 4 ? steps.filter((entry) => entry.step === 5) : [];
    const produced = [];
    if (step.step === 4) {
      // The public repo takes no .xlsx (scan:public): keep the file's hash and its cells, not the file.
      const bytes = readFileSync(join(work, edition.register));
      produced.push({ name: edition.register, bytes: bytes.length, sha256: sha256(bytes), state: "after-follow-up" });
      const cells = execFileSync(options.python, ["-I", "-c", "import json,sys,openpyxl\nws=openpyxl.load_workbook(sys.argv[1]).worksheets[0]\nprint(json.dumps([[('' if c is None else str(c)) for c in r] for r in ws.iter_rows(values_only=True)],ensure_ascii=False))", join(work, edition.register)], { encoding: "utf8" });
      const register = { source: edition.register, sha256: sha256(bytes), sheet: "Register", rows: JSON.parse(cells) };
      writeFileSync(join(outDir, `${options.locale}-register.json`), `${JSON.stringify(scrub(register, prefixes), null, 2)}\n`);
    }
    const recording = {
      schema: SCHEMA,
      id,
      slug: SLUG,
      locale: options.locale,
      prompt_id: `schritt-${step.step}`,
      take: runNumber,
      recorded_at: new Date(step.start * 1000).toISOString().replace(/\.\d{3}Z$/, "Z"),
      surface: "claude-code-cli-headless",
      source: "measured-run",
      claude_code_version: step.init.claude_code_version,
      model: step.init.model,
      models_used: step.models_used,
      flags,
      prompt: step.prompt,
      kit_zip: kitZipRel,
      kit_files: kitFiles,
      skill: { name: SKILL, sha256: skillDigest(skillDir) },
      skill_name: SKILL,
      with_skill: true,
      skill_invoked: step.turn.timeline.some((item) => item.kind === "tool_use" && item.tool === "Skill"),
      skills_offered: step.init.skills_offered,
      memory_sources: step.init.memory_sources,
      ...step.turn,
      wall_s: step.wall_s,
      denied_calls: step.denied,
      follow_ups: followUps.map((entry) => ({ prompt: entry.prompt, ...entry.turn, wall_s: entry.wall_s, denied_calls: entry.denied })),
      produced_files: produced,
      edited: false,
    };
    const clean = scrub(recording, prefixes);
    const text = JSON.stringify(clean, null, 2);
    if (FORBIDDEN_KEYS.test(text)) throw new Error(`${id}: a machine path or session secret survived the scrub`);
    if (step.init.mcp_servers.length > 0) throw new Error(`${id}: MCP servers were loaded`);
    writeFileSync(join(outDir, `${id}.json`), `${text}\n`);
    written.push({ id, chars: clean.final_text.length, duration_ms: clean.stats.duration_ms, denied: step.denied, follow_ups: clean.follow_ups.length });
  }
  console.log(JSON.stringify(written, null, 2));
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
