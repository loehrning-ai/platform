/*
 * DEMO · /demos/audit-vorbereitung-mit-ki (and /en/demos/audit-vorbereitung-mit-ki)
 * Workshop 05 "Audit-Vorbereitung mit KI" on the v4 shell (Glas): the
 * Vardar folder against Tannwald's eight requests. Server component: picks
 * the locale pack, the recorded Claude takes of this locale (the window of
 * scene 5 replays them, claude-takes.ts) and the take-home links, and renders the client demo with
 * them, so the browser bundle holds one language. The hub miniature is
 * tile.tsx (+ tile-motion.ts); the contract of this folder is checked by
 * src/components/demos/demo-contract.test.ts.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { skillZip } from "@/app/skills/_lib/skill-zip";
import type { DemoComponentProps } from "../demo-page";
import { SCENE } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-runs";
import { windowQuestions } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-takes";
import { COPY } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { takeHomeFor } from "@/lib/demo-takehome";
import type { Locale } from "@/lib/i18n/locale";
import Demo from "./demo";
import type { TakeHomeFiles } from "./scene-takehome";

const SLUG = "audit-vorbereitung-mit-ki";
const skillName = "audit-nachweise";

function filesFor(locale: Locale): TakeHomeFiles {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no take-home kit for ${locale}`);
  const document = readFileSync(path.join(process.cwd(), "content/skills", skillName, "SKILL.md"), "utf8");
  const kilobytes = Math.max(1, Math.round(skillZip(skillName, document).length / 1024));
  return {
    skill: { href: `/skills/${skillName}.zip`, download: `${skillName}.zip`, size: `${kilobytes} KB` },
    kit: { href: kit.href, download: kit.href.split("/").pop() ?? kit.href },
    shown: kit.shown.map((entry) => entry.split("/").pop() ?? entry),
  };
}

export default function AuditVorbereitungDemo({ locale }: DemoComponentProps) {
  return <Demo copy={COPY[locale]} questions={windowQuestions(SCENE, locale)} files={filesFor(locale)} />;
}
