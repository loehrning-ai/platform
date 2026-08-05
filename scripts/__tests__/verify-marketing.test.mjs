import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { verifyMarketing } from "../verify-marketing.mjs";

const DATE = "2026-07-26";

function entry(relativePath, overrides = {}) {
  const draft = relativePath.startsWith("marketing/drafts/");
  return {
    path: relativePath,
    kind: draft ? "draft-blog" : "operating-system",
    status: draft ? "draft" : "active",
    license: draft ? "ALL-RIGHTS-RESERVED" : "CC-BY-4.0",
    author: draft ? "Tim Löhr" : "loehrning.ai",
    dateCreated: DATE,
    dateModified: DATE,
    canonicalUrl: null,
    sourceReviewDate: DATE,
    ...overrides,
  };
}

function draftHeader(overrides = {}) {
  const fields = {
    Title: "Fixture draft",
    Status: "draft",
    License: "ALL-RIGHTS-RESERVED",
    Author: "Tim Löhr",
    Created: DATE,
    Modified: DATE,
    "Source review": DATE,
    "Canonical URL": "null",
    "Target channel": "blog",
    ...overrides,
  };
  return `---\n${Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}\n---\n\n# Fixture\n`;
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "loehrning-marketing-"));
  const files = {
    "marketing/README.md": "# Public marketing\n",
    "marketing/drafts/blog/example.md": draftHeader(),
    "marketing/research/sources.json": JSON.stringify({
      version: 1,
      sources: [
        {
          id: "official-source",
          url: "https://example.invalid/source",
        },
      ],
    }),
    "marketing/research/example.md":
      "# Research\n\n[Source: official-source]\n\n## Source index\n",
  };
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content);
  }
  const entries = [
    entry("marketing/README.md"),
    entry("marketing/drafts/blog/example.md"),
    entry("marketing/research/example.md", { kind: "research" }),
    entry("marketing/research/sources.json", { kind: "research" }),
    entry("marketing/manifest.json"),
  ];
  await writeFile(
    path.join(root, "marketing/manifest.json"),
    JSON.stringify({ version: 1, entries }),
  );
  return root;
}

async function mutateManifest(root, update) {
  const manifestPath = path.join(root, "marketing/manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  update(manifest);
  await writeFile(manifestPath, JSON.stringify(manifest));
}

test("accepts a complete public marketing contract", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  assert.deepEqual(await verifyMarketing(root), {
    files: 5,
    drafts: 1,
    sources: 1,
  });
});

test("accepts a long mixed-case public URL path", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  const sourcePath = path.join(root, "marketing/research/sources.json");
  const sources = JSON.parse(await readFile(sourcePath, "utf8"));
  sources.sources[0].url =
    "https://example.invalid/Redaktion/DE/Artikel/Blog/blog-beitrag-63_selbstlernangebot_ki-kompetenz.html";
  await writeFile(sourcePath, JSON.stringify(sources));
  assert.deepEqual(await verifyMarketing(root), {
    files: 5,
    drafts: 1,
    sources: 1,
  });
});

test("rejects an unprefixed high-entropy credential", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  const token = Array.from({ length: 8 }, () => "AbC123").join("");
  await writeFile(path.join(root, "marketing/README.md"), `${token}\n`);
  await assert.rejects(
    () => verifyMarketing(root),
    /possible high-entropy credential/,
  );
});

test("rejects a path with the wrong license", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  await mutateManifest(root, (manifest) => {
    manifest.entries.find((item) => item.path.endsWith("example.md")).license =
      "CC-BY-4.0";
  });
  await assert.rejects(() => verifyMarketing(root), /license must be/);
});

test("rejects an unregistered file and a stale manifest entry", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  await writeFile(path.join(root, "marketing/extra.md"), "# Extra\n");
  await mutateManifest(root, (manifest) => {
    manifest.entries.push(entry("marketing/missing.md"));
  });
  await assert.rejects(
    () => verifyMarketing(root),
    /file is not registered[\s\S]*stale manifest entry/,
  );
});

test("rejects missing draft metadata", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  await writeFile(
    path.join(root, "marketing/drafts/blog/example.md"),
    "# Missing header\n",
  );
  await assert.rejects(
    () => verifyMarketing(root),
    /draft metadata header is missing/,
  );
});

test("rejects symlinks", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  const target = path.join(root, "marketing", "README.md");
  const link = path.join(root, "marketing", "linked.md");
  await symlink(target, link);
  await assert.rejects(() => verifyMarketing(root), /symbolic links are not allowed/);
});

test("rejects invalid date ordering", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  await mutateManifest(root, (manifest) => {
    manifest.entries[0].dateCreated = "2026-07-27";
  });
  await assert.rejects(() => verifyMarketing(root), /precedes dateCreated/);
});

test("rejects a canonical URL on an unpublished draft", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  await mutateManifest(root, (manifest) => {
    manifest.entries.find((item) =>
      item.path.startsWith("marketing/drafts/"),
    ).canonicalUrl = "https://loehrning.ai/blog/example";
  });
  await assert.rejects(
    () => verifyMarketing(root),
    /unpublished draft canonicalUrl must be null/,
  );
});

test("reuses the public scanner rules for private context", async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { force: true, recursive: true }));
  const localPath = ["/Users", "real-contributor", "Documents", "source.md"].join(
    "/",
  );
  const internalReference = ["plans", "roadmap.md"].join("/");
  await writeFile(
    path.join(root, "marketing/README.md"),
    `${localPath}\n${internalReference}\n`,
  );
  await assert.rejects(
    () => verifyMarketing(root),
    /forbidden private context/,
  );
});
