// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { describe, expect, it, vi } from "vitest";

// Contracts for the repository's GitHub automation: Dependabot's release
// cooldown and grouping, the voice-report comment upsert, and the CI contract
// document that describes required checks and token permissions.

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

describe("voice-report job", () => {
  const ci = workflow("ci.yml");
  const job = ci.jobs["voice-report"];
  const upsert = job.steps?.find((step) => step.name === "Upsert the pull-request comment");
  const script = upsert?.with?.script ?? "";
  const marker = "<!-- voice-report -->";

  it("holds pull-requests: write only in this job and only on same-repository pull requests", () => {
    expect(ci.permissions).toEqual({ contents: "read" });
    expect(job.permissions).toEqual({ contents: "read", "pull-requests": "write" });
    expect(job.if).toBe("github.event_name == 'pull_request'");
    expect(upsert?.uses).toMatch(/^actions\/github-script@[0-9a-f]{40}$/);
    expect(upsert?.if).toContain(
      "github.event.pull_request.head.repo.full_name == github.repository",
    );
    for (const [id, other] of Object.entries(ci.jobs)) {
      if (id === "voice-report") continue;
      for (const [scope, access] of Object.entries(other.permissions ?? {})) {
        expect(["read", "none"], `${id} ${scope}`).toContain(access);
      }
    }
  });

  type Comment = {
    readonly id: number;
    readonly body?: string;
    readonly user?: { readonly login?: string; readonly type?: string } | null;
  };

  const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (
    ...parameters: string[]
  ) => (...arguments_: unknown[]) => Promise<unknown>;

  async function runUpsert(comments: readonly Comment[]) {
    const listComments = vi.fn();
    const updateComment = vi.fn(async () => ({}));
    const createComment = vi.fn(async () => ({}));
    const github = {
      paginate: vi.fn(async (method: unknown, parameters: unknown) => {
        expect(method).toBe(listComments);
        expect(parameters).toMatchObject({ owner: "o", repo: "r", issue_number: 7 });
        return comments;
      }),
      rest: { issues: { listComments, updateComment, createComment } },
    };
    const context = { repo: { owner: "o", repo: "r" }, payload: { pull_request: { number: 7 } } };
    const requireStub = (id: string) => {
      if (id !== "node:fs/promises") throw new Error(`unexpected require(${id})`);
      return { readFile: async () => "Report" };
    };
    await new AsyncFunction("require", "github", "context", script)(requireStub, github, context);
    return { updateComment, createComment };
  }

  const bot = { login: "github-actions[bot]", type: "Bot" };
  const spoof = (id: number, user: Comment["user"]): Comment => ({
    id,
    body: `${marker}\nnot the report`,
    user,
  });

  it("creates its own comment instead of overwriting a marker comment from anyone else", async () => {
    for (const user of [
      { login: "mallory", type: "User" },
      { login: "github-actions[bot]", type: "User" },
      { login: "dependabot[bot]", type: "Bot" },
      null,
    ]) {
      const { updateComment, createComment } = await runUpsert([spoof(1, user)]);
      expect(updateComment, JSON.stringify(user)).not.toHaveBeenCalled();
      expect(createComment).toHaveBeenCalledOnce();
      expect(createComment).toHaveBeenCalledWith({
        owner: "o",
        repo: "r",
        issue_number: 7,
        body: `${marker}\nReport`,
      });
    }
  });

  it("updates the comment github-actions[bot] wrote, even after a spoofed one", async () => {
    const { updateComment, createComment } = await runUpsert([
      spoof(1, { login: "mallory", type: "User" }),
      { id: 2, body: "an unrelated bot comment", user: bot },
      { id: 3, body: `${marker}\nold report`, user: bot },
    ]);
    expect(createComment).not.toHaveBeenCalled();
    expect(updateComment).toHaveBeenCalledExactlyOnceWith({
      owner: "o",
      repo: "r",
      comment_id: 3,
      body: `${marker}\nReport`,
    });
  });
});

describe("docs/ci-contract.md", () => {
  const doc = repositoryFile("packages/website/docs/ci-contract.md");

  function section(heading: string): string {
    const start = doc.indexOf(`\n${heading}\n`);
    expect(start, heading).toBeGreaterThanOrEqual(0);
    const level = heading.split(" ")[0];
    const rest = doc.slice(start + heading.length + 2);
    const next = rest.search(new RegExp(`\\n#{2,${level.length}} `));
    return next === -1 ? rest : rest.slice(0, next);
  }

  it("names every check the ruleset requires, and each check has a source", () => {
    expect(doc).not.toMatch(/only required status check/i);
    const required = section("### Required status checks");
    for (const check of ["verify", "dependency-review", "CodeQL"]) {
      expect(required).toMatch(new RegExp(`\\|\\s*\`${check}\`\\s*\\|`));
    }
    expect(workflow("ci.yml").jobs.verify.name).toBe("verify");
    const review = workflow("dependency-review.yml").jobs["dependency-review"];
    expect(review).toBeDefined();
    // Without a name the check context is the job id, which the ruleset names.
    expect(review.name).toBeUndefined();
    // CodeQL runs as GitHub's default setup, not from a workflow here.
    expect(workflowFiles.filter((file) => /codeql/i.test(file))).toEqual([]);
  });

  it("lists every Verify job, and verify depends on every job but the advisory report", () => {
    const ci = workflow("ci.yml");
    const graph = section("## CI job graph");
    for (const id of Object.keys(ci.jobs)) {
      expect(graph, id).toMatch(new RegExp(`\\n\\|\\s*\`${id}\``));
    }
    expect([...(ci.jobs.verify.needs ?? [])].sort()).toEqual(
      Object.keys(ci.jobs)
        .filter((id) => id !== "verify" && id !== "voice-report")
        .sort(),
    );
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
