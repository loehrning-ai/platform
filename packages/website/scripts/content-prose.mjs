/**
 * content-prose.mjs
 *
 * Learner-facing file discovery, language and surface classification, and
 * prose extraction shared by content-lint.mjs (voice rules) and
 * content-voice-report.mjs (metrics). Both tools import this module so they
 * agree on what "learner-facing" means.
 *
 * Learner-facing files (relative to packages/website):
 *   - content/** JSON and Markdown (native courses, books, changelog)
 *   - src/lib/<technical course>/** TypeScript (lessons, modules, config, copy)
 *   - src/lib/** and src/app/** modules named *-copy.ts
 *   - src/lib/workshops.ts, src/lib/books.ts, src/lib/courses/catalog.ts
 * Test files, type declarations, __tests__ and fixtures directories are never
 * learner-facing.
 *
 * Prose units: every file yields one or more "lessons" (per-lesson counters
 * apply inside one lesson). JSON block files split at the `lessons` array;
 * Markdown chapters and TypeScript modules count as one lesson each. Each
 * lesson holds ordered "segments": a JSON string value under a prose key, a
 * Markdown file body, or a TypeScript string literal.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** JSON keys whose string values are learner-visible prose. */
export const LEARNER_PROSE_KEYS = new Set([
  "adaptationNote",
  "bad",
  "body",
  "caption",
  "content",
  "correct",
  "critique",
  "definition",
  "desc",
  "description",
  "explanation",
  "good",
  "hint",
  "hook",
  "keyTakeaway",
  "label",
  "modelSolution",
  "note",
  "original",
  "output",
  "prompt",
  "question",
  "questionText",
  "sample",
  "scenario",
  "startingPrompt",
  "strong",
  "subtitle",
  "summary",
  "task",
  "term",
  "text",
  "title",
  "voiceAnchor",
  "weak",
  "why",
]);

/** JSON keys whose string-array items are learner-visible prose. */
export const LEARNER_PROSE_LIST_KEYS = new Set([
  "bullets",
  "highlights",
  "items",
  "keyConcepts",
  "points",
  "rubric",
  "steps",
]);

/** src/lib directories that hold a technical course (English source, German twin). */
export const TECHNICAL_COURSE_DIRS = [
  "ai-native-operator",
  "claude-course",
  "codex",
  "data-engineering-fundamentals",
  "data-infrastructure",
  "data-science",
];

/** Copy modules outside the *-copy.ts naming convention. */
export const EXTRA_COPY_MODULE_FILES = [
  "src/lib/books.ts",
  "src/lib/courses/catalog.ts",
  "src/lib/workshops.ts",
];

const EXCLUDED_SEGMENTS = new Set(["__tests__", "fixtures", "node_modules"]);

function toPosix(value) {
  return value.replaceAll("\\", "/");
}

function walk(dir, results) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir).sort()) {
    if (entry.startsWith(".") || EXCLUDED_SEGMENTS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, results);
    else results.push(full);
  }
  return results;
}

function isTestOrDeclaration(relFile) {
  return (
    relFile.endsWith(".test.ts") ||
    relFile.endsWith(".test.tsx") ||
    relFile.endsWith(".spec.ts") ||
    relFile.endsWith(".d.ts")
  );
}

/** True when a repository-relative posix path is a learner-facing file. */
export function isLearnerFacingFile(relFile) {
  const rel = toPosix(relFile);
  if (rel.split("/").some((segment) => EXCLUDED_SEGMENTS.has(segment))) {
    return false;
  }
  if (rel.startsWith("content/")) {
    return rel.endsWith(".json") || rel.endsWith(".md");
  }
  if (!rel.endsWith(".ts") || isTestOrDeclaration(rel)) return false;
  if (EXTRA_COPY_MODULE_FILES.includes(rel)) return true;
  if (rel.endsWith("-copy.ts")) {
    return rel.startsWith("src/lib/") || rel.startsWith("src/app/");
  }
  return TECHNICAL_COURSE_DIRS.some((dir) => rel.startsWith(`src/lib/${dir}/`));
}

/**
 * Returns the sorted list of learner-facing files below `root`, as
 * repository-relative posix paths.
 */
