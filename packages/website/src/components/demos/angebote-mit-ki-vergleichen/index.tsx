/*
 * DEMO · /demos/angebote-mit-ki-vergleichen (and /en/demos/angebote-mit-ki-vergleichen)
 * Workshop 06 "Die Vergleichsbasis" on the v4 shell (Glas). Server component: picks the locale
 * pack, reads the three offers, the negotiation email, the project instructions and the prompt
 * from the shipped kit zip, runs "Unsere Prüfung" over the recorded takes with Brandtwerk's rates,
 * and renders the client demo with them, so the browser bundle holds one language and no text can
 * drift from the kit. The hub miniature is tile.tsx (+ tile-motion.ts); the contract of this
 * folder is checked by src/components/demos/demo-contract.test.ts.
 */
import { readFileSync } from "node:fs";
import type { DemoComponentProps } from "../demo-page";
import { formatBytes } from "@/components/demos/take-home/for-your-claude";
import { SCENE, FILE_SET_LABELS } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/claude-runs";
import { HORIZON, kitRows, STACK } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/config";
import { COPY } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/copy";
import { FILES, OFFER_KEYS, type OfferKey } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/konditionen";
import { checkAnswer } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/our-check";
import { ALL_LINES } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/stage";
import { assemble } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/basis";
import { takeHomeFor } from "@/lib/demo-takehome";
import { publicFile } from "@/lib/demo-takehome.server";
import { readZipText } from "@/lib/zip/read";
import Demo, { type DemoData } from "./demo";
import type { CheckTake } from "./takehome";

const SLUG = "angebote-mit-ki-vergleichen";
const KIT = "angebote-vergleichen-kit";
const SKILL = "angebote-vergleichen";

function dataFor(locale: "de" | "en"): DemoData {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no take-home kit for ${locale}`);
  const zip = new Uint8Array(readFileSync(publicFile(kit.href)));
  const text = (path: string) => {
    const value = readZipText(zip, path);
    if (value === null) throw new Error(`${kit.href} has no ${path}`);
    return value;
  };
  const letters = Object.fromEntries(OFFER_KEYS.map((key) => [key, text(FILES[key])])) as Record<OfferKey, string>;
  const model = assemble(kitRows(locale), ALL_LINES, STACK, HORIZON);
  const totals = model.ranked.map((option) => ({ option: option.name, cents: option.total }));
  const prompt = SCENE?.prompts.find((entry) => entry.locale === locale && entry.id === "mit-saetzen");
  const checks: CheckTake[] = prompt
    ? [...prompt.withSkill.map((id) => ({ id, withSkill: true })), ...prompt.withoutSkill.map((id) => ({ id, withSkill: false }))].flatMap(({ id, withSkill }) => {
        const take = SCENE?.recordings.find((recording) => recording.id === id);
        return take ? [{ id, withSkill, items: checkAnswer(take.final_text, totals, locale) }] : [];
      })
    : [];
  return {
    letters,
    takehome: {
      mail: text(`${KIT}/vorlagen/verhandlungsmail.md`),
      instructions: text(kit.instructions),
      prompt: text(`${KIT}/take-home/prompt.md`),
      kitHref: kit.href,
      kitName: kit.href.split("/").pop() ?? kit.href,
      kitSize: formatBytes(zip.length, locale),
      skillHref: `/skills/${SKILL}.zip`,
      skillName: `${SKILL}.zip`,
      setLabels: FILE_SET_LABELS[locale],
      checks,
    },
  };
}

export default function AngeboteMitKiVergleichenDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} data={dataFor(locale)} />;
}
