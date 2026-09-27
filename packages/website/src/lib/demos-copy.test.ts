/**
 * demos-copy.test.ts (regression coverage)
 *
 * Exercises the demo-narrative copy layer in `@/lib/demos-copy`: the
 * `getDemoCopy` lookup and the content invariants of the `demoCopy` record.
 *
 * The high-value assertions are cross-checks against the structural
 * `@/lib/demos` metadata (the single source of truth for which demos exist):
 *  - every demo listed in demos.ts must have narrative copy, otherwise the
 *    /demos/[slug] detail page renders an empty body;
 *  - no orphan copy entries point at a slug that is not a real demo;
 *  - every demo names what is invented in one plain sentence, without the old
 *    "Sandbox-Szenario:" prefix that stacked a second disclaimer. That sentence
 *    lives once, in the registry's `syntheticDataLabel` (the "Daten" row).
 */

import { describe, expect, it } from "vitest";
import { demoCopy, getDemoCopy } from "@/lib/demos-copy";
import { demos, getDemoBySlug } from "@/lib/demos";
import { getDemoForLocale } from "@/lib/demos-localization";

function dataLabel(slug: string, locale: "de" | "en" = "de"): string {
  return getDemoForLocale(slug, locale)?.syntheticDataLabel ?? "";
}

describe("getDemoCopy", () => {
  it("returns the copy object for a known slug", () => {
    const copy = getDemoCopy("excel");
    expect(copy).toBeDefined();
    // Returns the exact record entry (same reference), not a copy.
    expect(copy).toBe(demoCopy.excel);
    expect(copy?.ogSubtitle).toBe(
      "Formeln, Pivot und Prognose in einer Beispieltabelle prüfen.",
    );
    expect(copy?.why).toContain("Vorwoche");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getDemoCopy("gibt-es-nicht")).toBeUndefined();
  });

  it("returns undefined for an empty slug", () => {
    expect(getDemoCopy("")).toBeUndefined();
  });
});

describe("demoCopy record integrity", () => {
  it("has non-empty why, data label and ogSubtitle for every entry", () => {
    for (const [slug, copy] of Object.entries(demoCopy)) {
      expect(copy.why.trim().length, `${slug}.why`).toBeGreaterThan(0);
      expect(dataLabel(slug).trim().length, `${slug}.syntheticDataLabel`).toBeGreaterThan(0);
      expect(
        copy.ogSubtitle.trim().length,
        `${slug}.ogSubtitle`,
      ).toBeGreaterThan(0);
    }
  });

  it("states what is invented in one sentence, without a stacked prefix", () => {
    for (const slug of Object.keys(demoCopy)) {
      const label = dataLabel(slug);
      expect(label, `${slug}.syntheticDataLabel`).not.toMatch(/^Sandbox-Szenario/);
      expect(label, `${slug}.syntheticDataLabel`).toMatch(
        /erfunden|fiktiv|angenommen|hypothetisch|vorgegeben|simuliert|Beispiel/i,
      );
      // One sentence: a single terminal full stop.
      expect(label.trim().match(/[.!?](\s|$)/g), `${slug}.syntheticDataLabel`).toHaveLength(1);
    }
  });

  it("opens every why with the case, not with an unsourced rule of thumb", () => {
    for (const locale of ["de", "en"] as const) {
      for (const demo of demos) {
        const why = getDemoCopy(demo.slug, locale)?.why ?? "";
        expect(why, `${locale}:${demo.slug}`).not.toMatch(
          /^(Viele |KI-Projekte scheitern|Governance gehört|Ein LLM ohne|Many |AI projects rarely|Run an LLM)/,
        );
        expect(why, `${locale}:${demo.slug}`).not.toMatch(/Das Praxisbeispiel|[\u2013\u2014]/);
      }
    }
  });

  it("labels seeded figures as fictional assumptions rather than measured proof", () => {
    const figures = ["excel", "word", "agent-pipeline", "fine-tune-playground"];
    for (const slug of figures) {
      expect(dataLabel(slug), slug).toMatch(
        /fiktiv|angenommen|hypothetisch|vorgegeben/i,
      );
    }
    expect(dataLabel("agent-pipeline")).not.toContain(
      "von 3 Tagen auf 20 Minuten",
    );
    expect(dataLabel("fine-tune-playground")).toContain(
      "kein Modell",
    );
  });

  it("names only figures the demos actually show", () => {
    // Earlier proof lines named figures no engine renders (42 roles, 4.2 h,
    // 180 drafts, 2,400 questions, a 38-point gap); a reader could not find
    // them anywhere.
    for (const locale of ["de", "en"] as const) {
      for (const slug of Object.keys(demoCopy)) {
        const proof = dataLabel(slug, locale);
        expect(proof, `${locale}:${slug}`).not.toMatch(
          /42 (Rollen|controlling)|4[,.]2 (Stunden|hours)|\b180\b|2[.,]400|\b38\b/,
        );
      }
    }
  });

  it("promises no budget alarm or limit the cost-and-drift demo lacks", () => {
    for (const locale of ["de", "en"] as const) {
      const copy = getDemoCopy("cost-drift-observability", locale);
      const all = `${copy?.why} ${dataLabel("cost-drift-observability", locale)} ${copy?.stop} ${copy?.ogSubtitle}`;
      expect(all, locale).not.toMatch(/Budget-Alarm|budget alert|Limit\b|limit\b/i);
    }
  });
});

describe("demoCopy <-> demos coverage", () => {
  it("provides copy for every demo declared in demos.ts", () => {
    for (const demo of demos) {
      expect(
        getDemoCopy(demo.slug),
        `missing demo copy for slug "${demo.slug}"`,
      ).toBeDefined();
    }
  });

  it("has no orphan copy entry pointing at a non-existent demo", () => {
    for (const slug of Object.keys(demoCopy)) {
      expect(
        getDemoBySlug(slug),
        `demoCopy has orphan entry "${slug}" with no matching demo`,
      ).toBeDefined();
    }
  });

  it("copy key set exactly matches the demo slug set", () => {
    const copySlugs = Object.keys(demoCopy).sort();
    const demoSlugs = demos.map((d) => d.slug).sort();
    expect(copySlugs).toEqual(demoSlugs);
  });
});
