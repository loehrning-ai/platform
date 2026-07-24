#!/usr/bin/env node
/**
 * content-lint.mjs
 *
 * Editorial and legal content linter for the KI-Kompetenzweg learning platform.
 *
 * OWNERSHIP: legal-source governance.
 * This is the SINGLE canonical implementation. accessibility and quality hardening and 036 MUST extend
 * this file — they must NOT create a new scripts/content-lint.mjs.
 *
 * EXTENSION POINTS (append new check functions at the bottom):
 *   - accessibility and quality hardening: add E2E accessibility and route-matrix checks
 *   - content-freshness governance: add freshness nextReview gate and metadata-completeness checks
 *
 * Usage:
 *   bun run content:lint          → runs all checks
 *   node scripts/content-lint.mjs → same
 *
 * Exit code 0 = clean. Exit code 1 = at least one ERROR found.
 * Warnings are logged but do not affect exit code.
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let errorCount = 0;
let warningCount = 0;

function error(file, line, rule, message) {
  console.error(`[ERROR][${rule}] ${file}:${line} — ${message}`);
  errorCount++;
}

function warn(file, line, rule, message) {
  console.warn(`[WARN][${rule}] ${file}:${line} — ${message}`);
  warningCount++;
}

// ---------------------------------------------------------------------------
// File collection utilities
// ---------------------------------------------------------------------------

function walkDir(dir, predicate, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, predicate, results);
    } else if (predicate(full)) {
      results.push(full);
    }
  }
  return results;
}

const contentJsonFiles = walkDir(join(ROOT, "content"), (f) => f.endsWith(".json"));
const contentMdFiles = walkDir(join(ROOT, "content"), (f) => f.endsWith(".md"));
// The standalone /vorlagen template section was removed from the platform;
// no template MD files exist, so template-specific rules no-op.
const templateMdFiles = [];

// TSX files in app/ and components/ (not test files)
const tsxFiles = [
  ...walkDir(join(ROOT, "src", "app"), (f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx")),
  ...walkDir(join(ROOT, "src", "components"), (f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx")),
];

// public-content transition extension: TS data modules under src/lib (e.g. blog-metadata.ts,
// demos.ts, demos-copy.ts) render learner-facing strings (titles, summaries,
// demo copy) but were previously skipped. Em-dash and banned-phrase checks now
// also scan these. Test files (.test.ts, .d.ts) are excluded. The TSX skip
// heuristic (comments / imports / console logs / data placeholders) is reused
// so type annotations and code lines don't false-positive.
//
// Excluded subtrees: course/, courses/, and auth/ are owned by the course-
// engine and auth plans and are out of scope for this editorial sweep (they
// carry pre-existing prose dashes tracked elsewhere). Keeping them out of the
// new scan avoids flagging strings this task is not permitted to edit.
const TS_DATA_EXCLUDED_DIRS = [
  join(ROOT, "src", "lib", "course") + "/",
  join(ROOT, "src", "lib", "courses") + "/",
  join(ROOT, "src", "lib", "auth") + "/",
];
const tsDataFiles = walkDir(
  join(ROOT, "src", "lib"),
  (f) =>
    f.endsWith(".ts") &&
    !f.endsWith(".test.ts") &&
    !f.endsWith(".d.ts") &&
    !TS_DATA_EXCLUDED_DIRS.some((dir) => f.startsWith(dir)),
);

// ---------------------------------------------------------------------------
// 3a. Banned-phrase check
// ---------------------------------------------------------------------------

/**
 * Hard-error banned phrases (CI fail).
 * These are commercial/selling/hype words that must not appear in learner-facing content.
 * Word-boundary matching is used where appropriate.
 *
 * NOTE on "Mehrwert": the word appears in educational content in the sense of
 * "no added value" (e.g., "Meta-Meeting ohne Mehrwert") — this is an ALLOWED
 * usage in a negative/explanatory context. The lint checks for it as a flag so
 * contributors remain aware; see ALLOWED_CONTEXTS below for exception handling.
 *
 * EXTENSION POINT: accessibility and quality hardening/036 may append to this list, not replace it.
 */
const BANNED_PHRASES_ERROR = [
  { phrase: "disruptiv", pattern: /\bdisruptiv\b/ },
  { phrase: "KI-Transformation", pattern: /\bKI-Transformation\b/ },
  { phrase: "Wettbewerbsvorteil", pattern: /\bWettbewerbsvorteil\b/ },
  { phrase: "profitieren Sie", pattern: /\bprofitieren Sie\b/ },
  { phrase: "Jetzt loslegen", pattern: /\bJetzt loslegen\b/i },
  { phrase: "Hier klicken", pattern: /\bHier klicken\b/i },
  { phrase: "Erfahren Sie mehr", pattern: /\bErfahren Sie mehr\b/i },
  { phrase: "zukunftssicher", pattern: /\bzukunftssicher\b/ },
  { phrase: "Paradigmenwechsel", pattern: /\bParadigmenwechsel\b/ },
  { phrase: "KI-Reifegrad", pattern: /\bKI-Reifegrad\b/ },
  { phrase: "Ihre Organisation", pattern: /\bIhre Organisation\b/ },
  { phrase: "KI-beschleunigt", pattern: /\bKI-beschleunigt\b/ },
  { phrase: "Mehrwert", pattern: /\bMehrwert\b/ },
];

