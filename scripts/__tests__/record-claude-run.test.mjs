import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  claudeArgs,
  distill,
  FORBIDDEN,
  INSTRUCTIONS_PLACEHOLDER,
  isolationErrors,
  kitRelative,
  parseArgs,
  preflightProblems,
  producedPaths,
  producedText,
  resolveFlags,
  runConversation,
  runFlags,
  scrub,
  skillDigest,
} from "../demos/record-claude-run.mjs";

const event = (t, ev) => ({ t, ev });
// Machine paths are built at run time, so this file itself never contains one.
const HOME = ["", "Users", "someone"].join("/");
const PRIVATE = ["", "private"].join("/");
const WORKSPACE = `${PRIVATE}/tmp/claude-rec-1`;

function stream() {
  return [
    event(0, { type: "system", subtype: "init", model: "claude-opus-5-5", claude_code_version: "2.1.310", skills: ["prognose-pruefen"], mcp_servers: [], plugins: [{ name: "x", path: "builtin", source: "x@builtin" }], memory_paths: { auto: `${HOME}/.claude/memory` }, session_id: "abc" }),
    event(1200, { type: "assistant", parent_tool_use_id: null, message: { content: [{ type: "tool_use", name: "Read", input: { file_path: `${WORKSPACE}/work/kosten.md` } }] } }),
    event(1300, { type: "user", parent_tool_use_id: null, message: { content: [{ type: "tool_result", is_error: false }] } }),
    event(2000, { type: "stream_event", parent_tool_use_id: null, event: { type: "content_block_start", content_block: { type: "text" } } }),
    event(2001, { type: "stream_event", parent_tool_use_id: null, event: { type: "content_block_delta", delta: { type: "text_delta", text: "Kochen Sie " } } }),
    event(2002, { type: "stream_event", parent_tool_use_id: null, event: { type: "content_block_delta", delta: { type: "text_delta", text: "729 Gläser." } } }),
    event(2100, { type: "result", result: "Kochen Sie 729 Gläser.", duration_ms: 2100, duration_api_ms: 2000, ttft_ms: 900, num_turns: 2, usage: { output_tokens: 12 }, is_error: false, stop_reason: "end_turn", permission_denials: [], modelUsage: { "claude-opus-5-5": {} } }),
  ];
}

test("distills a stream into a turn whose streamed text is the final text", () => {
  const { init, turn, models_used } = distill(stream(), [WORKSPACE]);
  assert.equal(init.model, "claude-opus-5-5");
  assert.deepEqual(init.memory_sources, ["auto"]);
  assert.deepEqual(models_used, ["claude-opus-5-5"]);
  assert.deepEqual(turn.timeline.map((item) => item.kind), ["tool_use", "tool_result", "text_start", "text", "text"]);
  assert.equal(turn.timeline[0].input.file_path, "work/kosten.md");
  assert.deepEqual(isolationErrors({ init, turn }, { skill: "prognose-pruefen", withSkill: true, userSkills: [] }), []);
});

test("refuses takes that broke isolation or honesty", () => {
  const { init, turn } = distill(stream(), []);
  const errors = isolationErrors(
    { init: { ...init, plugins: ["mine"], mcp_servers: [{ name: "slack" }] }, turn: { ...turn, permission_denials: 2, final_text: "anders" } },
    { skill: "prognose-pruefen", withSkill: false, userSkills: ["prognose-pruefen"] },
  ).join("\n");
  assert.match(errors, /MCP servers/);
  assert.match(errors, /user plugins/);
  assert.match(errors, /offered in a take without it/);
  assert.match(errors, /2 tool calls were denied/);
  assert.match(errors, /differs from the final text/);
});

test("scrubs machine paths so no recording names a home folder or a temp dir", () => {
  const clean = scrub({ a: `${HOME}/x/y.csv`, b: `${PRIVATE}/var/folders/ab/T/z`, c: "/tmp/claude-rec-9/work/k.md", d: ["", "home", "me", "k"].join("/") }, []);
  assert.equal(FORBIDDEN.test(JSON.stringify(clean)), false);
  assert.equal(clean.a, "~/x/y.csv");
});

