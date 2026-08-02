/**
 * EU AI Act course review Verification tests for EU AI Act course perfection.
 * Asserts all P0/P1 fixes are intact and cannot silently regress.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CONTENT_DIR = join(
  process.cwd(),
  "content/eu-ai-act-kurs"
);

const COURSE_DIR = join(process.cwd(), "src");

function readJson(relativePath: string): unknown {
  const fullPath = join(CONTENT_DIR, relativePath);
  return JSON.parse(readFileSync(fullPath, "utf-8"));
}

function readFile(relativePath: string): string {
  const fullPath = join(COURSE_DIR, relativePath);
  return readFileSync(fullPath, "utf-8");
}

// ─── Sanctions date fix ─────────────────────────────────────────────

describe("block-1 sanctions date", () => {
  it("does NOT contain 'August 2025 scharf' or 'scharf seit August 2025'", () => {
    const raw = readFileSync(join(CONTENT_DIR, "block-1-grundlagen-lessons.json"), "utf-8");
    expect(raw).not.toContain("August 2025 scharf");
    expect(raw).not.toContain("scharf seit August 2025");
    expect(raw).not.toContain("Seit August 2025 durchsetzbar");
  });

  it("block-1 L4 s3 title is 'Wann greift die Durchsetzung?'", () => {
    const data = readJson("block-1-grundlagen-lessons.json") as { lessons: { sections: { title: string }[] }[] };
    const s3 = data.lessons[3]?.sections[2];
    expect(s3?.title).toBe("Wann greift die Durchsetzung?");
  });

  it("block-1 L4 s3 keyTakeaway reflects the amended Article 4 timeline", () => {
    const data = readJson("block-1-grundlagen-lessons.json") as {
      lessons: { sections: { keyTakeaway?: string }[] }[]
    };
    const s3 = data.lessons[3]?.sections[2];
    expect(s3?.keyTakeaway).toContain("Februar 2025");
    expect(s3?.keyTakeaway).toContain("27. Juli 2026");
    expect(s3?.keyTakeaway).toContain("Anfang August 2026");
  });

  it("Dec 2027 and Aug 2028 dates in block-1 carry pending qualifier", () => {
    const raw = readFileSync(join(CONTENT_DIR, "block-1-grundlagen-lessons.json"), "utf-8");
    // If file contains these dates, it must also contain the qualifier
    if (raw.includes("2027") && raw.includes("2028")) {
      expect(raw).toMatch(/beschlossen|noch nicht veröffentlicht|noch nicht in Kraft/);
    }
  });
});

// ─── Quiz q_w02 claimId ─────────────────────────────────────────────

describe("quiz questions integrity", () => {
  it("q_w02 has claimId set to ai-literacy-supervision-2026-08-02", () => {
    const questions = readJson("quiz/questions.json") as Array<{ id: string; claimId?: string }>;
    const q = questions.find((q) => q.id === "q_w02");
    expect(q?.claimId).toBe("ai-literacy-supervision-2026-08-02");
  });

  it("q_w17 explanation does NOT use 'Konformitätsvermutung' as what CoP signatories enjoy", () => {
    const questions = readJson("quiz/questions.json") as Array<{ id: string; explanation?: string }>;
    const q = questions.find((q) => q.id === "q_w17");
    expect(q?.explanation).not.toContain("gilt als Weg zur Vermutung der Konformität");
    // Must contain the corrected formulation
    expect(q?.explanation).toContain("Mittel zum Nachweis");
  });
});

// ─── Duration fix ────────────────────────────────────────────────────

describe("landing page duration", () => {
  it("eu-ai-act-kurs page.tsx does NOT contain PT3H", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).not.toContain("PT3H");
  });

  it("eu-ai-act-kurs page.tsx does NOT contain '3 Stunden' or 'Drei Stunden'", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).not.toContain("3 Stunden");
    expect(content).not.toContain("Drei Stunden");
  });

  it("kurs/layout.tsx does NOT contain PT3H", () => {
    const content = readFile("app/eu-ai-act-kurs/kurs/layout.tsx");
    expect(content).not.toContain("PT3H");
  });

  it("landing page uses PT1H50M (110 min = lesson sums)", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain("PT1H50M");
  });

  it("landing page mentions ca. 1 Std. 50 Min. or 110 min", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    const hasTimeRef = content.includes("1 Std. 50 Min") || content.includes("110 min") || content.includes("16–20 Minuten");
    expect(hasTimeRef).toBe(true);
  });
});

// ─── GPAI Konformitätsvermutung fix ─────────────────────────────────

describe("GPAI Code wording", () => {
  it("block-4 does NOT contain 'genießen eine Konformitätsvermutung'", () => {
    const raw = readFileSync(join(CONTENT_DIR, "block-4-gpai-transparenz-lessons.json"), "utf-8");
    expect(raw).not.toContain("genießen eine Konformitätsvermutung");
    expect(raw).not.toContain("gilt als Weg zur Vermutung der Konformität");
  });

  it("block-4 contains the corrected 'Mittel zum Nachweis' formulation", () => {
    const raw = readFileSync(join(CONTENT_DIR, "block-4-gpai-transparenz-lessons.json"), "utf-8");
    expect(raw).toContain("Mittel zum Nachweis");
  });
});

// ─── Personal-brand removal ─────────────────────────────────────────

describe("personal brand removal", () => {
  const courseFiles = [
    "block-1-grundlagen-lessons.json",
    "block-2-risikoklassen-lessons.json",
    "block-3-hochrisiko-lessons.json",
    "block-4-gpai-transparenz-lessons.json",
    "block-5-governance-lessons.json",
    "block-6-praxis-lessons.json",
  ];

  for (const file of courseFiles) {
    it(`${file} does NOT contain 'Tim Löhr sieht' or 'Tim Loehr'`, () => {
      const raw = readFileSync(join(CONTENT_DIR, file), "utf-8");
      expect(raw).not.toContain("Tim Löhr sieht");
      expect(raw).not.toContain("Tim Loehr");
    });
  }

  it("block-6 does NOT contain anti-consultancy dig '30.000 Euro' or 'Beratungsprodukte verkaufen'", () => {
    const raw = readFileSync(join(CONTENT_DIR, "block-6-praxis-lessons.json"), "utf-8");
    expect(raw).not.toContain("30.000 Euro");
    expect(raw).not.toContain("Beratungsprodukte verkaufen");
  });
});

// ─── Template count fix ─────────────────────────────────────────────

describe("template count 12→8 fix", () => {
  it("block-6 does NOT contain 'zwölf' as template count", () => {
    const raw = readFileSync(join(CONTENT_DIR, "block-6-praxis-lessons.json"), "utf-8");
    expect(raw).not.toContain("zwölf lebende Dokumente");
    expect(raw).not.toContain("zwölf Vorlagen");
    // Numerals are fine in other contexts, but not as template count
    expect(raw).not.toContain("brauchen zwölf");
  });

  it("block-6 L3 s1 keyTakeaway references '8' or 'acht' (8 honest templates)", () => {
    const data = readJson("block-6-praxis-lessons.json") as {
      lessons: { sections: { keyTakeaway?: string }[] }[]
    };
    const s1 = data.lessons[2]?.sections[0];
    const kt = s1?.keyTakeaway?.toLowerCase() ?? "";
    expect(kt.includes("acht") || kt.includes("8 ")).toBe(true);
  });
});

// ─── Art. 50 consumer rights ────────────────────────────────────────

describe("Art. 50 consumer rights section", () => {
  it("block-2 L3 has 4 sections (consumer-rights section added)", () => {
    const data = readJson("block-2-risikoklassen-lessons.json") as {
      lessons: { sections: unknown[] }[]
    };
    const l3sections = data.lessons[2]?.sections;
    expect(l3sections?.length).toBeGreaterThanOrEqual(4);
  });

  it("block-2 L3 s4 keyTakeaway distinguishes the Article 50 duties", () => {
    const data = readJson("block-2-risikoklassen-lessons.json") as {
      lessons: { sections: { keyTakeaway?: string }[] }[]
    };
    const s4 = data.lessons[2]?.sections[3];
    expect(s4?.keyTakeaway).toContain("Art. 50");
    expect(s4?.keyTakeaway).toContain("Technische Markierung");
  });

  it("block-2 L3 Art.50 section cites Code of Practice 2026", () => {
    const data = readJson("block-2-risikoklassen-lessons.json") as {
      lessons: { sections: { content?: string }[] }[]
    };
    const s4 = data.lessons[2]?.sections[3];
    expect(s4?.content).toContain("10. Juni 2026");
    expect(s4?.content).toContain("Bundesnetzagentur");
    expect(s4?.content).toContain("nicht amtlich verifiziert");
  });
});

// ─── Art. 2(10) private carve-out ──────────────────────────────────

describe("Art. 2(10) private carve-out", () => {
  it("block-1 L2 has named section for Art. 2 Abs. 10 private carve-out", () => {
    const data = readJson("block-1-grundlagen-lessons.json") as {
      lessons: { sections: { title: string; keyTakeaway?: string }[] }[]
    };
    const l2sections = data.lessons[1]?.sections;
    const carveOutSection = l2sections?.find((s) => s.title.includes("Art. 2 Abs. 10") || s.title.includes("private Ausnahme"));
    expect(carveOutSection).toBeDefined();
    expect(carveOutSection?.keyTakeaway).toContain("rein privat");
  });
});

// ─── Quiz count consistency ────────────────────────────────────────

describe("quiz count consistency", () => {
  it("EU AI Act quiz file has exactly 27 questions", () => {
    const questions = readJson("quiz/questions.json") as unknown[];
    expect(questions.length).toBe(27);
  });

  it("EU_AI_ACT_KURS_CONFIG.workshopQuizQuestionCount equals quiz array length (27)", () => {
    // Read config file directly to check value
    const configRaw = readFile("lib/course/config.ts");
    // Extract workshopQuizQuestionCount from EU AI Act config section
    const match = configRaw.match(
      /EU_AI_ACT_KURS_CONFIG[\s\S]*?workshopQuizQuestionCount:\s*(\d+)/,
    );
    const configCount = match ? parseInt(match[1], 10) : null;
    const questions = readJson("quiz/questions.json") as unknown[];
    expect(configCount).toBe(questions.length);
    expect(configCount).toBe(27);
  });

  it("quiz has at least 2 citizen-perspective questions (Art.50 and Art.2(10))", () => {
    const questions = readJson("quiz/questions.json") as Array<{ id: string }>;
    const citizenQuestions = questions.filter((q) => ["q_w26", "q_w27"].includes(q.id));
    expect(citizenQuestions.length).toBe(2);
  });
});

// ─── Certificate wording ───────────────────────────────────────────

describe("certificate wording", () => {
  it("certificate-page.tsx does NOT contain 'Zertifikat herunterladen'", () => {
    const content = readFile("components/course/kurs/certificate-page.tsx");
    expect(content).not.toContain("Zertifikat herunterladen");
  });

  it("workshop-quiz-page.tsx does NOT contain 'Zertifikat herunterladen'", () => {
    const content = readFile("components/course/kurs/workshop-quiz-page.tsx");
    expect(content).not.toContain("Zertifikat herunterladen");
  });

  it("EU AI Act config certificateSubtitle says 'Teilnahme bestätigt' and cites Commission Q&A", () => {
    const config = readFile("lib/course/config.ts");
    // Find the EU_AI_ACT_KURS_CONFIG section
    const euSection = config.slice(config.indexOf("EU_AI_ACT_KURS_CONFIG"), config.indexOf("AI_NATIVE_CONFIG"));
    expect(euSection).toContain("Teilnahme bestätigt");
    expect(euSection).toContain("FAQ KI-Kompetenz");
  });
});

// ─── General: no 'Sie haben den KI-Führerschein gemacht' on landing ──────────

describe("landing page reframe", () => {
  it("landing page does NOT contain B2B exclusion 'Verantwortliche statt Anwender'", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).not.toContain("Verantwortliche statt Anwender");
  });

  it("landing page does NOT contain 'Sie haben den KI-Führerschein gemacht'", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).not.toContain("Sie haben den KI-Führerschein gemacht");
  });

  it("landing page title is 'EU AI Act: Was du wissen musst'", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain("EU AI Act: Was du wissen musst");
  });

  it("landing page has 'Was du nach diesem Kurs kannst' section", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain("Was du nach diesem Kurs kannst");
  });

  it("landing page has two-track callout", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain("Blöcke 1");
    expect(content).toContain("Blöcke 3");
  });

  it("landing page has disclaimer about Art.4 not requiring a certificate", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain("FAQ KI-Kompetenz");
  });

  it("landing page does NOT contain 'Compliance-Roadmap 2026-2028'", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).not.toContain("Compliance-Roadmap 2026-2028");
  });
});
