import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createPreviewServer, resolvePreviewFile } from "../course03/card-preview.mjs";
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

/**
 * A workshop folder beside a sibling that shares its name as a string prefix
 * ("workshop-private"), plus a file directly in the parent.
 */
async function previewFixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "course03-preview-"));
  t.after(() => rm(dir, { force: true, recursive: true }));
  const folder = path.join(dir, "workshop");
  await mkdir(path.join(folder, "lib"), { recursive: true });
  await writeFile(path.join(folder, "slides.html"), "<!doctype html>");
  await writeFile(path.join(folder, "lib/story.css"), "a{}");
  await mkdir(path.join(dir, "workshop-private"));
  await writeFile(path.join(dir, "workshop-private/secret.txt"), "private");
  await writeFile(path.join(dir, "outside.txt"), "private");
  return folder;
}

function previewGet(port, target) {
  return new Promise((resolve, reject) => {
    const outgoing = request({ host: "127.0.0.1", port, path: target, agent: false }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
    });
    outgoing.on("error", reject);
    outgoing.end();
  });
}

test("the card preview helper resolves only paths inside the workshop folder", async (t) => {
  const folder = await previewFixture(t);
  assert.deepEqual(resolvePreviewFile(folder, "/slides.html"), { file: path.join(folder, "slides.html") });
  assert.deepEqual(resolvePreviewFile(folder, "/lib/story.css?v=1"), { file: path.join(folder, "lib/story.css") });
  assert.deepEqual(resolvePreviewFile(folder, "/lib/%2e%2e/slides.html"), { file: path.join(folder, "slides.html") });
  // Encoded separators survive URL parsing and decode into a climb out of the
  // folder. The sibling shares the folder's name as a string prefix, which a
  // plain startsWith(folder) check accepted.
  for (const target of [
    "/..%2fworkshop-private/secret.txt",
    "/%2e%2e%2fworkshop-private%2fsecret.txt",
    "/lib/..%2f..%2fworkshop-private/secret.txt",
    "/..%2foutside.txt",
    "/..%2f",
    "/",
  ]) {
    assert.deepEqual(resolvePreviewFile(folder, target), { status: 403 }, target);
  }
  // A folder given with a trailing separator is contained just as strictly.
  assert.deepEqual(resolvePreviewFile(`${folder}${path.sep}`, "/..%2fworkshop-private/secret.txt"), { status: 403 });
  assert.deepEqual(resolvePreviewFile(`${folder}${path.sep}`, "/slides.html"), { file: path.join(folder, "slides.html") });
  // Malformed percent-escapes are a client error, not an exception.
  for (const target of ["/%E0%A4%A", "/%", "/slides%ZZ.html"]) {
    assert.deepEqual(resolvePreviewFile(folder, target), { status: 400 }, target);
  }
});

test("the card preview server refuses the sibling folder and survives malformed escapes", async (t) => {
  const folder = await previewFixture(t);
  const server = createPreviewServer(folder);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();

  assert.deepEqual(await previewGet(port, "/slides.html"), { status: 200, body: "<!doctype html>" });
  assert.deepEqual(await previewGet(port, "/..%2fworkshop-private/secret.txt"), { status: 403, body: "" });
  assert.deepEqual(await previewGet(port, "/..%2foutside.txt"), { status: 403, body: "" });
  assert.deepEqual(await previewGet(port, "/%E0%A4%A"), { status: 400, body: "" });
  assert.deepEqual(await previewGet(port, "/missing.html"), { status: 404, body: "" });
  // The malformed request did not take the process down.
  assert.deepEqual(await previewGet(port, "/lib/story.css"), { status: 200, body: "a{}" });
});
