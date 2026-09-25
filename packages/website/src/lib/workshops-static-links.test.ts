import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../public/workshops");

function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

describe("static workshop materials", () => {
  it("never link to a directory URL, because the site does not serve index.html for a folder", () => {
    const offenders: string[] = [];
    const files = htmlFiles(root);
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      const html = readFileSync(file, "utf8");
      for (const [, href] of html.matchAll(/\shref="([^"]*)"/g)) {
        if (/^(?:https?:|mailto:|#)/.test(href)) continue;
        if (href.endsWith("/")) offenders.push(`${file.slice(root.length + 1)}: ${href}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
