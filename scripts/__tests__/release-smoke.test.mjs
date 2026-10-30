import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildSmokeContract, MAX_RESPONSE_BYTES, runSmoke, smokeSourcePaths, verifySmokeResponse } from "../release-smoke.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function committedSources() {
  const files = {};
  const assets = [];
  for (const slug of ["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"]) for (const lang of ["de", "en"]) {
    const bytes = Buffer.from(`synthetic ${slug} ${lang} archive`);
    assets.push({ path: `packages/website/public/workshops/${slug}/kit-${lang}.zip`, sizeBytes: bytes.length, sha256: hash(bytes) });
  }
  files["ASSET_MANIFEST.json"] = Buffer.from(JSON.stringify({ assets }));
  for (const file of smokeSourcePaths().slice(1)) files[file] = Buffer.from(`committed bytes ${file}`);
  return files;
}
const document = (language = "de") => Buffer.from(`<html lang="${language}"><body><main><h1>Workshop</h1><span data-app-hydration-marker="true"></span></main></body></html>`);

test("contract covers app documents, both courses/languages and exact deck/kit bytes", () => {
  const files = committedSources();
  const checks = buildSmokeContract(files);
  assert.equal(checks.length, 31);
  assert.equal(new Set(checks.map((c) => c.route)).size, checks.length);
  for (const slug of ["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"]) for (const prefix of ["", "/en"]) for (const section of ["workshops", "demos"]) assert.ok(checks.some((c) => c.route === `${prefix}/${section}/${slug}`));
  assert.equal(checks.filter((c) => c.kind === "asset").length, 10);
  const slide = checks.find((c) => c.route === "/workshops/esg-berichte-mit-ki/slides.html");
  assert.equal(slide.hash, hash(files["packages/website/public/workshops/esg-berichte-mit-ki/slides.html"]));
});

test("contract fails closed on missing/duplicate/unsafe/oversized kit metadata", () => {
  const edit = (mutate) => { const sources = committedSources(); const manifest = JSON.parse(sources["ASSET_MANIFEST.json"]); mutate(manifest.assets); sources["ASSET_MANIFEST.json"] = Buffer.from(JSON.stringify(manifest)); return sources; };
  for (const sources of [edit((a) => a.pop()), edit((a) => { a[1] = a[0]; }), edit((a) => { a[0].path = a[0].path.replace("kit-de", "../kit-de"); }), edit((a) => { a[0].sizeBytes = MAX_RESPONSE_BYTES + 1; }), edit((a) => { a[0].sha256 = "wrong"; })]) assert.throws(() => buildSmokeContract(sources), /committed/);
  const missing = committedSources(); delete missing[smokeSourcePaths()[1]];
  assert.throws(() => buildSmokeContract(missing), /Missing committed source/);
});

test("exact asset smoke catches changed bytes even if HTTP succeeds and size matches", () => {
  const bytes = Buffer.from("known committed asset");
  const check = { route: "/kit.zip", kind: "asset", hash: hash(bytes), size: bytes.length };
  verifySmokeResponse(check, { status: 200, bytes });
  assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: Buffer.from("wrong committed asset") }), /differs from the requested Git commit/);
  assert.throws(() => verifySmokeResponse(check, { status: 404, bytes }), /HTTP 404/);
});

test("Git-tree contract verifies runtime blob bytes and excludes maps and authoring files", () => {
  const files = committedSources();
  const paths = [...smokeSourcePaths().slice(1), ...["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"].flatMap((slug) => ["deck-keys.js", "deck-stage.js", "scenes.js", "geo.js", "globe.js"].map((file) => `packages/website/public/workshops/${slug}/lib/${file}`))];
  const payload = Buffer.from("actual committed runtime");
  const blobHash = createHash("sha1").update(`blob ${payload.length}\0`).update(payload).digest("hex");
  const tree = { truncated: false, tree: [...paths.map((path) => ({ path, type: "blob", size: payload.length, sha: blobHash })), ...["lib/source.js.map", "lib/README.md", "assets/authoring.svg"].map((file) => ({ path: `packages/website/public/workshops/esg-berichte-mit-ki/${file}`, type: "blob", size: payload.length, sha: blobHash }))] };
  const contract = buildSmokeContract(files, tree);
  assert.equal(contract.length, 41);
  assert.equal(contract.some((check) => /source\.js\.map|README|authoring/.test(check.route)), false);
  const script = contract.find((check) => check.route.endsWith("/lib/scenes.js"));
  verifySmokeResponse(script, { status: 200, bytes: payload });
  assert.throws(() => verifySmokeResponse(script, { status: 200, bytes: Buffer.from("wrong committed runtime!") }), /differs from the requested Git commit/);
  assert.throws(() => buildSmokeContract(files, { ...tree, truncated: true }), /Incomplete committed Git tree/);
  assert.throws(() => buildSmokeContract(files, { ...tree, tree: tree.tree.filter((entry) => !entry.path.endsWith("/lib/scenes.js")) }), /Incomplete or excessive/);
});

test("HTML smoke rejects protection pages, missing app shell, wrong locale and soft 404s", () => {
  const check = { route: "/workshops/example", kind: "html", language: "de" };
  verifySmokeResponse(check, { status: 200, bytes: document() });
  for (const bytes of [Buffer.from("<html><h1>Vercel Authentication</h1></html>"), document("en"), Buffer.from(document().toString().replace("Workshop", "404")), Buffer.from(document().toString().replace("data-app-hydration-marker", "other-marker"))]) assert.throws(() => verifySmokeResponse(check, { status: 200, bytes }), /expected application document/);
});

