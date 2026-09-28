// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { devNull, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PRIVATE_CONTENT_RULES } from "../../../scripts/open-source/export-denylist.mjs";

// A Vercel CLI deploy uploads the working copy from the repository root and
// filters it only through .vercelignore plus a short built-in list; it never
// reads .gitignore. These tests hold .vercelignore to two rules:
//   1. every untracked path that a .gitignore excludes is excluded from the
//      upload too, so no local .env, key, session state or agent note ships;
//   2. no tracked file is excluded, so the upload still contains every input
//      the Git-integration build uses.
// Git itself evaluates both files, with the same gitignore semantics the CLI's
// `ignore` matcher implements.
//
// One exception is derived, not listed: a .gitignore rule that the publication
// scanner forbids spelling in any tracked file except .gitignore (its private
// content rules) cannot be repeated in .vercelignore without failing that
// scanner, so such a rule is not required here.

const repoRoot = fileURLToPath(new URL("../../../../../", import.meta.url));
// The ignore sandboxes are isolated from global and system configuration,
// including a personal core.excludesFile that could hide an uncovered path.
// Reading the real repository keeps the normal configuration, which may carry
// the safe.directory entry a CI checkout relies on.
const sandboxEnv = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: devNull,
};

function git(args: readonly string[], cwd: string, input?: string): string {
  const sandboxed = cwd !== repoRoot;
  return execFileSync(
    "git",
    sandboxed ? ["-c", `core.excludesFile=${devNull}`, ...args] : [...args],
    {
      cwd,
      env: sandboxed ? sandboxEnv : process.env,
      input,
      maxBuffer: 64 * 1024 * 1024,
    },
  ).toString("utf8");
}

function nulList(output: string): string[] {
  return output.split("\0").filter(Boolean);
}

