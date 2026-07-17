import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  demos,
  DEMO_CATEGORIES,
  DEMO_LEVELS,
  DEMO_LEVEL_LABELS,
  filterDemos,
  getAllCategories,
  getAllIndustries,
  getAllLevels,
  getDemoBySlug,
  getDemosByCategory,
  getDemosByIndustry,
  getDemosByLevel,
  getNextDemo,
} from "./demos";

describe("demos catalog", () => {
  it("contains exactly 12 demos", () => {
    expect(demos.length).toBe(12);
  });

  it("has unique slugs", () => {
    const slugs = demos.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique numeric ids", () => {
    const ns = demos.map((d) => d.n);
    expect(new Set(ns).size).toBe(ns.length);
  });

  it("numeric ids are sequential and zero-padded", () => {
    demos.forEach((d, i) => {
      expect(d.n).toBe(String(i + 1).padStart(2, "0"));
    });
  });

  it("every demo has at least one industry", () => {
    for (const d of demos) expect(d.industries.length).toBeGreaterThanOrEqual(1);
  });

  it("every demo uses a known category", () => {
    for (const d of demos) expect(DEMO_CATEGORIES).toContain(d.category);
  });

  it("every demo uses a known level", () => {
    for (const d of demos) expect(DEMO_LEVELS).toContain(d.level);
  });
});

describe("getDemoBySlug", () => {
  it("returns the demo for a known slug", () => {
    const d = getDemoBySlug("excel");
    expect(d?.id).toBe("excel");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getDemoBySlug("does-not-exist")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(getDemoBySlug("")).toBeUndefined();
  });
});

describe("getDemosByCategory", () => {
  it("filters by category", () => {
    const rag = getDemosByCategory("RAG");
    expect(rag.length).toBeGreaterThan(0);
    for (const d of rag) expect(d.category).toBe("RAG");
  });

  it("returns all demos for Alle", () => {
    expect(getDemosByCategory("Alle").length).toBe(demos.length);
  });

  it("returns all demos for empty string", () => {
    expect(getDemosByCategory("").length).toBe(demos.length);
  });

  it("returns empty array for unknown category", () => {
    expect(getDemosByCategory("FooBar").length).toBe(0);
  });
});

describe("getDemosByLevel", () => {
  it("filters by level", () => {
    const fortg = getDemosByLevel("fortg");
    for (const d of fortg) expect(d.level).toBe("fortg");
  });

  it("returns all for 'alle'", () => {
    expect(getDemosByLevel("alle").length).toBe(demos.length);
  });

  it("returns empty for unknown level", () => {
    expect(getDemosByLevel("super-pro").length).toBe(0);
  });
});

describe("getDemosByIndustry", () => {
  it("filters by industry", () => {
    const result = getDemosByIndustry("Maschinenbau");
    expect(result.length).toBeGreaterThan(0);
    for (const d of result) expect(d.industries).toContain("Maschinenbau");
  });

  it("returns all demos for empty industry", () => {
    expect(getDemosByIndustry("").length).toBe(demos.length);
  });

  it("returns empty for unknown industry", () => {
    expect(getDemosByIndustry("DoesNotExist").length).toBe(0);
  });
});

describe("filterDemos (combined filters)", () => {
  it("returns all demos with no filter", () => {
    expect(filterDemos({}).length).toBe(demos.length);
  });

  it("AND-combines category + level", () => {
    const result = filterDemos({ category: "Grundlagen", level: "einstieg" });
    expect(result.length).toBeGreaterThan(0);
    for (const d of result) {
      expect(d.category).toBe("Grundlagen");
      expect(d.level).toBe("einstieg");
    }
  });

  it("returns empty when filters cannot all match", () => {
    const result = filterDemos({ category: "RAG", level: "einstieg" });
    expect(result.length).toBe(0);
  });

  it("industry intersects with category", () => {
    const result = filterDemos({
      category: "Automation",
      industry: "Maschinenbau",
    });
    for (const d of result) {
      expect(d.category).toBe("Automation");
      expect(d.industries).toContain("Maschinenbau");
    }
  });

  it("ignores 'Alle' / 'alle' sentinels", () => {
    expect(filterDemos({ category: "Alle", level: "alle" }).length).toBe(
      demos.length,
    );
  });
});

describe("getNextDemo", () => {
  it("returns the next demo in array order", () => {
    const first = demos[0];
    const next = getNextDemo(first);
    expect(next.id).toBe(demos[1].id);
  });

  it("wraps around at the last demo", () => {
    const last = demos[demos.length - 1];
    const next = getNextDemo(last);
    expect(next.id).toBe(demos[0].id);
  });

  it("returns first demo for a demo not in the array", () => {
    const orphan = { ...demos[0], id: "ghost" };
    expect(getNextDemo(orphan).id).toBe(demos[0].id);
  });
});

describe("helpers", () => {
  it("getAllCategories returns the expected set", () => {
    expect(getAllCategories()).toEqual(DEMO_CATEGORIES);
  });

  it("getAllLevels returns the expected set", () => {
    expect(getAllLevels()).toEqual(DEMO_LEVELS);
  });

  it("getAllIndustries returns a sorted deduplicated list", () => {
    const industries = getAllIndustries();
    expect(industries.length).toBeGreaterThan(0);
    expect([...industries].sort((a, b) => a.localeCompare(b, "de"))).toEqual(
      industries,
    );
  });

  it("level labels cover every level", () => {
    for (const level of DEMO_LEVELS) {
      expect(DEMO_LEVEL_LABELS[level]).toBeTypeOf("string");
    }
  });
});

