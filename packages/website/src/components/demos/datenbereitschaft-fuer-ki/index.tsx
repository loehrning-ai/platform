/*
 * DEMO · /demos/datenbereitschaft-fuer-ki (and /en/demos/datenbereitschaft-fuer-ki)
 * Workshop 03 "Die Fragekarte". Server component: picks the locale pack and
 * renders the client demo with it, so the browser bundle holds one language.
 * It also reads today's recording once, so the line under Claude's table
 * follows the take (facts.ts), never an expectation. The hub miniature is
 * tile.tsx (+ tile-motion.ts); the contract of this folder is checked by
 * src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { SCENE } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/claude-runs";
import { COPY } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy";
import { factsOf } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/facts";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { takeHomeFor } from "@/lib/demo-takehome";
import { downloadPathFor } from "@/lib/vorlagen/registry";
import Demo from "./demo";

const SLUG = "datenbereitschaft-fuer-ki";
/** The take without the skill whose follow-up decides copy variant A or B of scene 1. */
const TODAY_TAKE = { de: "de-monat-without-1", en: "en-month-without-1" } as const;

/** "26. Oktober 2026" / "26 October 2026", from the take's own UTC timestamp. */
function recordedOn(iso: string, locale: "de" | "en", months: readonly string[]): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  const name = months[Number(month) - 1] ?? month;
  return locale === "de" ? `${Number(day)}. ${name} ${year}` : `${Number(day)} ${name} ${year}`;
}

export default function DatenbereitschaftFuerKiDemo({ locale }: DemoComponentProps) {
  const pack = COPY[locale];
  const take = SCENE?.recordings.find((recording) => recording.id === TODAY_TAKE[locale]);
  const todayLine = take && factsOf(take).followUpGivesRehearsal ? fill(pack.answer.statusToday, { date: recordedOn(take.recorded_at, locale, pack.monthLong), model: take.model }) : null;
  const hrefs = {
    kit: takeHomeFor(SLUG)?.kit[locale].href ?? "/workshops/datenbereitschaft-fuer-ki/data-readiness-kit.zip",
    skill: "/skills/kennzahl-fragekarte.zip",
    card: downloadPathFor("fragekarte", locale),
  };
  return <Demo pack={pack} hrefs={hrefs} todayLine={todayLine} />;
}
