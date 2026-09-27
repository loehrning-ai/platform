#!/usr/bin/env node
/**
 * Render the Workshop 03 card preview (card-preview.webp, 1024 x 576) from the deck cover.
 *
 * Serves the published workshop folder on a loopback port, opens slides.html#cover/0 in
 * Chromium at 1920 x 1080 with reduced motion (so the cover shows its final state),
 * screenshots the stage and downsizes it with sharp. Then run
 *   node scripts/course03/refresh-published.mjs
 * which records the new bytes in bundle-manifest.json and in this workshop's
 * ASSET_MANIFEST.json row ("Chromium screenshot of the course cover, resized to 1024 by 576 pixels").
 *
 * Usage (from the repository root; needs the website's dev dependencies installed):
 *   node scripts/course03/card-preview.mjs [--chromium /path/to/chromium]
 */
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WORKSHOP_RELATIVE } from "./publication.mjs";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ttf": "font/ttf", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json" };

/**
 * Map a request target onto a file inside `folder`.
 *
 * Returns `{ file }` for a servable path, `{ status: 400 }` for a target that is not a
 * valid URL or whose percent-escapes do not decode, and `{ status: 403 }` for anything
 * outside the folder. Containment is exact: the resolved path must start with the
 * resolved folder plus a separator, so a sibling such as `<folder>-private/` that only
 * shares the folder's name as a string prefix is refused, and so is the folder itself.
 */
export function resolvePreviewFile(folder, requestTarget) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestTarget, "http://localhost").pathname);
  } catch {
    return { status: 400 };
  }
  const root = path.resolve(folder);
  const inside = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(inside)) return { status: 403 };
  return { file };
}

/** A static file server for `folder` that answers only paths resolvePreviewFile accepts. */
export function createPreviewServer(folder) {
  return createServer(async (request, response) => {
    const target = resolvePreviewFile(folder, request.url ?? "/");
    if (!target.file) {
      response.writeHead(target.status).end();
      return;
    }
    try {
      const bytes = await readFile(target.file);
      response.writeHead(200, { "content-type": TYPES[path.extname(target.file)] ?? "application/octet-stream" }).end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const folder = path.join(root, WORKSHOP_RELATIVE);
  const website = createRequire(path.join(root, "packages/website/package.json"));
  const { chromium } = website("@playwright/test");
  const sharp = website("sharp");

  const server = createPreviewServer(folder);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  const flag = process.argv.indexOf("--chromium");
  const browser = await chromium.launch(flag > 0 ? { executablePath: process.argv[flag + 1] } : {});
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await page.goto(`http://127.0.0.1:${port}/slides.html#cover/0`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    const cover = page.locator("section#cover");
    const png = await cover.screenshot();
    const webp = await sharp(png).resize(1024, 576, { fit: "cover", position: "left top" }).webp({ quality: 82, effort: 6 }).toBuffer();
    await writeFile(path.join(folder, "card-preview.webp"), webp);
    console.log(`Wrote ${WORKSHOP_RELATIVE}/card-preview.webp (${webp.length} bytes). Now run node scripts/course03/refresh-published.mjs`);
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
