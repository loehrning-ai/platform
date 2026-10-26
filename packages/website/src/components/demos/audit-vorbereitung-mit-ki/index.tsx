/*
 * DEMO · /demos/audit-vorbereitung-mit-ki (and /en/demos/audit-vorbereitung-mit-ki)
 * Workshop 05 "Audit-Vorbereitung mit KI" on the v4 shell (Glas): the
 * Vardar folder against Tannwald's eight requests. Server component: picks
 * the locale pack, the recorded Claude answers of this locale (for the
 * Zitat-Probe) and the take-home links, and renders the client demo with
 * them, so the browser bundle holds one language. The hub miniature is
 * tile.tsx (+ tile-motion.ts); the contract of this folder is checked by
 * src/components/demos/demo-contract.test.ts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { skillZip } from "@/app/skills/_lib/skill-zip";
import type { DemoComponentProps } from "../demo-page";
import { modelName, recordedOn, type ClaudeRecording } from "@/lib/claude-runs";
import { SCENE } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-runs";
import { COPY } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { takeHomeFor } from "@/lib/demo-takehome";
import type { Locale } from "@/lib/i18n/locale";
import Demo from "./demo";
import type { ProbeQuestion, ProbeTake } from "./scene-claude";
import type { TakeHomeFiles } from "./scene-takehome";

const SLUG = "audit-vorbereitung-mit-ki";
const SKILL = "audit-nachweise";

function takeOf(id: string | undefined, locale: Locale): ProbeTake | null {
  const recording: ClaudeRecording | undefined = SCENE?.recordings.find((entry) => entry.id === id);
  if (!recording) return null;
  return { id: recording.id, recordedOn: recordedOn(recording.recorded_at, locale), model: modelName(recording.model), prompt: recording.prompt, text: recording.final_text };
}

/** The first recorded take of each question of this locale, with and without the skill. */
function questionsFor(locale: Locale): readonly ProbeQuestion[] {
  return (SCENE?.prompts ?? [])
    .filter((prompt) => prompt.locale === locale)
    .map((prompt) => ({ id: prompt.id, label: prompt.label, withSkill: takeOf(prompt.withSkill[0], locale), withoutSkill: takeOf(prompt.withoutSkill[0], locale) }));
}

function filesFor(locale: Locale): TakeHomeFiles {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no take-home kit for ${locale}`);
  const document = readFileSync(path.join(process.cwd(), "content/skills", SKILL, "SKILL.md"), "utf8");
  const kilobytes = Math.max(1, Math.round(skillZip(SKILL, document).length / 1024));
  return {
    skill: { href: `/skills/${SKILL}.zip`, download: `${SKILL}.zip`, size: `${kilobytes} KB` },
    kit: { href: kit.href, download: kit.href.split("/").pop() ?? kit.href },
    shown: kit.shown.map((entry) => entry.split("/").pop() ?? entry),
  };
}

export default function AuditVorbereitungDemo({ locale }: DemoComponentProps) {
  return <Demo copy={COPY[locale]} questions={questionsFor(locale)} files={filesFor(locale)} sceneId={`claude-scene-${SLUG}`} />;
}
