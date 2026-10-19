#!/usr/bin/env node
/**
 * list-book-tokens.mjs
 *
 * Prints the number tokens a book's figures offer to the prose, with the text
 * each one resolves to today. For authors: copy the token, never the number.
 *
 *   node scripts/list-book-tokens.mjs                  all figures of ki-landschaft
 *   node scripts/list-book-tokens.mjs c4 c7            only these figures
 *   node scripts/list-book-tokens.mjs --book <slug>
 *
 * Fields (append with a dot): .num .lo .hi .range .n .a .b ; digits override with :0
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseFigureSpec } from "../src/lib/figures/validate.ts";
import { resolveToken, tokenKeys } from "../src/lib/figures/tokens.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  const argv = process.argv.slice(2);
  let book = "ki-landschaft";
  const only = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--book") book = argv[++i] ?? "";
    else only.push(argv[i].toLowerCase());
  }
  const dir = join(ROOT, "content", "books", book, "figures");
  const names = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : [];
  for (const name of names) {
    const spec = parseFigureSpec(JSON.parse(readFileSync(join(dir, name), "utf8")));
    if (only.length > 0 && !only.includes(spec.id.toLowerCase())) continue;
    console.log(`\n${spec.id}  ${spec.title}${spec.meta?.methodVersion ? `  [${spec.meta.methodVersion}]` : ""}`);
    for (const key of tokenKeys(spec)) {
      let shown;
      try {
        shown = resolveToken(spec, key);
      } catch (error) {
        shown = `(${error instanceof Error ? error.message.split(":").slice(1).join(":").trim() : "not citable"})`;
      }
      console.log(`  {{${spec.id}.${key}}}  ->  ${shown}`);
    }
  }
}

main();
