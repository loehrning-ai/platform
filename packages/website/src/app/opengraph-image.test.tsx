/** @vitest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it, vi } from "vitest";
import { PAPER, PLAKAT } from "@/lib/plakat/palettes";
// The card reads its font from src/fonts on the Node runtime. Any fetch that
// leaves the process (the edge-era font URL fetch failed with "Failed to
// parse URL" during the build and on the first render) fails the render and
// the suite, so the pixel tests below also prove the card needs no network or
// file URL. Only inline data: URLs pass: next/og loads its own WebAssembly
// from them. Installed before the route module is imported, so a top-level
// fetch is caught too.
const fetchGuard = vi.hoisted(() => {
  const blocked: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith("data:")) return realFetch(input, init);
    blocked.push(url);
    throw new Error(`root social image must not fetch: ${url}`);
  }) as typeof fetch;
  return { blocked, realFetch };
});

const locale = vi.hoisted(() => ({ current: "de" as "de" | "en" }));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: async () => locale.current,
}));

import * as route from "./opengraph-image";
import * as englishRoute from "./en/opengraph-image";

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

// The one red (SPEC D2): the globe disc and the colophon's L tile.
const MENNIGE = rgb(PAPER.mennige);
const ULTRAMARIN = rgb(PLAKAT.lemons.ground);
const BUTTER = rgb(PLAKAT.lemons.ink);
const KALKWEISS = rgb(PAPER.kalkweiss);

async function renderPixels(requestLocale: "de" | "en" = "de") {
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

describe("root social image", () => {
  it("renders the lemons poster card that stays readable at thumbnail size", async () => {
    const { count, at } = await renderPixels();
    const total = size.width * size.height;

    // Ultramarin is the ground: the largest single colour on the card.
    expect(count(ULTRAMARIN)).toBeGreaterThan(total * 0.4);
    // The flat Mennige globe disc bleeding off the right and bottom edges,
    // plus the L tile, is a large solid red shape (about 135k pixels).
    expect(count(MENNIGE)).toBeGreaterThan(80_000);
    expect(count(MENNIGE)).toBeLessThan(total * 0.35);
    // The Butter headline and Germany.
    expect(count(BUTTER)).toBeGreaterThan(20_000);
    // The Kalkweiß colophon strip sits at the bottom left, the ground at the
    // top left and the globe at the bottom right.
    expect(count(KALKWEISS)).toBeGreaterThan(30_000);
    expect(at(8, size.height - 8)).toEqual([...KALKWEISS]);
    expect(at(8, 8)).toEqual([...ULTRAMARIN]);
    expect(at(size.width - 8, size.height - 8)).toEqual([...MENNIGE]);
  });

  it("renders the English card for the /en mirror with the same poster layout", async () => {
    const [de, en] = [await renderPixels("de"), await renderPixels("en")];
    // The English headline is set smaller (96px), so it covers fewer Butter
    // pixels, but the card keeps the same ground, globe and strip.
    expect(en.count(BUTTER)).toBeGreaterThan(20_000);
    expect(en.count(BUTTER)).not.toBe(de.count(BUTTER));
    expect(en.count(MENNIGE)).toBe(de.count(MENNIGE));
    expect(en.at(8, size.height - 8)).toEqual([...KALKWEISS]);
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
    for (const routeKey of ["/opengraph-image", "/en/opengraph-image"]) {
      expect(config).toContain(
        `"${routeKey}": ["./src/fonts/LoehrningSans-*.ttf"]`,
      );
    }
  });

  it("keeps metadata aligned with the rendered subject", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toContain("KI verstehen. Sicher anwenden.");
    expect(alt).toContain("Understand AI. Apply it safely.");
    expect(alt).toContain("loehrning.ai");
  });
});
