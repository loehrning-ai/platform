/**
 * The Claude scenes of all six demos, for the page. Each entry lives in the
 * demo's own folder (src/lib/demo-cases/<slug>/claude-runs/index.ts) together
 * with its recordings; this file only collects them.
 */

import type { ClaudeSceneData } from "@/lib/claude-runs";
import type { DemoSlug } from "@/lib/demos";
import { SCENE as w01 } from "@/lib/demo-cases/ki-prognosen-einschaetzen/claude-runs";
import { SCENE as w02 } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/claude-runs";
import { SCENE as w03 } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/claude-runs";
import { SCENE as w04 } from "@/lib/demo-cases/esg-berichte-mit-ki/claude-runs";
import { SCENE as w05 } from "@/lib/demo-cases/audit-vorbereitung-mit-ki/claude-runs";
import { SCENE as w06 } from "@/lib/demo-cases/angebote-mit-ki-vergleichen/claude-runs";

export const CLAUDE_SCENES: Readonly<Record<DemoSlug, ClaudeSceneData | null>> = {
  "ki-prognosen-einschaetzen": w01,
  "geschaeftsberichte-mit-ki-lesen": w02,
  "datenbereitschaft-fuer-ki": w03,
  "esg-berichte-mit-ki": w04,
  "audit-vorbereitung-mit-ki": w05,
  "angebote-mit-ki-vergleichen": w06,
};
