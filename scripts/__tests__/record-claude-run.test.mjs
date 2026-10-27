import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { distill, FORBIDDEN, isolationErrors, producedText, runFlags, scrub, skillDigest } from "../demos/record-claude-run.mjs";

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