/**
 * Soft-warning phrases (log but don't fail).
 */
const BANNED_PHRASES_WARN_JSON = [
  { phrase: "Ihr Unternehmen", pattern: /\bIhr Unternehmen\b/ },
];

const BANNED_PHRASES_WARN_CONTENT = [
  { phrase: "Demo (as learner-visible label)", pattern: /\bDemo\b/ },
];

/**
 * Contexts where a banned phrase is used in a clearly educational/negative sense.
 * A line containing the phrase AND one of these context markers is downgraded to a warning.
 * This prevents false positives on "Meta-Meeting ohne Mehrwert" etc.
 */
const ALLOWED_CONTEXT_MARKERS = [
  "ohne Mehrwert",
  "kein Mehrwert",
  "keinen Mehrwert",
  "nicht als Mehrwert",
];

/**
 * "Demo" is only non-canonical when it labels a platform-owned learning
 * surface. Generic demonstrations and third-party product names remain valid
 * German copy and must not generate editorial noise.
 */
const ALLOWED_DEMO_CONTEXTS = [
  /\bLive-Demo\b/i,
  /\bfiktiv zur Demo\b/i,
  /\bNicht Demo\b/i,
  /\bHive(?: Moderation)? Demo\b/i,
];

const URL_LEADING_PUNCTUATION = new Set(["(", "[", "{", "<", "\"", "'"]);
const URL_TRAILING_PUNCTUATION = new Set([
  ")",
  "]",
  "}",
  ">",
  "\"",
  "'",
  ".",
  ",",
  ";",
  "!",
  "?",
]);

function stripUrlPunctuation(value) {
  let start = 0;
  let end = value.length;
  while (start < end && URL_LEADING_PUNCTUATION.has(value[start])) start++;
  while (end > start && URL_TRAILING_PUNCTUATION.has(value[end - 1])) end--;
  return value.slice(start, end);
}

/**
 * The Hive demo is a named third-party product, not a platform-owned "Demo"
 * label. Exempt only its exact HTTPS URL (or the same bare host/path in prose).
 * Parsing the candidate prevents lookalike hosts such as
 * `hivemoderation.com.evil.example/demo` from suppressing the warning.
 */
export function containsExactHiveDemoUrl(line) {
  for (const rawToken of line.split(/\s+/)) {
    const token = stripUrlPunctuation(rawToken);
    if (!token.toLowerCase().includes("hivemoderation.com")) continue;

    try {
      const explicitScheme = token.includes("://");
      const parsed = new URL(explicitScheme ? token : `https://${token}`);
      if (
        parsed.protocol === "https:" &&
        parsed.username === "" &&
        parsed.password === "" &&
        parsed.hostname === "hivemoderation.com" &&
        parsed.port === "" &&
        parsed.pathname === "/demo" &&
        parsed.search === "" &&
        parsed.hash === ""
      ) {
        return true;
      }
    } catch {
      // Malformed and partial URL-like tokens are not eligible exemptions.
    }
  }
  return false;
}

export function hasAllowedDemoContext(line) {
  return (
    ALLOWED_DEMO_CONTEXTS.some((allowed) => allowed.test(line)) ||
    containsExactHiveDemoUrl(line)
  );
}

/**
 * Incorrect quiz options deliberately contain misconceptions, wrong dates,
 * or rejected terminology. They are learner-visible, but they are not factual
 * claims or endorsed platform language.
 */
function isIncorrectJsonAnswerOptionLine(lines, index) {
  const line = lines[index];
  if (!/"text"\s*:/.test(line)) return false;

  const fragment = lines.slice(index, index + 5).join("\n");
  const objectEnd = fragment.indexOf("}");
  const answerObject = objectEnd === -1 ? fragment : fragment.slice(0, objectEnd + 1);
  return /"isCorrect"\s*:\s*false/.test(answerObject);
}

