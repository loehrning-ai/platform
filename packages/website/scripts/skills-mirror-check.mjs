#!/usr/bin/env node

/**
 * Skills mirror check.
 *
 * The skills collection has exactly one source of truth:
 * `packages/website/content/skills/<name>/SKILL.md`. Two copies exist
 * downstream, and both are supposed to be the same bytes:
 *
 *   1. what this site serves at `/skills/<name>/SKILL.md`;
 *   2. the public mirror repository an agent installs the collection from.
 *
 * A copy that has drifted is worse than a missing one: an agent would follow
 * instructions the platform no longer stands behind, and nobody would see it.
 * So this script compares, byte for byte, and refuses to pass on a difference.
 *
 * It also enforces what a skill directory may contain. A skill is one Markdown
 * document and nothing else: no script, no hook, no second file that an agent
 * runtime might execute. A key is entered interactively by the person who owns
 * it, so a document that writes a key into itself, or that pipes a download
 * into a shell, fails here rather than in someone's terminal.
 *
 * Usage:
 *
 *   node scripts/skills-mirror-check.mjs
 *   node scripts/skills-mirror-check.mjs --base-url http://localhost:3000
 *   node scripts/skills-mirror-check.mjs --mirror ../skills
 *
 * Without an option it checks the content directory alone, which is what CI
 * can prove without a server or a clone. `--base-url` additionally fetches the
 * served copies; `--mirror` additionally reads a local clone of the public
 * mirror repository. Both comparisons are byte-exact.
 */

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * The seam the served-copy comparison is tested through. Only the three members
 * the check reads are required, so a stub stays a few lines instead of a full
 * `Response`.
 *
 * @typedef {{ status: number, headers: { get(name: string): string | null }, text(): Promise<string> }} SkillFetchResponse
 * @typedef {(url: string) => Promise<SkillFetchResponse>} SkillFetch
 */

/** The one document a skill directory is allowed to hold. */
export const SKILL_DOCUMENT_FILENAME = "SKILL.md";

/** Same shape as the route segment and the directory name, so all three match. */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SKILL_NAME_MAX_LENGTH = 64;

/** A skill is read into an agent's context; keep it far below any model budget. */
export const MAX_SKILL_DOCUMENT_BYTES = 64 * 1024;

/** Frontmatter fields every skill document must carry with a non-empty value. */
export const REQUIRED_FRONTMATTER_FIELDS = ["name", "description"];

/**
 * Content that would make a skill executable rather than instructive. The pipe
 * rules skip Markdown table rows, whose pipes are layout and never a shell.
 */