/** Creates an empty repository whose only ignore sources are `files`. */
function ignoreSandbox(files: Readonly<Record<string, string>>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "vercelignore-"));
  sandboxes.push(dir);
  execFileSync("git", ["init", "--quiet", "--template=", dir], { env: sandboxEnv });
  for (const [relative, contents] of Object.entries(files)) {
    const target = path.join(dir, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  return dir;
}

/** The subset of `paths` that the sandbox's ignore rules exclude. */
function ignoredIn(sandbox: string, paths: readonly string[]): Set<string> {
  if (paths.length === 0) return new Set();
  try {
    return new Set(
      nulList(
        git(["check-ignore", "--no-index", "--stdin", "-z"], sandbox, `${paths.join("\0")}\0`),
      ),
    );
  } catch (error) {
    // check-ignore exits 1 when no path is ignored.
    if ((error as { status?: number }).status === 1) return new Set();
    throw error;
  }
}

type Sample = { readonly source: string; readonly rule: string; readonly path: string };

/** Mirrors scan-export.mjs: the rule text itself would be a scanner finding. */
function onlyNameableInGitignore(rule: string): boolean {
  return PRIVATE_CONTENT_RULES.some((scannerRule) =>
    scannerRule.matches ? scannerRule.matches(rule) : scannerRule.re?.test(rule) === true,
  );
}

/**
 * Turns each exclude rule of a .gitignore into concrete paths it should match:
 * wildcards become a literal word, a character class its first character, and
 * a directory rule gains a file inside the directory. Unanchored rules are
 * probed both beside the .gitignore and two directories deeper.
 */
function samplesFrom(source: string, contents: string): Sample[] {
  const base = path.posix.dirname(source) === "." ? "" : `${path.posix.dirname(source)}/`;
  const samples: Sample[] = [];
  for (const line of contents.split("\n")) {
    const rule = line.trim();
    if (!rule || rule.startsWith("#") || rule.startsWith("!")) continue;
    const directoryOnly = rule.endsWith("/");
    const body = rule.replace(/\/$/, "");
    const anchored = body.startsWith("/") || (!body.startsWith("**/") && body.includes("/"));
    const name = body
      .replace(/^\//, "")
      .replace(/^\*\*\//, "")
      .replace(/\[(.)[^\]]*\]/g, "$1")
      .replace(/\*+/g, "sample");
    const leaf = directoryOnly ? `${name}/sample-file` : name;
    const paths = anchored ? [`${base}${leaf}`] : [`${base}${leaf}`, `${base}nested/dir/${leaf}`];
    for (const samplePath of paths) samples.push({ source, rule, path: samplePath });
  }
  return samples;
}

const sandboxes: string[] = [];
let tracked: Set<string>;
let gitignoreSandbox: string;
let vercelSandbox: string;
let gitignoreSamples: Sample[];

beforeAll(() => {
  tracked = new Set(nulList(git(["ls-files", "-z"], repoRoot)));
  const gitignoreFiles = nulList(git(["ls-files", "-z", "--", ".gitignore", "*/.gitignore"], repoRoot));
  const gitignores = Object.fromEntries(
    gitignoreFiles.map((file) => [file, readFileSync(path.join(repoRoot, file), "utf8")]),
  );
  gitignoreSandbox = ignoreSandbox(gitignores);
  // Vercel reads only the root .vercelignore, relative to the upload root,
  // which is exactly how git reads a root .gitignore.
  vercelSandbox = ignoreSandbox({
    ".gitignore": readFileSync(path.join(repoRoot, ".vercelignore"), "utf8"),
  });
  gitignoreSamples = Object.entries(gitignores).flatMap(([file, contents]) =>
    samplesFrom(file, contents),
  );
});

afterAll(() => {
  for (const dir of sandboxes) rmSync(dir, { recursive: true, force: true });
});

describe(".vercelignore", () => {
  it("covers every untracked path that a .gitignore excludes", () => {
    expect(new Set(gitignoreSamples.map((sample) => sample.source))).toContain(".gitignore");
    const gitIgnored = ignoredIn(
      gitignoreSandbox,
      gitignoreSamples.map((sample) => sample.path),
    );

    // Every rule must yield a path git really ignores, or the probe proves
    // nothing for that rule.
    const unprobed = [
      ...new Set(
        gitignoreSamples
          .filter(
            (sample) =>
              !gitignoreSamples.some(
                (other) =>
                  other.source === sample.source &&
                  other.rule === sample.rule &&
                  gitIgnored.has(other.path),
              ),
          )
          .map((sample) => `${sample.source}: ${sample.rule}`),
      ),
    ];
    expect(unprobed).toEqual([]);

    // A tracked file is shipped by Git builds regardless of .gitignore, so it
    // must stay uploadable; "excludes no tracked file" enforces that side.
    const mustExclude = gitignoreSamples.filter(
      (sample) =>
        gitIgnored.has(sample.path) &&
        !tracked.has(sample.path) &&
        !onlyNameableInGitignore(sample.rule),
    );
    // The derived exception stays narrow: a few single Markdown note names.
    // The explicit list in the next test still requires every environment,
    // key, session and agent path whatever the scanner exempts.
    const exempted = [
      ...new Set(
        gitignoreSamples
          .filter((sample) => onlyNameableInGitignore(sample.rule))
          .map((sample) => sample.rule),
      ),
    ];
    expect(exempted.length).toBeLessThanOrEqual(3);
    for (const rule of exempted) expect(rule).toMatch(/^[A-Za-z*]+\.md$/);
    const vercelIgnored = ignoredIn(
      vercelSandbox,
      mustExclude.map((sample) => sample.path),
    );
    const uploaded = mustExclude
      .filter((sample) => !vercelIgnored.has(sample.path))
      .map((sample) => `${sample.path} (${sample.source}: ${sample.rule})`);
    expect(uploaded).toEqual([]);
  });

  it("excludes environment files, keys, session state and agent files at any depth", () => {
    const sensitive = [
      ".env",
      ".env.production",
      ".envrc",
      "packages/website/.env",
      "packages/website/.env.production",
      "packages/website/.env.local",
      "packages/website/tests/e2e/.env.test",
      "packages/website/tests/e2e/.auth/user.json",
      "packages/website/supabase/.temp/project-ref",
      "packages/website/playwright-report/data/trace.zip",
      "packages/website/test-results/konto/trace.zip",
      ".vercel/.env.production.local",
      "server.pem",
      "packages/website/certs/tls.key",
      "signing.p12",
      "id_ed25519",
      ".npmrc",
      "packages/website/.npmrc",
      ".netrc",
      ".git-credentials",
      "credentials.json",
      "service-account-prod.json",
      ".aws/credentials",
      ".ssh/config",
      "CLAUDE.md",
      "AGENTS.md",
      "packages/website/CLAUDE.md",
      "packages/website/AGENTS.md",
      ".claude/settings.local.json",
      "packages/website/.claude/settings.json",
      ".codex/config.toml",
      ".cursor/rules",
      "scratchpad/notes.md",
      "packages/website/scratchpad/notes.md",
      "docs/operations/notes.md",
      "docs/privacy/notes.md",
    ];
    const ignored = ignoredIn(vercelSandbox, sensitive);
    expect(sensitive.filter((file) => !ignored.has(file))).toEqual([]);
  });

  it("excludes no tracked file, so the upload keeps every build input", () => {
    const ignored = ignoredIn(vercelSandbox, [...tracked]);
    expect([...ignored]).toEqual([]);
  });

  it("keeps the lockfile, manifests, license policy, content and env templates uploadable", () => {
    const buildInputs = [
      "bun.lock",
      "bunfig.toml",
      "package.json",
      "LICENSE_POLICY.md",
      "packages/website/package.json",
      "packages/website/vercel.json",
      "packages/website/next.config.ts",
      "packages/website/.env.example",
      "packages/website/tests/e2e/.env.test.example",
    ];
    for (const file of buildInputs) expect(tracked).toContain(file);
    const contentFile = [...tracked].find((file) => file.startsWith("packages/website/content/"));
    expect(contentFile).toBeDefined();
    const probe = [...buildInputs, contentFile as string];
    const ignored = ignoredIn(vercelSandbox, probe);
    expect(probe.filter((file) => ignored.has(file))).toEqual([]);
  });
});
