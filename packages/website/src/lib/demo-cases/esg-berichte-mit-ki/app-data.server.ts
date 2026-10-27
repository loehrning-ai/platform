import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readZipEntry } from "@/lib/zip/read";
import { APP_STEPS, typedPrompt } from "./app-steps";
import { claudePaybackYears, claudeStatusChanges, differencesBefore, registerCounts, stepCounts } from "./app-facts";
import { APP_RECORDINGS, APP_REGISTER, stepTurn, type Edition } from "./app-recordings";
import { fileKind, PROJECT_NAME, type AppData, type AppFile, type AppFileWhere } from "./app-data";
import { kitZip } from "./kit-text";

const SKILL = "esg-nachweise";

const WHERE: ReadonlyArray<readonly [RegExp, AppFileWhere]> = [
  [/^(ordner|files)\//, "knowledge"],
  [/^(anfragen|requests)\//, "request"],
  [/^(nachreichung|late-document)\//, "late"],
  [/^(projektanweisungen|project-instructions)\.md$/, "instructions"],
];

/** The skill's description, from the frontmatter of the SKILL.md visitors download. */
function skillDescription(): string {
  const source = readFileSync(join(process.cwd(), "content/skills", SKILL, "SKILL.md"), "utf8");
  const match = /^description:\s*(.+)$/m.exec(source);
  return match?.[1]?.trim() ?? "";
}

/**
 * The depicted app for one edition. Every file comes from the shipped kit zip
 * (the paths the recording read, byte for byte), so a chip or a cited line
 * shows exactly what a visitor downloads.
 */
export function appData(edition: Edition): AppData {
  const zip = kitZip(edition);
  const first = APP_RECORDINGS[edition]["schritt-1"];
  const four = APP_RECORDINGS[edition]["schritt-4"];
  const files: AppFile[] = four.kit_files.map((ref) => {
    const root = ref.path.slice(0, ref.path.indexOf("/") + 1);
    const path = ref.path.slice(root.length);
    const bytes = readZipEntry(zip, ref.path);
    if (!bytes) throw new Error(`esg app: the kit has no ${ref.path}`);
    const kind = fileKind(ref.name);
    const where = WHERE.find(([pattern]) => pattern.test(path))?.[1] ?? "knowledge";
    return { path, name: ref.name, kind, bytes: bytes.length, where, text: kind === "png" ? null : new TextDecoder().decode(bytes) };
  });
  const instructions = files.find((file) => file.where === "instructions");
  const produced = four.produced_files[0];
  if (!instructions?.text || !produced) throw new Error("esg app: no project instructions or no register");
  files.push({ path: produced.name, name: produced.name, kind: "xlsx", bytes: produced.bytes, where: "produced", text: null });
  const counts = registerCounts(edition);
  if (!counts.before || !counts.after) throw new Error("esg app: the register counts are not in the answers");
  const two = stepCounts(edition, "schritt-2");
  const payback = claudePaybackYears(edition);
  if (payback === null) throw new Error("esg app: no F4 payback in the answer of step 3");
  return {
    locale: edition,
    project: PROJECT_NAME[edition],
    model: first.model,
    version: first.claude_code_version,
    recordedAt: first.recorded_at,
    files,
    instructions: instructions.name,
    skill: { name: SKILL, description: skillDescription(), href: `/skills/${SKILL}.zip` },
    steps: APP_STEPS.map((step) => {
      const { turn, sent, wallS } = stepTurn(edition, step);
      return {
        id: step.id,
        chat: step.chat,
        typed: typedPrompt(sent),
        attach: step.attach[edition],
        turn: { timeline: turn.timeline, final_text: turn.final_text, stats: turn.stats, is_error: turn.is_error, stop_reason: turn.stop_reason },
        wallS,
      };
    }),
    register: { name: produced.name, rows: APP_REGISTER[edition].rows },
    facts: {
      belegt1: stepCounts(edition, "schritt-1").belegt,
      belegt2: two.belegt,
      rest2: two.schwach + two.luecke,
      before: counts.before,
      after: counts.after,
      payback,
      changed: claudeStatusChanges(edition),
      differences: differencesBefore(edition),
    },
  };
}
