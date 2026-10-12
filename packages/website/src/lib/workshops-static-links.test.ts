import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      const html = readFileSync(file, "utf8");
      for (const [, href] of html.matchAll(/\shref="([^"]*)"/g)) {
        if (/^(?:https?:|mailto:|#)/.test(href)) continue;
        if (href.endsWith("/")) offenders.push(`${file.slice(root.length + 1)}: ${href}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never link to a workshop file that is not published", () => {
    const missing: string[] = [];
    for (const file of htmlFiles(root)) {
      const html = readFileSync(file, "utf8");
      for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
        if (!url || /^(?:[a-z]+:|\/\/|#|\/)/i.test(url) || /[$'+ ]/.test(url)) continue;
        const path = url.split(/[?#]/)[0];
        if (!path) continue;
        if (!existsSync(resolve(dirname(file), path))) missing.push(`${file.slice(root.length + 1)}: ${url}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
