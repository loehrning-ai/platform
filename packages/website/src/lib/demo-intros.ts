/**
 * The intros and shell versions of all six demos, for the route (which shell
 * to render) and the hub. Each entry lives in the demo's own folder
 * (src/lib/demo-cases/<slug>/intro.ts); this file only collects them.
 */

import type { DemoIntroData, DemoShellVersion } from "@/lib/demo-intro";
import type { DemoSlug } from "@/lib/demos";
import * as w01 from "@/lib/demo-cases/ki-prognosen-einschaetzen/intro";
import * as w02 from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/intro";
import * as w03 from "@/lib/demo-cases/datenbereitschaft-fuer-ki/intro";
import * as w04 from "@/lib/demo-cases/esg-berichte-mit-ki/intro";
import * as w05 from "@/lib/demo-cases/audit-vorbereitung-mit-ki/intro";
import * as w06 from "@/lib/demo-cases/angebote-mit-ki-vergleichen/intro";

/**
 * TAKEHOME_IN_STAGE: the demo draws its take-home and its Claude scene inside the stage (last beat),
 * so the page leaves out the shared "Für deinen Claude" block and the scene section below it.
 */
export const DEMO_INTROS: Readonly<Record<DemoSlug, { readonly SHELL: DemoShellVersion; readonly INTRO: DemoIntroData; readonly TAKEHOME_IN_STAGE?: boolean }>> = {
  "ki-prognosen-einschaetzen": w01,
  "geschaeftsberichte-mit-ki-lesen": w02,
  "datenbereitschaft-fuer-ki": w03,
  "esg-berichte-mit-ki": w04,
  "audit-vorbereitung-mit-ki": w05,
  "angebote-mit-ki-vergleichen": w06,
};

export function demoShell(slug: DemoSlug): DemoShellVersion {
  return DEMO_INTROS[slug].SHELL;
}
