#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, posix, relative } from "node:path";
import {
  BINARY_ASSET_EXTENSIONS,
  EXPORT_PROFILES,
  GENERIC_BASE64_RE,
  LOCKFILE_BASENAMES,
  PRICING_RULES,
  PRIVATE_CONTENT_RULES,
  SECRET_VALUE_RULES,
  hasBase64SecretShape,
  isPrivateExportPath,
  matchedPrivateRules,
} from "./export-denylist.mjs";

// Build output and VCS internals: never walked, never scanned.
const GENERATED_DIRS = new Set([
  ".bun-cache",
  ".cache",
  ".git",
  ".lighthouseci",
  ".mypy_cache",
  ".next",
  ".pytest_cache",
  ".ruff_cache",
  ".output",
  ".swc",
  ".turbo",
  ".vercel",
  ".venv",
  "__pycache__",
  "blob-report",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
  "venv",
]);

// Secret-like filenames (whole basename). The export copy relies on the
// scan-before-copy gate to block these, so this stays scanner-local rather than
// living in the shared copy denylist.
const SECRET_FILE_RE =
  /(^|\/)(\.env(\..*)?|\.dockercfg|\.git-credentials|\.netrc|\.npmrc|\.pypirc|credentials\.json|kubeconfig|id_(?:rsa|dsa|ecdsa|ed25519)|.*\.pem|.*\.p12|.*\.pfx|.*\.key|service-account.*\.json)$/i;
const ENV_EXAMPLE_RE = /(^|\/)[^/]*\.env[^/]*\.example$/i;
const ASSET_MANIFEST_BASENAME = "ASSET_MANIFEST.json";
const ASSET_MANIFEST_VERSION = 1;
const ASSET_METADATA_FIELDS = ["owner", "source", "license", "redistribution"];
const MANIFEST_TEXT_ASSET_EXTENSIONS = new Set([
  "html",
  "md",
  "svg",
  "txt",
  "vtt",
]);
const SENSITIVE_ENV_NAME_RE =
  /(?:^|_)(?:API_?KEY|KEY|TOKEN|SECRET|PASSWORD|PASS|PRIVATE_KEY|SERVICE_ROLE_KEY)(?:_|$)|^(?:DATABASE|DIRECT)_URL$|^DIGIFYDE_API_URL$|^ALLOW_UNVERIFIED_SCAN_TOKEN$/i;
const KNOWN_TEXT_EXTENSIONS = new Set([
  "cjs",
  "css",
  "csv",
  "graphql",
  "gql",
  "hbs",
  "html",
  "ini",
  "js",
  "json",
  "jsonc",
  "jsx",
  "md",
  "mdx",
  "mjs",
  "mts",
  "py",
  "scss",
  "sh",
  "sql",
  "svg",
  "toml",
  "ts",
  "tsx",
  "txt",
  "xml",
  "yaml",
  "yml",
]);

const LARGE_FILE_BYTES = 1024 * 1024;

// Severity model:
//   FAIL  blocks the export and sets a non-zero exit code.
//   WARN  is surfaced for manual sign-off; it does not block.
//   ASSET is recorded for the license/asset audit; it does not block.
const FAIL = "FAIL";
const WARN = "WARN";
const ASSET = "ASSET";

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const source = argValue("--source");
const dest = argValue("--dest");
const profile = argValue("--profile") ?? "interactive-courses";
if ((source && dest) || (!source && !dest)) {
  console.error(
    "Usage: scan-export.mjs (--source <dir> | --dest <dir>) [--profile interactive-courses|platform]",
  );
  process.exit(2);
}
if (!EXPORT_PROFILES.includes(profile)) {
  console.error(
    `scan-export: unsupported profile ${JSON.stringify(profile)}; expected ${EXPORT_PROFILES.join(" or ")}`,
  );
  process.exit(2);
}
const mode = dest ? "dest" : "source";
const root = dest ?? source;

