import { createHash } from "node:crypto";

export const PRODUCTION_ORIGINS = Object.freeze(["https://loehrning.ai", "https://www.loehrning.ai"]);
export const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const SLUGS = ["esg-berichte-mit-ki", "audit-vorbereitung-mit-ki"];
const PUBLIC_PREFIX = "packages/website/public";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function smokeSourcePaths() {
  return ["ASSET_MANIFEST.json", ...SLUGS.flatMap((slug) =>
    ["slides.html", "en/slides.html", "lib/deck.css"].map((file) => `${PUBLIC_PREFIX}/workshops/${slug}/${file}`))];
}

/** Every source byte is loaded from the requested GitHub commit by the caller. */
export function buildSmokeContract(sourceFiles, gitTree) {
  const manifest = JSON.parse(Buffer.from(sourceFiles["ASSET_MANIFEST.json"] ?? "").toString("utf8"));
  if (!Array.isArray(manifest.assets)) throw new Error("Invalid committed asset manifest");
  const kits = manifest.assets.filter((a) => typeof a.path === "string" && a.path.endsWith(".zip") &&
    SLUGS.some((slug) => a.path.startsWith(`${PUBLIC_PREFIX}/workshops/${slug}/`)));
  if (kits.length !== 4) throw new Error("Expected four committed W04/W05 kit editions");
  if (new Set(kits.map((a) => a.path)).size !== kits.length) throw new Error("Duplicate committed kit path");
  const assets = kits.map((a) => {
    if (!/^[a-f0-9]{64}$/.test(a.sha256) || !Number.isSafeInteger(a.sizeBytes) || a.sizeBytes <= 0 ||
      a.sizeBytes > MAX_RESPONSE_BYTES || a.path.includes("..") || a.path.includes("\\")) throw new Error("Invalid committed kit metadata");
    return { route: a.path.slice(PUBLIC_PREFIX.length), kind: "asset", hash: a.sha256, size: a.sizeBytes };
  });
  if (gitTree !== undefined) {
    if (gitTree.truncated !== false || !Array.isArray(gitTree.tree)) throw new Error("Incomplete committed Git tree");
    const runtime = gitTree.tree.filter((entry) => entry.type === "blob" && SLUGS.some((slug) => {
      const prefix = `${PUBLIC_PREFIX}/workshops/${slug}/`;
      return entry.path === `${prefix}slides.html` || entry.path === `${prefix}en/slides.html` || (entry.path.startsWith(`${prefix}lib/`) && /\.(?:js|css|svg)$/.test(entry.path));
    }));
    const required = [...smokeSourcePaths().slice(1), ...SLUGS.flatMap((slug) => ["deck-keys.js", "deck-stage.js", "scenes.js", "geo.js", "globe.js"].map((file) => `${PUBLIC_PREFIX}/workshops/${slug}/lib/${file}`))];
    if (runtime.length > 200 || required.some((file) => !runtime.some((entry) => entry.path === file))) throw new Error("Incomplete or excessive committed deck runtime");
    for (const entry of runtime) {
      if (!/^[a-f0-9]{40}$/.test(entry.sha) || !Number.isSafeInteger(entry.size) || entry.size <= 0 || entry.size > MAX_RESPONSE_BYTES || entry.path.includes("..") || entry.path.includes("\\")) throw new Error("Invalid committed runtime metadata");
      assets.push({ route: entry.path.slice(PUBLIC_PREFIX.length), kind: "asset", algorithm: "git-sha1", hash: entry.sha, size: entry.size });
    }
    if (new Set(assets.map((asset) => asset.route)).size !== assets.length) throw new Error("Duplicate committed runtime path");
  } else for (const file of smokeSourcePaths().slice(1)) {
    const bytes = sourceFiles[file];
    if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_RESPONSE_BYTES) throw new Error(`Missing committed source: ${file}`);
    assets.push({ route: file.slice(PUBLIC_PREFIX.length), kind: "asset", hash: sha256(bytes), size: bytes.length });
  }
  const html = ["/", "/en", "/kurse", "/workshops", "/login"];
  for (const prefix of ["", "/en"]) for (const slug of SLUGS) {
    html.push(`${prefix}/workshops/${slug}`, `${prefix}/workshops/${slug}/kit`, `${prefix}/demos/${slug}`);
  }
  return [...html.map((route) => ({ route, kind: "html", language: route.startsWith("/en") ? "en" : "de" })),
    { route: "/robots.txt", kind: "robots" }, { route: "/sitemap.xml", kind: "sitemap" },
    { route: "/llms.txt", kind: "llms" }, { route: "/api/knowledge-graph.json", kind: "json" }, ...assets];
}

