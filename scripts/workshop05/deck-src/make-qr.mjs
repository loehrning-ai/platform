#!/usr/bin/env node
/**
 * Writes the deck's QR codes (assets/qr-*.svg), Druckschwarz on Kalkweiß, each with its URL as <title>.
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

export const QR = {
  "qr-kit.svg": `${SITE}/workshops/${SLUG}/kit`,
  "qr-kit-en.svg": `${SITE}/en/workshops/${SLUG}/kit`,
  "qr-probe.svg": `${SITE}/demos/${SLUG}#zitat-probe`,
  "qr-probe-en.svg": `${SITE}/en/demos/${SLUG}#zitat-probe`,
  "qr-own.svg": `${SITE}/demos/${SLUG}#dein-ordner`,
  "qr-own-en.svg": `${SITE}/en/demos/${SLUG}#dein-ordner`,
  "qr-skill.svg": `${SITE}/demos/${SLUG}#mitnehmen`,
  "qr-skill-en.svg": `${SITE}/en/demos/${SLUG}#mitnehmen`,
};

for (const [file, url] of Object.entries(QR)) {
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M", color: { dark: "#121212", light: "#F3F0E9" } });
  const titled = svg.replace(/<svg([^>]*)>/, `<svg$1 data-url="${url}"><title>${url}</title>`);
  writeFileSync(path.join(OUT, file), titled + (titled.endsWith("\n") ? "" : "\n"));
  console.log(`wrote ${file} → ${url}`);
}