const findings = [];
let filesChecked = 0;
const assetManifestEntries = new Map();
const manifestPathsDeclared = new Set();
const assetPathsSeen = new Set();

function addFinding(path, line, severity, label) {
  findings.push({ path, line, severity, label });
}

function toPosixPath(path) {
  return path.replace(/\\/g, "/");
}

function isEnvExample(rel) {
  return ENV_EXAMPLE_RE.test(rel);
}

function normalizedExampleValue(rawValue) {
  let value = rawValue.trim();
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.lastIndexOf(quote) > 0) {
    value = value.slice(1, value.lastIndexOf(quote)).trim();
  } else {
    value = value.replace(/\s+#.*$/, "").trim();
  }
  return value;
}

function isSafeExamplePlaceholder(rawValue) {
  const value = normalizedExampleValue(rawValue);
  if (value === "") return true;
  if (/^<[^<>\r\n]+>$/.test(value)) return true;
  if (/^\$\{[A-Z][A-Z0-9_]*\}$/.test(value)) return true;
  if (/^x{4,}$/i.test(value)) return true;
  if (
    /(?:^|[^A-Za-z0-9])(?:your|replace(?:[-_]?me)?|change(?:[-_]?me)?|example|placeholder|dummy|fake|mock|test|local|development|dev)(?:[^A-Za-z0-9]|$)/i.test(
      value,
    )
  ) {
    return true;
  }
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".example") ||
      hostname.endsWith(".example.com") ||
      hostname.endsWith(".example.org") ||
      hostname.endsWith(".invalid")
    );
  } catch {
    return false;
  }
}

function isSecretLikePath(rel) {
  const lower = rel.toLowerCase();
  return (
    SECRET_FILE_RE.test(rel) ||
    /(?:^|\/)\.docker\/config\.json$/.test(lower) ||
    /(?:^|\/)\.aws\/(?:config|credentials)$/.test(lower) ||
    /(?:^|\/)\.kube\/config$/.test(lower) ||
    /(?:^|\/)\.ssh\/config$/.test(lower)
  );
}

function isAllowedGeneratedAuthDirectory(rel) {
  return (
    rel === "packages/website/tests/e2e/.auth" ||
    rel === "tests/e2e/.auth"
  );
}

function scanSensitiveLiteralAssignment(rel, line, lineNo) {
  const match = line.match(
    /(?:^|[,{;\s])["']?(password|passwd|client_secret|access_token|refresh_token|secret_key|api_key)["']?\s*[:=]\s*(["'`])([^"'`\r\n]+)\2/i,
  );
  if (!match || isSafeExamplePlaceholder(match[3])) return;
  addFinding(
    rel,
    lineNo,
    FAIL,
    `literal ${match[1]} assignment (possible secret)`,
  );
}

function scanEnvExampleAssignment(rel, line, lineNo) {
  const match = line.match(
    /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/,
  );
  if (!match || !SENSITIVE_ENV_NAME_RE.test(match[1])) return;
  if (!isSafeExamplePlaceholder(match[2])) {
    addFinding(
      rel,
      lineNo,
      FAIL,
      `sensitive environment example ${match[1]} must be empty or use a canonical placeholder`,
    );
  }
}

function isNormalizedManifestPath(path) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.startsWith("./") &&
    !path.includes("\\") &&
    posix.normalize(path) === path &&
    !path.split("/").includes("..")
  );
}

function isManifestAssetExtension(extension) {
  return (
    BINARY_ASSET_EXTENSIONS.has(extension) ||
    MANIFEST_TEXT_ASSET_EXTENSIONS.has(extension)
  );
}