// Error boundaries retain the app shell; inspect rendered headings and the actual
// React/Next error protocol, not ordinary copy or strings bundled in scripts.
function hasApplicationErrorDocument(html) {
  const rendered = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  if (/<h1\b[^>]*>\s*(?:Die Seite konnte nicht geladen werden\.|The page could not be loaded\.|Die Anwendung konnte nicht geladen werden\.|The application could not be loaded\.)\s*<\/h1\s*>/i.test(rendered)) return true;
  // Next's intentional no-SSR bailout is not an application failure.
  if (/<template\b[^>]*\bdata-dgst=["'](?!BAILOUT_TO_CLIENT_SIDE_RENDERING["'])[^"']+["']/i.test(rendered)) return true;
  const flight = [];
  for (const match of html.matchAll(/<script\b[^>]*>\s*self\.__next_f\.push\((\[[\s\S]*?\])\)\s*;?\s*<\/script\s*>/gi)) {
    try {
      const frame = JSON.parse(match[1]);
      if (frame[0] === 1 && typeof frame[1] === "string") flight.push(frame[1]);
    } catch { /* Other scripts are not Flight data. */ }
  }
  return /(?:^|\n)[\da-f]+:E\{"digest":/i.test(flight.join(""));
}

export function verifySmokeResponse(check, response) {
  if (response.status !== 200) throw new Error(`${check.route}: HTTP ${response.status}`);
  const bytes = Buffer.from(response.bytes ?? "");
  if (!bytes.length || bytes.length > MAX_RESPONSE_BYTES) throw new Error(`${check.route}: invalid response size`);
  if (check.kind === "asset") {
    const hash = check.algorithm === "git-sha1" ? createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex") : sha256(bytes);
    if (bytes.length !== check.size || hash !== check.hash) throw new Error(`${check.route}: deployed asset differs from the requested Git commit`);
    return;
  }
  const text = bytes.toString("utf8");
  if (check.kind === "html") {
    if (!/<main\b/i.test(text) || !/<h1\b/i.test(text) || !text.includes("data-app-hydration-marker") ||
      !new RegExp(`<html\\b[^>]*\\blang=["']${check.language}["']`, "i").test(text) ||
      /NEXT_HTTP_ERROR_FALLBACK;404|<h1[^>]*>\s*404\s*<\//i.test(text) || hasApplicationErrorDocument(text)) throw new Error(`${check.route}: missing expected application document`);
  } else if (check.kind === "robots" && !/user-agent:/i.test(text)) throw new Error(`${check.route}: invalid robots document`);
  else if (check.kind === "sitemap" && !/<urlset\b/.test(text)) throw new Error(`${check.route}: invalid sitemap document`);
  else if (check.kind === "llms" && !/loehrning/i.test(text)) throw new Error(`${check.route}: invalid public knowledge document`);
  else if (check.kind === "json") {
    let value;
    try { value = JSON.parse(text); } catch { throw new Error(`${check.route}: invalid JSON`); }
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${check.route}: missing knowledge graph`);
  }
}

/** Four bounded workers; failed requests are never retried or promoted. */
export async function runSmoke({ baseUrl, contract, request, log = () => {} }) {
  let next = 0;
  const failures = [];
  await Promise.all(Array.from({ length: Math.min(4, contract.length) }, async () => {
    for (;;) {
      const check = contract[next++];
      if (!check) return;
      try { verifySmokeResponse(check, await request(baseUrl, check.route)); }
      catch (error) { failures.push(error instanceof Error ? error.message : `${check.route}: request failed`); }
    }
  }));
  if (failures.length) throw new Error(`Release smoke failed:\n  - ${failures.join("\n  - ")}`);
  log(`Smoke passed: ${contract.length} application and exact-asset checks at ${baseUrl}`);
  return { checks: contract.length, baseUrl };
}