// ─── Schema integrity tests (demo-library review ) ─────────────────────────────

describe("demo schema integrity (demo-library review )", () => {
  const VALID_EVIDENCE_MODES = ["synthetic", "rule_based", "recorded_trace", "live_api"] as const;
  const VALID_EXTERNAL_ACTIONS = ["none", "simulated", "review_gated", "real_disabled"] as const;

  it("every demo has a valid evidenceMode", () => {
    for (const d of demos) {
      expect(VALID_EVIDENCE_MODES).toContain(d.evidenceMode);
    }
  });

  it("every demo has a valid externalActionMode", () => {
    for (const d of demos) {
      expect(VALID_EXTERNAL_ACTIONS).toContain(d.externalActionMode);
    }
  });

  it("every demo has illustrative: true", () => {
    for (const d of demos) {
      expect(d.illustrative, `${d.slug} must have illustrative: true`).toBe(true);
    }
  });

  it("every demo has a courseSlug", () => {
    for (const d of demos) {
      expect(d.courseSlug, `${d.slug} must have courseSlug`).toBeTruthy();
    }
  });

  it("every demo has a non-empty syntheticDataLabel", () => {
    for (const d of demos) {
      expect(
        d.syntheticDataLabel.length,
        `${d.slug} must have non-empty syntheticDataLabel`,
      ).toBeGreaterThan(0);
    }
  });

  it("no demo tags array contains 'pgvector' (post-stage-4 regression guard)", () => {
    for (const d of demos) {
      expect(
        d.tags,
        `${d.slug} tags must not contain 'pgvector'`,
      ).not.toContain("pgvector");
    }
  });

  it("DEMO_CATEGORIES does not contain 'Einstieg' (post-stage-9 regression guard)", () => {
    expect(DEMO_CATEGORIES).not.toContain("Einstieg");
  });
});

// ─── Behaviour tests (demo-library review ) ────────────────────────────────────

describe("DemoCtaTarget and dead-code guards (demo-library review )", () => {
  it("DemoCtaTarget does not include 'ki-check' (post-stage-1 regression guard)", async () => {
    const analyticsPath = path.resolve(__dirname, "../lib/analytics.ts");
    const src = fs.readFileSync(analyticsPath, "utf-8");
    expect(src, "analytics.ts must not expose 'ki-check' as DemoCtaTarget").not.toContain('"ki-check"');
  });

  it("DemoCtaTarget does not include 'kontakt' (post-stage-1 regression guard)", async () => {
    const analyticsPath = path.resolve(__dirname, "../lib/analytics.ts");
    const src = fs.readFileSync(analyticsPath, "utf-8");
    expect(src, "analytics.ts must not expose 'kontakt' as DemoCtaTarget").not.toContain('"kontakt"');
  });

  it("process-demos.ts has been deleted (post-stage-1 regression guard)", () => {
    const processPath = path.resolve(__dirname, "../lib/process-demos.ts");
    expect(fs.existsSync(processPath), "process-demos.ts must not exist").toBe(false);
  });
});

// ─── Claim-lint: canonical demo components (demo-library review ) ──────────────

function readDemoFiles(dir: string): string {
  const root = path.resolve(__dirname, dir);
  if (!fs.existsSync(root)) return "";
  const files = fs.readdirSync(root).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  return files
    .map((f) => fs.readFileSync(path.join(root, f), "utf-8"))
    .join("\n");
}

describe("claim-lint: canonical demos (src/components/demos/)", () => {
  let src: string;
  before: {
    src = readDemoFiles("../../components/demos");
  }

  it("'tim@loehrning.ai' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("tim@loehrning.ai");
  });

  it("'Tim Löhr · loehrning.ai' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("Tim Löhr · loehrning.ai");
  });

  it("'Dr. Löhr' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("Dr. Löhr");
  });

  it("'pgvector' is absent from JSX (comments allowed, but none expected)", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("pgvector");
  });

  it("'Conf 94' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("Conf 94");
  });

  it("'conf. 94' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("conf. 94");
  });

  it("'40ms' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("40ms");
  });

  it("'Live-Formeln' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("Live-Formeln");
  });

  it("'Minute für Minute' is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("Minute für Minute");
  });

  it("'1.284' (dot-variant pgvector doc count) is absent", () => {
    const canonical = readDemoFiles("../../components/demos");
    expect(canonical).not.toContain("1.284");
  });
});

describe("claim-lint: legacy ai-native demos (src/components/ai-native/demos/)", () => {
  it("'1,284' (comma-variant pgvector doc count) is absent", () => {
    const legacy = readDemoFiles("../../components/ai-native/demos");
    expect(legacy).not.toContain("1,284");
  });

  it("'pgvector' is absent", () => {
    const legacy = readDemoFiles("../../components/ai-native/demos");
    expect(legacy).not.toContain("pgvector");
  });

  it("'Ihr Netzwerk' (Sie-register violation) is absent", () => {
    const legacy = readDemoFiles("../../components/ai-native/demos");
    expect(legacy).not.toContain("Ihr Netzwerk");
  });

  it("'40ms' is absent", () => {
    const legacy = readDemoFiles("../../components/ai-native/demos");
    expect(legacy).not.toContain("40ms");
  });

  it("'Live-Formeln' is absent", () => {
    const legacy = readDemoFiles("../../components/ai-native/demos");
    expect(legacy).not.toContain("Live-Formeln");
  });
});
