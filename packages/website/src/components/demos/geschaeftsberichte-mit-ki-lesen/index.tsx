/*
 * DEMO · /demos/geschaeftsberichte-mit-ki-lesen (and /en/demos/geschaeftsberichte-mit-ki-lesen)
 * Workshop 02 "Eine Datei, drei Antworten". Server component: picks the locale
 * pack, reads the skill and the kit's project instructions from disk, and
 * renders the client demo with them, so the browser bundle holds one language
 * and the take-home text cannot drift from the files. The hub miniature is
 * tile.tsx (+ tile-motion.ts); the contract of this folder is checked by
 * src/components/demos/demo-contract.test.ts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { SKILL_NAME } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import { takeHomeFor } from "@/lib/demo-takehome";
import { publicFile } from "@/lib/demo-takehome.server";
import { readZipText } from "@/lib/zip/read";
import Demo from "./demo";

const SLUG = "geschaeftsberichte-mit-ki-lesen";

function skillSource(): string {
  return readFileSync(path.join(process.cwd(), "content", "skills", SKILL_NAME, "SKILL.md"), "utf8");
}

function kitInstructions(locale: "de" | "en"): string {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no take-home kit for ${locale}`);
  const text = readZipText(new Uint8Array(readFileSync(publicFile(kit.href))), kit.instructions);
  if (text === null) throw new Error(`${kit.href} has no ${kit.instructions}`);
  return text;
}

export default function GeschaeftsberichteMitKiLesenDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} skillText={skillSource()} instructions={kitInstructions(locale)} />;
}
