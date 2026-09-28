import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Keyboard focus must stay visible (WCAG 2.4.7).
 *
 * In Tailwind v4 `outline-none` sets `--tw-outline-style: none`, and a width
 * utility such as `focus-visible:outline-2` only sets
 * `outline-style: var(--tw-outline-style)`. Together they draw nothing: the
 * focused outline style stays `none`. A class string that removes the outline
 * and brings it back on focus therefore has to name the style too
 * (`focus-visible:outline-solid`, or the bare `focus-visible:outline`).
 */

const SRC = join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (/\.(?:ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

const REMOVES = /(?:^|[\s"'`])outline-none(?=[\s"'`]|$)/;
const WIDTH_ON_FOCUS = /(?:^|[\s"'`])focus-visible:-?outline-\d/;
const STYLE_ON_FOCUS =
  /(?:^|[\s"'`])focus-visible:(?:outline-(?:solid|dashed|dotted|double)|outline)(?=[\s"'`]|$)/;

function invisibleFocusLines(source: string): number[] {
  const hits: number[] = [];
  source.split("\n").forEach((line, index) => {
    if (
      REMOVES.test(line) &&
      WIDTH_ON_FOCUS.test(line) &&
      !STYLE_ON_FOCUS.test(line)
    ) {
      hits.push(index + 1);
    }
  });
  return hits;
}

describe("focus outlines", () => {
  it("recognises the invisible pattern and its fixes", () => {
    expect(
      invisibleFocusLines(
        '"outline-none focus-visible:outline-2 focus-visible:outline-brand-orange"',
      ),
    ).toEqual([1]);
    expect(
      invisibleFocusLines(
        '"outline-none focus-visible:outline-2 focus-visible:outline-solid"',
      ),
    ).toEqual([]);
    expect(
      invisibleFocusLines('"outline-none focus-visible:outline focus-visible:outline-2"'),
    ).toEqual([]);
    expect(invisibleFocusLines('"outline-none focus-visible:ring-2"')).toEqual(
      [],
    );
  });

  it("never pairs outline-none with a focus outline width but no style", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      for (const line of invisibleFocusLines(readFileSync(file, "utf8"))) {
        offenders.push(`${relative(SRC, file)}:${line}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
