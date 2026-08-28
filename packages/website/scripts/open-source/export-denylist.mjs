// Shared denylist for the open-source export pipeline.
//
// SINGLE SOURCE OF TRUTH. Both scripts in this directory consume this module:
//   - export-interactive-courses.mjs excludes matching files from the copy.
//   - scan-export.mjs flags matching files as findings and fails.
// Neither script defines its own copy of these patterns; they import from here so
// one edit protects every export path.
//
// EXTENSION POINT: add new private classes here, do NOT redefine anything in
// the consuming scripts. Append rule objects to
// PRIVATE_PATH_RULES to protect more paths, and add a SEPARATE named export
// (for example SECRET_VALUE_RULES / PRIVATE_CONTEXT_RULES) for content-based or
// context-based classes so the path predicate below stays focused on paths.
// Every consumer inherits the change automatically.

/**
 * Private-path exclusion rules. Each rule is path based and matches whether the
 * export source is the loehrning.ai monorepo or a standalone clone, because the
 * predicate looks at path segments and basenames rather than absolute prefixes.
 *
 * Each rule:
 *   - id: stable identifier for the rule
 *   - label: human-readable reason, surfaced in scanner findings
 *   - match(relPath, segments, basename): true when the path must be excluded
 */
export const EXPORT_PROFILES = ["interactive-courses", "platform"];

