import { describe, expect, it } from "vitest";
import { COPY } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import {
  growth,
  growthWith,
  meanQty,
  recordsOf,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import {
  INITIAL_STATE,
  type DemoState,
} from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/demo-state";
import { captionFor } from "./captions";
import { formatter } from "./fmt";

const caption = (
  locale: "de" | "en",
  beat: Parameters<typeof captionFor>[2],
  patch: Partial<DemoState>,
) => {
  const pack = COPY[locale];
  return captionFor(
    pack,
    formatter(pack),
    beat,
    { ...INITIAL_STATE, ...patch },
    "guided",
    0,
  ).join(" ");
};

describe("W02 captions say what the kit computes", () => {
  it("per week, the caption gives the kit's −2,1 % and never a figure the kit does not have", () => {
    expect(growth("week")).toBeCloseTo(-0.021, 3);
    expect(caption("de", "zeitraum", { period: "week" })).toContain("2,1 %");
    expect(caption("en", "zeitraum", { period: "week" })).toContain("2.1 %");
  });

  it("per week without the week from 30 September, it names both figures and says which one is the kit's", () => {
    const text = caption("de", "zeitraum", {
      period: "week",
      septemberEnds: "sep29",
    });
    const without = Math.abs(growthWith("sep29", "week") * 100)
      .toFixed(1)
      .replace(".", ",");
    expect(text).toContain(`${without} %`);
    expect(text).toContain("2,1 %");
    expect(text).toContain("Das Kit zählt diese Woche zum September");
  });

  it("affected units: says a record affected more units on average, with both averages, never that every record did", () => {
    expect(meanQty("sep")).toBeGreaterThan(meanQty("aug"));
    const text = caption("de", "zaehlen", {
      counter: "affected",
      visited: ["records", "affected"],
      countEvent: "counterNew",
    });
    expect(text).toContain("im Schnitt mehr Stück");
    expect(text).toContain(String(Math.round(meanQty("sep"))));
    expect(text).toContain(String(Math.round(meanQty("aug"))));
    expect(text).not.toMatch(/jede (Meldung )?betraf/);
  });

  it("all three counters: the records of both months, not of September only", () => {
    const total = recordsOf("aug").length + recordsOf("sep").length;
    const text = caption("de", "zaehlen", {
      counter: "scrapped",
      visited: ["records", "affected", "scrapped"],
      countEvent: "counterNew",
    });
    expect(text).toContain(
      `dieselben ${total} Meldungen aus August und September`,
    );
  });
});
