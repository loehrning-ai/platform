/** @vitest-environment node */

import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { PAPER, PLAKAT } from "@/lib/plakat/palettes";
// The edge route bundles its font by URL (fetch(new URL(..., import.meta.url))).
// Node's fetch has no file: scheme, so the test serves those URLs from disk;
// every other request still goes to the real fetch.
vi.hoisted(async () => {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof URL ? input : new URL(String(input));
    if (url.protocol === "file:") {
      return new Response(new Uint8Array(await readFile(fileURLToPath(url))));
    }
    return realFetch(input, init);
  }) as typeof fetch;
});

import Image, {
  alt,
  contentType,
  runtime,
  size,
} from "./opengraph-image";

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

async function renderPixels() {
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

  it("keeps metadata aligned with the rendered subject", () => {
    expect(runtime).toBe("edge");
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toContain("KI verstehen. Sicher anwenden.");
    expect(alt).toContain("loehrning.ai");
  });
});