export function collectLearnerFacingFiles(root) {
  const candidates = [
    ...walk(join(root, "content"), []),
    ...walk(join(root, "src", "lib"), []),
    ...walk(join(root, "src", "app"), []),
  ];
  const prefix = toPosix(root).replace(/\/$/, "") + "/";
  return candidates
    .map((full) => toPosix(full))
    .filter((full) => full.startsWith(prefix))
    .map((full) => full.slice(prefix.length))
    .filter(isLearnerFacingFile)
    .sort();
}

/**
 * Language by path. English lives under `en/` (native courses, books) or is
 * the authored source of a technical course (lessons/*.ts, modules/*.ts).
 * `content/claude` keeps its German twin under `de/`; the ai-native-operator
 * quiz is English. Modules that carry both locales are "mixed".
 */
export function classifyLearnerFile(relFile) {
  const rel = toPosix(relFile);
  const parts = rel.split("/");
  const kind = rel.endsWith(".json") ? "json" : rel.endsWith(".md") ? "md" : "ts";

  if (parts[0] === "content") {
    if (parts[1] === "books" && parts.length >= 3) {
      const lang = parts[3] === "en" && parts.length >= 5 ? "en" : "de";
      const base = `content/books/${parts[2]}`;
      return { kind, lang, surface: lang === "en" ? `${base}/en` : base };
    }
    if (parts.length === 2) {
      const lang = /\.en\.md$/.test(parts[1]) ? "en" : "de";
      const base = `content/${parts[1].replace(/(\.en)?\.(md|json)$/, "")}`;
      return { kind, lang, surface: lang === "en" ? `${base}/en` : base };
    }
    const course = parts[1];
    let lang = "de";
    if (course === "claude") lang = parts[2] === "de" ? "de" : "en";
    else if (course === "ai-native-operator") lang = "en";
    else if (parts[2] === "en") lang = "en";
    const base = `content/${course}`;
    return { kind, lang, surface: lang === "en" ? `${base}/en` : base };
  }

  const technical = TECHNICAL_COURSE_DIRS.find((dir) =>
    rel.startsWith(`src/lib/${dir}/`),
  );
  if (technical && !rel.endsWith("-copy.ts")) {
    const base = `src/lib/${technical}`;
    if (parts.includes("de")) return { kind, lang: "de", surface: `${base}/de` };
    const parent = parts[parts.length - 2];
    if (parent === "lessons" || parent === "modules") {
      return { kind, lang: "en", surface: base };
    }
    return { kind, lang: "mixed", surface: base };
  }
  if (technical) {
    return { kind, lang: "mixed", surface: `src/lib/${technical}` };
  }
  return { kind, lang: "mixed", surface: "copy modules" };
}

// ---------------------------------------------------------------------------
// Prose extraction
// ---------------------------------------------------------------------------

function countNewlines(text, from, to) {
  let count = 0;
  for (let i = from; i < to; i++) if (text[i] === "\n") count++;
  return count;
}

/**
 * Maps parsed JSON string values back to source lines. Content JSON keeps one
 * string per physical line and walks in document order, so a forward-moving
 * cursor over the encoded value is exact; an unmatched value keeps the last
 * known line.
 */
function createJsonLocator(raw) {
  let cursor = 0;
  let line = 1;
  return (value) => {
    const encoded = JSON.stringify(value);
    const index = raw.indexOf(encoded, cursor);
    if (index === -1) return line;
    line += countNewlines(raw, cursor, index);
    cursor = index + encoded.length;
    return line;
  };
}

function isIncorrectOption(node) {
  return (
    node !== null &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    node.isCorrect === false
  );
}

function extractJsonUnits(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const locate = createJsonLocator(raw);
  const lessons = [];
  let current = { id: "file", segments: [] };
  lessons.push(current);

  const push = (value) => {
    if (typeof value !== "string" || value.trim() === "") return;
    current.segments.push({ text: value, line: locate(value), physical: false });
  };

  const walkNode = (node, key) => {
    if (typeof node === "string") {
      if (key !== null && LEARNER_PROSE_KEYS.has(key)) push(node);
      return;
    }
    if (Array.isArray(node)) {
      if (key === "lessons") {
        node.forEach((lesson, index) => {
          const id =
            lesson && typeof lesson === "object" && typeof lesson.id === "string"
              ? lesson.id
              : `lesson-${index + 1}`;
          const previous = current;
          current = { id, segments: [] };
          lessons.push(current);
          walkNode(lesson, null);
          current = previous;
        });
        return;
      }
      const stringList =
        key !== null &&
        LEARNER_PROSE_LIST_KEYS.has(key) &&
        node.every((item) => typeof item === "string");
      for (const item of node) {
        if (stringList) push(item);
        else walkNode(item, key);
      }
      return;
    }
    if (node && typeof node === "object") {
      if (isIncorrectOption(node)) return;
      for (const [childKey, value] of Object.entries(node)) {
        if (childKey.startsWith("_")) continue;
        walkNode(value, childKey);
      }
    }
  };

  walkNode(parsed, null);
  return lessons.filter((lesson) => lesson.segments.length > 0);
}

