import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  GENERIC_BASE64_RE,
  PRIVATE_CONTENT_RULES,
  SECRET_VALUE_RULES,
  hasBase64SecretShape,
  matchedPrivateRules,
} from "../packages/website/scripts/open-source/export-denylist.mjs";

const ALLOWED_EXTENSIONS = new Set([".json", ".md"]);
const ALLOWED_KINDS = new Set([
  "calendar",
  "draft-blog",
  "draft-linkedin",
  "measurement",
  "operating-system",
  "research",
  "strategy",
  "template",
]);
const ALLOWED_STATUSES = new Set(["active", "draft"]);
const REQUIRED_ENTRY_FIELDS = [
  "path",
  "kind",
  "status",
  "license",
  "author",
  "dateCreated",
  "dateModified",
  "canonicalUrl",
  "sourceReviewDate",
];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COMMERCIAL_ROUTE_RE =
  /\/(?:leistungen|ki-transformation-check|eu-ai-act-check)(?:\b|\/)/i;

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function expectedLicense(relativePath) {
  return relativePath.startsWith("marketing/drafts/")
    ? "ALL-RIGHTS-RESERVED"
    : "CC-BY-4.0";
}

function parseDraftHeader(content, relativePath) {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") {
    throw new Error(`${relativePath}: draft metadata header is missing`);
  }
  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex < 0) {
    throw new Error(`${relativePath}: draft metadata header is not closed`);
  }

  const fields = new Map();
  for (const line of lines.slice(1, closingIndex)) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    fields.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }

  for (const field of [
    "Title",
    "Status",
    "License",
    "Author",
    "Created",
    "Modified",
    "Source review",
    "Canonical URL",
    "Target channel",
  ]) {
    if (!fields.get(field)) {
      throw new Error(`${relativePath}: draft metadata field "${field}" is missing`);
    }
  }
  return fields;
}

async function collectFiles(directory, repositoryRoot, findings) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = normalize(path.relative(repositoryRoot, absolutePath));
    if (entry.isSymbolicLink()) {
      findings.push(`${relativePath}: symbolic links are not allowed`);
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, repositoryRoot, findings)));
      continue;
    }
    if (!entry.isFile()) {
      findings.push(`${relativePath}: only regular files are allowed`);
      continue;
    }
    if (!ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      findings.push(`${relativePath}: only Markdown and JSON are allowed`);
    }
    files.push(relativePath);
  }
  return files;
}

function validateDate(value, label, relativePath, findings) {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) {
    findings.push(`${relativePath}: ${label} must use YYYY-MM-DD`);
    return false;
  }
  return true;
}

function isPublicUrlPathToken(line, token) {
  const urls = line.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  return urls.some((rawUrl) => {
    try {
      const url = new URL(rawUrl);
      return (
        `${url.hostname}${url.pathname}`.includes(token) &&
        !url.search.includes(token) &&
        !url.hash.includes(token)
      );
    } catch {
      return false;
    }
  });
}

function scanPublicContent(content, relativePath, findings) {
  const privatePathMatches = matchedPrivateRules(relativePath, "platform");
  for (const label of privatePathMatches) {
    findings.push(`${relativePath}: forbidden public path (${label})`);
  }

  for (const [index, line] of content.split(/\r?\n/).entries()) {
    for (const rule of PRIVATE_CONTENT_RULES) {
      const matched = rule.matches ? rule.matches(line) : rule.re?.test(line);
      if (matched) {
        findings.push(
          `${relativePath}:${index + 1}: forbidden private context (${rule.label})`,
        );
      }
    }
    for (const rule of SECRET_VALUE_RULES) {
      if (rule.re.test(line)) {
        findings.push(
          `${relativePath}:${index + 1}: possible secret (${rule.label})`,
        );
      }
    }
    for (const match of line.matchAll(new RegExp(GENERIC_BASE64_RE.source, "g"))) {
      if (
        hasBase64SecretShape(match[0]) &&
        !isPublicUrlPathToken(line, match[0])
      ) {
        findings.push(
          `${relativePath}:${index + 1}: possible high-entropy credential`,
        );
      }
    }
  }
}

