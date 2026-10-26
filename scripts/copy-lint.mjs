#!/usr/bin/env node
/**
 * One copy lint for everything a workshop visitor reads: demo copy, the hub,
 * the take-home block, workshop data, kits (zipped and source), skills,
 * vorlagen and deck copy. One list instead of five per-workshop lists that
 * drift apart (amendment 23 of the demos v3 review).
 *
 *   node scripts/copy-lint.mjs            lint, exit 1 on any finding
 *   node scripts/copy-lint.mjs --json     findings as JSON
 *
 * TypeScript sources are parsed, and only string literals, template text and
 * JSX text are checked, so code, comments and identifiers never trip it.
 *
 * Known findings that a builder still has to rewrite sit in
 * scripts/copy-lint.allow.json as {file, rule, match, reason}. An entry
 * suppresses the findings of that rule in that file whose text contains
 * `match`. An entry that suppresses nothing fails the run, so the list can
 * only shrink.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEBSITE = path.join(ROOT, "packages/website");
const ALLOW_PATH = path.join(ROOT, "scripts/copy-lint.allow.json");

/* ── Rules ─────────────────────────────────────────────────────────────── */

/**
 * German words spelled with ae/oe/ue instead of an umlaut. Matched anywhere
 * inside a word (compounds), so the list holds stems no English word contains.
 */
export const UMLAUT_STEMS = [
  "aehn", "aelt", "aender", "aerger", "buero", "duerf", "erklaer", "faell", "fuehr", "fuell", "fuenf",
  "fuer", "gebaeude", "gemaess", "geschaeft", "gruen", "guelt", "haett", "haeufig", "hoeh", "itaet",
  "jaehr", "koenn", "koerper", "kuend", "kuenft", "kuenstl", "kuerz", "laender", "laess", "loesung",
  "loesen", "maess", "moeg", "muend", "muess", "naech", "natuerl", "nuetz", "oeffentl", "oeffn",
  "pruef", "rueck", "saechl", "schaetz", "schluess", "spaet", "staerk", "stoer", "taegl", "uebe",
  "uebl", "uebung", "verfueg", "waehl", "waehr", "waere", "wuensch", "wuerd", "zaehl", "zwoelf",
];

const UMLAUT_PATTERN = new RegExp(`(${UMLAUT_STEMS.join("|")})`, "i");

