import { describe, expect, it } from "vitest";
import { COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { linear } from "./plot";
import { placeLabels } from "./scene-baseline";

const W = 6.8;

describe.each(["de", "en"] as const)("the ruler labels on a phone stay inside and apart (%s)", (locale) => {
  const copy = COPY[locale];
  it.each([328, 358, 1100])("at %ipx, for every guess from 80 to 100 %", (width) => {
    const ruler = linear(0.8, 1, 20, width - 20);
    for (let guess = 80; guess <= 100; guess += 0.5) {
      const marks = [
        { share: 0.942, label: `${copy.s1.rulerTool} 94,2 %` },
        { share: guess / 100, label: `${copy.s1.rulerGuess} ${guess.toFixed(1)} %` },
      ].sort((a, b) => a.share - b.share);
      const placed = placeLabels(
        marks.map((mark) => ruler(mark.share)),
        marks.map((mark) => mark.label),
        width,
      );
      const left = { from: placed[0]!.x - marks[0]!.label.length * W, to: placed[0]!.x };
      const right = { from: placed[1]!.x, to: placed[1]!.x + marks[1]!.label.length * W };
      expect(left.from, `guess ${guess}`).toBeGreaterThanOrEqual(4 - 1e-9);
      expect(right.to, `guess ${guess}`).toBeLessThanOrEqual(width - 4 + 1e-9);
      expect(right.from - left.to, `guess ${guess}`).toBeGreaterThanOrEqual(8 - 1e-9);
    }
  });
});