test("HTML smoke rejects rendered DE/EN error boundaries without matching bundled copy", () => {
  const headings = [
    ["de", "Die Seite konnte nicht geladen werden."],
    ["en", "The page could not be loaded."],
    ["de", "Die Anwendung konnte nicht geladen werden."],
    ["en", "The application could not be loaded."],
  ];
  for (const [language, title] of headings) {
    const check = { route: "/workshops/example", kind: "html", language };
    const rendered = document(language).toString().replace("Workshop", title);
    assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: Buffer.from(rendered) }), /expected application document/);
    const ordinary = document(language).toString().replace("</body>", `<p>${title}</p><script>const copy = ${JSON.stringify(`<h1>${title}</h1>`)};</script></body>`);
    verifySmokeResponse(check, { status: 200, bytes: Buffer.from(ordinary) });
  }
});

test("HTML smoke rejects real streamed error markers and accepts intentional client bailout", () => {
  const check = { route: "/workshops/example", kind: "html", language: "de" };
  const withMarkup = (markup) => Buffer.from(document().toString().replace("</main>", `${markup}</main>`));
  assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: withMarkup('<!--$!--><template data-dgst="2081249290"></template><!--/$-->') }), /expected application document/);
  verifySmokeResponse(check, { status: 200, bytes: withMarkup('<!--$!--><template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template><!--/$-->') });
  const frame = (value) => `<script>self.__next_f.push(${JSON.stringify([1, value])})</script>`;
  // The error row can cross streaming chunks; parse data rather than bundled text.
  assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: withMarkup(frame('1:{"name":"Workshop"}\na:E{"dig') + frame('est":"2081249290"}\n')) }), /expected application document/);
  verifySmokeResponse(check, { status: 200, bytes: withMarkup(frame(`1:${JSON.stringify({ content: 'Workshop error example\na:E{"digest":"2081249290"}', title: "The page could not be loaded." })}\n`)) });
  verifySmokeResponse(check, { status: 200, bytes: withMarkup('<script>const example = \'<template data-dgst="2081249290"></template>\';</script>') });
});

test("HTML parser handles malformed script end tags and real headings outside scripts", () => {
  const check = { route: "/workshops/example", kind: "html", language: "de" };
  const title = "Die Anwendung konnte nicht geladen werden.";
  const bundled = document().toString().replace("</main>", `<script>const copy = ${JSON.stringify(`<h1>${title}</h1>`)};</script data-note></main>`);
  verifySmokeResponse(check, { status: 200, bytes: Buffer.from(bundled) });
  const exposed = document().toString().replace("</main>", `<script>const copy = "</script data-note><h1>${title}</h1>";</script></main>`);
  assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: Buffer.from(exposed) }), /expected application document/);
  const encodedTitle = document().toString().replace("Workshop", "Die Anwendung konnte nicht geladen werden&#46;");
  assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: Buffer.from(encodedTitle) }), /expected application document/);
});

test("HTML parsing does not execute scripts or accept app markup stored inside one", () => {
  const check = { route: "/", kind: "html", language: "de" };
  const inert = document().toString().replace("</body>", '<script>document.querySelector("h1").textContent = "404";</script><script src="https://release-smoke.invalid/script.js"></script></body>');
  verifySmokeResponse(check, { status: 200, bytes: Buffer.from(inert) });
  const scriptOnly = `<html lang="de"><script>const app = ${JSON.stringify(document().toString())};</script></html>`;
  assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: Buffer.from(scriptOnly) }), /expected application document/);
});

test("knowledge endpoints must contain their expected document format", () => {
  for (const [kind, valid] of [["robots", "User-agent: *"], ["sitemap", '<urlset xmlns="https://example.test"></urlset>'], ["llms", "# loehrning.ai"], ["json", '{"courses":[]}']]) {
    const check = { route: `/${kind}`, kind };
    verifySmokeResponse(check, { status: 200, bytes: Buffer.from(valid) });
    assert.throws(() => verifySmokeResponse(check, { status: 200, bytes: Buffer.from("<html>failure</html>") }));
  }
});

test("smoke has at most four active requests, checks every route once and never retries failures", async () => {
  let active = 0, maxActive = 0;
  const visited = [];
  const contract = Array.from({ length: 12 }, (_, index) => ({ route: `/${index}`, kind: "html", language: "de" }));
  await assert.rejects(runSmoke({ baseUrl: "https://deployment.vercel.app", contract, request: async (_base, route) => {
    visited.push(route); active++; maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setImmediate(resolve)); active--;
    return { status: route === "/2" ? 500 : 200, bytes: document() };
  } }), /\/2: HTTP 500/);
  assert.equal(maxActive, 4);
  assert.equal(visited.length, contract.length);
  assert.equal(new Set(visited).size, contract.length);
});

test("successful smoke reports its evidence count", async () => {
  const logs = [];
  assert.deepEqual(await runSmoke({ baseUrl: "https://loehrning.ai", contract: [{ route: "/", kind: "html", language: "de" }], request: async () => ({ status: 200, bytes: document() }), log: (message) => logs.push(message) }), { checks: 1, baseUrl: "https://loehrning.ai" });
  assert.match(logs[0], /1 application and exact-asset checks/);
});