/** A token that is a slug, path, URL, file name or identifier, not prose. */
function isMachineToken(token) {
  return (
    /[/_.@=#\\]/.test(token) ||
    /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(token) ||
    /^[a-z]+[A-Z]/.test(token)
  );
}

/** The line with slugs, paths, class lists and identifiers blanked out. */
export function proseOnly(line) {
  return line
    .split(/(\s+)/)
    .map((token) =>
      // A folder name keeps its slash ("loesungen/"): only quotes, brackets and sentence marks come off first.
      isMachineToken(token.replace(/^[\p{P}]+|[\p{P}]+$/gu, "")) || isMachineToken(token.replace(/^[("'„“‚‘`]+|[)"'“”‘’`,;:!?.]+$/gu, ""))
        ? " "
        : token,
    )
    .join("");
}

/** Each rule returns the matched snippets in one line of prose. */
export const RULES = [
  {
    id: "dash",
    why: "no en or em dashes; use a comma, a colon or a full stop",
    test: (line) => line.match(/[‒–—―]/g) ?? [],
  },
  {
    id: "deadline",
    why: "no fake deadlines (Freitag, Friday)",
    // A working-week range ("Montag bis Freitag") is a fact, not a deadline.
    test: (line) =>
      line.replace(/\b(montag|monday)\s+(bis|to|through|until)\s+(freitag|friday)\b/gi, " ").match(/\b(freitags?|fridays?)\b/gi) ?? [],
  },
  {
    id: "boss",
    why: "no boss theatre (Chef, boss)",
    test: (line) => line.match(/\b(chef|chefin|chefs|boss|bosses)\b/gi) ?? [],
  },
  {
    id: "countdown",
    why: "no fake urgency (Countdown)",
    test: (line) => line.match(/\bcountdowns?\b/gi) ?? [],
  },
  {
    id: "stamp",
    why: "no approval theatre (Stempel, stamp)",
    test: (line) => line.match(/\b(stempel\w*|stamp(?:s|ed)?)\b/gi) ?? [],
  },
  {
    id: "surprise",
    why: "no staged surprise (Überraschung, surprise)",
    test: (line) => line.match(/(?<!\p{L})(überrasch\p{L}*|surpris\p{L}*)/giu) ?? [],
  },
  {
    id: "praise",
    why: "no praise (Richtig!, Correct!)",
    // An interjection standing alone as a sentence: "Richtig!", "Genau.", "Perfect!".
    test: (line) =>
      [...line.matchAll(/(?:^|[.!?:]\s+|["„“'‚])((?:Richtig|Correct|Genau|Exactly|Super|Perfekt|Perfect|Great job|Gut gemacht|Well done)[!.])/g)].map((hit) => hit[1]),
  },
  {
    id: "score",
    why: "no score theatre (score, Punkte)",
    test: (line) => line.match(/\b(scores?|punkte|punktzahl\w*|punktestand)\b/gi) ?? [],
  },
  {
    id: "compliance-claim",
    why: "no compliance claims (compliant, konform) outside a quoted rule",
    test: (line) => {
      const unquoted = line.replace(/[„"“«‹‚`][^„"“”«»‹›‚‘`]*[”“"»›‘’`]/g, " ");
      return unquoted.match(/\b(compliant|non-compliant|\w*konform\w*)\b/gi) ?? [];
    },
  },
  {
    id: "hype",
    why: "no hype words (magisch, nahtlos, seamless, Game-Changer, revolution)",
    test: (line) => line.match(/\b(magisch\w*|magic(?:al)?|nahtlos\w*|seamless\w*|game[- ]?changer\w*|revolution\w*)\b/gi) ?? [],
  },
  {
    id: "umlaut",
    why: "write real umlauts (für, not fuer)",
    test: (line) =>
      line
        .split(/[\s"'„“”‚‘’«»()[\]{}<>,;:!?*]+/)
        .filter((token) => token && UMLAUT_PATTERN.test(token)),
  },
];

/** Markdown only: a heading that ends in a question mark. */
const QUESTION_HEADING = {
  id: "question-heading",
  why: "headings state, they do not ask",
  test: (line) => (/^#{1,6}\s.*\?\s*$/.test(line) ? [line.trim()] : []),
};

/**
 * Permanent exemptions, not debts: the finding is the point of the text.
 * Debts a builder still has to rewrite go to copy-lint.allow.json instead.
 */
export const EXEMPT = [
  {
    file: /^packages\/website\/content\/vorlagen\/(en\/)?ki-in-der-ausbildung-fragen\.md$/,
    rules: ["question-heading", "score", "countdown"],
    reason: "a question sheet: each heading is a question to put to the employer, and it asks whether a tool scores or sets countdowns",
  },
  {
    file: /^packages\/website\/src\/lib\/demo-cases\/[^/]+\/parse\.ts$/,
    rules: ["dash"],
    reason: "parsers recognise dashes in pasted text; they never show one",
  },
];

const isExempt = (finding) => EXEMPT.some((entry) => entry.file.test(finding.file.replace(/!.*$/, "")) && entry.rules.includes(finding.rule));

/* ── Sources ───────────────────────────────────────────────────────────── */

const PROSE_EXTENSIONS = new Set([".md", ".txt"]);
const SKIP_DIRECTORIES = new Set(["node_modules", ".next", ".git", "__tests__", "__screenshots__"]);

function walk(directory, keep, out = []) {
  if (!existsSync(directory)) return out;
  for (const name of readdirSync(directory).sort()) {
    if (SKIP_DIRECTORIES.has(name)) continue;
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) walk(full, keep, out);
    else if (keep(full)) out.push(full);
  }
  return out;
}

const isSourceFile = (file) => /\.(ts|tsx)$/.test(file) && !/\.(test|spec)\.tsx?$/.test(file) && !file.endsWith(".d.ts");
const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/");

/** Every file the lint reads, by kind. Exported for the self-test. */
export function targets() {
  const site = (...parts) => path.join(WEBSITE, ...parts);
  const code = [
    ...walk(site("src/lib/demo-cases"), isSourceFile),
    ...walk(site("src/components/demos"), isSourceFile),
    ...["demos.ts", "demos-ui-copy.ts", "demo-takehome.ts", "demo-beats.ts", "claude-ui.ts"].map((name) => site("src/lib", name)),
    ...readdirSync(site("src/lib"))
      .filter((name) => /^workshops.*\.ts$/.test(name) && !/\.test\.ts$/.test(name))
      .map((name) => site("src/lib", name)),
  ].filter(existsSync);

  const prose = [
    ...walk(site("content/skills"), (file) => file.endsWith("SKILL.md")),
    ...walk(site("content/vorlagen"), (file) => file.endsWith(".md")),
    ...walk(site("public/workshops"), (file) => PROSE_EXTENSIONS.has(path.extname(file))),
    ...walk(path.join(ROOT, "scripts/workshop04/overlay"), (file) => PROSE_EXTENSIONS.has(path.extname(file))),
    ...walk(path.join(ROOT, "scripts/workshop05/kit"), (file) => PROSE_EXTENSIONS.has(path.extname(file))),
    ...walk(path.join(ROOT, "scripts/workshop06/kit"), (file) => PROSE_EXTENSIONS.has(path.extname(file))),
  ].filter((file) => !/\/(PUBLICATION|ASSET-RIGHTS)\.md$/.test(file));

  const json = [
    ...walk(WEBSITE, (file) => /\/deck-copy[^/]*\.json$/.test(file)),
    ...walk(path.join(ROOT, "scripts"), (file) => /\/deck-copy[^/]*\.json$/.test(file) || /\/deck-src\/notes\.json$/.test(file)),
  ];

  // Decks and presenter views: the visible text nodes and the spoken
  // attributes of their HTML, never script, style or comments.
  const html = walk(site("public/workshops"), (file) => /\/(slides[^/]*|presenter)\.html$/.test(file));

  const zips = walk(site("public/workshops"), (file) => file.endsWith(".zip"));
  return { code, prose, json, html, zips };
}

/* ── Extraction ────────────────────────────────────────────────────────── */

const requireFromSite = createRequire(path.join(WEBSITE, "package.json"));
let tsModule;
const typescript = () => (tsModule ??= requireFromSite("typescript"));

/** String literals, template text and JSX text of a TS/TSX file, with line numbers. */
export function codeStrings(source, fileName = "copy.tsx") {
  const ts = typescript();
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = [];
  const add = (node, text) => {
    if (!text || !/\p{L}|[‒-―]/u.test(text)) return;
    const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
    text.split("\n").forEach((part, index) => out.push({ line: line + 1 + index, text: part }));
  };
  const visit = (node) => {
    const parent = node.parent;
    const isModuleSpecifier = parent && (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) && parent.moduleSpecifier === node;
    const isImportCall = parent && ts.isCallExpression(parent) && parent.expression.kind === ts.SyntaxKind.ImportKeyword;
    const isTypeLiteral = parent && ts.isLiteralTypeNode(parent);
    const isDirective = parent && ts.isExpressionStatement(parent);
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !isModuleSpecifier && !isImportCall && !isTypeLiteral && !isDirective) {
      add(node, node.text);
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      add(node, node.text);
    } else if (ts.isJsxText(node)) {
      add(node, node.text.trim());
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return out;
}

/** Every string value in a JSON document, keyed by its JSON path. */
export function jsonStrings(source) {
  const out = [];
  const visit = (value, at) => {
    if (typeof value === "string") value.split("\n").forEach((text) => out.push({ line: at, text }));
    else if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${at}[${index}]`));
    else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) visit(item, at ? `${at}.${key}` : key);
  };
  visit(JSON.parse(source), "");
  return out;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…", shy: "" };

/** Decodes the few entities a deck uses, numeric ones included. */
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    if (name[0] === "#") return String.fromCodePoint(name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

/**
 * The text a visitor sees or hears in an HTML page: text nodes plus alt,
 * title, aria-label and placeholder values, with line numbers. Script, style
 * and comments are blanked first (their line breaks kept). The string values
 * of JSON script blocks count too: a deck keeps its speaker notes there, and
 * a presenter reads them aloud.
 */
export function htmlTextLines(source) {
  const lineOf = (index) => source.slice(0, index).split("\n").length;
  const notes = [];
  for (const match of source.matchAll(/<script\b[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let strings;
    try {
      strings = jsonStrings(match[1]);
    } catch {
      continue;
    }
    const at = lineOf(match.index);
    for (const { text } of strings) {
      const trimmed = text.trim();
      // A bare lowercase token ("pruefprotokoll", "write") is an id or a kind, not a sentence.
      if (trimmed && !/^[a-z0-9-]+$/.test(trimmed) && /\p{L}|[‒-―]/u.test(trimmed)) notes.push({ line: at, text: trimmed });
    }
  }
  return [...notes, ...htmlVisibleLines(source)];
}

function htmlVisibleLines(source) {
  const blank = (block) => block.replace(/[^\n]/g, " ");
  const visible = source
    .replace(/<script\b[\s\S]*?<\/script>/gi, blank)
    .replace(/<style\b[\s\S]*?<\/style>/gi, blank)
    .replace(/<!--[\s\S]*?-->/g, blank);
  const lineAt = (index) => visible.slice(0, index).split("\n").length;
  const out = [];
  const push = (index, raw) => {
    raw.split("\n").forEach((part, offset) => {
      const text = decodeEntities(part).trim();
      // A file tree row ("loesungen/", "START-HIER.md") is a name, not prose.
      const isPath = /^[\w.-]+(?:\/[\w.-]+)*\/$/.test(text) || /^[\w-]+(?:\.[\w-]+)*\.[a-z0-9]{1,4}$/i.test(text);
      if (text && !isPath && /\p{L}|[‒-―]/u.test(text)) out.push({ line: lineAt(index) + offset, text });
    });
  };
  for (const match of visible.matchAll(/>([^<]+)</g)) push(match.index + 1, match[1]);
  for (const match of visible.matchAll(/\s(?:alt|title|aria-label|placeholder)="([^"]*)"/gi)) push(match.index, match[1]);
  return out;
}

/** Markdown and text lines, without fenced code blocks and inline code. */
export function proseLines(source) {
  const out = [];
  let fenced = false;
  source.split("\n").forEach((raw, index) => {
    if (/^\s*(```|~~~)/.test(raw)) {
      fenced = !fenced;
      return;
    }
    if (fenced) return;
    out.push({ line: index + 1, text: raw.replace(/`[^`]*`/g, " ").replace(/\]\([^)]*\)/g, "]") });
  });
  return out;
}

/** The .md and .txt members of a zip (STORE or DEFLATE), read from the central directory. */
export function zipProse(bytes) {
  const buffer = Buffer.from(bytes);
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end -= 1;
  if (end < 0) throw new Error("not a zip: no end of central directory");
  const count = buffer.readUInt16LE(end + 10);
  let at = buffer.readUInt32LE(end + 16);
  const members = [];
  for (let index = 0; index < count; index += 1) {
    const method = buffer.readUInt16LE(at + 10);
    const size = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    const local = buffer.readUInt32LE(at + 42);
    const name = buffer.subarray(at + 46, at + 46 + nameLength).toString("utf8");
    at += 46 + nameLength + extraLength + commentLength;
    if (!PROSE_EXTENSIONS.has(path.extname(name)) || /(^|\/)(PUBLICATION|ASSET-RIGHTS)\.md$/.test(name)) continue;
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const raw = buffer.subarray(dataStart, dataStart + size);
    const data = method === 0 ? raw : method === 8 ? inflateRawSync(raw) : null;
    if (data) members.push({ name, text: data.toString("utf8") });
  }
  return members;
}

/* ── Lint ──────────────────────────────────────────────────────────────── */

export function lintLines(file, lines, { markdown = false, code = false } = {}) {
  const rules = markdown ? [...RULES, QUESTION_HEADING] : RULES;
  const findings = [];
  for (const { line, text } of lines) {
    // In code, a one-word lowercase string is a key or a class name, not copy.
    if (code && /^[a-z][a-z0-9]*$/.test(text.trim())) continue;
    const prose = proseOnly(text);
    for (const rule of rules) {
      for (const hit of rule.test(rule.id === "dash" || rule.id === QUESTION_HEADING.id ? text : prose)) {
        findings.push({ file, line, rule: rule.id, match: hit, text: text.trim().slice(0, 160) });
      }
    }
  }
  return findings;
}

export function collectFindings(sources = targets()) {
  const findings = [];
  for (const file of sources.code) findings.push(...lintLines(rel(file), codeStrings(readFileSync(file, "utf8"), file), { code: true }));
  for (const file of sources.prose) findings.push(...lintLines(rel(file), proseLines(readFileSync(file, "utf8")), { markdown: file.endsWith(".md") }));
  for (const file of sources.json) findings.push(...lintLines(rel(file), jsonStrings(readFileSync(file, "utf8"))));
  for (const file of sources.html ?? []) findings.push(...lintLines(rel(file), htmlTextLines(readFileSync(file, "utf8"))));
  for (const file of sources.zips) {
    for (const member of zipProse(readFileSync(file))) {
      findings.push(...lintLines(`${rel(file)}!${member.name}`, proseLines(member.text), { markdown: member.name.endsWith(".md") }));
    }
  }
  return findings.filter((finding) => !isExempt(finding));
}

export function readAllowlist(file = ALLOW_PATH) {
  if (!existsSync(file)) return [];
  const entries = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(entries)) throw new Error("copy-lint.allow.json must be an array");
  for (const entry of entries) {
    for (const key of ["file", "rule", "match", "reason"]) {
      if (typeof entry[key] !== "string" || entry[key].length === 0) throw new Error(`allowlist entry needs a non-empty "${key}": ${JSON.stringify(entry)}`);
    }
    if (!RULES.some((rule) => rule.id === entry.rule) && entry.rule !== QUESTION_HEADING.id) {
      throw new Error(`allowlist entry names an unknown rule "${entry.rule}"`);
    }
  }
  return entries;
}

/** Splits findings into blocking and allowed, and lists entries that allowed nothing. */
export function applyAllowlist(findings, entries) {
  const used = new Set();
  const blocking = [];
  for (const finding of findings) {
    const matching = entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.file === finding.file && entry.rule === finding.rule && (finding.text.includes(entry.match) || finding.match.includes(entry.match)));
    if (matching.length === 0) blocking.push(finding);
    for (const { index } of matching) used.add(index);
  }
  const stale = entries.filter((_, index) => !used.has(index));
  return { blocking, allowed: findings.length - blocking.length, stale };
}

function main() {
  const asJson = process.argv.includes("--json");
  const findings = collectFindings();
  const { blocking, allowed, stale } = applyAllowlist(findings, readAllowlist());
  if (asJson) {
    process.stdout.write(`${JSON.stringify({ blocking, stale, allowed }, null, 2)}\n`);
  } else {
    const why = Object.fromEntries([...RULES, QUESTION_HEADING].map((rule) => [rule.id, rule.why]));
    for (const finding of blocking) {
      process.stdout.write(`${finding.file}:${finding.line}  ${finding.rule}  "${finding.match}"  (${why[finding.rule]})\n    ${finding.text}\n`);
    }
    for (const entry of stale) {
      process.stdout.write(`stale allowlist entry, remove it: ${entry.file} ${entry.rule} "${entry.match}"\n`);
    }
    process.stdout.write(`copy-lint: ${blocking.length} finding(s), ${stale.length} stale allowlist entr(ies), ${allowed} allowed\n`);
  }
  process.exitCode = blocking.length > 0 || stale.length > 0 ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
