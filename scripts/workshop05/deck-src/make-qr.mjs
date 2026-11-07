#!/usr/bin/env node
/**
 * Writes the deck's six QR codes (assets/qr-*-g26*.svg), Druckschwarz on Kalkweiß, each with its URL as <title>.
 * Usage (from the repository root): node scripts/workshop05/deck-src/make-qr.mjs
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../packages/website/package.json"));
const QRCode = require("qrcode");
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../packages/website/public/workshops/audit-vorbereitung-mit-ki/assets");
const SITE = "https://loehrning.ai";
const SLUG = "audit-vorbereitung-mit-ki";

/** New file names (assets are cached for a year): the g26 set replaces the retired qr-kit, qr-probe, qr-own and qr-skill files. */
export const QR = {
  "qr-kit-g26.svg": `${SITE}/workshops/${SLUG}/kit`,
  "qr-kit-g26-en.svg": `${SITE}/en/workshops/${SLUG}/kit`,
  "qr-demo-g26.svg": `${SITE}/demos/${SLUG}`,
  "qr-demo-g26-en.svg": `${SITE}/en/demos/${SLUG}`,
  "qr-skill-g26.svg": `${SITE}/skills/audit-nachweise`,
  "qr-skill-g26-en.svg": `${SITE}/skills/audit-nachweise`,
};

for (const [file, url] of Object.entries(QR)) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#121212", light: "#F3F0E9" } });
  const titled = svg.replace(/<svg([^>]*)>/, `<svg$1 data-url="${url}"><title>${url}</title>`);
  writeFileSync(path.join(OUT, file), titled + (titled.endsWith("\n") ? "" : "\n"));
  console.log(`wrote ${file} → ${url}`);
}
