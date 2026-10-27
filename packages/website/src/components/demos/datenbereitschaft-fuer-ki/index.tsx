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
import { modelName, type ClaudeRecording } from "@/lib/claude-runs";
import { SCENE } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/claude-runs";
import { COPY } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy";
import { CLAUDE_ANSWER } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import type { Grading } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import { answerValues, factsOf } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/facts";
import { fill } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/files";
import { takeHomeFor } from "@/lib/demo-takehome";
import { downloadPathFor } from "@/lib/vorlagen/registry";
import Demo from "./demo";

const SLUG = "datenbereitschaft-fuer-ki";
/** The takes of today's recording that the lines under Claude's table speak about. */
const TODAY_TAKE = { de: "de-monat-without-1", en: "en-month-without-1" } as const;
const TODAY_SKILL_TAKE = { de: "de-monat-with-1", en: "en-month-with-1" } as const;
/** The takes the test list grades in scene 5 (the rehearsal is the run log's table). */
const GRADED = {
  without: TODAY_TAKE,
  with: TODAY_SKILL_TAKE,
  view: { de: "de-sicht-with-1", en: "en-view-with-1" },
} as const;

/** What each graded answer ends with, read from the takes here on the server so the browser never loads them. */
function gradingFor(locale: "de" | "en"): Grading {
  const values = (id: string) => {
    const take = SCENE?.recordings.find((recording) => recording.id === id);
    return take ? answerValues(take) : null;
  };
  return { rehearsal: CLAUDE_ANSWER, without: values(GRADED.without[locale]), with: values(GRADED.with[locale]), view: values(GRADED.view[locale]) };
}

/** "26. Oktober 2026" / "26 October 2026", from the take's own UTC timestamp. */
function recordedOn(iso: string, locale: "de" | "en", months: readonly string[]): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  const name = months[Number(month) - 1] ?? month;
  return locale === "de" ? `${Number(day)}. ${name} ${year}` : `${Number(day)} ${name} ${year}`;
}

/**
 * What today's recording did, told whole: every sentence is chosen by a fact
 * the script read from the take, so a new take that behaves differently drops
 * the sentence instead of keeping a claim it no longer supports.
 */
function todayLines(pack: (typeof COPY)["de"], locale: "de" | "en", take: ClaudeRecording, skillTake: ClaudeRecording | undefined): string | null {
  const facts = factsOf(take);
  if (!facts.followUpGivesRehearsal) return null;
  const t = pack.answer.today;
  const lines = [facts.firstTurnNamesOpening ? fill(t.first, { date: recordedOn(take.recorded_at, locale, pack.monthLong), model: modelName(take.model) }) : null, t.followUp];
  const skill = skillTake ? factsOf(skillTake) : null;
  if (skill && skill.turns > 1 && skill.rehearsalValuesTurn === null && skill.expectedValuesTurn === null) lines.push(t.withSkill);
  return lines[0] ? lines.join(" ") : null;
}

export default function DatenbereitschaftFuerKiDemo({ locale }: DemoComponentProps) {
  const pack = COPY[locale];
  const take = SCENE?.recordings.find((recording) => recording.id === TODAY_TAKE[locale]);
  const skillTake = SCENE?.recordings.find((recording) => recording.id === TODAY_SKILL_TAKE[locale]);
  const todayLine = take ? todayLines(pack, locale, take, skillTake) : null;
  const hrefs = {
    kit: takeHomeFor(SLUG)?.kit[locale].href ?? "/workshops/datenbereitschaft-fuer-ki/data-readiness-kit.zip",
    skill: "/skills/kennzahl-fragekarte.zip",
    card: downloadPathFor("fragekarte", locale),
  };
  return <Demo pack={pack} hrefs={hrefs} todayLine={todayLine} grading={gradingFor(locale)} />;
}
