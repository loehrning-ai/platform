#!/usr/bin/env node
/**
 * Extracts the five prompts of each edition of Workshop 05 from the START file inside the shipped
 * zip (the 4-space-indented blocks: step 1, 2, 3, 4 and the second prompt of step 4) and writes
 * prompt-<locale>-<id>.txt into prompts/ next to this file. The recorder sends these files as they
 * are, the deck shows the same text, and the takes test checks all three agree.
 *
 *   node scripts/workshop05/recordings/extract-prompts.mjs            write prompts/
 *   node scripts/workshop05/recordings/extract-prompts.mjs --check    write nothing, exit 1 when a file differs
 *
 * The prompts are public text (the kit shows them), so keeping them in the repository is fine.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BLOCK_ORDER, LOCALES, PROMPT_DIR, promptFile, startEntry, zipText } from "./recipe.mjs";

/** The indented blocks of a Markdown file: runs of lines that start with 4 spaces, the indent removed. */
export function indentedBlocks(markdown) {
  const blocks = [];
  let current = null;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("    ")) {
      if (!current) {
        current = [];
        blocks.push(current);
      }
      current.push(line.slice(4));
    } else if (line.trim() !== "" || current) {
      current = null;
    }
  }
  return blocks.map((lines) => lines.join("\n").trim());
}

/** The five prompts of one edition, read from the zip, as {id: text}. */
export function promptsFromZip(locale) {
  const blocks = indentedBlocks(zipText(locale, startEntry(locale)));
  if (blocks.length !== BLOCK_ORDER.length) throw new Error(`${locale}: the start file has ${blocks.length} indented blocks, expected ${BLOCK_ORDER.length}`);
  blocks.forEach((block, index) => {
    if (block.includes("\n")) throw new Error(`${locale}: block ${index + 1} spans several lines`);
  });
  return Object.fromEntries(BLOCK_ORDER.map((id, index) => [id, blocks[index]]));
}

/** The text a prompt file holds, without the final newline; undefined when the file is missing. */
export function readPromptFile(locale, id) {
  const file = promptFile(locale, id);
  return existsSync(file) ? readFileSync(file, "utf8").replace(/\n$/, "") : undefined;
}

function main() {
  const check = process.argv.includes("--check");
  let differs = 0;
  if (!check) mkdirSync(PROMPT_DIR, { recursive: true });
  for (const locale of LOCALES) {
    const prompts = promptsFromZip(locale);
    for (const [id, text] of Object.entries(prompts)) {
      const file = promptFile(locale, id);
      if (readPromptFile(locale, id) !== text) {
        differs += 1;
        if (check) console.error(`differs: ${path.relative(process.cwd(), file)}`);
        else writeFileSync(file, `${text}\n`);
      }
      console.log(`${path.basename(file)}: ${text.split(/\s+/).length} words`);
    }
  }
  if (check && differs > 0) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