export async function verifyMarketing(repositoryRoot = process.cwd()) {
  const root = path.resolve(repositoryRoot);
  const marketingRoot = path.join(root, "marketing");
  const findings = [];
  const actualFiles = await collectFiles(marketingRoot, root, findings);
  actualFiles.sort();

  const manifestPath = path.join(marketingRoot, "manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `marketing/manifest.json is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (manifest.version !== 1) {
    findings.push("marketing/manifest.json: version must be 1");
  }
  if (!Array.isArray(manifest.entries)) {
    findings.push("marketing/manifest.json: entries must be an array");
  }

  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  const manifestPaths = new Set();
  for (const [index, entry] of entries.entries()) {
    const label =
      entry && typeof entry.path === "string"
        ? entry.path
        : `marketing/manifest.json entry ${index}`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      findings.push(`${label}: entry must be an object`);
      continue;
    }
    for (const field of REQUIRED_ENTRY_FIELDS) {
      if (!(field in entry)) findings.push(`${label}: missing field ${field}`);
    }
    if (
      typeof entry.path !== "string" ||
      !entry.path.startsWith("marketing/") ||
      entry.path.includes("\\") ||
      entry.path.split("/").includes("..")
    ) {
      findings.push(`${label}: path must be a normalized marketing-relative path`);
      continue;
    }
    if (manifestPaths.has(entry.path)) {
      findings.push(`${entry.path}: duplicate manifest entry`);
    }
    manifestPaths.add(entry.path);

    if (!ALLOWED_KINDS.has(entry.kind)) {
      findings.push(`${entry.path}: unsupported kind ${String(entry.kind)}`);
    }
    if (!ALLOWED_STATUSES.has(entry.status)) {
      findings.push(`${entry.path}: unsupported status ${String(entry.status)}`);
    }
    if (entry.license !== expectedLicense(entry.path)) {
      findings.push(
        `${entry.path}: license must be ${expectedLicense(entry.path)}`,
      );
    }
    if (typeof entry.author !== "string" || entry.author.trim() === "") {
      findings.push(`${entry.path}: author is required`);
    }

    const createdValid = validateDate(
      entry.dateCreated,
      "dateCreated",
      entry.path,
      findings,
    );
    const modifiedValid = validateDate(
      entry.dateModified,
      "dateModified",
      entry.path,
      findings,
    );
    const reviewValid = validateDate(
      entry.sourceReviewDate,
      "sourceReviewDate",
      entry.path,
      findings,
    );
    if (
      createdValid &&
      modifiedValid &&
      entry.dateCreated > entry.dateModified
    ) {
      findings.push(`${entry.path}: dateModified precedes dateCreated`);
    }
    if (
      reviewValid &&
      modifiedValid &&
      entry.sourceReviewDate > entry.dateModified
    ) {
      findings.push(`${entry.path}: sourceReviewDate exceeds dateModified`);
    }

    const isDraft = entry.path.startsWith("marketing/drafts/");
    if (isDraft) {
      if (entry.status !== "draft") {
        findings.push(`${entry.path}: draft status must be draft`);
      }
      if (entry.canonicalUrl !== null) {
        findings.push(`${entry.path}: unpublished draft canonicalUrl must be null`);
      }
    } else if (
      entry.canonicalUrl !== null &&
      (typeof entry.canonicalUrl !== "string" ||
        !entry.canonicalUrl.startsWith("https://"))
    ) {
      findings.push(`${entry.path}: canonicalUrl must be null or HTTPS`);
    }
  }

  for (const relativePath of actualFiles) {
    if (!manifestPaths.has(relativePath)) {
      findings.push(`${relativePath}: file is not registered in the manifest`);
    }
  }
  for (const relativePath of manifestPaths) {
    if (!actualFiles.includes(relativePath)) {
      findings.push(`${relativePath}: stale manifest entry`);
    }
  }

  let draftCount = 0;
  for (const relativePath of actualFiles) {
    const absolutePath = path.join(root, relativePath);
    const content = await readFile(absolutePath, "utf8");
    scanPublicContent(content, relativePath, findings);
    if (
      relativePath.startsWith("marketing/drafts/") &&
      relativePath.endsWith(".md")
    ) {
      draftCount += 1;
      try {
        const fields = parseDraftHeader(content, relativePath);
        const entry = entries.find((candidate) => candidate.path === relativePath);
        if (entry) {
          const pairs = [
            ["Status", "status"],
            ["License", "license"],
            ["Author", "author"],
            ["Created", "dateCreated"],
            ["Modified", "dateModified"],
            ["Source review", "sourceReviewDate"],
          ];
          for (const [headerField, manifestField] of pairs) {
            if (fields.get(headerField) !== entry[manifestField]) {
              findings.push(
                `${relativePath}: ${headerField} does not match manifest`,
              );
            }
          }
          if (fields.get("Canonical URL") !== "null") {
            findings.push(`${relativePath}: Canonical URL must be null`);
          }
          const expectedChannel =
            entry.kind === "draft-blog" ? "blog" : "linkedin";
          if (fields.get("Target channel") !== expectedChannel) {
            findings.push(
              `${relativePath}: Target channel must be ${expectedChannel}`,
            );
          }
        }
      } catch (error) {
        findings.push(error instanceof Error ? error.message : String(error));
      }
      if (COMMERCIAL_ROUTE_RE.test(content)) {
        findings.push(`${relativePath}: retired commercial route found`);
      }
    }
  }

  const sourceRegistryPath = path.join(
    marketingRoot,
    "research",
    "sources.json",
  );
  const sourceRegistry = JSON.parse(await readFile(sourceRegistryPath, "utf8"));
  if (sourceRegistry.version !== 1 || !Array.isArray(sourceRegistry.sources)) {
    findings.push("marketing/research/sources.json: invalid source registry");
  }
  const sourceIds = new Set();
  for (const source of sourceRegistry.sources ?? []) {
    if (!source.id || sourceIds.has(source.id)) {
      findings.push("marketing/research/sources.json: source ids must be unique");
    }
    sourceIds.add(source.id);
    if (typeof source.url !== "string" || !source.url.startsWith("https://")) {
      findings.push(
        `marketing/research/sources.json: ${String(source.id)} needs an HTTPS URL`,
      );
    }
  }

  for (const relativePath of actualFiles.filter(
    (file) =>
      file.startsWith("marketing/research/") && file.endsWith(".md"),
  )) {
    const content = await readFile(path.join(root, relativePath), "utf8");
    if (!/^## Source index$/m.test(content)) {
      findings.push(`${relativePath}: Source index section is required`);
    }
    for (const match of content.matchAll(/\[Source: ([a-z0-9-]+)\]/g)) {
      if (!sourceIds.has(match[1])) {
        findings.push(`${relativePath}: unknown source id ${match[1]}`);
      }
    }
  }

  if (findings.length > 0) {
    throw new Error(
      `Marketing contract failed:\n${findings
        .map((finding) => `- ${finding}`)
        .join("\n")}`,
    );
  }

  return {
    files: actualFiles.length,
    drafts: draftCount,
    sources: sourceIds.size,
  };
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (invokedPath === import.meta.url) {
  try {
    const rootFlagIndex = process.argv.indexOf("--root");
    const root =
      rootFlagIndex >= 0 ? process.argv[rootFlagIndex + 1] : process.cwd();
    const result = await verifyMarketing(root);
    console.log(
      `Marketing contract valid: ${result.files} files, ${result.drafts} drafts, ${result.sources} sources`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