export const EXECUTABLE_CONTENT_RULES = [
  {
    id: "remote-fetch-pipe",
    label: "a download piped into another command",
    skipTableRows: true,
    re: /\b(?:curl|wget)\b[^\n]{0,200}\|/,
  },
  {
    id: "pipe-to-shell",
    label: "a pipe into a shell",
    skipTableRows: true,
    re: /\|\s*(?:sudo\s+)?(?:\S*\/)?(?:ba|z|k|da)?sh\b/,
  },
  {
    id: "shell-eval",
    label: "an eval of fetched text",
    re: /\beval\s*[("'`$]/,
  },
  {
    id: "inline-secret-assignment",
    label: "a key or token written into the document",
    re: /\b[A-Z][A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD)\s*=/,
  },
  {
    id: "vendor-key-literal",
    label: "a vendor key literal",
    re: /(?:^|[^A-Za-z0-9])(?:sk-[A-Za-z0-9_-]{20,}|lat_[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{16,})/,
  },
];

/** @param {unknown} value */
export function isSkillName(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= SKILL_NAME_MAX_LENGTH &&
    SKILL_NAME_PATTERN.test(value)
  );
}

/**
 * A row of a Markdown table: starts and ends with an unescaped pipe.
 *
 * @param {string} line
 */
export function isMarkdownTableRow(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

/** @param {string} text */
export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * Minimal YAML frontmatter reader for the fixed `key: value` shape these
 * documents use. Deliberately not a YAML parser: a skill that needs nested
 * frontmatter should fail this check and be discussed, not silently accepted.
 *
 * @param {string} text
 * @returns {{ fields: Map<string, string>, error: string | null }}
 */
export function parseFrontmatter(text) {
  /** @type {Map<string, string>} */
  const fields = new Map();
  if (!text.startsWith("---\n")) {
    return { fields, error: "does not open with a --- frontmatter block" };
  }
  const closing = text.indexOf("\n---\n", 3);
  if (closing === -1) {
    return { fields, error: "has no closing --- frontmatter delimiter" };
  }
  const block = text.slice(4, closing);
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") continue;
    const separator = line.indexOf(":");
    if (separator === -1 || line.startsWith(" ")) {
      return {
        fields,
        error: `has a frontmatter line that is not "key: value": ${line.trim()}`,
      };
    }
    fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  return { fields, error: null };
}

/**
 * @param {string} name
 * @param {string} text
 */
function checkExecutableContent(name, text) {
  /** @type {string[]} */
  const errors = [];
  const lines = text.split("\n");
  for (const rule of EXECUTABLE_CONTENT_RULES) {
    for (const [index, line] of lines.entries()) {
      if (rule.skipTableRows && isMarkdownTableRow(line)) continue;
      if (!rule.re.test(line)) continue;
      errors.push(
        `${name}/${SKILL_DOCUMENT_FILENAME}:${index + 1}: contains ${rule.label} (${rule.id}). Skills describe steps; a person runs them.`,
      );
      break;
    }
  }
  return errors;
}

/**
 * @param {string} name
 * @param {string} text
 */
function checkDocument(name, text) {
  /** @type {string[]} */
  const errors = [];
  const bytes = Buffer.byteLength(text, "utf8");
  if (bytes > MAX_SKILL_DOCUMENT_BYTES) {
    errors.push(
      `${name}/${SKILL_DOCUMENT_FILENAME}: ${bytes} bytes exceeds the ${MAX_SKILL_DOCUMENT_BYTES}-byte ceiling`,
    );
  }
  if (text.trim() === "") {
    errors.push(`${name}/${SKILL_DOCUMENT_FILENAME}: is empty`);
    return errors;
  }

  const { fields, error } = parseFrontmatter(text);
  if (error) {
    errors.push(`${name}/${SKILL_DOCUMENT_FILENAME}: ${error}`);
  } else {
    for (const field of REQUIRED_FRONTMATTER_FIELDS) {
      const value = fields.get(field);
      if (typeof value !== "string" || value === "") {
        errors.push(
          `${name}/${SKILL_DOCUMENT_FILENAME}: frontmatter field "${field}" is missing or empty`,
        );
      }
    }
    const declared = fields.get("name");
    if (typeof declared === "string" && declared !== "" && declared !== name) {
      errors.push(
        `${name}/${SKILL_DOCUMENT_FILENAME}: frontmatter name "${declared}" does not match the directory name "${name}"`,
      );
    }
  }

  errors.push(...checkExecutableContent(name, text));
  return errors;
}

/**
 * Reads the authored collection and validates its structure. Returns the skill
 * documents keyed by name plus every structural finding.
 *
 * @param {string} contentDir
 * @returns {Promise<{ documents: Map<string, string>, errors: string[] }>}
 */
export async function collectSkillSources(contentDir) {
  /** @type {string[]} */
  const errors = [];
  /** @type {Map<string, string>} */
  const documents = new Map();

  let entries;
  try {
    entries = await readdir(contentDir, { withFileTypes: true });
  } catch (cause) {
    return {
      documents,
      errors: [`content directory ${contentDir} is unreadable: ${cause.code ?? cause.message}`],
    };
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      errors.push(
        `${entry.name}: the skills directory holds skill directories only, not loose files`,
      );
      continue;
    }
    if (!isSkillName(entry.name)) {
      errors.push(
        `${entry.name}: is not a valid skill name (lower-case words joined by single hyphens, at most ${SKILL_NAME_MAX_LENGTH} characters)`,
      );
      continue;
    }

    const skillDir = path.join(contentDir, entry.name);
    const contents = await readdir(skillDir, { withFileTypes: true });
    const unexpected = contents
      .filter((item) => !(item.isFile() && item.name === SKILL_DOCUMENT_FILENAME))
      .map((item) => item.name)
      .sort();
    if (unexpected.length > 0) {
      errors.push(
        `${entry.name}: holds ${unexpected.join(", ")} besides ${SKILL_DOCUMENT_FILENAME}. A skill is one document and nothing executable.`,
      );
    }
    if (!contents.some((item) => item.isFile() && item.name === SKILL_DOCUMENT_FILENAME)) {
      errors.push(`${entry.name}: has no ${SKILL_DOCUMENT_FILENAME}`);
      continue;
    }

    const text = await readFile(
      path.join(skillDir, SKILL_DOCUMENT_FILENAME),
      "utf8",
    );
    documents.set(entry.name, text);
    errors.push(...checkDocument(entry.name, text));
  }

  if (documents.size === 0 && errors.length === 0) {
    errors.push(`content directory ${contentDir} holds no skills`);
  }

  return { documents, errors };
}

/**
 * Byte-exact comparison of one downstream copy against the authored source.
 *
 * @param {Map<string, string>} source
 * @param {Map<string, string>} copy
 * @param {string} label
 * @returns {string[]}
 */
export function compareCopies(source, copy, label) {
  /** @type {string[]} */
  const errors = [];
  for (const name of [...new Set([...source.keys(), ...copy.keys()])].sort()) {
    const authored = source.get(name);
    const mirrored = copy.get(name);
    if (authored === undefined) {
      errors.push(`${label}: serves "${name}", which is not in the content directory`);
      continue;
    }
    if (mirrored === undefined) {
      errors.push(`${label}: is missing "${name}"`);
      continue;
    }
    if (authored !== mirrored) {
      errors.push(
        `${label}: "${name}" differs from the content directory (source ${sha256(authored)}, copy ${sha256(mirrored)})`,
      );
    }
  }
  return errors;
}

/**
 * Fetches the served copies. Returns the ones that answered plus any faults.
 *
 * @param {string} baseUrl
 * @param {readonly string[]} names
 * @param {SkillFetch} [fetchImpl]
 * @returns {Promise<{ documents: Map<string, string>, errors: string[] }>}
 */
export async function fetchServedSkills(baseUrl, names, fetchImpl = fetch) {
  /** @type {Map<string, string>} */
  const documents = new Map();
  /** @type {string[]} */
  const errors = [];
  for (const name of names) {
    const url = new URL(`/skills/${name}/${SKILL_DOCUMENT_FILENAME}`, baseUrl);
    let response;
    try {
      response = await fetchImpl(url.toString());
    } catch (cause) {
      errors.push(`served copy: ${url} could not be fetched: ${cause.message}`);
      continue;
    }
    if (response.status !== 200) {
      errors.push(`served copy: ${url} answered ${response.status}, expected 200`);
      continue;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("text/markdown")) {
      errors.push(
        `served copy: ${url} answered with content-type "${contentType}", expected text/markdown`,
      );
    }
    documents.set(name, await response.text());
  }
  return { documents, errors };
}

/**
 * Reads a local clone of the public mirror repository.
 *
 * @param {string} mirrorDir
 * @returns {Promise<{ documents: Map<string, string>, errors: string[] }>}
 */
export async function readMirrorSkills(mirrorDir) {
  /** @type {Map<string, string>} */
  const documents = new Map();
  /** @type {string[]} */
  const errors = [];
  let entries;
  try {
    entries = await readdir(mirrorDir, { withFileTypes: true });
  } catch (cause) {
    return {
      documents,
      errors: [`mirror directory ${mirrorDir} is unreadable: ${cause.code ?? cause.message}`],
    };
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !isSkillName(entry.name)) continue;
    try {
      documents.set(
        entry.name,
        await readFile(
          path.join(mirrorDir, entry.name, SKILL_DOCUMENT_FILENAME),
          "utf8",
        ),
      );
    } catch (cause) {
      if (cause.code !== "ENOENT") throw cause;
      errors.push(`mirror copy: "${entry.name}" has no ${SKILL_DOCUMENT_FILENAME}`);
    }
  }
  return { documents, errors };
}

export function defaultContentDir() {
  return path.join(HERE, "..", "content", "skills");
}

/**
 * @param {{ contentDir?: string, baseUrl?: string | null, mirrorDir?: string | null, fetchImpl?: SkillFetch }} [options]
 * @returns {Promise<{ errors: string[], names: string[] }>}
 */
export async function runSkillsMirrorCheck({
  contentDir = defaultContentDir(),
  baseUrl = null,
  mirrorDir = null,
  fetchImpl = fetch,
} = {}) {
  const { documents, errors } = await collectSkillSources(contentDir);
  const allErrors = [...errors];
  const names = [...documents.keys()].sort();

  if (baseUrl !== null) {
    const served = await fetchServedSkills(baseUrl, names, fetchImpl);
    allErrors.push(...served.errors);
    allErrors.push(...compareCopies(documents, served.documents, "served copy"));
  }

  if (mirrorDir !== null) {
    const mirror = await readMirrorSkills(mirrorDir);
    allErrors.push(...mirror.errors);
    allErrors.push(...compareCopies(documents, mirror.documents, "mirror copy"));
  }

  return { errors: allErrors, names };
}

/**
 * @param {readonly string[]} argv
 * @returns {{ contentDir: string | null, baseUrl: string | null, mirrorDir: string | null }}
 */
export function parseArguments(argv) {
  /** @type {{ contentDir: string | null, baseUrl: string | null, mirrorDir: string | null }} */
  const options = { contentDir: null, baseUrl: null, mirrorDir: null };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--base-url" || flag === "--mirror" || flag === "--content-dir") {
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${flag} needs a value`);
      }
      if (flag === "--base-url") options.baseUrl = value;
      if (flag === "--mirror") options.mirrorDir = path.resolve(value);
      if (flag === "--content-dir") options.contentDir = path.resolve(value);
      index += 1;
      continue;
    }
    throw new Error(
      `unknown argument "${flag}". Usage: skills-mirror-check.mjs [--content-dir <dir>] [--base-url <url>] [--mirror <dir>]`,
    );
  }
  return options;
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (cause) {
    console.error(`Skills mirror check: ${cause.message}`);
    process.exitCode = 1;
    return;
  }

  const { errors, names } = await runSkillsMirrorCheck({
    contentDir: options.contentDir ?? defaultContentDir(),
    baseUrl: options.baseUrl,
    mirrorDir: options.mirrorDir,
  });

  if (errors.length > 0) {
    console.error("Skills mirror check failed:");
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  const compared = [
    options.baseUrl ? `served copies at ${options.baseUrl}` : null,
    options.mirrorDir ? `mirror clone at ${options.mirrorDir}` : null,
  ].filter(Boolean);
  console.log(
    `Skills mirror check passed: ${names.length} skill(s) (${names.join(", ")})` +
      (compared.length > 0 ? `, compared against ${compared.join(" and ")}` : ""),
  );
}

const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
  await main();
}