async function loadAssetManifest() {
  if (profile !== "platform") return;

  let raw;
  try {
    raw = await readFile(join(root, ASSET_MANIFEST_BASENAME), "utf8");
  } catch (error) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      `required asset manifest is missing or unreadable (${error?.code ?? "read error"})`,
    );
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      "asset manifest is not valid JSON",
    );
    return;
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      "asset manifest must be a JSON object",
    );
    return;
  }
  if (manifest.version !== ASSET_MANIFEST_VERSION) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      `asset manifest version must be ${ASSET_MANIFEST_VERSION}`,
    );
  }
  if (!Array.isArray(manifest.assets)) {
    addFinding(
      ASSET_MANIFEST_BASENAME,
      null,
      FAIL,
      "asset manifest assets must be an array",
    );
    return;
  }

  manifest.assets.forEach((asset, index) => {
    const location = `${ASSET_MANIFEST_BASENAME}#assets[${index}]`;
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
      addFinding(location, null, FAIL, "asset entry must be an object");
      return;
    }
    let valid = true;
    if (!isNormalizedManifestPath(asset.path)) {
      addFinding(
        location,
        null,
        FAIL,
        "asset path must be a normalized repo-relative POSIX path",
      );
      valid = false;
    }
    if (
      typeof asset.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(asset.sha256)
    ) {
      addFinding(
        location,
        null,
        FAIL,
        "asset sha256 must be 64 lowercase hexadecimal characters",
      );
      valid = false;
    }
    if (!Number.isSafeInteger(asset.sizeBytes) || asset.sizeBytes <= 0) {
      addFinding(
        location,
        null,
        FAIL,
        "asset sizeBytes must be a positive safe integer",
      );
      valid = false;
    }
    for (const field of ASSET_METADATA_FIELDS) {
      if (typeof asset[field] !== "string" || asset[field].trim() === "") {
        addFinding(
          location,
          null,
          FAIL,
          `asset ${field} must be a non-empty string`,
        );
        valid = false;
      }
    }
    if (typeof asset.path === "string") {
      if (manifestPathsDeclared.has(asset.path)) {
        addFinding(location, null, FAIL, `duplicate asset path ${asset.path}`);
        valid = false;
      }
      manifestPathsDeclared.add(asset.path);
    }
    if (
      typeof asset.path === "string" &&
      !isManifestAssetExtension(extname(asset.path).slice(1).toLowerCase())
    ) {
      addFinding(
        location,
        null,
        FAIL,
        "asset path does not use a recognized asset extension",
      );
      valid = false;
    }
    if (valid) assetManifestEntries.set(asset.path, asset);
  });
}

// The generic base64 heuristic (only this heuristic, never the prefixed secret
// rules) is suppressed for lockfiles and for lines whose base64 is public
// integrity data: inline data URIs and subresource-integrity / lockfile hashes.
function skipBase64Heuristic(line, basename) {
  if (LOCKFILE_BASENAMES.has(basename)) return true;
  if (line.includes(";base64,")) return true;
  if (/\bintegrity\s*=/.test(line)) return true;
  if (/\bsha(?:256|384|512)-/.test(line)) return true;
  return false;
}

function isPublicUrlPathToken(line, token) {
  const urls = line.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  return urls.some((rawUrl) => {
    try {
      const url = new URL(rawUrl);
      const publicLocation = `${url.hostname}${url.pathname}`;
      return (
        publicLocation.includes(token) &&
        !url.search.includes(token) &&
        !url.hash.includes(token)
      );
    } catch {
      return false;
    }
  });
}

