/*
 * DEMO · /demos/geschaeftsberichte-mit-ki-lesen (and /en/demos/geschaeftsberichte-mit-ki-lesen)
 * Workshop 02 "Eine Datei, drei Antworten" on the v4 shell (Glas). Server
 * component: picks the locale pack, reads the skill, the kit's project
 * instructions and the recording date of the condition quoted in scene 3
 * from disk, and renders the client demo with them, so the browser bundle
 * holds one language and the take-home text cannot drift from the files.
 * The hub miniature is tile.tsx (+ tile-motion.ts); the contract of this
 * folder is checked by src/components/demos/demo-contract.test.ts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { DemoComponentProps } from "../demo-page";
import { SCENE } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/claude-runs";
import { CONDITIONS } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/conditions";
import { COPY } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { kitCounterWords, SKILL_FILE, SKILL_NAME, type KitCardWords } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import { takeHomeFor } from "@/lib/demo-takehome";
import { publicFile } from "@/lib/demo-takehome.server";
import { downloadPathFor, VORLAGEN } from "@/lib/vorlagen/registry";
import { readZipText } from "@/lib/zip/read";
import Demo from "./demo";
import type { TakeHomeFiles } from "./takehome";

const SLUG = "geschaeftsberichte-mit-ki-lesen";
const TEMPLATE = "kennzahlen-steckbrief-vorlage";

function skillSource(): string {
  return readFileSync(path.join(process.cwd(), "content", "skills", SKILL_NAME, SKILL_FILE), "utf8");
}

function filesFor(locale: "de" | "en"): TakeHomeFiles {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no take-home kit for ${locale}`);
  const instructions = readZipText(new Uint8Array(readFileSync(publicFile(kit.href))), kit.instructions);
  if (instructions === null) throw new Error(`${kit.href} has no ${kit.instructions}`);
  const template = VORLAGEN.find((item) => item.slug === TEMPLATE);
  if (!template) throw new Error(`${SLUG}: ${TEMPLATE} is not in the template registry`);
  return {
    skillText: skillSource(),
    instructions,
    plainSkillHref: `/skills/${SKILL_NAME}.zip`,
    templateHref: downloadPathFor(TEMPLATE, locale),
    templateName: template.downloadNames[locale],
    kitHref: kit.href,
    kitName: kit.href.split("/").pop() ?? kit.href,
  };
}

/** The three numerator options exactly as the kit's metric-cards.md words them. */
function kitCountersFor(locale: "de" | "en"): KitCardWords["counters"] {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  const cardsPath = kit?.shown.find((file) => file.endsWith("/metric-cards.md"));
  if (!kit || !cardsPath) throw new Error(`${SLUG}: the ${locale} kit lists no metric-cards.md`);
  const text = readZipText(new Uint8Array(readFileSync(publicFile(kit.href))), cardsPath);
  if (text === null) throw new Error(`${kit.href} has no ${cardsPath}`);
  return kitCounterWords(text);
}

/** The day the take quoted in scene 3 was recorded ("2026-10-26"). */
function recordedOn(locale: "de" | "en"): string {
  const take = SCENE?.recordings.find((recording) => recording.id === CONDITIONS[locale].takeId);
  if (!take) throw new Error(`${SLUG}: the take ${CONDITIONS[locale].takeId} is not in claude-runs`);
  return take.recorded_at.slice(0, 10);
}

export default function GeschaeftsberichteMitKiLesenDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} files={filesFor(locale)} recordedOn={recordedOn(locale)} kitCounters={kitCountersFor(locale)} />;
}
