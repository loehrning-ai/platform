import { statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { runningHits } from "./demo-cases/ki-prognosen-einschaetzen/derive";
import { KIT_COSTS, kitCheck } from "./demo-cases/ki-prognosen-einschaetzen/kit";
import { getWorkshopBySlug } from "./workshops";
import { FORECASTING_KIT } from "./workshops-forecasting-kit";

/** The kit page prints the numbers the demo's check computes from the kit's own files. */
describe("workshop 01 kit block", () => {
  const { check, result } = kitCheck(KIT_COSTS.fehlmenge, KIT_COSTS.restKantine);
  const scored = 50;

  for (const locale of ["de", "en"] as const) {
    const steps = FORECASTING_KIT[locale].steps;

    it(`${locale}: the range counts the kit's hits of ${scored} weeks`, () => {
      const hits = runningHits(check, scored);
      expect(steps[1]?.segments?.map((segment) => segment.value)).toEqual([hits, scored - hits]);
    });

    it(`${locale}: the planning number is the forecast plus the cost buffer`, () => {
      const next = result.naechste;
      expect(next?.planzahl).toBeDefined();
      const line = steps[2]?.line;
      expect(line?.result).toBe(String(next?.planzahl));
      expect(line?.text).toBe(`${next?.prognose} + ${(next?.planzahl ?? 0) - (next?.prognose ?? 0)}`);
    });

    it(`${locale}: the rule frees the kit's weeks of 52`, () => {
      expect(steps[3]?.segments?.map((segment) => segment.value)).toEqual([
        result.regel_frei,
        52 - (result.regel_frei ?? 0),
      ]);
    });
  }

  it("labels the zip with its measured size in both locales", () => {
    const size = statSync(resolve(__dirname, "../../public/workshops/ki-prognosen-einschaetzen/forecast-check.zip")).size;
    for (const locale of ["de", "en"] as const) {
      const kit = getWorkshopBySlug("ki-prognosen-einschaetzen", locale)?.materials.find((m) => m.role === "kit");
      expect(kit?.sizeLabel).toBe(`${Math.round(size / 1024)} KB`);
    }
  });
});
