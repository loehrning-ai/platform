import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildKitArchive, crc32, kitArchiveFiles, KIT_SOURCE_FILES } from "../course03/kit-archive.mjs";
import { check, isRepositoryAuthored, loadOverrides, resolveOverride, sha256, writeManifest } from "../course03/overrides.mjs";
import { planRefresh } from "../course03/refresh-published.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function overridesFixture(t, { original, override }) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "course03-overrides-"));
  t.after(() => rm(dir, { force: true, recursive: true }));
  await mkdir(path.join(dir, "scripts/course03/overrides/lib"), { recursive: true });
  await writeFile(path.join(dir, "scripts/course03/overrides/lib/story.css"), override);
  writeManifest(dir, {
    exported: { "lib/story.css": sha256(original) },
    files: { "lib/story.css": { original: sha256(original), override: sha256(override) } },
  });
  return loadOverrides(dir);
}

test("crc32 matches the ZIP reference value", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

test("kit archive is deterministic and lists worksheets before the builder kit", () => {
  const files = kitArchiveFiles(["warehouse/README.md", "README.md"]);
  assert.deepEqual(files.slice(0, KIT_SOURCE_FILES.length), KIT_SOURCE_FILES);
  assert.deepEqual(files.slice(-2), ["builder/README.md", "builder/warehouse/README.md"]);
  const entries = files.map((name) => [name, Buffer.from(`# ${name}\n`)]);
  assert.ok(buildKitArchive(entries).equals(buildKitArchive(entries)));
});

test("an override replaces only the export output it was recorded against", async (t) => {
  const original = Buffer.from("a{color:red}\n");
  const override = Buffer.from("a{color:#b73a15}\n");
  const overrides = await overridesFixture(t, { original, override });
  assert.equal(resolveOverride(overrides, "lib/tokens.css", original).status, "none");
  const applied = resolveOverride(overrides, "lib/story.css", original);
  assert.equal(applied.status, "applied");
  assert.ok(applied.bytes.equals(override));
  assert.equal(resolveOverride(overrides, "lib/story.css", override).status, "upstreamed");
  assert.throws(() => resolveOverride(overrides, "lib/story.css", Buffer.from("a{color:blue}\n")), /course source changed lib\/story\.css/);
});

test("an edited override copy is rejected until the manifest is recaptured", async (t) => {
  const overrides = await overridesFixture(t, { original: Buffer.from("x\n"), override: Buffer.from("y\n") });
  await writeFile(path.join(overrides.dir, "lib/story.css"), "z\n");
  assert.throws(() => resolveOverride(overrides, "lib/story.css", Buffer.from("x\n")), /does not match its manifest hash/);
});

test("repository-authored surfaces never need an override", () => {
  for (const name of ["guide.html", "builder.html", "demo.html", "data-readiness-kit/builder/README.md", "data-readiness-kit.zip", "bundle-manifest.json"]) {
    assert.equal(isRepositoryAuthored(name), true, name);
  }
  for (const name of ["slides.html", "lib/deck-stage.js", "data-readiness-kit/readiness-lab.html"]) {
    assert.equal(isRepositoryAuthored(name), false, name);
  }
});

test("every published fix is recorded as an override that the next export re-applies", () => {
  assert.deepEqual(check(root), []);
});

test("the published ZIP, manifests and repository-authored files are up to date", () => {
  const { problems, drift, removals } = planRefresh(root);
  assert.deepEqual(problems, []);
  assert.deepEqual(drift, [], "run: node scripts/course03/refresh-published.mjs");
  assert.deepEqual(removals, []);
});