function extractMarkdownUnits(raw) {
  let body = raw;
  let line = 1;
  const frontmatter = raw.match(/^---\n[\s\S]*?\n---\n/);
  if (frontmatter) {
    body = raw.slice(frontmatter[0].length);
    line += countNewlines(raw, 0, frontmatter[0].length);
  }
  if (body.trim() === "") return [];
  return [{ id: "file", segments: [{ text: body, line, physical: true }] }];
}

const REGEX_PRECEDERS = new Set([
  "(",
  ",",
  "=",
  ":",
  "[",
  "!",
  "&",
  "|",
  "?",
  "{",
  "}",
  ";",
  "+",
  "-",
  "*",
  "%",
  "<",
  ">",
  "~",
  "^",
]);

const SIMPLE_ESCAPES = {
  n: "\n",
  t: "\t",
  r: "\r",
  b: "\b",
  f: "\f",
  v: "\v",
  "0": "\0",
};

function unescapeLiteral(body) {
  let out = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== "\\") {
      out += ch;
      continue;
    }
    const next = body[i + 1];
    if (next === undefined) break;
    if (next in SIMPLE_ESCAPES) {
      out += SIMPLE_ESCAPES[next];
      i++;
    } else if (next === "u" && body[i + 2] === "{") {
      const end = body.indexOf("}", i + 3);
      if (end === -1) break;
      out += String.fromCodePoint(parseInt(body.slice(i + 3, end), 16));
      i = end;
    } else if (next === "u") {
      out += String.fromCharCode(parseInt(body.slice(i + 2, i + 6), 16));
      i += 5;
    } else if (next === "x") {
      out += String.fromCharCode(parseInt(body.slice(i + 2, i + 4), 16));
      i += 3;
    } else if (next === "\n") {
      i++;
    } else {
      out += next;
      i++;
    }
  }
  return out;
}

