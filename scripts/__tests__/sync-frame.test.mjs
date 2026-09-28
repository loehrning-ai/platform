import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { FRAME_WORKSHOPS, frameCopyPath, readCopy } from "../workshops/sync-frame.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = path.join(REPO_ROOT, "scripts/workshops/sync-frame.mjs");

test("readCopy reads a copy once and reports a missing one as null", (t) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "sync-frame-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "workshop-frame.css");
  assert.equal(readCopy(file), null);
  writeFileSync(file, "a{}\n");
  assert.ok(readCopy(file).equals(Buffer.from("a{}\n")));
  mkdirSync(path.join(dir, "folder"));
  assert.throws(() => readCopy(path.join(dir, "folder")), { code: "EISDIR" }, "other errors are not swallowed");
});

test("the script never checks for a copy separately before writing it", () => {
  assert.doesNotMatch(readFileSync(SCRIPT, "utf8"), /\bexistsSync\b|\bstatSync\b|\baccessSync\b/);
});

test("every framed workshop holds the current frame stylesheet", () => {
  const source = readFileSync(path.join(REPO_ROOT, "scripts/workshops/workshop-frame.css"));
  for (const slug of FRAME_WORKSHOPS) assert.ok(readCopy(frameCopyPath(slug))?.equals(source), slug);
  const run = spawnSync(process.execPath, [SCRIPT, "--check"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
});
