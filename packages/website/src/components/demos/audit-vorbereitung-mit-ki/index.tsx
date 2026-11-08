/*
 * DEMO · /demos/audit-vorbereitung-mit-ki (and /en/demos/audit-vorbereitung-mit-ki)
 * Workshop 05 "Audit-Vorbereitung mit KI" on the v4 shell (Glas): the case
 * "Folder and register", an invented firm in Bitola and the thirteen questions of the
 * labour inspector. Server component: it picks the locale pack, computes the
 * model from the kit with the oracle (plain data, so the browser never loads
 * the kit or the oracle) and builds the take-home links, then renders the
 * client demo with them, so the browser bundle holds one language. The hub
 * miniature is tile.tsx (+ tile-motion.ts); the contract of this folder is
 * checked by src/components/demos/demo-contract.test.ts.
 */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { skillZip } from "@/app/skills/_lib/skill-zip";
import type { DemoComponentProps } from "../demo-page";
import { COPY } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/copy";
import { buildModel } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/model";
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
    kit: { href: kit.href, download: kit.href.split("/").pop() ?? kit.href, size: `${Math.max(1, Math.round(statSync(path.join(process.cwd(), "public", kit.href)).size / 1024))} KB` },
    shown: kit.shown.map((entry) => entry.split("/").pop() ?? entry),
  };
}

export default function AuditVorbereitungDemo({ locale }: DemoComponentProps) {
  return <Demo copy={COPY[locale]} model={buildModel(locale)} files={filesFor(locale)} />;
}