function isTypeOnlyDemoReference(line) {
  const stripped = stripTrailingLineComment(line).trim();
  return /\bDemo\b/.test(stripped) && !/["'`<>]/.test(stripped);
}

function checkBannedPhrases() {
  const filesToCheck = [
    ...contentJsonFiles,
    ...contentMdFiles,
    ...tsxFiles,
    ...tsDataFiles,
  ];

  for (const file of filesToCheck) {
    const relFile = file.replace(ROOT + "/", "");
    const lines = readFileSync(file, "utf-8").split("\n");
    const isTemplate = templateMdFiles.includes(file);
    const isJson = file.endsWith(".json");

    lines.forEach((line, i) => {
      const lineNum = i + 1;
      const isIncorrectAnswerOption = isJson && isIncorrectJsonAnswerOptionLine(lines, i);

      // Hard-error banned phrases
      for (const { phrase, pattern } of BANNED_PHRASES_ERROR) {
        if (pattern.test(line)) {
          if (isIncorrectAnswerOption) continue;
          // Check if the line has an allowed-context marker (educational use)
          const hasAllowedContext = ALLOWED_CONTEXT_MARKERS.some((ctx) => line.includes(ctx));
          if (hasAllowedContext) {
            warn(relFile, lineNum, "BANNED-PHRASE-CONTEXT", `"${phrase}" appears in allowed educational context (verify intent)`);
          } else {
            error(relFile, lineNum, "BANNED-PHRASE", `"${phrase}"`);
          }
        }
      }

      // Soft-warning: "Ihr Unternehmen" in lesson JSON (not in templates — templates are directed at organizations)
      if (isJson && !isTemplate) {
        for (const { phrase, pattern } of BANNED_PHRASES_WARN_JSON) {
          if (pattern.test(line)) {
            warn(relFile, lineNum, "BANNED-PHRASE-WARN", `"${phrase}" (use "dein Unternehmen" or restructure for learner voice)`);
          }
        }
      }

      // Soft-warning: "Demo" as learner-visible label in content/TSX (not in code comments or identifiers)
      // Only check if the line contains "Demo" outside of code patterns
      for (const { phrase, pattern } of BANNED_PHRASES_WARN_CONTENT) {
        if (pattern.test(line)) {
          if (isIncorrectAnswerOption) continue;
          if (hasAllowedDemoContext(line)) continue;
          if (isTypeOnlyDemoReference(line)) continue;
          // Skip code comments, import statements, variable names, object keys
          const isCodeLine = /^\s*(\/\/|import |export |const |let |var |function |interface |type |class |\/\*|@|\*)/
            .test(line);
          const isDeveloperDiagnostic = /\b(?:errors?|warnings?)\.push\(|\bthrow new Error\(|\bconsole\.(?:warn|error|log|info|debug)\b/.test(line);
          const isCodeIdentifier = /"demo"|'demo'|\bdemoMode\b|\bDemo(?:Page|Card|Section)\b|(?:^|[,({]\s*)demo\s*:|demo-[a-z0-9]/.test(line);
          if (!isCodeLine && !isDeveloperDiagnostic && !isCodeIdentifier) {
            warn(relFile, lineNum, "DEMO-LABEL-WARN", `"${phrase}" found — canonical learner-visible label is "Praxisbeispiel"`);
          }
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 3b. AI Act date string check (whitelist from legal-registry.json)
// ---------------------------------------------------------------------------

const GERMAN_DATE_PATTERN = /\d+\. (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) 202[3-9]/g;

// Placeholder patterns in templates (fill-in-the-blank user fields)
const PLACEHOLDER_PATTERNS = [
  /<placeholder>/i,
  /\[Datum\]/i,
  /\[TT\.MM\.JJJJ\]/i,
  /\[Jahr\]/i,
];

function checkAiActDates() {
  const registryPath = join(ROOT, "src", "lib", "legal-registry.json");

  if (!existsSync(registryPath)) {
    warn("scripts/content-lint.mjs", 0, "REGISTRY-MISSING",
      "src/lib/legal-registry.json not found — run 'bun run registry:export' first. Skipping date check.");
    return;
  }

  let approvedDates;
  try {
    approvedDates = new Set(JSON.parse(readFileSync(registryPath, "utf-8")));
  } catch {
    warn("scripts/content-lint.mjs", 0, "REGISTRY-PARSE",
      "Could not parse src/lib/legal-registry.json. Skipping date check.");
    return;
  }

  const filesToCheck = [...contentJsonFiles, ...contentMdFiles];

  for (const file of filesToCheck) {
    const relFile = file.replace(ROOT + "/", "");
    const isTemplate = templateMdFiles.includes(file);
    const content = readFileSync(file, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, i) => {
      const lineNum = i + 1;

      // Skip placeholder lines in templates
      if (isTemplate && PLACEHOLDER_PATTERNS.some((p) => p.test(line))) return;
      // A deliberately wrong quiz option is not a legal claim.
      if (file.endsWith(".json") && isIncorrectJsonAnswerOptionLine(lines, i)) return;

      const matches = line.matchAll(GERMAN_DATE_PATTERN);
      for (const match of matches) {
        const dateStr = match[0];
        if (!approvedDates.has(dateStr)) {
          warn(relFile, lineNum, "HARDCODED-DATE",
            `"${dateStr}" — date appears correct but is hardcoded. Consider using claimId reference instead (see legal-registry.ts).`);
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 3c. Em-dash check in content prose
// ---------------------------------------------------------------------------
//
// accessibility and quality hardening extension: also scans src/**/*.tsx (excluding test files) for
// em-dashes and en-dashes in JSX text/strings (human-facing copy).
// Code comments ({/* ... */}) are skipped.
// En-dashes in data-display placeholders like {hydrated ? `${pct}%` : "—"}
// are not human copy and are excluded via SKIP patterns.
//
// FIX SWEEP: After extending to TSX, run `bun run content:lint` and fix
// every dash it reports. Identifiers, import paths, variable names, and
// TypeScript type annotations are excluded by the skip heuristic below.

const EM_DASH = "—"; // —
const EN_DASH = "–"; // –

// Returns true for lines that should be skipped in .tsx/.ts files:
// - JSX block comments (opening with {/*)
// - Single-line JS comments (//)
// - Import/export declarations
// - Lines where the dash is inside a ternary as a fallback value (data placeholder)
// - Digit-to-digit en-dash ranges like "2019-2024"
//
// public-content transition note: developer-facing console.* diagnostics (warn/error/log/info/
// debug) are NOT learner copy, so a dash inside them is not a voice violation.
function isTsxSkipLine(line) {
  const trimmed = line.trim();
  // JSX block comments
  if (trimmed.startsWith("{/*") || trimmed.startsWith("/*") || trimmed.startsWith("* ") || trimmed.startsWith("*/")) return true;
  // Single-line JS comments
  if (trimmed.startsWith("//")) return true;
  // Import/export lines
  if (trimmed.startsWith("import ") || trimmed.startsWith("export ")) return true;
  // Developer-facing console diagnostics (not learner copy)
  if (/\bconsole\.(warn|error|log|info|debug)\b/.test(trimmed)) return true;
  // Ternary data-display fallback: `? ... : "—"` (em-dash as placeholder only)
  if (/:\s*["'`]—["'`]/.test(line)) return true;
  // En-dash in numeric ranges inside data arrays/objects (e.g. "2019–2024")
  // These are data, not prose. Detect as: digit–digit pattern.
  // We still flag en-dashes NOT in numeric ranges.
  return false;
}

// Remove a trailing `// ...` line comment from a line of code while respecting
// string literals (so a `//` inside a quoted string or a `://` URL is kept).
// Returns the code-and-strings portion only; a dash that lived solely in the
// trailing comment will be gone from the result, so it won't be flagged.
function stripTrailingLineComment(line) {
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : "";
    if (ch === "'" && !inDouble && !inBacktick && prev !== "\\") inSingle = !inSingle;
    else if (ch === '"' && !inSingle && !inBacktick && prev !== "\\") inDouble = !inDouble;
    else if (ch === "`" && !inSingle && !inDouble && prev !== "\\") inBacktick = !inBacktick;
    else if (ch === "/" && line[i + 1] === "/" && !inSingle && !inDouble && !inBacktick) {
      return line.slice(0, i);
    }
  }
  return line;
}

// For TSX/TS files, check em-dash (—) and en-dash (–) in non-comment, non-data
// portions. Trailing line comments are stripped first so a dash in a code
// comment is not mistaken for learner copy.
function checkEmDashInTsx(file, lines) {
  const relFile = file.replace(ROOT + "/", "");
  lines.forEach((rawLine, i) => {
    if (isTsxSkipLine(rawLine)) return;
    const line = stripTrailingLineComment(rawLine);
    const lineNum = i + 1;
    if (line.includes(EM_DASH)) {
      error(relFile, lineNum, "EM-DASH",
        `Em-dash (U+2014) found in TSX copy — use a comma, colon, or parentheses instead (voice spec §5)`);
    }
    // En-dashes: flag unless it is a digit–digit range (data, not prose)
    if (line.includes(EN_DASH) && !/\d–\d/.test(line)) {
      error(relFile, lineNum, "EN-DASH",
        `En-dash (U+2013) found in TSX prose — use a hyphen (-) for ranges or restructure`);
    }
  });
}

function checkEmDash() {
  // Check .json and .md content files (original behaviour)
  const filesToCheck = [...contentJsonFiles, ...contentMdFiles];
  for (const file of filesToCheck) {
    const relFile = file.replace(ROOT + "/", "");
    const lines = readFileSync(file, "utf-8").split("\n");
    lines.forEach((line, i) => {
      const lineNum = i + 1;
      if (line.includes(EM_DASH)) {
        error(relFile, lineNum, "EM-DASH",
          `Em-dash (U+2014) found in content prose — use a comma, colon, or parentheses instead`);
      }
      if (line.includes(EN_DASH)) {
        error(relFile, lineNum, "EN-DASH",
          `En-dash (U+2013) found in content prose — use a hyphen (-) for ranges or restructure`);
      }
    });
  }

  // accessibility and quality hardening extension: also check src/**/*.tsx (human-facing copy in JSX)
  // public-content transition extension: also check src/lib/**/*.ts data modules. The same
  // skip heuristic (comments / imports / ternary data placeholders) applies.
  for (const file of [...tsxFiles, ...tsDataFiles]) {
    const lines = readFileSync(file, "utf-8").split("\n");
    checkEmDashInTsx(file, lines);
  }
}

// ---------------------------------------------------------------------------
// 3d. "Studien zeigen" unsourced absolutes check
// ---------------------------------------------------------------------------

function checkStudienZeigen() {
  for (const file of contentJsonFiles) {
    const relFile = file.replace(ROOT + "/", "");
    const content = readFileSync(file, "utf-8");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Invalid JSON is a build error, not a lint concern here
      continue;
    }

    // Walk the parsed JSON and find objects containing "Studien zeigen" in string values
    // without a co-located "sources" array
    const violations = findStudienZeigenViolations(parsed, relFile, content);
    for (const v of violations) {
      error(relFile, v.line, "UNSOURCED-CLAIM",
        `"Studien zeigen" without co-located sources[] array`);
    }
  }
}

function findStudienZeigenViolations(obj, file, rawContent) {
  const violations = [];

  function walk(node) {
    if (typeof node === "string") {
      if (node.includes("Studien zeigen")) {
        // Find approximate line number in raw content
        const idx = rawContent.indexOf("Studien zeigen");
        const line = rawContent.substring(0, idx).split("\n").length;
        violations.push({ line });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === "object") {
      // Check if this object has a string value containing "Studien zeigen"
      // AND lacks a "sources" array
      let hasStudienZeigen = false;
      let hasSources = false;

      for (const [key, val] of Object.entries(node)) {
        if (key === "sources" && Array.isArray(val) && val.length > 0) {
          hasSources = true;
        }
        if (typeof val === "string" && val.includes("Studien zeigen")) {
          hasStudienZeigen = true;
        }
      }

      if (hasStudienZeigen && !hasSources) {
        const idx = rawContent.indexOf("Studien zeigen");
        const line = rawContent.substring(0, idx).split("\n").length;
        violations.push({ line });
        return; // Don't double-report children
      }

      // Recurse into children
      for (const val of Object.values(node)) {
        walk(val);
      }
    }
  }

  walk(obj);
  return violations;
}

// ---------------------------------------------------------------------------
// 3e. "Nach dutzenden Audits" / "Nach zahlreichen Audits" authority claim check
// ---------------------------------------------------------------------------

function checkAuditAuthorityClain() {
  const filesToCheck = [...contentJsonFiles, ...contentMdFiles];
  const pattern = /\bNach (dutzenden|zahlreichen) Audits\b/;

  for (const file of filesToCheck) {
    const relFile = file.replace(ROOT + "/", "");
    const lines = readFileSync(file, "utf-8").split("\n");

    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        error(relFile, i + 1, "UNVERIFIABLE-AUTHORITY",
          `"Nach dutzenden/zahlreichen Audits" — unverifiable implied testimonial. Use published research attribution instead.`);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// 3f. ASCII umlaut substitutes check
// ---------------------------------------------------------------------------

/**
 * ASCII umlaut substitutes must not appear in learner-facing prose.
 * These are tell-tale signs of text copied from a non-German keyboard or old content.
 *
 * Word-boundary matching only: "fuer" matches, but "refuer" does not.
 * Note: "oeffentlich" catches "oeffentlich" but not "Oeffentlich" (case-sensitive check).
 *
 * public-content contract ratchet: a match in PROSE is a hard ERROR (regressions fail
 * CI). A match that sits inside a slug, URL, file path, email, or code
 * identifier (e.g. the slug `dsfa-fuer-ki-systeme` or the route `/ueber-mich`)
 * is exempt so legitimate ASCII identifiers do not fail the build. See
 * isAsciiUmlautIdentifierContext below for the prose-vs-identifier rule.
 */
const ASCII_UMLAUT_PATTERNS = [
  { pattern: /\bfuer\b/, example: "fuer → für" },
  { pattern: /\boeffentlich\b/i, example: "oeffentlich → öffentlich" },
  { pattern: /\bBuecher\b/, example: "Buecher → Bücher" },
  { pattern: /\bpruefe\b/i, example: "pruefe → prüfe" },
  { pattern: /\bGeraete\b/, example: "Geraete → Geräte" },
  { pattern: /\bGeraeten\b/, example: "Geraeten → Geräten" },
  { pattern: /\bmuessen\b/i, example: "muessen → müssen" },
  { pattern: /\bkoennen\b/i, example: "koennen → können" },
  { pattern: /\bgroesse\b/i, example: "groesse → Größe" },
  // public-content transition additions: ASCII-umlaut words found in demo TS/TSX data modules.
  // Kept as an explicit word list on purpose — no generic ae/oe/ue heuristic
  // (that would false-positive on loanwords like "Fluenz", "Queue", "Status").
  { pattern: /\bZwoelf\b/i, example: "Zwoelf → Zwölf" },
  { pattern: /\berklaerten\b/i, example: "erklaerten → erklärten" },
  { pattern: /\bVertraege\b/, example: "Vertraege → Verträge" },
  { pattern: /\bVertraegen\b/, example: "Vertraegen → Verträgen" },
  { pattern: /\bGeschaeftsfuehrung\b/, example: "Geschaeftsfuehrung → Geschäftsführung" },
  { pattern: /\bmoeglich\b/i, example: "moeglich → möglich" },
  { pattern: /\benthaelt\b/i, example: "enthaelt → enthält" },
  { pattern: /\bwaehle\b/i, example: "waehle → wähle" },
];

// Characters that, when directly glued to an ASCII-umlaut match, mark it as
// part of a slug, URL, file path, email, or code identifier rather than prose.
// Prose words are bounded by whitespace, quotes, or sentence punctuation.
const ASCII_UMLAUT_IDENTIFIER_SEP = /[-_/@:]/;

// True when the match at [start, end) sits inside an identifier/slug/URL/path/
// email (exempt from the prose ratchet) rather than in prose. A hyphen, slash,
// underscore, "@", or ":" glued to either side is the tell (e.g. the slug
// `dsfa-fuer-ki-systeme` or the route `/ueber-mich`). A dot counts only when it
// joins the match to more alphanumerics (domain/extension); a sentence-final
// "moeglich." stays prose and still errors.
function isAsciiUmlautIdentifierContext(line, start, end) {
  const before = start > 0 ? line[start - 1] : "";
  const after = end < line.length ? line[end] : "";
  if (ASCII_UMLAUT_IDENTIFIER_SEP.test(before) || ASCII_UMLAUT_IDENTIFIER_SEP.test(after)) {
    return true;
  }
  if (before === "." && /[A-Za-z0-9]/.test(start > 1 ? line[start - 2] : "")) return true;
  if (after === "." && /[A-Za-z0-9]/.test(end + 1 < line.length ? line[end + 1] : "")) return true;
  return false;
}

function checkAsciiUmlauts() {
  const filesToCheck = [...contentJsonFiles, ...contentMdFiles, ...tsxFiles];

  for (const file of filesToCheck) {
    const relFile = file.replace(ROOT + "/", "");
    const lines = readFileSync(file, "utf-8").split("\n");

    lines.forEach((line, i) => {
      // Skip code comments and import lines
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("import")) return;

      for (const { pattern, example } of ASCII_UMLAUT_PATTERNS) {
        const globalPattern = new RegExp(
          pattern.source,
          pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g",
        );
        for (const match of line.matchAll(globalPattern)) {
          const start = match.index ?? 0;
          const end = start + match[0].length;
          // Legitimate ASCII identifiers (slugs, URLs, paths, emails) are exempt.
          if (isAsciiUmlautIdentifierContext(line, start, end)) continue;
          error(relFile, i + 1, "ASCII-UMLAUT",
            `ASCII umlaut substitute in prose - use real umlaut: ${example}`);
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Template source-policy check.
// (Added inline as specified; content-freshness governance extends further below this function)
// ---------------------------------------------------------------------------

function checkTemplateSources() {
  for (const file of templateMdFiles) {
    // Skip .csv files (YAML frontmatter architecturally impossible)
    if (file.endsWith(".csv")) continue;

    const relFile = file.replace(ROOT + "/", "");
    const content = readFileSync(file, "utf-8");

    // Extract YAML frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;

    const fm = fmMatch[1];

    // Check if sources is empty or missing.
    // sources can be:
    //   - sources: []         (explicitly empty array)
    //   - sources: (newline)  (no items follow)
    //   - sources:            (followed by YAML list items "  - ...")
    const hasExplicitlyEmptySources = /^sources:\s*\[\s*\]$/m.test(fm);

    // Has real sources if "sources:" is present and is followed (within the frontmatter)
    // by at least one YAML list item "  - " on the next line (not just empty)
    const sourcesMatch = fm.match(/^sources:\s*\n([\s\S]*?)(?=\n\w|\n---|\Z)/m);
    const hasListItems = sourcesMatch && /^\s+-/m.test(sourcesMatch[1] ?? "");
    const hasSources = hasListItems && !hasExplicitlyEmptySources;
    const hasSourcePolicy = /^sourcePolicy:\s*["']?user-filled["']?$/m.test(fm);

    if (!hasSources && !hasSourcePolicy) {
      warn(relFile, 1, "TEMPLATE-SOURCES",
        `Template has no sources[] and no sourcePolicy: "user-filled" — add sources or mark as user-filled`);
    }
  }
}

// ---------------------------------------------------------------------------
// content-freshness governance Extension: Freshness gate (Gate A) and metadata completeness (Gate B)
// ---------------------------------------------------------------------------

/**
 * Structural config files excluded from freshness/metadata gates.
 * These are schema/config, not prose content that ages.
 */
const FRESHNESS_EXCLUDED = [
  "glossary.json",
  "quiz/questions.json",
  "challenges.json",
  "course.json",
  "modules.json",
];

export function isFreshnessExcluded(filePath) {
  const segments = filePath
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean);

  return FRESHNESS_EXCLUDED.some((excluded) => {
    const excludedSegments = excluded.split("/");
    if (excludedSegments.length > segments.length) return false;
    const offset = segments.length - excludedSegments.length;
    return excludedSegments.every(
      (segment, index) => segments[offset + index] === segment,
    );
  });
}

const NATIVE_COURSE_DIRS = [
  join(ROOT, "content", "ki-fuehrerschein"),
  join(ROOT, "content", "eu-ai-act-kurs"),
  join(ROOT, "content", "ai-native"),
  join(ROOT, "content", "ki-und-gesellschaft"),
];
const NESTED_LESSON_METADATA_DIR = join(
  ROOT,
  "content",
  "ki-und-gesellschaft",
);
const BOOK_MANIFEST_FILES = walkDir(
  join(ROOT, "content", "books"),
  (file) => file.endsWith("manifest.json"),
);
const REQUIRED_FRESHNESS_FIELDS = [
  "owner",
  "lastReviewed",
  "nextReview",
  "reviewCadence",
  "riskClass",
];

function metadataRecordsForJson(file, parsed) {
  const relFile = file.replace(ROOT + "/", "");
  if (!file.startsWith(`${NESTED_LESSON_METADATA_DIR}/`)) {
    return [{ label: relFile, value: parsed }];
  }
  if (!Array.isArray(parsed.lessons) || parsed.lessons.length === 0) {
    return [{ label: relFile, value: {} }];
  }
  return parsed.lessons.map((lesson, index) => ({
    label: `${relFile}#${lesson?.id ?? `lesson-${index + 1}`}`,
    value: lesson ?? {},
  }));
}

function freshnessJsonRecords() {
  const files = [
    ...NATIVE_COURSE_DIRS.flatMap((dir) =>
      existsSync(dir)
        ? walkDir(
            dir,
            (file) => file.endsWith(".json") && !isFreshnessExcluded(file),
          )
        : [],
    ),
    ...BOOK_MANIFEST_FILES,
  ];

  return files.flatMap((file) => {
    try {
      return metadataRecordsForJson(
        file,
        JSON.parse(readFileSync(file, "utf-8")),
      );
    } catch {
      return [];
    }
  });
}

function validIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Gate A: fail if any lesson block JSON or vorlage MD has a nextReview in the past */
function checkFreshnessGate() {
  // SKIP_FRESHNESS_CHECK is a local-dev-only escape hatch (public-content contract).
  // In CI it must never silently skip the gate: fail hard and loud.
  if (process.env.SKIP_FRESHNESS_CHECK === "true") {
    if (process.env.CI) {
      console.error("");
      console.error("[ERROR][FRESHNESS-SKIP-CI] SKIP_FRESHNESS_CHECK=true is set while CI is set.");
      console.error("The freshness gate MUST run in CI. Remove SKIP_FRESHNESS_CHECK from the CI environment and re-run.");
      console.error("");
      process.exit(1);
    }
    console.warn("");
    console.warn("################################################################");
    console.warn("## WARNING: freshness gate SKIPPED (SKIP_FRESHNESS_CHECK=true) ##");
    console.warn("## Overdue nextReview dates are NOT being checked in this run. ##");
    console.warn("## Local-dev escape hatch only. CI fails hard when it is set.  ##");
    console.warn("################################################################");
    console.warn("");
    warningCount++;
    return;
  }

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  // Native course block metadata and book-manifest metadata are release gates.
  for (const { label, value } of freshnessJsonRecords()) {
    if (value.nextReview && !validIsoDate(value.nextReview)) {
      error(label, 1, "FRESHNESS-DATE-INVALID",
        `nextReview ${String(value.nextReview)} is not a real YYYY-MM-DD date`);
    } else if (value.nextReview < today) {
      error(label, 1, "FRESHNESS-OVERDUE",
        `nextReview ${value.nextReview} is in the past — content review required before commit`);
    }
    if (value.lastReviewed && !validIsoDate(value.lastReviewed)) {
      error(label, 1, "FRESHNESS-DATE-INVALID",
        `lastReviewed ${String(value.lastReviewed)} is not a real YYYY-MM-DD date`);
    } else if (value.lastReviewed > today) {
      error(label, 1, "FRESHNESS-FUTURE",
        `lastReviewed ${value.lastReviewed} is in the future`);
    }
    if (
      validIsoDate(value.lastReviewed) &&
      validIsoDate(value.nextReview) &&
      value.nextReview < value.lastReviewed
    ) {
      error(label, 1, "FRESHNESS-ORDER",
        `nextReview ${value.nextReview} is earlier than lastReviewed ${value.lastReviewed}`);
    }
  }

  // Check vorlage MD files
  for (const file of templateMdFiles) {
    if (file.endsWith(".csv")) continue;
    const relFile = file.replace(ROOT + "/", "");
    const content = readFileSync(file, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    const nrMatch = fm.match(/^nextReview:\s*["']?(\d{4}-\d{2}-\d{2})["']?$/m);
    if (nrMatch) {
      if (!validIsoDate(nrMatch[1])) {
        error(relFile, 1, "FRESHNESS-DATE-INVALID",
          `nextReview ${nrMatch[1]} is not a real YYYY-MM-DD date`);
      } else if (nrMatch[1] < today) {
        error(relFile, 1, "FRESHNESS-OVERDUE",
          `nextReview ${nrMatch[1]} is in the past — content review required`);
      }
    }
  }
}

/** Gate B: fail if required freshness metadata fields are missing */
function checkMetadataCompleteness() {
  const REQUIRED_FM_FIELDS = ["owner", "lastReviewed", "nextReview", "reviewCadence", "riskClass"];

  for (const { label, value } of freshnessJsonRecords()) {
    for (const field of REQUIRED_FRESHNESS_FIELDS) {
      if (typeof value[field] !== "string" || value[field].trim() === "") {
        error(label, 1, "METADATA-MISSING",
          `Required freshness field "${field}" is missing`);
      }
    }
  }

  for (const file of templateMdFiles) {
    if (file.endsWith(".csv")) continue;
    const relFile = file.replace(ROOT + "/", "");
    const content = readFileSync(file, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) { continue; }
    const fm = fmMatch[1];
    for (const field of REQUIRED_FM_FIELDS) {
      const fieldPattern = new RegExp(`^${field}:`, "m");
      if (!fieldPattern.test(fm)) {
        error(relFile, 1, "METADATA-MISSING",
          `Required freshness field "${field}" is missing from frontmatter`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// public-content contract extension: shared freshness source divergence guard
// ---------------------------------------------------------------------------
//
// The site content date lives in exactly one place: SITE_CONTENT_DATE in
// src/lib/content-freshness.ts. The machine freshness surfaces (sitemap,
// llms.txt, knowledge-graph) must all derive their date from it, and the
// blog manifest (fourth surface) may never claim a modification newer than
// it. These checks fail the lint when the surfaces would emit different
// dates, and warn (best-effort via git diff) when a surface file changed in
// the working tree without the shared module changing.

const FRESHNESS_MODULE = "src/lib/content-freshness.ts";
const FRESHNESS_CONSTANT = "SITE_CONTENT_DATE";
const FRESHNESS_SURFACE_FILES = [
  "src/app/sitemap.ts",
  "src/app/llms.txt/route.ts",
  "src/app/api/knowledge-graph.json/route.ts",
];
const BLOG_MANIFEST_FILE = "src/lib/blog-metadata.ts";
const ISO_DATE_PATTERN = /\d{4}-\d{2}-\d{2}/;

function isCodeCommentLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
}

/** Reads and validates the shared SITE_CONTENT_DATE value; null on failure. */
function readSharedFreshnessDate() {
  const modulePath = join(ROOT, FRESHNESS_MODULE);
  if (!existsSync(modulePath)) {
    error(FRESHNESS_MODULE, 1, "FRESHNESS-SOURCE-MISSING",
      `Shared freshness module not found. sitemap, llms.txt, and knowledge-graph must derive their date from ${FRESHNESS_CONSTANT}.`);
    return null;
  }
  const content = readFileSync(modulePath, "utf-8");
  const match = content.match(/export const SITE_CONTENT_DATE = "(\d{4}-\d{2}-\d{2})"/);
  if (!match) {
    error(FRESHNESS_MODULE, 1, "FRESHNESS-SOURCE-INVALID",
      `Could not find 'export const ${FRESHNESS_CONSTANT} = "YYYY-MM-DD"' in the shared freshness module.`);
    return null;
  }
  if (Number.isNaN(new Date(match[1]).getTime())) {
    error(FRESHNESS_MODULE, 1, "FRESHNESS-SOURCE-INVALID",
      `${FRESHNESS_CONSTANT} value "${match[1]}" is not a valid date.`);
    return null;
  }
  return match[1];
}

/**
 * Divergence guard: every machine freshness surface must consume the shared
 * constant and must not hardcode its own ISO date. A hardcoded date or a
 * missing reference means the surfaces would emit different dates.
 */
function checkFreshnessSurfaceConsistency() {
  const shared = readSharedFreshnessDate();
  if (!shared) return;

  for (const relFile of FRESHNESS_SURFACE_FILES) {
    const filePath = join(ROOT, relFile);
    if (!existsSync(filePath)) {
      error(relFile, 1, "FRESHNESS-SURFACE-MISSING", "Freshness surface file not found");
      continue;
    }
    const lines = readFileSync(filePath, "utf-8").split("\n");
    let referencesConstant = false;
    lines.forEach((rawLine, i) => {
      if (isCodeCommentLine(rawLine)) return;
      const line = stripTrailingLineComment(rawLine);
      if (line.includes(FRESHNESS_CONSTANT)) referencesConstant = true;
      const hardcoded = line.match(ISO_DATE_PATTERN);
      if (hardcoded) {
        error(relFile, i + 1, "FRESHNESS-DIVERGENCE",
          `Hardcoded date "${hardcoded[0]}" would let this surface diverge from ${FRESHNESS_CONSTANT} (${shared}). Derive the date from ${FRESHNESS_MODULE}.`);
      }
    });
    if (!referencesConstant) {
      error(relFile, 1, "FRESHNESS-DIVERGENCE",
        `File does not consume ${FRESHNESS_CONSTANT} from ${FRESHNESS_MODULE}; the three machine surfaces could emit different dates.`);
    }
  }

  // Fourth surface: the blog manifest keeps honest per-post dates but may
  // never claim a modification NEWER than the shared site content date.
  const manifestPath = join(ROOT, BLOG_MANIFEST_FILE);
  if (!existsSync(manifestPath)) {
    error(BLOG_MANIFEST_FILE, 1, "FRESHNESS-SURFACE-MISSING", "Blog manifest not found");
    return;
  }
  const manifestLines = readFileSync(manifestPath, "utf-8").split("\n");
  manifestLines.forEach((line, i) => {
    const m = line.match(/dateModified:\s*"(\d{4}-\d{2}-\d{2})"/);
    if (m && m[1] > shared) {
      error(BLOG_MANIFEST_FILE, i + 1, "FRESHNESS-DIVERGENCE",
        `Blog dateModified ${m[1]} is newer than ${FRESHNESS_CONSTANT} (${shared}). Bump ${FRESHNESS_MODULE} in the same commit as the post update.`);
    }
  });
}

/**
 * Staleness flag (best-effort): warn when a freshness surface file changed
 * in the working tree (staged, unstaged, or untracked) without the shared
 * module changing. Degrades silently when git is unavailable.
 */
function checkFreshnessSourceStaleness() {
  let changed;
  try {
    const gitOpts = { cwd: ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] };
    const diffOut = execSync("git diff --name-only HEAD --relative", gitOpts);
    const untrackedOut = execSync("git ls-files --others --exclude-standard", gitOpts);
    changed = new Set([...diffOut.split("\n"), ...untrackedOut.split("\n")].filter(Boolean));
  } catch {
    return; // not a git checkout, or git missing: divergence guard above still holds
  }

  if (changed.has(FRESHNESS_MODULE)) return;
  for (const relFile of FRESHNESS_SURFACE_FILES) {
    if (changed.has(relFile)) {
      warn(relFile, 1, "FRESHNESS-BUMP-CHECK",
        `Changed in the working tree without ${FRESHNESS_MODULE} changing. If this edit changes served content, bump ${FRESHNESS_CONSTANT}.`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

function runAllChecks() {
  console.log("Running content lint...\n");

  checkBannedPhrases();
  checkAiActDates();
  checkEmDash();
  checkStudienZeigen();
  checkAuditAuthorityClain();
  checkAsciiUmlauts();
  checkTemplateSources();
  checkFreshnessGate();
  checkMetadataCompleteness();
  checkFreshnessSurfaceConsistency();
  checkFreshnessSourceStaleness();

  console.log(`\nContent lint complete: ${errorCount} error(s), ${warningCount} warning(s).`);

  if (errorCount > 0) {
    console.error(`\nFAIL: ${errorCount} error(s) found. Fix before committing.`);
    process.exit(1);
  } else {
    console.log("PASS: No errors.");
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  runAllChecks();
}
