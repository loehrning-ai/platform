/**
 * What is recorded for Workshop 05 and from which files: the two recordings per language (`chain`,
 * `register`), their kit files, the prompt files and the recorder command lines. Everything is read
 * from the shipped zips with `unzip`, never from the kit source tree, so the hashes in a recording
 * are the hashes a visitor downloads. No clock and no network.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "../../..");
export const SLUG = "audit-vorbereitung-mit-ki";
export const SKILL = "audit-nachweise";
export const PUBLIC_DIR = path.join(REPO_ROOT, "packages/website/public/workshops", SLUG);
export const RUNS_DIR = path.join(REPO_ROOT, "packages/website/src/lib/demo-cases", SLUG, "claude-runs");
export const PROMPT_DIR = path.join(HERE, "prompts");
export const LOCALES = ["en", "de"];
export const RECORDINGS = ["chain", "register"];
/** The prompt files of each recording, in turn order: the first is the prompt, the others are follow-ups. */
export const PROMPT_IDS = { chain: ["chain-1", "chain-2", "chain-3"], register: ["register-1", "register-2"] };
/** The START file blocks in file order: step 1, 2, 3, 4 and the second prompt of step 4. */
export const BLOCK_ORDER = ["chain-1", "chain-2", "chain-3", "register-1", "register-2"];
/** How many takes may be run per language and recording (the recording plan), and which take number is the extra one. */
export const MAX_TAKES = 4;
export const EXTRA_TAKE = 5;

/** Per edition: the zip, its root folder, the START file, the instructions and the file groups of each recording. */
export const EDITIONS = {
  en: {
    zip: "gradba-audit-kit.zip",
    root: "gradba-audit-kit",
    start: "START-HERE.md",
    instructions: "project-instructions.md",
    chain: { dirs: ["checklists", "folder"], files: ["notice_DIT_2026-11-23.md", "cases/case-A-labour.md", "templates/evidence-index.csv", "templates/clock.csv", "templates/new-paper-note.md"] },
    register: { dirs: ["folder"], files: ["templates/register.csv"] },
    counts: { checklists: 3, folder: 14 },
    folderDir: "folder",
    registerTemplate: "templates/register.csv",
    evidenceIndex: "templates/evidence-index.csv",
    clock: "templates/clock.csv",
    paperNote: "templates/new-paper-note.md",
  },
  de: {
    zip: "gradba-audit-kit-de.zip",
    root: "gradba-audit-kit-de",
    start: "START-HIER.md",
    instructions: "projektanweisungen.md",
    chain: { dirs: ["listen", "ordner"], files: ["mitteilung_DIT_2026-11-23.md", "faelle/fall-A-arbeit.md", "vorlagen/evidence-index.csv", "vorlagen/clock.csv", "vorlagen/neues-papier.md"] },
    register: { dirs: ["ordner"], files: ["vorlagen/register.csv"] },
    counts: { listen: 3, ordner: 14 },
    folderDir: "ordner",
    registerTemplate: "vorlagen/register.csv",
    evidenceIndex: "vorlagen/evidence-index.csv",
    clock: "vorlagen/clock.csv",
    paperNote: "vorlagen/neues-papier.md",
  },
};

export const zipPath = (locale) => path.join(PUBLIC_DIR, EDITIONS[locale].zip);
/** The same path the recorder gets: relative to the repository root. */
export const zipPathRelative = (locale) => path.relative(REPO_ROOT, zipPath(locale)).split(path.sep).join("/");

export function zipEntries(locale) {
  const out = execFileSync("unzip", ["-Z1", zipPath(locale)], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  return out.split("\n").filter((name) => name !== "" && !name.endsWith("/"));
}

export function zipText(locale, entry) {
  return execFileSync("unzip", ["-p", zipPath(locale), entry], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/** The zip paths of the kit files one recording puts in the workspace (a whole folder, then single files), sorted. */
export function kitFilesFor(locale, recording, entries = zipEntries(locale)) {
  const edition = EDITIONS[locale];
  const group = edition[recording];
  const found = [];
  for (const dir of group.dirs) {
    const prefix = `${edition.root}/${dir}/`;
    const inside = entries.filter((name) => name.startsWith(prefix));
    const want = edition.counts[dir];
    if (want !== undefined && recording === "chain" && inside.length !== want) throw new Error(`${edition.zip}: ${dir}/ holds ${inside.length} files, the recipe expects ${want}`);
    found.push(...inside);
  }
  for (const file of group.files) {
    const entry = `${edition.root}/${file}`;
    if (!entries.includes(entry)) throw new Error(`${edition.zip} has no ${entry}`);
    found.push(entry);
  }
  return found.sort();
}

export const instructionsEntry = (locale) => `${EDITIONS[locale].root}/${EDITIONS[locale].instructions}`;
export const startEntry = (locale) => `${EDITIONS[locale].root}/${EDITIONS[locale].start}`;
export const promptFile = (locale, id) => path.join(PROMPT_DIR, `prompt-${locale}-${id}.txt`);
export const takeId = (locale, recording, take) => `${locale}-${recording}-${take}`;

/**
 * The arguments of one recorder call (after `node scripts/demos/record-claude-run.mjs`), with paths
 * relative to the repository root. `promptDir` and `rawDir` are strings, so a command line can carry
 * a shell variable for them.
 */
export function recorderArgs({ locale, recording, take, rawDir = "$RAW", promptDir = "scripts/workshop05/recordings/prompts", model, entries }) {
  const prompts = PROMPT_IDS[recording].map((id) => `${promptDir}/prompt-${locale}-${id}.txt`);
  const args = [
    "--slug", SLUG, "--locale", locale, "--prompt-id", recording, "--take", String(take), "--id", takeId(locale, recording, take),
    "--kit-zip", zipPathRelative(locale),
  ];
  for (const file of kitFilesFor(locale, recording, entries)) args.push("--kit-file", file);
  args.push("--instructions-file", instructionsEntry(locale), "--keep-paths", "--skill", SKILL, "--no-skill", "--allow-python", "--allow-write", "--preflight");
  args.push("--prompt-file", prompts[0]);
  for (const followUp of prompts.slice(1)) args.push("--follow-up-file", followUp);
  if (model) args.push("--model", model);
  args.push("--raw-dir", rawDir);
  return args;
}