function scanText(rel, basename, text) {
  const envExample = isEnvExample(rel);
  const privatePolicyDeclaration = basename === ".gitignore";
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineNo = i + 1;
    for (const rule of SECRET_VALUE_RULES) {
      if (envExample && rule.kind === "assignment-name") continue;
      if (rule.re.test(line)) addFinding(rel, lineNo, FAIL, rule.label);
    }
    scanSensitiveLiteralAssignment(rel, line, lineNo);
    for (const rule of PRIVATE_CONTENT_RULES) {
      if (privatePolicyDeclaration) continue;
      const matches = rule.matches ? rule.matches(line) : rule.re.test(line);
      if (matches) addFinding(rel, lineNo, FAIL, rule.label);
    }
    if (!skipBase64Heuristic(line, basename)) {
      const runs = line.match(GENERIC_BASE64_RE);
      if (
        runs &&
        runs.some(
          (token) =>
            hasBase64SecretShape(token) && !isPublicUrlPathToken(line, token),
        )
      ) {
        addFinding(
          rel,
          lineNo,
          FAIL,
          "high-entropy base64 run (possible secret)",
        );
      }
    }
    if (profile !== "platform") {
      for (const rule of PRICING_RULES) {
        if (rule.re.test(line)) addFinding(rel, lineNo, WARN, rule.label);
      }
    }
    if (profile === "platform" && envExample) {
      scanEnvExampleAssignment(rel, line, lineNo);
    }
  }
}

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    addFinding(
      toPosixPath(relative(root, dir)) || ".",
      null,
      profile === "platform" ? FAIL : WARN,
      `unreadable directory (${error?.code ?? "read error"}); manual review`,
    );
    return;
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = toPosixPath(relative(root, full));
    if (entry.isSymbolicLink()) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        "symbolic link requires explicit review and materialization",
      );
      continue;
    }
    if (entry.isDirectory()) {
      if (entry.name === ".auth") {
        if (isAllowedGeneratedAuthDirectory(rel)) continue;
        addFinding(
          rel,
          null,
          FAIL,
          "unexpected authenticated storage directory",
        );
        continue;
      }
      if (GENERATED_DIRS.has(entry.name)) continue;
      if (isPrivateExportPath(rel, profile)) {
        addFinding(
          rel,
          null,
          FAIL,
          `private path (${matchedPrivateRules(rel, profile).join(", ")})`,
        );
        continue;
      }
      await walk(full);
      continue;
    }
    if (!entry.isFile()) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        "unsupported filesystem entry requires explicit review",
      );
      continue;
    }
    filesChecked += 1;
    if (isPrivateExportPath(rel, profile)) {
      addFinding(
        rel,
        null,
        FAIL,
        `private path (${matchedPrivateRules(rel, profile).join(", ")})`,
      );
      continue;
    }
    if (isSecretLikePath(rel) && !isEnvExample(rel)) {
      addFinding(rel, null, FAIL, "secret-like filename");
      continue;
    }
    const basename = entry.name.toLowerCase();
    const ext = extname(entry.name).slice(1).toLowerCase();
    let info;
    try {
      info = await stat(full);
    } catch (error) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        `unreadable file metadata (${error?.code ?? "stat error"}); manual review`,
      );
      continue;
    }
    const isLarge = info.size > LARGE_FILE_BYTES;

    if (BINARY_ASSET_EXTENSIONS.has(ext)) {
      if (profile === "platform") {
        assetPathsSeen.add(rel);
        const manifestEntry = assetManifestEntries.get(rel);
        if (!manifestEntry) {
          addFinding(
            rel,
            null,
            FAIL,
            "recognized binary is missing from ASSET_MANIFEST.json",
          );
        } else {
          if (info.size !== manifestEntry.sizeBytes) {
            addFinding(
              rel,
              null,
              FAIL,
              "binary byte size does not match ASSET_MANIFEST.json",
            );
          }
          try {
            const binary = await readFile(full);
            const actualSha256 = createHash("sha256")
              .update(binary)
              .digest("hex");
            if (actualSha256 !== manifestEntry.sha256) {
              addFinding(
                rel,
                null,
                FAIL,
                "binary sha256 does not match ASSET_MANIFEST.json",
              );
            }
          } catch (error) {
            addFinding(
              rel,
              null,
              FAIL,
              `binary is unreadable (${error?.code ?? "read error"}); manifest cannot be verified`,
            );
          }
        }
      }
      // Binary assets are never decoded as text. Oversized ones remain visible
      // as an audit note after their platform-manifest hash is verified.
      if (isLarge) {
        addFinding(rel, null, ASSET, `large binary asset, ${info.size} bytes`);
      }
      continue;
    }

    let buffer = null;
    const manifestEntry =
      profile === "platform" ? assetManifestEntries.get(rel) : null;
    if (manifestEntry) {
      assetPathsSeen.add(rel);
      if (info.size !== manifestEntry.sizeBytes) {
        addFinding(
          rel,
          null,
          FAIL,
          "asset byte size does not match ASSET_MANIFEST.json",
        );
      }
      try {
        buffer = await readFile(full);
        const actualSha256 = createHash("sha256").update(buffer).digest("hex");
        if (actualSha256 !== manifestEntry.sha256) {
          addFinding(
            rel,
            null,
            FAIL,
            "asset sha256 does not match ASSET_MANIFEST.json",
          );
        }
      } catch (error) {
        addFinding(
          rel,
          null,
          FAIL,
          `asset is unreadable (${error?.code ?? "read error"}); manifest cannot be verified`,
        );
        continue;
      }
    }
    if (!buffer) {
      try {
        buffer = await readFile(full);
      } catch (error) {
        addFinding(
          rel,
          null,
          profile === "platform" ? FAIL : WARN,
          `unreadable file (${error?.code ?? "read error"}); manual review`,
        );
        continue;
      }
    }
    if (
      buffer.subarray(0, 8192).includes(0) &&
      !KNOWN_TEXT_EXTENSIONS.has(ext)
    ) {
      addFinding(
        rel,
        null,
        profile === "platform" ? FAIL : WARN,
        "binary file is not a recognized asset type; manual review",
      );
      continue;
    }
    if (isLarge) {
      addFinding(
        rel,
        null,
        WARN,
        `large file, ${info.size} bytes; manual review required`,
      );
    }
    scanText(rel, basename, buffer.toString("utf8"));
  }
}

