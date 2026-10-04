/**
 * EU AI Act course regression guards. The course runs on the lesson engine
 * (five modules, ten lessons); these checks keep the legally sensitive
 * statements, the landing scope and the certificate wording from silently
 * regressing. Authoring-contract and DE/EN parity checks live in
 * src/lib/course/eu-ai-act-engine-content.test.ts.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLegalClaim } from "../legal-registry";

const CONTENT_DIR = join(process.cwd(), "content/eu-ai-act-kurs");
const COURSE_DIR = join(process.cwd(), "src");

const MODULE_FILES = readdirSync(CONTENT_DIR)
  .filter((name) => /^block-\d-.*-lessons\.json$/.test(name))
  .sort();

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(join(CONTENT_DIR, relativePath), "utf-8"));
}

function readFile(relativePath: string): string {
  return readFileSync(join(COURSE_DIR, relativePath), "utf-8");
}

function moduleText(locale: "de" | "en"): string {
  return MODULE_FILES.map((file) =>
    readFileSync(join(CONTENT_DIR, locale === "en" ? "en" : "", file), "utf-8"),
  ).join("\n");
}

describe("EU AI Act module files", () => {
  it("ships exactly five engine module files in both locales", () => {
    expect(MODULE_FILES).toEqual([
      "block-1-geltung-lessons.json",
      "block-2-risiko-lessons.json",
      "block-3-pflichten-lessons.json",
      "block-4-aufsicht-lessons.json",
      "block-5-umsetzen-lessons.json",
    ]);
    expect(
      readdirSync(join(CONTENT_DIR, "en"))
        .filter((name) => name.endsWith("-lessons.json"))
        .sort(),
    ).toEqual(MODULE_FILES);
  });

  it("keeps sanctions dating honest: no 'enforceable since August 2025' shortcut", () => {
    const raw = moduleText("de");
    expect(raw).not.toContain("August 2025 scharf");
    expect(raw).not.toContain("scharf seit August 2025");
    expect(raw).not.toContain("Seit August 2025 durchsetzbar");
  });

  it("keeps the GPAI Code of Practice as a commitment, never a presumption of conformity", () => {
    const raw = moduleText("de");
    expect(raw).not.toContain("genießen eine Konformitätsvermutung");
    expect(raw).toContain("Zusage, kein Konformitätsnachweis");
    expect(moduleText("en")).toContain("a commitment, not proof of conformity");
  });

  it("dates the German implementing act from the legal registry", () => {
    const kiMig = getLegalClaim("de-ki-mig-in-force-2026-07-29");
    expect(kiMig?.status).toBe("binding");
    const raw = moduleText("de");
    expect(raw).toContain(kiMig?.displayDateDE ?? "29. Juli 2026");
    expect(raw).toContain("Bundesnetzagentur");
    expect(raw).not.toContain("nicht amtlich verifiziert");
  });

  it("teaches the private carve-out (Art. 2 Abs. 10) and the output trigger (Art. 2 Abs. 1 lit. c)", () => {
    const raw = moduleText("de");
    expect(raw).toContain("Art. 2 Abs. 10");
    expect(raw).toContain("Art. 2 Abs. 1 lit. c");
    expect(moduleText("en")).toContain("Art. 2(10)");
  });

  it("keeps the CV case free of personal brand and invented guarantees", () => {
    for (const locale of ["de", "en"] as const) {
      const raw = moduleText(locale);
      expect(raw).not.toContain("Tim Löhr sieht");
      expect(raw).not.toContain("Tim Loehr");
      expect(raw).not.toContain("Beratungsprodukte verkaufen");
    }
  });
});

describe("EU AI Act final quiz", () => {
  it("has 20 questions and matches the configured count", () => {
    const questions = readJson("quiz/questions.json") as unknown[];
    const english = readJson("en/quiz/questions.json") as unknown[];
    expect(questions).toHaveLength(20);
    expect(english).toHaveLength(20);
    const configRaw = readFile("lib/course/config.ts");
    const match = configRaw.match(
      /EU_AI_ACT_KURS_CONFIG[\s\S]*?workshopQuizQuestionCount:\s*(\d+)/,
    );
    expect(match ? Number.parseInt(match[1], 10) : null).toBe(questions.length);
  });

  it("covers role, timeline, risk class, Art. 50, fines and GPAI", () => {
    const text = (readJson("quiz/questions.json") as Array<{ questionText: string }>)
      .map((question) => question.questionText)
      .join("\n");
    for (const needle of ["Rolle", "Art. 4", "Anhang III", "Art. 50", "Art. 99", "Art. 53", "Art. 6 Abs. 3"]) {
      expect(text, needle).toContain(needle);
    }
  });
});

describe("certificate wording", () => {
  it("certificate pages never offer a 'Zertifikat'", () => {
    expect(readFile("components/course/kurs/certificate-page.tsx")).not.toContain(
      "Zertifikat herunterladen",
    );
    expect(readFile("components/course/kurs/workshop-quiz-page.tsx")).not.toContain(
      "Zertifikat herunterladen",
    );
  });

  it("EU AI Act config says 'Teilnahme bestätigt' and cites the amended regulation", () => {
    const config = readFile("lib/course/config.ts");
    const euSection = config.slice(
      config.indexOf("EU_AI_ACT_KURS_CONFIG"),
      config.indexOf("AI_NATIVE_CONFIG"),
    );
    expect(euSection).toContain("Teilnahme bestätigt");
    expect(euSection).toContain("Verordnung (EU) 2026/1744");
  });
});

describe("landing page", () => {
  it("states the course size and workload that the lessons add up to", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain('courseWorkload: "PT1H"');
    expect(content).not.toContain("PT1H50M");
    expect(content).toContain("10 Lektionen mit Übung");
    expect(content).toContain("Abschlussquiz mit 20 Fragen");
    expect(readFile("app/eu-ai-act-kurs/kurs/layout.tsx")).toContain('courseWorkload: "PT1H"');
  });

  it("states concrete, hands-on outcomes and the two-track audience", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain("EU AI Act Kurs: Rollen, Risiken und Pflichten");
    expect(content).toContain("Einen Anwendungsfall in sechs Fragen einer Risikoklasse zuordnen");
    expect(content).toContain("Module 1 und 2");
    expect(content).toContain("Ab Modul 3");
    expect(content).toContain("Ohne Programmier- oder Jura-Vorkenntnisse");
  });

  it("states that participation or its record does not prove Article 4 compliance", () => {
    const content = readFile("app/eu-ai-act-kurs/page.tsx");
    expect(content).toContain(
      "Teilnahme oder Teilnahmenachweis allein belegen weder Kompetenz noch die Erfüllung von Artikel 4",
    );
    expect(content).toContain(
      "Participation or a completion record alone establishes neither competence nor compliance with Article 4",
    );
    expect(content).not.toContain("Compliance-Roadmap 2026-2028");
  });
});
