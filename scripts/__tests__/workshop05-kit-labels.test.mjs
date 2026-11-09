/**
 * Workshop 05 kit: labels on every file, CSV comment lines, the allowed external URLs (one privacy link anywhere, the verified
 * sources only inside keep-watch/ and bereit-bleiben/), weekday words, banned words, the tree (41 files, 12 top-level entries)
 * in both editions. The tree grew by the five files of keep-watch/ (REDESIGN-3 D5).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { kitEntries, kitEntriesDe } from "../workshop05/build-kit.mjs";

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../workshop05");
const EDITIONS = [
  { name: "en", dir: path.join(HERE, "kit"), label: "Fictional training material", entries: kitEntries },
  { name: "de", dir: path.join(HERE, "kit-de"), label: "Erfundenes Übungsmaterial", entries: kitEntriesDe },
];
const walk = (dir, base = "") =>
  readdirSync(dir).flatMap((entry) => (statSync(path.join(dir, entry)).isDirectory() ? walk(path.join(dir, entry), `${base}${entry}/`) : [`${base}${entry}`]));
const SKILL = "claude/audit-nachweise/SKILL.md";
// Written in pieces so that this test file itself holds none of the words it forbids.
const INTERNAL = new RegExp(["\\/Users\\/", "\\/private\\/", "maven" + "gence", "facilitator\\/", "CLAUDE" + "\\.md", "vard" + "ar", "tann" + "wald"].join("|"), "i");
const ALLOWED_URL = "https://privacy.claude.com/en/articles/7996890";
/** The sources keep-watch/ may link: two Anthropic help pages and the verified watch list (Anthropic help centre, projects and scheduled tasks; AZLP, Služben vesnik, DIT). */
const WATCH_URLS = [
  "https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork",
  "https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects",
  "https://dit.gov.mk/",
  "https://slvesnik.com.mk/besplaten-pristap-do-izdanija.nspx",
  "https://azlp.mk/feed/",
  "https://mzzpr.org.mk/feed/",
];
const WATCH_DIR = /^(keep-watch|bereit-bleiben)\//;

for (const edition of EDITIONS) {
  const files = walk(edition.dir).filter((file) => !file.endsWith(".DS_Store"));
  const text = (file) => readFileSync(path.join(edition.dir, file), "utf8");

  test(`${edition.name}: 41 files with the skill, 12 top-level entries, plain ASCII names`, () => {
    const entries = edition.entries().map(([file]) => file);
    assert.equal(entries.length, 41);
    assert.ok(entries.includes(SKILL));
    assert.equal(files.length, 40);
    assert.equal(new Set(entries.map((file) => file.split("/")[0])).size, 12);
    for (const file of entries) assert.match(file, /^[A-Za-z0-9._\-/]+$/);
  });

  test(`${edition.name}: every file carries the label in its first lines`, () => {
    for (const file of files) {
      const body = text(file);
      assert.ok(!body.includes("\r"), `${file} has CR`);
      assert.ok(body.endsWith("\n"), `${file} lacks a final newline`);
      if (file.endsWith(".csv")) {
        const lines = body.split("\n");
        assert.equal(lines[0], "# Fictional training material, invented for the exercise.", file);
        assert.equal(lines[1], "# Erfundenes Übungsmaterial, für die Übung erfunden.", file);
        if (file.endsWith("employee_records_2026.csv")) {
          assert.match(lines[2], /^# The 13-digit ids starting with 99 are invented and are not real personal numbers\./);
          assert.match(lines[2], /Die 13-stelligen Nummern, die mit 99 beginnen, sind erfunden und keine echten Personennummern\.$/);
        } else assert.ok(!lines[2].startsWith("#"), `${file}: only two comment lines`);
      } else {
        const head = body.split("\n").slice(0, 3).join("\n");
        assert.ok(head.includes(edition.label), `${file}: label missing in the first 3 lines`);
      }
    }
  });

  test(`${edition.name}: no dash, arrow, internal path or banned word, only the allowed external URLs`, () => {
    for (const file of files) {
      const body = text(file);
      assert.ok(!/[‒–—―→]/.test(body), `${file} has a dash or an arrow`);
      assert.ok(!INTERNAL.test(body), `${file} holds an internal or retired word`);
      for (const url of body.match(/https?:\/\/[^\s)>"]+/g) ?? []) assert.ok(url === ALLOWED_URL || (WATCH_DIR.test(file) && WATCH_URLS.includes(url)), `${file} links ${url}`);
      assert.ok(!/\b(Friday|Saturday|Sunday|Fri|Sat|Sun|Freitag|Samstag|Sonnabend|Sonntag)\b/.test(body), `${file} has a weekday that is never printed`);
      assert.ok(!/\b(deadline|compliant|compliance|score|scores|stamp|countdown|urgent)\b/i.test(body) || edition.name === "de", `${file} has a banned word`);
      assert.ok(!/\b(Deadline|konform|Countdown|dringend|Stempel|Punkte|Chef)\b/.test(body) || edition.name === "en", `${file} has a banned German word`);
    }
  });
}

test("the two editions have the same CSV bytes", () => {
  const read = (dir, file) => readFileSync(path.join(HERE, dir, file), "utf8");
  for (const name of readdirSync(path.join(HERE, "kit/folder")).filter((f) => f.endsWith(".csv"))) assert.equal(read("kit/folder", name), read("kit-de/ordner", name), name);
  for (const name of readdirSync(path.join(HERE, "kit/templates")).filter((f) => f.endsWith(".csv"))) assert.equal(read("kit/templates", name), read("kit-de/vorlagen", name), name);
});