function precededByModuleSpecifier(source, index) {
  const before = source.slice(Math.max(0, index - 40), index);
  return /(?:\bfrom|\bimport\s*\(|\brequire\s*\()\s*$/.test(before);
}

/**
 * Extracts string and template literal contents from TypeScript source.
 * Comments and regex literals are skipped; `${...}` expressions inside
 * templates are dropped; module specifiers after `from`/`import(` are ignored.
 */
export function extractTsStringLiterals(source) {
  const literals = [];
  const stack = [{ mode: "code", depth: 0 }];
  let line = 1;
  let i = 0;
  let lastSignificant = "";
  let lastWord = "";

  const top = () => stack[stack.length - 1];

  const finishLiteral = (start, startLine, template) => {
    if (precededByModuleSpecifier(source, start - 1)) return;
    const body = source.slice(start, i);
    const text = template
      ? body.replace(/\$\{[\s\S]*?\}/g, " ")
      : body;
    const value = unescapeLiteral(text);
    if (value.trim() !== "") literals.push({ text: value, line: startLine, template });
  };

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    const state = top();

    if (state.mode === "lineComment") {
      if (ch === "\n") {
        stack.pop();
        line++;
      }
      i++;
      continue;
    }
    if (state.mode === "blockComment") {
      if (ch === "*" && next === "/") {
        stack.pop();
        i += 2;
        continue;
      }
      if (ch === "\n") line++;
      i++;
      continue;
    }
    if (state.mode === "regex") {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === "[") state.inClass = true;
      else if (ch === "]") state.inClass = false;
      else if (ch === "/" && !state.inClass) stack.pop();
      else if (ch === "\n") {
        stack.pop();
        line++;
      }
      i++;
      continue;
    }
    if (state.mode === "single" || state.mode === "double") {
      const quote = state.mode === "single" ? "'" : '"';
      if (ch === "\\") {
        if (next === "\n") line++;
        i += 2;
        continue;
      }
      if (ch === quote) {
        finishLiteral(state.start, state.line, false);
        stack.pop();
        i++;
        lastSignificant = quote;
        continue;
      }
      if (ch === "\n") {
        stack.pop();
        line++;
      }
      i++;
      continue;
    }
    if (state.mode === "template") {
      if (ch === "\\") {
        if (next === "\n") line++;
        i += 2;
        continue;
      }
      if (ch === "`") {
        finishLiteral(state.start, state.line, true);
        stack.pop();
        i++;
        lastSignificant = "`";
        continue;
      }
      if (ch === "$" && next === "{") {
        stack.push({ mode: "code", depth: 0, templateExpression: true });
        i += 2;
        continue;
      }
      if (ch === "\n") line++;
      i++;
      continue;
    }

    // mode === "code"
    if (ch === "/" && next === "/") {
      stack.push({ mode: "lineComment" });
      i += 2;
      continue;
    }
    if (ch === "/" && next === "*") {
      stack.push({ mode: "blockComment" });
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      stack.push({ mode: ch === "'" ? "single" : "double", start: i + 1, line });
      i++;
      continue;
    }
    if (ch === "`") {
      stack.push({ mode: "template", start: i + 1, line });
      i++;
      continue;
    }
    if (ch === "/") {
      const regexContext =
        lastSignificant === "" ||
        REGEX_PRECEDERS.has(lastSignificant) ||
        ["return", "typeof", "case", "in", "of"].includes(lastWord);
      if (regexContext) {
        stack.push({ mode: "regex", inClass: false });
        i++;
        continue;
      }
    }
    if (state.templateExpression) {
      if (ch === "{") state.depth++;
      if (ch === "}") {
        if (state.depth === 0) {
          stack.pop();
          i++;
          continue;
        }
        state.depth--;
      }
    }
    if (ch === "\n") line++;
    if (/\S/.test(ch)) {
      lastSignificant = ch;
      if (/[A-Za-z_$]/.test(ch)) {
        const match = /^[A-Za-z_$][\w$]*/.exec(source.slice(i, i + 40));
        if (match) {
          lastWord = match[0];
          i += match[0].length;
          lastSignificant = match[0][match[0].length - 1];
          continue;
        }
      } else {
        lastWord = "";
      }
    }
    i++;
  }
  return literals;
}

function extractTsUnits(raw) {
  const segments = extractTsStringLiterals(raw).map((literal) => ({
    text: literal.text,
    line: literal.line,
    physical: literal.template,
  }));
  if (segments.length === 0) return [];
  return [{ id: "file", segments }];
}

/**
 * Returns the prose units of one learner-facing file:
 * `{ relFile, kind, lang, surface, lessons: [{ id, segments: [{ text, line, physical }] }] }`.
 * `physical` marks segments whose newlines are real source lines (Markdown
 * bodies, template literals) so paragraph line numbers can be derived.
 */
export function extractProseUnits(relFile, raw) {
  const classification = classifyLearnerFile(relFile);
  let lessons;
  if (classification.kind === "json") lessons = extractJsonUnits(raw);
  else if (classification.kind === "md") lessons = extractMarkdownUnits(raw);
  else lessons = extractTsUnits(raw);
  return { relFile: toPosix(relFile), ...classification, lessons };
}

// ---------------------------------------------------------------------------
// Text primitives (paragraphs, lists, sentences, words)
// ---------------------------------------------------------------------------

const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const HEADING = /^\s{0,3}#{1,6}\s/;
const TABLE_ROW = /^\s*\|/;

/** Replaces fenced code blocks with blank lines so line numbers survive. */
export function blankOutCodeFences(text) {
  return text.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/[^\n]/g, ""),
  );
}

function lineType(lineText) {
  if (LIST_ITEM.test(lineText)) return "list";
  if (HEADING.test(lineText)) return "heading";
  if (TABLE_ROW.test(lineText)) return "table";
  if (/^\s*>/.test(lineText)) return "quote";
  return "text";
}

/**
 * Splits a segment into paragraph blocks. Each block is
 * `{ type, text, lineIndex, items }` where type is "text", "list", "heading",
 * "table" or "quote"; `lineIndex` is the zero-based line of the block inside
 * the segment; `items` is the item count for lists. A text run followed by
 * list lines without a blank line yields two blocks. A blank line always ends
 * a block, so two lists separated by a blank line count as two lists (loose
 * lists are rare in this corpus and would otherwise merge distinct lists).
 */
