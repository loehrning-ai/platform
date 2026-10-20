// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";

// Contracts for the repository's GitHub automation: Dependabot's release
// cooldown and grouping, the shape of the Verify and Nightly workflows, and the
// CI contract document that describes the release signal and token permissions.

const repoRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

function repositoryFile(relative: string): string {
  return readFileSync(path.join(repoRoot, relative), "utf8");
}

function parseYaml(source: string): Record<string, unknown> {
  // gray-matter parses front matter with js-yaml's safe schema, so wrapping a
  // whole file as front matter reuses that parser without a new dependency.
  // A document separator would end the wrapper early.
  expect(source).not.toMatch(/^---\s*$/m);
  return matter(`---\n${source}\n---\n`).data;
}

type Permissions = Readonly<Record<string, string>>;
type Step = {
  readonly name?: string;
  readonly if?: string;
  readonly uses?: string;
  readonly with?: Readonly<Record<string, string>>;
};
type Job = {
  readonly name?: string;
  readonly if?: string;
  readonly needs?: readonly string[];
  readonly "continue-on-error"?: unknown;
  readonly permissions?: Permissions;
  readonly steps?: readonly Step[];
};
type Workflow = { readonly permissions?: Permissions; readonly jobs: Readonly<Record<string, Job>> };

function workflow(file: string): Workflow {
  return parseYaml(repositoryFile(`.github/workflows/${file}`)) as Workflow;
}

const workflowFiles = readdirSync(path.join(repoRoot, ".github/workflows"))
  .filter((file) => /\.ya?ml$/.test(file))
  .sort();

describe("Dependabot configuration", () => {
  type Group = {
    readonly "applies-to"?: string;
    readonly patterns?: readonly string[];
    readonly "update-types"?: readonly string[];
  };
  type Ignore = {
    readonly "dependency-name": string;
    readonly versions?: readonly string[];
    readonly "update-types"?: readonly string[];
  };
  type Update = {
    readonly "package-ecosystem": string;
    readonly cooldown?: {
      readonly "default-days"?: number;
      readonly include?: readonly string[];
      readonly exclude?: readonly string[];
    };
    readonly groups?: Readonly<Record<string, Group>>;
    readonly ignore?: readonly Ignore[];
  };
  const config = parseYaml(repositoryFile(".github/dependabot.yml")) as {
    readonly updates: readonly Update[];
  };
  const ecosystem = (name: string) => {
    const update = config.updates.find((entry) => entry["package-ecosystem"] === name);
    expect(update, name).toBeDefined();
    return update as Update;
  };

  it("maintains the Bun lockfile and the pinned GitHub Actions", () => {
    expect(config.updates.map((update) => update["package-ecosystem"]).sort()).toEqual([
      "bun",
      "github-actions",
    ]);
  });

  it("proposes no release younger than three days, for every dependency", () => {
    for (const update of config.updates) {
      const name = update["package-ecosystem"];
      expect(update.cooldown?.["default-days"], name).toBeGreaterThanOrEqual(3);
      // An include list would limit the cooldown to the listed names, and an
      // exclude list would exempt names from it.
      expect(update.cooldown?.include, name).toBeUndefined();
      expect(update.cooldown?.exclude, name).toBeUndefined();
    }
  });

  it("groups minor and patch version updates and leaves each major on its own", () => {
    for (const update of config.updates) {
      const name = update["package-ecosystem"];
      const groups = Object.values(update.groups ?? {});
      expect(groups.length, name).toBeGreaterThan(0);
      for (const group of groups) {
        expect(group["applies-to"], name).toBe("version-updates");
        expect(group["update-types"], name).toBeDefined();
        expect(group["update-types"], name).not.toContain("major");
      }
      expect(
        groups.some(
          (group) =>
            group.patterns?.includes("*") &&
            [...(group["update-types"] ?? [])].sort().join() === "minor,patch",
        ),
        name,
      ).toBe(true);
    }
  });

  it("holds @vitejs/plugin-react on its major until the vite 8 migration", () => {
    const rootManifest = JSON.parse(repositoryFile("package.json")) as {
      readonly overrides?: Readonly<Record<string, string>>;
    };
    const viteRange = rootManifest.overrides?.vite;
    expect(viteRange).toBeDefined();
    const viteMajor = Number(/\d+/.exec(viteRange as string)?.[0]);
    const pluginReact = (ecosystem("bun").ignore ?? []).filter(
      (rule) => rule["dependency-name"] === "@vitejs/plugin-react",
    );
    // plugin-react 6 requires vite 8. Once vite 8 is in, this rule must go, so
    // the next plugin-react major is proposed again.
    if (viteMajor < 8) {
      expect(pluginReact).toEqual([
        {
          "dependency-name": "@vitejs/plugin-react",
          "update-types": ["version-update:semver-major"],
        },
      ]);
    } else {
      expect(pluginReact).toEqual([]);
    }
    // Nothing else is ignored wholesale: an ignore rule always names the
    // update types or versions it holds back.
    for (const update of config.updates) {
      for (const rule of update.ignore ?? []) {
        expect(rule["update-types"] ?? rule.versions, rule["dependency-name"]).toBeDefined();
      }
    }
  });
});

