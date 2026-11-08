#!/usr/bin/env node
/**
 * Prints the recorder command lines for Workshop 05, one per take, to run from the repository root,
 * one at a time and never in parallel (the recording plan).
 *
 *   node scripts/workshop05/recordings/commands.mjs                  takes 1 and 2 of every recording and language
 *   node scripts/workshop05/recordings/commands.mjs --take 3         only take 3
 *   node scripts/workshop05/recordings/commands.mjs --locale de --recording register
 *   node scripts/workshop05/recordings/commands.mjs --model <id>     adds --model (only when the default model is not available)
 *   node scripts/workshop05/recordings/commands.mjs --dry-run        adds --dry-run to every command
 *
 * Take 5 is the one extra take of the recording plan: its prompt files are copies with one plain sentence appended
 * (the START file stays as it is), written to "$RAW" by the printed lines above the command.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXTRA_TAKE, LOCALES, MAX_TAKES, PROMPT_IDS, RECORDINGS, promptFile, recorderArgs, zipEntries } from "./recipe.mjs";

const EXTRA_SENTENCE = { en: "Write plain sentences, with no dashes and no arrows.", de: "Schreibe einfache Sätze, ohne Gedankenstriche und ohne Pfeile." };

const quote = (arg) => (/^[A-Za-z0-9_@%+=:,./$-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, "'\\''")}'`);

/** The lines of one take: for the extra take the variant prompt files first, then the recorder call. */
export function takeCommand({ locale, recording, take, model, dryRun = false, entries }) {
  const extra = take === EXTRA_TAKE;
  const lines = [];
  if (extra) {
    for (const id of PROMPT_IDS[recording]) {
      const source = path.relative(process.cwd(), promptFile(locale, id));
      lines.push(`{ cat ${quote(source)}; printf ' %s\\n' ${quote(EXTRA_SENTENCE[locale])}; } > "$RAW/prompt-${locale}-${id}.txt"`);
    }
  }
  const args = recorderArgs({ locale, recording, take, model, promptDir: extra ? "$RAW" : undefined, entries: entries ?? zipEntries(locale) });
  if (dryRun) args.push("--dry-run");
  lines.push(`node scripts/demos/record-claude-run.mjs ${args.map(quote).join(" ")}`);
  return lines;
}

function main() {
  const argv = process.argv.slice(2);
  const get = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
  const onlyTake = get("--take") === undefined ? undefined : Number(get("--take"));
  const locales = get("--locale") ? [get("--locale")] : LOCALES;
  const recordings = get("--recording") ? [get("--recording")] : RECORDINGS;
  const takes = onlyTake === undefined ? [1, 2] : [onlyTake];
  if (takes.some((take) => !Number.isInteger(take) || take < 1 || take > Math.max(MAX_TAKES, EXTRA_TAKE))) throw new Error(`--take is 1 to ${EXTRA_TAKE}`);
  for (const locale of locales) {
    const entries = zipEntries(locale);
    for (const recording of recordings) {
      for (const take of takes) {
        console.log(`# ${locale} ${recording} take ${take}`);
        for (const line of takeCommand({ locale, recording, take, model: get("--model"), dryRun: argv.includes("--dry-run"), entries })) console.log(line);
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