test("builds flags without paths, and isolates a take without the skill", () => {
  const flags = runFlags({ model: "claude-opus-5-5", withSkill: false, allowWrite: false, allowPython: false, persist: false });
  assert.ok(flags.includes("--strict-mcp-config"));
  assert.ok(flags.includes("--disable-slash-commands"));
  assert.ok(!flags.some((flag) => flag.includes("/")));
});

test("digests a skill folder by sorted relative paths and bytes", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "skill-"));
  mkdirSync(path.join(dir, "sub"));
  writeFileSync(path.join(dir, "SKILL.md"), "a");
  writeFileSync(path.join(dir, "sub", "x.py"), "b");
  const first = skillDigest(dir);
  writeFileSync(path.join(dir, "sub", "x.py"), "c");
  assert.notEqual(skillDigest(dir), first);
  assert.equal(producedText(Buffer.from("print(1)\n")), "print(1)\n");
  assert.equal(producedText(Buffer.from([0, 1, 2])), undefined);
});

const REQUIRED = ["--slug", "s", "--locale", "en", "--prompt-id", "chain", "--kit-zip", "k.zip", "--prompt-file", "p.txt", "--skill", "sk"];

test("parses --keep-paths, --instructions-file and several --follow-up-file flags; other workshops see no change", () => {
  const plain = parseArgs(REQUIRED);
  assert.equal(plain.keepPaths, undefined);
  assert.equal(plain.instructionsFile, undefined);
  assert.deepEqual(plain.followUps, []);
  const options = parseArgs([...REQUIRED, "--keep-paths", "--instructions-file", "kit/project-instructions.md", "--follow-up-file", "b.txt", "--follow-up-file", "c.txt", "--preflight", "--no-skill"]);
  assert.equal(options.keepPaths, true);
  assert.equal(options.instructionsFile, "kit/project-instructions.md");
  assert.deepEqual(options.followUps, ["b.txt", "c.txt"]);
  assert.equal(options.preflight, true);
  assert.equal(options.id, "en-chain-without-1");
});

test("keeps the folder below the kit root with --keep-paths and flattens without it", () => {
  assert.equal(kitRelative("gradba-audit-kit/folder/attendance_2026-11.csv", true), "folder/attendance_2026-11.csv");
  assert.equal(kitRelative("gradba-audit-kit/templates/clock.csv", true), "templates/clock.csv");
  assert.equal(kitRelative("gradba-audit-kit/project-instructions.md", true), "project-instructions.md");
  assert.equal(kitRelative("gradba-audit-kit/folder/attendance_2026-11.csv", false), "attendance_2026-11.csv");
});

test("stores the instructions as a placeholder in the flags, never as a path or as text, and hands the text over at spawn", () => {
  const without = runFlags({ model: "claude-opus-5-5", withSkill: false, allowWrite: true, allowPython: true, persist: true });
  assert.ok(!without.includes("--append-system-prompt"));
  const flags = runFlags({ model: "claude-opus-5-5", withSkill: false, allowWrite: true, allowPython: true, persist: true, instructions: true });
  assert.deepEqual(flags.slice(-2), ["--append-system-prompt", INSTRUCTIONS_PLACEHOLDER]);
  assert.ok(!flags.some((flag) => flag.includes("/")));
  assert.equal(FORBIDDEN.test(JSON.stringify(flags)), false);
  const argv = claudeArgs("Hello", flags, ["--add-dir", "ws"], "Rule 1. Rule 2.");
  assert.equal(argv[argv.indexOf("--append-system-prompt") + 1], "Rule 1. Rule 2.");
  assert.ok(!argv.includes(INSTRUCTIONS_PLACEHOLDER));
  assert.throws(() => resolveFlags(flags, undefined), /no text/);
  assert.deepEqual(resolveFlags(without, undefined), without);
});

test("counts a file as produced when it is new or its bytes changed, not when it is untouched", () => {
  const before = new Map([["work/templates/evidence-index.csv", "aaa"], ["work/templates/clock.csv", "bbb"], ["work/folder/a.csv", "ccc"]]);
  const after = new Map([["work/templates/evidence-index.csv", "aab"], ["work/templates/clock.csv", "bbb"], ["work/folder/a.csv", "ccc"], ["work/register.csv", "ddd"]]);
  assert.deepEqual(producedPaths(before, after), ["work/register.csv", "work/templates/evidence-index.csv"]);
  assert.deepEqual(producedPaths(before, before), []);
});

