import type { AppCopy } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { fill, type AppData, type AppStepData } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data";
import type { BeatId } from "@/lib/demo-cases/esg-berichte-mit-ki/beats";
import { cardVerdict } from "@/lib/demo-cases/esg-berichte-mit-ki/card-state";
import type { Pack } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import type { DemoState } from "@/lib/demo-cases/esg-berichte-mit-ki/demo-state";
import type { KitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { LEDGER } from "@/lib/demo-cases/esg-berichte-mit-ki/ledger";
import { MEASURED, summary } from "@/lib/demo-cases/esg-berichte-mit-ki/measured";
import { recordedOn } from "@/lib/claude-runs";
import type { Fmt } from "../fmt";
import { INSTALL_STEPS } from "./install-view";
import { minSec } from "./measured-card";

/**
 * The dock's caption for every state of the demo: before a prompt is sent,
 * while Claude works, the answer in a sentence or two with the numbers read
 * from the recording, what to check by hand, and the beats after step 5.
 * Pure, so the tests can fill every caption of both editions.
 */

export type StepState = "idle" | "running" | "done";

export interface CaptionInput {
  readonly copy: AppCopy;
  readonly pack: Pack;
  readonly fmt: Fmt;
  readonly kit: KitText;
  readonly data: AppData;
  readonly step: AppStepData;
  readonly state: StepState;
  readonly scene: DemoState;
}

/** Once the visitor works the panel, the caption follows what they do there (the W04 scene captions). */
function sceneCaption({ pack, fmt, step, scene }: CaptionInput): readonly string[] | null {
  switch (step.id) {
    case "schritt-2": {
      if (scene.card.picking) return [fmt.t(pack.connect.picking, { part: pack.card.parts[scene.card.picking] })];
      if (cardVerdict(scene.card)) return fmt.ts(pack.connect.verdict);
      return null;
    }
    case "schritt-3": {
      const s = scene.strom;
      if (!s.linked) return null;
      return s.t < 1 ? pack.strom.morphInstruction : fmt.ts(pack.strom.caption);
    }
    case "schritt-5":
      return scene.invoiceIn ? fmt.ts(pack.invoice.caption) : null;
    default:
      return null;
  }
}

/** Claude's answer in a sentence or two, with the numbers read from the recording, then what to check by hand. */
function doneCaption({ copy, pack, fmt, kit, data, step }: CaptionInput): readonly string[] {
  const f = data.facts;
  const months = fmt.figures.months ?? "";
  const done = copy.steps.done;
  switch (step.id) {
    case "schritt-1": {
      const mismatch = f.differences
        .filter((item) => LEDGER.find((row) => row.id === item.row)?.group === "fragebogen")
        .map((item) => fill(copy.steps.mismatch, { row: item.row, claude: pack.statuses[item.claude], solution: pack.statuses[item.solution] }));
      return [...done["schritt-1"].map((text) => fill(text, { belegt: f.belegt1, strom: kit.fileNames.strom, months })), ...mismatch];
    }
    case "schritt-2":
      return [...done["schritt-2"].map((text) => fill(text, { belegt: f.belegt2, rest: f.rest2, claim: kit.claim.text })), ...pack.connect.instruction];
    case "schritt-3":
      return [...done["schritt-3"].map((text) => fill(text, { mwh11: fmt.figures.mwh11 ?? "", months })), ...pack.strom.instruction];
    case "schritt-4":
      return done["schritt-4"].map((text) => fill(text, { register: data.register.name, ...f.before }));
    case "schritt-5":
      return [...done["schritt-5"].map((text) => fill(text, { ...f.after })), copy.steps.invoiceHint];
  }
}

export function stepCaption(input: CaptionInput): readonly string[] {
  const { copy, step, state } = input;
  if (state === "idle") return copy.steps.ready[step.id];
  if (state === "running") return copy.steps.running.map((text) => fill(text, { s: Math.round(step.wallS) }));
  return sceneCaption(input) ?? doneCaption(input);
}

export function beatCaption(copy: AppCopy, beat: BeatId, locale: "de" | "en", installStep: number): readonly string[] {
  switch (beat) {
    case "gemessen": {
      const sum = summary(locale);
      const date = recordedOn(`${MEASURED.date}T12:00:00Z`, locale);
      return copy.measured.caption.map((text) => fill(text, { time: minSec(copy, sum.medianS), runs: sum.runs, date }));
    }
    case "dein-claude": {
      const step = copy.install.steps[installStep] ?? "";
      if (installStep === 0) return [copy.install.caption[0] ?? "", step];
      return installStep === INSTALL_STEPS - 1 ? [step, copy.install.team] : [step];
    }
    case "mitnehmen":
      return copy.takehome.caption;
    default:
      return [];
  }
}