const JAVASCRIPT_PACKAGE_MANAGER_LOCKFILES = new Set([
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

// These four versioned files are the active, manifest-verified runtime faces.
// Keep the allowlist exact so the obsolete public/fonts working directory does
// not become a general publication channel again.
const APPROVED_PUBLIC_RUNTIME_FONT_PATHS = new Set([
  "packages/website/public/fonts",
  "packages/website/public/fonts/loehrning-sans-bold-v1.woff2",
  "packages/website/public/fonts/loehrning-sans-medium-v1.woff2",
  "packages/website/public/fonts/loehrning-sans-regular-v1.woff2",
  "packages/website/public/fonts/loehrning-sans-semibold-v1.woff2",
]);

function hasSegmentPair(segments, first, second) {
  return segments.some(
    (segment, index) => segment === first && segments[index + 1] === second,
  );
}

function hasSegmentSequence(segments, sequence) {
  return segments.some((_, index) =>
    sequence.every((segment, offset) => segments[index + offset] === segment),
  );
}

function appliesToProfile(rule, profile) {
  return !rule.profiles || rule.profiles.includes(profile);
}

export const PRIVATE_PATH_RULES = [
  {
    id: "docs-privacy",
    label: "privacy docs (docs/privacy)",
    // Any path that contains the segment pair docs/privacy, at any depth.
    match: (_relPath, segments) => hasSegmentPair(segments, "docs", "privacy"),
  },
  {
    id: "launch-evidence-ledger",
    label: "launch evidence ledger",
    match: (_relPath, _segments, basename) =>
      basename === "launch-evidence-ledger.md",
  },
  {
    id: "runbook",
    label: "operations runbook",
    match: (_relPath, _segments, basename) =>
      basename.toLowerCase() === ["run", "book.md"].join(""),
  },
  // Private-context classes must never reach a public export in either the
  // copy or the scan.
  {
    id: "ai-tooling-instruction-files",
    label: "AI tooling instruction file",
    match: (_relPath, _segments, basename) =>
      [
        ".claude.json",
        ".cursorrules",
        ".windsurfrules",
        ".roorules",
        "claude.md",
        "agents.md",
        "agent.md",
        "integration.md",
        "notes.md",
        ["to", "do.md"].join(""),
        ["todo", "s.md"].join(""),
      ].includes(basename.toLowerCase()),
  },
  {
    id: "internal-local-notes",
    label: "internal local planning note",
    match: (_relPath, _segments, basename) => {
      const lower = basename.toLowerCase();
      return (
        (lower.startsWith("discuss-") && lower.endsWith(".md")) ||
        lower.endsWith(".local.md")
      );
    },
  },
  {
    id: "plans-directory",
    // Any path segment named "plans" (internal planning tree). The teaching
    // "claude" course directory has no leading dot and is unaffected.
    label: "internal plans directory",
    match: (_relPath, segments) => segments.includes("plans"),
  },
  {
    id: "ai-tooling-directories",
    // Leading-dot AI tooling dirs only. The published "claude" course directory
    // (no dot) is deliberately NOT matched here.
    label: "AI tooling directory",
    match: (_relPath, segments) =>
      segments.some(
        (segment) =>
          segment === ".claude" ||
          segment === ".claude-code" ||
          segment === ".agents" ||
          segment === ".cursor" ||
          segment === ".codex" ||
          segment === ".gemini" ||
          segment === ".windsurf" ||
          segment === ".roo" ||
          segment === ".cline" ||
          segment === ".continue" ||
          segment.startsWith(".aider"),
      ),
  },
  {
    id: "copilot-instructions",
    label: "AI tooling instruction file",
    match: (_relPath, segments, basename) =>
      basename.toLowerCase() === "copilot-instructions.md" &&
      hasSegmentPair(segments, ".github", "copilot-instructions.md"),
  },
  {
    id: "aider-instruction-files",
    label: "AI tooling instruction file",
    match: (_relPath, _segments, basename) =>
      basename.toLowerCase().startsWith(".aider"),
  },
  {
    id: "platform-launch-readiness",
    label: "internal launch-readiness document",
    profiles: ["platform"],
    match: (_relPath, segments, basename) =>
      basename === "launch-readiness.md" && segments.includes("docs"),
  },
  {
    id: "platform-operations-docs",
    label: "internal operations documentation",
    profiles: ["platform"],
    match: (_relPath, segments) =>
      hasSegmentPair(segments, "docs", "operations"),
  },
  {
    id: "platform-github-release-plan",
    label: "internal GitHub release plan",
    profiles: ["platform"],
    match: (_relPath, segments, basename) =>
      basename === "github-org-release.md" && segments.includes("open-source"),
  },
  {
    id: "platform-search-evidence",
    label: "internal search/citation evidence template",
    profiles: ["platform"],
    match: (_relPath, segments, basename) =>
      basename === "search-citation-baseline.md" && segments.includes("seo"),
  },
  {
    id: "platform-org-profile-blueprint",
    label: "separate organization-profile repository blueprint",
    profiles: ["platform"],
    match: (_relPath, segments) =>
      hasSegmentSequence(segments, ["docs", "open-source", "org-profile"]),
  },
  {
    id: "platform-nested-lockfile",
    label: "non-canonical JavaScript lockfile (only root bun.lock is allowed)",
    profiles: ["platform"],
    match: (_relPath, segments, basename) =>
      JAVASCRIPT_PACKAGE_MANAGER_LOCKFILES.has(basename.toLowerCase()) &&
      !(segments.length === 1 && basename.toLowerCase() === "bun.lock"),
  },
  {
    id: "platform-logo-working-kit",
    label: "redundant logo working asset kit",
    profiles: ["platform"],
    match: (_relPath, segments) =>
      hasSegmentSequence(segments, ["packages", "website", "logo"]),
  },
  {
    id: "platform-duplicate-public-fonts",
    label: "unused duplicate public font files",
    profiles: ["platform"],
    match: (_relPath, segments) => {
      if (
        !hasSegmentSequence(segments, [
          "packages",
          "website",
          "public",
          "fonts",
        ])
      ) {
        return false;
      }

      return !APPROVED_PUBLIC_RUNTIME_FONT_PATHS.has(segments.join("/"));
    },
  },
];

/**
 * Split a relative path into non-empty POSIX segments. Accepts either separator
 * so callers can pass values from path.relative() on any platform.
 */
export function toSegments(relPath) {
  return String(relPath).replace(/\\/g, "/").split("/").filter(Boolean);
}

/**
 * True when relPath matches any private-path rule and must be kept out of every
 * export path (copy and scan). relPath may use either separator and may be
 * monorepo-relative or clone-relative.
 */
export function isPrivateExportPath(relPath, profile = "interactive-courses") {
  const segments = toSegments(relPath);
  const basename = segments[segments.length - 1] ?? "";
  return PRIVATE_PATH_RULES.some(
    (rule) =>
      appliesToProfile(rule, profile) &&
      rule.match(relPath, segments, basename),
  );
}

/**
 * Labels of every private-path rule that matches relPath. Used by the scanner to
 * explain a finding; empty array when nothing matches.
 */
export function matchedPrivateRules(relPath, profile = "interactive-courses") {
  const segments = toSegments(relPath);
  const basename = segments[segments.length - 1] ?? "";
  return PRIVATE_PATH_RULES.filter(
    (rule) =>
      appliesToProfile(rule, profile) &&
      rule.match(relPath, segments, basename),
  ).map((rule) => rule.label);
}

// ---------------------------------------------------------------------------
// Content-based classes are separate named exports so the path predicate above
// stays focused on paths. Each rule is { id, label,
// re } with a NON-global regex, so a consumer can call rule.re.test(line)
// repeatedly across lines without lastIndex surprises.
// ---------------------------------------------------------------------------

/**
 * Secret value patterns (FAIL class).
 * The original sk- / SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY /
 * SENTRY_AUTH_TOKEN / PEM patterns are preserved; GitHub tokens, AWS keys,
 * Slack tokens, JWT (Supabase) keys, Google keys, Resend, Firecrawl, the
 * rate-limit HMAC key, and the named env-assignment secrets are added. A match
 * on any line is blocking.
 */
function envAssignmentPattern(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:\\b${escaped}\\s*=|[\"']${escaped}[\"']\\s*\\]\\s*=)`);
}

export const SECRET_VALUE_RULES = [
  {
    id: "openai-anthropic-sk",
    label: "sk- API key",
    // A boundary is required so ordinary words such as "risk-area" do not
    // become false positives merely because they contain the substring "sk-".
    re: /(?:^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/,
  },
  {
    id: "github-token",
    label: "GitHub token (gh[pousr]_)",
    re: /gh[pousr]_[A-Za-z0-9]{16,}/,
  },
  {
    id: "github-fine-grained-pat",
    label: "GitHub fine-grained PAT (github_pat_)",
    re: /github_pat_[A-Za-z0-9_]{20,}/,
  },
  {
    id: "aws-access-key-id",
    label: "AWS access key id (AKIA)",
    re: /AKIA[0-9A-Z]{16}/,
  },
  {
    id: "slack-token",
    label: "Slack token (xox[bpars]-)",
    re: /xox[baprs]-[A-Za-z0-9-]{10,}/,
  },
  {
    id: "jwt-supabase",
    label: "JWT header, e.g. Supabase key (eyJhbGciOi)",
    re: /eyJhbGciOi[A-Za-z0-9_-]{5,}/,
  },
  {
    id: "supabase-secret-key",
    label: "Supabase secret key (sb_secret_)",
    re: /\bsb_secret_[A-Za-z0-9_-]{22}_[A-Za-z0-9_-]{8}\b/,
  },
  {
    id: "google-api-key",
    label: "Google API key (AIza)",
    re: /AIza[0-9A-Za-z_-]{16,}/,
  },
  {
    id: "resend-api-key",
    label: "Resend API key (re_)",
    re: /\bre_[A-Za-z0-9]{16,}/,
  },
  {
    id: "firecrawl-api-key",
    label: "Firecrawl API key (fc-)",
    re: /\bfc-[A-Za-z0-9]{16,}/,
  },
  {
    id: "rate-limit-hmac-key-value",
    label: "rate-limit HMAC key (rlh1_)",
    re: /\brlh1_[0-9a-f]{64}\b/,
  },
  {
    id: "supabase-service-role",
    label: "SUPABASE_SERVICE_ROLE_KEY assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("SUPABASE_SERVICE_ROLE_KEY"),
  },
  {
    id: "rate-limit-hmac-secret",
    label: "RATE_LIMIT_HMAC_SECRET assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("RATE_LIMIT_HMAC_SECRET"),
  },
  {
    id: "anthropic-key",
    label: "ANTHROPIC_API_KEY assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("ANTHROPIC_API_KEY"),
  },
  {
    id: "sentry-auth-token",
    label: "SENTRY_AUTH_TOKEN assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("SENTRY_AUTH_TOKEN"),
  },
  {
    id: "database-url",
    label: "DATABASE_URL assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("DATABASE_URL"),
  },
  {
    id: "resend-key-assignment",
    label: "RESEND_API_KEY assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("RESEND_API_KEY"),
  },
  {
    id: "gemini-key",
    label: "GEMINI_API_KEY assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("GEMINI_API_KEY"),
  },
  {
    id: "cron-secret",
    label: "CRON_SECRET assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("CRON_SECRET"),
  },
  {
    id: "digifyde-api-url",
    label: "DIGIFYDE_API_URL assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("DIGIFYDE_API_URL"),
  },
  {
    id: "allow-unverified-scan-token",
    label: "ALLOW_UNVERIFIED_SCAN_TOKEN assignment",
    kind: "assignment-name",
    re: envAssignmentPattern("ALLOW_UNVERIFIED_SCAN_TOKEN"),
  },
  {
    id: "pem-private-key",
    label: "PEM private key block",
    re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

/**
 * Private-context content patterns (FAIL class): internal references that must
 * never appear in a public export even when the file path looks clean. The
 * Path-based internal-document classes live in PRIVATE_PATH_RULES above and
 * are not duplicated here.
 */
const privateVaultFragment = ["mavengence", "obsidian"].join("_");

// Contributor-local absolute paths are private even when the contributor is
// not the repository owner. Keep the platform-independent detection here so
// every scanner profile inherits it. A narrow placeholder allowlist permits
// documentation to show copyable generic examples without permitting real
// usernames. The regexes require a path below the user's home directory;
// ordinary prose such as "/home/" and public URLs whose route happens to
// contain "/Users/" do not match.
const GENERIC_LOCAL_USER_SEGMENT_RE =
  /^(?:<(?:user|username|your[-_.]?(?:user|username))>|\{(?:user|username)\}|\$(?:user|username)|\$\{(?:user|username)\}|%(?:user|username)%|(?:your[-_.]?)?(?:user|username)|(?:example|sample|demo)(?:[-_.]?(?:user|username))?)$/i;

const LOCAL_USER_PATH_PATTERNS = [
  // Common shell-home shortcuts into contributor-private folders. Generic
  // teaching paths such as ~/invoice_audit remain allowed.
  {
    re: /\b(?:Source|Quelle|Provenance)\s*:[^\r\n]*?(~\/(?:Desktop|Documents|Downloads|Library|Movies|Music|Pictures)(?:\/[^\s"'`<>]+)*)/gi,
    allowWindowsSystemProfile: false,
    tildeHome: true,
  },
  // macOS and conventional Linux home directories.
  {
    re: /(?:^|[\s"'`=(\x5b{:,])((?:\/Users|\/home)\/([^/\\\s"'`]+)(?:[/\\][^\\\s"'`<>]+)+)/gi,
    allowWindowsSystemProfile: false,
  },
  // Windows drive paths, accepting either separator for copied diagnostics.
  {
    re: /(?:^|[\s"'`=(\x5b{:,])([A-Za-z]:[\\/]Users[\\/]([^/\\\s"'`]+)(?:[\\/][^\\\s"'`<>]+)+)/gi,
    allowWindowsSystemProfile: true,
  },
  // file:///Users/... and file:///home/... are local paths, not public URLs.
  {
    re: /\bfile:\/\/\/((?:Users|home)\/([^/\\\s"'`]+)(?:[/\\][^\\\s"'`<>]+)+)/gi,
    allowWindowsSystemProfile: false,
  },
];

function isGenericLocalUserSegment(segment) {
  return GENERIC_LOCAL_USER_SEGMENT_RE.test(segment);
}

/**
 * True when a line contains a contributor-specific absolute home path.
 *
 * Detected forms:
 *   - macOS: /Users/<username>/...
 *   - Linux: /home/<username>/...
 *   - Windows: C:\\Users\\<username>\\... (or forward slashes)
 *
 * Canonical documentation placeholders such as <username>, $USER,
 * %USERNAME%, example-user, and the Windows Public/Default profiles are
 * intentionally allowed.
 */
export function containsContributorAbsolutePath(line) {
  for (const {
    re,
    allowWindowsSystemProfile,
    tildeHome,
  } of LOCAL_USER_PATH_PATTERNS) {
    // Create a fresh global regex so repeated line scans never share lastIndex.
    const matcher = new RegExp(re.source, re.flags);
    for (const match of String(line).matchAll(matcher)) {
      if (tildeHome) return true;
      const userSegment = match[2];
      const windowsSystemProfile =
        allowWindowsSystemProfile &&
        /^(?:public|default)$/i.test(userSegment ?? "");
      if (
        userSegment &&
        !windowsSystemProfile &&
        !isGenericLocalUserSegment(userSegment)
      ) {
        return true;
      }
    }
  }
  return false;
}

export const PRIVATE_CONTENT_RULES = [
  {
    id: "local-user-path",
    label: "local machine user path",
    matches: containsContributorAbsolutePath,
  },
  {
    id: "obsidian-vault",
    label: "private Obsidian vault reference",
    re: new RegExp(privateVaultFragment),
  },
  {
    id: "internal-plan-reference",
    label: "internal plan identifier",
    re: /\b(?:plans?\/(?:[a-z0-9._-]+\/)*[a-z0-9._-]+|plans?[- ]0[0-9]{2}|0[0-9]{2}\s+(?:stage|s)\s*\d+)\b/i,
  },
  {
    id: "internal-operations-reference",
    label: "internal TODO or operations-runbook reference",
    re: /\b(?:TODO(?:S)?|RUNBOOK)\.md\b/i,
  },
];

/**
 * Pricing patterns (WARN class). Pricing can appear legitimately in course
 * prose (worked examples, exercises), so these are surfaced for manual sign-off
 * in the manifest rather than blocking. Secrets and private context stay
 * blocking; only pricing is advisory.
 */
export const PRICING_RULES = [
  { id: "preis", label: "pricing term (Preis)", re: /preis/i },
  { id: "eur-amount", label: "pricing amount (EUR N)", re: /EUR ?[0-9]/ },
  { id: "pricing-en", label: "pricing term (pricing)", re: /pricing/i },
];

/**
 * Generic high-entropy heuristic (FAIL class) for secrets with no known prefix.
 * A run of 40+ base64-alphabet characters that mixes lower case, upper case,
 * AND digits looks like an encoded credential. Long English words carry no
 * digits and long hex carries no upper case, so prose and git hashes stay
 * quiet. The consuming scanner suppresses this heuristic (only this one, never
 * the prefixed rules above) for lockfiles and for data-URI / SRI hash lines,
 * whose base64 is public integrity data rather than a secret.
 */
export const GENERIC_BASE64_RE = /[A-Za-z0-9+/_-]{40,}={0,2}/g;

export function hasBase64SecretShape(token) {
  return (
    typeof token === "string" &&
    token.length >= 40 &&
    /[a-z]/.test(token) &&
    /[A-Z]/.test(token) &&
    /[0-9]/.test(token)
  );
}

/**
 * Lockfile basenames (lower case) whose integrity hashes are base64 by design.
 * The generic base64 heuristic is skipped for these so hashes do not
 * false-positive; the prefixed secret rules still apply.
 */
export const LOCKFILE_BASENAMES = new Set([
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "composer.lock",
  "cargo.lock",
  "poetry.lock",
]);

/**
 * Known binary asset extensions (lower case, no dot). Files with these
 * extensions are never read as text; oversized ones are recorded for the
 * manifest license/asset audit instead of being scanned line by line.
 */
export const BINARY_ASSET_EXTENSIONS = new Set([
  "7z",
  "avif",
  "bmp",
  "docx",
  "gz",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "m4v",
  "mov",
  "mp3",
  "mp4",
  "ogg",
  "otf",
  "pptx",
  "tar",
  "tif",
  "tiff",
  "ttf",
  "wasm",
  "wav",
  "webm",
  "woff",
  "woff2",
  "xlsx",
  "zip",
  "pdf",
]);
