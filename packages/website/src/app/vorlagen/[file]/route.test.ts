/**
 * GET /vorlagen/<file>.md serves a CC BY 4.0 question sheet as a download.
 * The body is the authored file byte for byte, the headers name the page
 * that publishes it as canonical, and every other name is a plain 404.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { VORLAGEN, vorlagenContentRoot } from "@/lib/vorlagen/registry";
import {
  GET,
  dynamic,
  dynamicParams,
  generateStaticParams,
  runtime,
} from "./route";

const CASES = VORLAGEN.flatMap((entry) =>
  (["de", "en"] as const).map((locale) => ({
    locale,
    name: entry.downloadNames[locale],
    file: path.join(vorlagenContentRoot(), entry.files[locale]),
    hostPath: entry.hostPaths[locale],
  })),
);

function requestFor(name: string): Request {
  return new Request(`https://loehrning.ai/vorlagen/${encodeURIComponent(name)}`);
}

function paramsFor(file: string) {
  return { params: Promise.resolve({ file }) };
}

describe("GET /vorlagen/[file]", () => {
  it("is prerendered for exactly the registered download names", async () => {
    expect(runtime).toBe("nodejs");
    expect(dynamic).toBe("force-static");
    expect(dynamicParams).toBe(false);
    await expect(generateStaticParams()).resolves.toEqual([
      { file: "ki-in-der-ausbildung-fragen.md" },
      { file: "ki-in-der-ausbildung-fragen.en.md" },
    ]);
  });

  it.each(CASES)("serves $name as an unmodified Markdown download", async ({ locale, name, file, hostPath }) => {
    const response = await GET(requestFor(name), paramsFor(name));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe(`attachment; filename="${name}"`);
    expect(response.headers.get("Content-Language")).toBe(locale);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600, s-maxage=3600");
    expect(response.headers.get("Link")).toBe(`<https://loehrning.ai${hostPath}>; rel="canonical"`);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");

    const body = Buffer.from(await response.arrayBuffer());
    expect(body.equals(readFileSync(file))).toBe(true);
  });

  it.each([
    "x.md",
    "../x.md",
    "../package.json",
    "..%2Fpackage.json",
    "en/ki-in-der-ausbildung-fragen.md",
    "ki-in-der-ausbildung-fragen",
    "ki-in-der-ausbildung-fragen.de.md",
    "",
  ])("answers 404 as plain text for %j", async (name) => {
    const response = await GET(requestFor(name), paramsFor(name));

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBeNull();
    expect(response.headers.get("Link")).toBeNull();
    await expect(response.text()).resolves.toBe("Unknown template.\n");
  });
});