export function splitParagraphs(segmentText) {
  const lines = blankOutCodeFences(segmentText).split("\n");
  const blocks = [];
  let run = null;
  const flush = () => {
    if (run !== null && run.lines.join("").trim() !== "") {
      const block = {
        type: run.type,
        text: run.lines.join("\n"),
        lineIndex: run.start,
      };
      if (run.type === "list") {
        block.items = run.lines.filter((l) => LIST_ITEM.test(l)).length;
      }
      blocks.push(block);
    }
    run = null;
  };
  lines.forEach((lineText, index) => {
    if (lineText.trim() === "") {
      flush();
      return;
    }
    const type = lineType(lineText);
    if (run === null || run.type !== type) {
      flush();
      run = { type, start: index, lines: [] };
    }
    run.lines.push(lineText);
  });
  flush();
  return blocks;
}

const ABBREVIATIONS =
  /\b(?:z\.\s?B|d\.\s?h|u\.\s?a|u\.\s?U|s\.\s?o|s\.\s?u|o\.\s?g|i\.\s?d\.\s?R|e\.\s?g|i\.\s?e|bzw|bspw|ca|Nr|Art|Abs|Abschn|vgl|usw|etc|vs|Dr|Prof|Mr|Mrs|Ms|St|No|approx|Inc|Ltd|sog|ggf|evtl|inkl|zzgl|exkl|Std|Min|Mio|Mrd|Tsd|Jh|Hrsg|Tel|Fig|Abb|Kap|Co|Corp|Jr|Sr|U\.S|U\.K|Mind|max|min|resp|engl|dt|lat|geb|gest|Bd|Aufl|S|f|ff|Pkt|Anm|Verf|Red|Ziff|Buchst|Satz|Rn|Rz|lit|para|sec|vol|ed|eds|al|approx|dept|est|fig|no|pp|p)\./g;

// "M\u00e4rz" is spelled with an escape so this module stays ASCII-only.
const ORDINAL_DATE = new RegExp(
  "\\b(\\d{1,2})\\.(?=\\s+(?:Januar|Februar|M\u00e4rz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Jan|Feb|Mrz|Apr|Jun|Jul|Aug|Sep|Sept|Okt|Nov|Dez|Quartal|Halbjahr|Jahrhundert|Jh|Kapitel|Lektion|Modul|Schritt|Stufe|Platz|Auflage))",
  "g",
);

// Placeholder for protected abbreviation dots while splitting sentences.
const DOT_PLACEHOLDER = "\u0001";
// Opening and closing quote characters that may hug a sentence boundary.
const CLOSING_QUOTES = "\u201c\u201d\u2019";
const OPENING_QUOTES = "\u201e\u201c\u2018\u2019";
const SENTENCE_BOUNDARY = new RegExp(
  `(?<=[.!?][)\\]"'${CLOSING_QUOTES}]*)\\s+(?=[("'${OPENING_QUOTES}\\[]?[\\p{Lu}\\p{N}])`,
  "u",
);

/** Removes Markdown syntax that would otherwise split or count as words. */
export function stripMarkdown(text) {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_]{1,3}(?=\S)|(?<=\S)[*_]{1,3}/g, "")
    .replace(/\s*\n\s*/g, " ");
}

/**
 * Splits prose into sentences. Common German and English abbreviations and
 * German ordinal dates do not end a sentence; decimals never do because no
 * whitespace follows the dot.
 */
export function splitSentences(text) {
  const protectedText = stripMarkdown(text)
    .replace(ABBREVIATIONS, (m) => m.replace(/\./g, DOT_PLACEHOLDER))
    .replace(ORDINAL_DATE, `$1${DOT_PLACEHOLDER}`);
  return protectedText
    .split(SENTENCE_BOUNDARY)
    .map((sentence) => sentence.replaceAll(DOT_PLACEHOLDER, ".").trim())
    .filter((sentence) => countWords(sentence) > 0);
}

const WORD = /[\p{L}\p{N}]+(?:[-'\u2019][\p{L}\p{N}]+)*/gu;

export function countWords(text) {
  const matches = text.match(WORD);
  return matches ? matches.length : 0;
}

/** True for a segment that reads as prose rather than an identifier or label. */
export function isProseSegment(text) {
  return countWords(text) >= 3;
}