describe("workflow shape", () => {
  const ci = workflow("ci.yml");

  it("keeps verify as the only aggregate and the only job with that name", () => {
    expect(Object.keys(ci.jobs).sort()).toEqual(["browser", "static", "unit", "verify"]);
    expect(ci.jobs.verify.name).toBe("verify");
    expect(ci.jobs.verify.if).toBe("${{ always() }}");
    expect([...(ci.jobs.verify.needs ?? [])].sort()).toEqual(["browser", "static", "unit"]);
    for (const file of workflowFiles) {
      for (const [id, job] of Object.entries(workflow(file).jobs)) {
        if (file === "ci.yml" && id === "verify") continue;
        expect(id, `${file} ${id}`).not.toMatch(/^verify/);
        expect(job.name ?? "", `${file} ${id}`).not.toMatch(/^verify/);
      }
    }
  });

  it("lets no gate hide a failure", () => {
    for (const [id, job] of Object.entries(ci.jobs)) {
      expect(job["continue-on-error"], id).toBeUndefined();
    }
    for (const id of ["static", "unit", "browser"]) {
      // Only verify may be conditional; a skipped gate would count as red there.
      expect(ci.jobs[id].if, id).toBeUndefined();
      expect(ci.jobs[id].needs, id).toBeUndefined();
    }
  });

  it("uses only GitHub-owned actions pinned to a full commit SHA", () => {
    const files = [
      ...workflowFiles.map((file) => `.github/workflows/${file}`),
      ".github/actions/setup/action.yml",
    ];
    for (const file of files) {
      const uses = [...repositoryFile(file).matchAll(/^\s*(?:-\s+)?uses:\s*(\S+)/gm)].map(
        (match) => match[1],
      );
      expect(uses.length, file).toBeGreaterThan(0);
      for (const reference of uses) {
        if (reference.startsWith("./")) continue;
        expect(reference, `${file} ${reference}`).toMatch(/^actions\/[\w-]+@[0-9a-f]{40}$/);
      }
    }
  });
});

describe("docs/ci-contract.md", () => {
  const doc = repositoryFile("packages/website/docs/ci-contract.md");

  it("documents the release signal and does not claim a ruleset the repository lacks", () => {
    expect(doc).toMatch(/`verify` check-run/);
    expect(doc).toMatch(/no branch protection/i);
    expect(workflow("ci.yml").jobs.verify.name).toBe("verify");
    // CodeQL runs as GitHub's default setup, not from a workflow here.
    expect(workflowFiles.filter((file) => /codeql/i.test(file))).toEqual([]);
  });

  it("lists every Verify job and every workflow file", () => {
    for (const id of Object.keys(workflow("ci.yml").jobs)) {
      expect(doc, id).toMatch(new RegExp(`\\n\\|\\s*\`${id}\``));
    }
    for (const file of workflowFiles) {
      expect(doc, file).toContain(`\`${file}\``);
    }
  });

  it("states every elevated token permission exactly as the workflows grant it", () => {
    const elevated: string[] = [];
    for (const file of workflowFiles) {
      const definition = workflow(file);
      expect(definition.permissions, file).toEqual({ contents: "read" });
      for (const [id, job] of Object.entries(definition.jobs)) {
        const permissions = Object.entries(job.permissions ?? {});
        if (!permissions.some(([, access]) => access === "write")) {
          for (const [scope, access] of permissions) {
            expect(["read", "none"], `${file} ${id} ${scope}`).toContain(access);
          }
          continue;
        }
        elevated.push(`${file} ${id}`);
        const row = new RegExp(`\\n\\|\\s*\`${file}\`\\s*\\|\\s*\`${id}\`\\s*\\|([^|\\n]*)\\|`).exec(doc);
        expect(row, `${file} ${id}`).not.toBeNull();
        const documented = [...(row?.[1] ?? "").matchAll(/`([a-z-]+): (read|write)`/g)].map(
          (match) => `${match[1]}: ${match[2]}`,
        );
        expect(documented.sort(), `${file} ${id}`).toEqual(
          permissions.map(([scope, access]) => `${scope}: ${access}`).sort(),
        );
      }
    }
    // The document's permissions table has exactly one row per elevated job.
    const documentedRows = [...doc.matchAll(/\n\|\s*`([\w.-]+\.ya?ml)`\s*\|\s*`([\w-]+)`\s*\|/g)].map(
      (match) => `${match[1]} ${match[2]}`,
    );
    expect(documentedRows.sort()).toEqual(elevated.sort());
    expect(doc).not.toMatch(/CI has read-only repository\s+permissions/);
  });
});
