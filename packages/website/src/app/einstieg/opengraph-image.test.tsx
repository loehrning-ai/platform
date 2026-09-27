/** @vitest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it, vi } from "vitest";
import { PAPER } from "@/lib/plakat/palettes";
// The card reads its font from src/fonts on the Node runtime. Any fetch that
// leaves the process (the edge-era font URL fetch failed with "Failed to
// parse URL" during the build and on the first render) fails the render and
// the suite. Only inline data: URLs pass: next/og loads its own WebAssembly
// from them. Installed before the route module is imported, so a top-level
// fetch is caught too.
const fetchGuard = vi.hoisted(() => {
  const blocked: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("data:")) return realFetch(input, init);
    blocked.push(url);
    throw new Error(`/einstieg social image must not fetch: ${url}`);
  }) as typeof fetch;
  return { blocked, realFetch };
});

const locale = vi.hoisted(() => ({ current: "de" as "de" | "en" }));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: async () => locale.current,
}));

import * as route from "./opengraph-image";
import * as englishRoute from "../en/einstieg/opengraph-image";

const { default: Image, alt, contentType, size } = route;

afterAll(() => {
  globalThis.fetch = fetchGuard.realFetch;
  expect(fetchGuard.blocked).toEqual([]);
});

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function rgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const KALKWEISS = rgb(PAPER.kalkweiss);
const DRUCKSCHWARZ = rgb(PAPER.druckschwarz);
const MENNIGE = rgb(PAPER.mennige);

async function renderPixels(requestLocale: "de" | "en") {
  locale.current = requestLocale;
  const response = await Image();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");

  const bytes = Buffer.from(await response.arrayBuffer());
  expect([...bytes.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
  expect(bytes.readUInt32BE(16)).toBe(size.width);
  expect(bytes.readUInt32BE(20)).toBe(size.height);

  const { data, info } = await sharp(bytes)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const count = (colour: readonly [number, number, number]) => {
    let pixels = 0;
    for (let offset = 0; offset < data.length; offset += info.channels) {
      if (
        data[offset] === colour[0] &&
        data[offset + 1] === colour[1] &&
        data[offset + 2] === colour[2]
      ) {
        pixels += 1;
      }
    }
    return pixels;
  };
  const at = (x: number, y: number) => {
    const offset = (y * info.width + x) * info.channels;
    return [data[offset], data[offset + 1], data[offset + 2]];
  };
  return { count, at };
}

describe("/einstieg social image", () => {
  it("renders the paper card in both locales with the site face", async () => {
    const [de, en] = [await renderPixels("de"), await renderPixels("en")];
    const total = size.width * size.height;
    for (const card of [de, en]) {
      // Kalkweiß ground, Druckschwarz headline and rule, one Mennige step
      // label plus the colophon's L tile.
      expect(card.count(KALKWEISS)).toBeGreaterThan(total * 0.6);
      expect(card.count(DRUCKSCHWARZ)).toBeGreaterThan(10_000);
      expect(card.count(MENNIGE)).toBeGreaterThan(1_000);
      expect(card.at(8, 8)).toEqual([...KALKWEISS]);
    }
    // The English copy is a different set of lines, not the German card.
    expect(en.count(DRUCKSCHWARZ)).not.toBe(de.count(DRUCKSCHWARZ));
  });

  it("renders on the Node runtime and ships its font with the function", () => {
    // No edge runtime export on the card or on its generated /en mirror: the
    // default Node runtime reads src/fonts with readFile.
    expect("runtime" in route).toBe(false);
    expect("runtime" in englishRoute).toBe(false);
    expect(englishRoute.default).toBe(Image);
    // readFile(process.cwd() + ...) is invisible to the tracer, so both
    // locale routes list the font in outputFileTracingIncludes.
    const config = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    for (const routeKey of [
      "/einstieg/opengraph-image",
      "/en/einstieg/opengraph-image",
    ]) {
      expect(config).toContain(
        `"${routeKey}": ["./src/fonts/LoehrningSans-*.ttf"]`,
      );
    }
  });

  it("keeps metadata aligned with the rendered subject", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toContain("Was ist KI?");
    expect(alt).toContain("What is AI?");
    expect(alt).toContain("loehrning.ai");
  });
});