test("flags a forbidden word or a machine path in a kit file, the instructions or a prompt before any run", () => {
  const word = ["sig", "nature"].join("");
  assert.deepEqual(preflightProblems({ files: [{ name: "a.md", text: "all clear" }], instructions: { name: "i.md", text: "plain" }, prompts: ["one", "two"] }), []);
  const problems = preflightProblems({
    files: [{ name: "folder/a.md", text: `the ${word} line` }],
    instructions: { name: "i.md", text: `see ${HOME}/x` },
    prompts: ["fine", `a ${word}`],
  });
  assert.equal(problems.length, 3);
  assert.match(problems.join("\n"), /folder\/a.md/);
  assert.match(problems.join("\n"), /follow-up 1/);
});

/** A stand-in for one turn of claude: the init event carries one session, the result one answer. */
function fakeTurn(answer) {
  return [
    event(0, { type: "system", subtype: "init", model: "claude-opus-5-5", claude_code_version: "2.1.319", skills: [], mcp_servers: [], plugins: [], memory_paths: {}, session_id: "sess-1" }),
    event(10, { type: "stream_event", parent_tool_use_id: null, event: { type: "content_block_start", content_block: { type: "text" } } }),
    event(11, { type: "stream_event", parent_tool_use_id: null, event: { type: "content_block_delta", delta: { type: "text_delta", text: answer } } }),
    event(20, { type: "result", result: answer, duration_ms: 20, duration_api_ms: 19, ttft_ms: 5, num_turns: 1, usage: { output_tokens: 3 }, is_error: false, stop_reason: "end_turn", permission_denials: [], modelUsage: { "claude-opus-5-5": {} } }),
  ];
}

test("runs three turns of one session and passes the project instructions to every one of them", async () => {
  const flags = runFlags({ model: "claude-opus-5-5", withSkill: false, allowWrite: true, allowPython: true, persist: true, instructions: true });
  const spawned = [];
  const run = async (argv) => {
    spawned.push(argv);
    return fakeTurn(`answer ${spawned.length}`);
  };
  const { first, followTurns, errors } = await runConversation({
    prompt: "step one",
    followUps: ["step two", "step three"],
    flags,
    extra: ["--add-dir", "ws"],
    instructionsText: "Project rules.",
    cwd: "work",
    raw: [],
    prefixes: [],
    check: (turn) => isolationErrors(turn, { skill: "audit-nachweise", withSkill: false, userSkills: [] }),
    run,
  });
  assert.deepEqual(errors, []);
  assert.equal(spawned.length, 3);
  for (const argv of spawned) assert.equal(argv[argv.indexOf("--append-system-prompt") + 1], "Project rules.");
  assert.deepEqual(spawned.map((argv) => argv[1]), ["step one", "step two", "step three"]);
  assert.ok(!spawned[0].includes("--resume"));
  for (const argv of spawned.slice(1)) assert.equal(argv[argv.indexOf("--resume") + 1], "sess-1");
  assert.ok(!spawned.some((argv) => argv.includes("--no-session-persistence")));
  assert.equal(first.turn.final_text, "answer 1");
  assert.deepEqual(followTurns.map((turn) => [turn.prompt, turn.final_text]), [["step two", "answer 2"], ["step three", "answer 3"]]);
});

test("a register take has one follow-up and keeps the instructions on it", async () => {
  const flags = runFlags({ model: "claude-opus-5-5", withSkill: false, allowWrite: true, allowPython: true, persist: true, instructions: true });
  const spawned = [];
  const { followTurns } = await runConversation({ prompt: "build it", followUps: ["ask it"], flags, extra: [], instructionsText: "Rules.", cwd: "w", raw: [], prefixes: [], check: () => [], run: async (argv) => (spawned.push(argv), fakeTurn("ok")) });
  assert.equal(spawned.length, 2);
  assert.equal(followTurns.length, 1);
  assert.ok(spawned.every((argv) => argv.includes("Rules.")));
});