const rootInfo = await stat(root).catch(() => null);
if (!rootInfo || !rootInfo.isDirectory()) {
  console.error(`scan-export: not a directory: ${root}`);
  process.exit(2);
}

await loadAssetManifest();
await walk(root);

if (profile === "platform") {
  for (const path of assetManifestEntries.keys()) {
    if (!assetPathsSeen.has(path)) {
      addFinding(
        path,
        null,
        FAIL,
        "stale ASSET_MANIFEST.json entry has no matching asset file",
      );
    }
  }
}

const fails = findings.filter((f) => f.severity === FAIL);
const warns = findings.filter((f) => f.severity === WARN);
const assets = findings.filter((f) => f.severity === ASSET);

function format(finding) {
  const location = finding.line
    ? `${finding.path}:${finding.line}`
    : finding.path;
  return `- ${location}  [${finding.label}]`;
}

if (findings.length === 0) {
  console.log(
    `scan-export (${mode}, ${profile}) passed: ${filesChecked} files checked, no findings`,
  );
  process.exit(0);
}

const emit = fails.length > 0 ? console.error : console.warn;

if (fails.length > 0) {
  console.error(
    `scan-export (${mode}, ${profile}) FAILED: ${fails.length} blocking finding(s) over ${filesChecked} files`,
  );
  for (const finding of fails) console.error(format(finding));
}
if (warns.length > 0) {
  emit(
    `scan-export (${mode}, ${profile}) WARN: ${warns.length} finding(s) need manual sign-off`,
  );
  for (const finding of warns) emit(format(finding));
}
if (assets.length > 0) {
  emit(
    `scan-export (${mode}, ${profile}) ASSET: ${assets.length} large binary asset(s)`,
  );
  for (const finding of assets) emit(format(finding));
}

if (fails.length > 0) process.exit(1);

console.log(
  `scan-export (${mode}, ${profile}) passed with no blocking findings: ${filesChecked} files checked, ${warns.length} warning(s), ${assets.length} asset note(s)`,
);
process.exit(0);
