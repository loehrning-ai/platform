/**
 * AI-Native course integrity regression suite (AI-native course implementation).
 *
 * Tests:
 * 1. Capstone wording regression — no "Peer-Feedback" or "Peer-Review" in quiz JSON
 * 2. DSGVO-sicher regression — no unqualified binary "DSGVO-sicher" in correct-answer options
 * 3. Commercial q24 removal — no pricing/cost questions in quiz
 * 4. Urgency ticker absence — component file deleted, not imported in page.tsx
 * 5. Grade-exercise fallback — isGradeEnabled() returns false when env var is absent
 * 6. Bundle copy check — no ghost artifact-count strings in content.ts
 */

import { describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();

function readText(relativePath: string): string {
  return readFileSync(resolve(cwd, relativePath), "utf-8");
}

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  answerOptions: AnswerOption[];
  explanation: string;
}

function loadAiNativeQuiz(): QuizQuestion[] {
  const raw = readText("content/ai-native/quiz/questions.json");
  return JSON.parse(raw) as QuizQuestion[];
}

// ─── 1. Capstone wording regression ─────────────────────────────────────────

describe("Capstone wording regression", () => {
  it('quiz JSON contains no "Peer-Feedback" or "Peer-Review"', () => {
    const questions = loadAiNativeQuiz();
    for (const q of questions) {
      const full = JSON.stringify(q);
      expect(full).not.toMatch(/Peer-Feedback|Peer-Review/);
    }
  });

  it("modul-4-lessons.json contains no Peer-Feedback or Peer-Review", () => {
    const text = readText("content/ai-native/modul-4-lessons.json");
    expect(text).not.toMatch(/Peer-Feedback|Peer-Review/);
  });

  it("content.ts FAQ contains no 'echte Review' wording", () => {
    const text = readText("src/lib/ai-native/content.ts");
    expect(text).not.toContain("echte Review");
    expect(text).not.toContain("Peer-Feedback");
  });
});

// ─── 2. DSGVO-sicher regression ─────────────────────────────────────────────

describe("DSGVO-sicher claim regression", () => {
  it("no correct-answer option text claims DSGVO-sicher as unqualified binary fact", () => {
    const questions = loadAiNativeQuiz();
    for (const q of questions) {
      for (const o of q.answerOptions) {
        if (o.isCorrect) {
          // "DSGVO-sicher" as a standalone claim in the option text is forbidden.
          // Qualified forms like "datenschutzkonform nach DSGVO" are acceptable.
          // We match "DSGVO-sicher" not followed immediately by a parenthetical caveat.
          expect(o.text).not.toMatch(/DSGVO-sicher(?!\s*\()/);
        }
      }
    }
  });
});

// ─── 3. Commercial q24 removal ───────────────────────────────────────────────

describe("No commercial/pricing questions in quiz", () => {
  it("no question text, option text, or explanation references platform pricing", () => {
    const questions = loadAiNativeQuiz();
    for (const q of questions) {
      const full = JSON.stringify(q);
      expect(full).not.toMatch(/komplett kostenlos im Lernkonto/);
      // Check for standalone "EUR" followed by numbers (pricing claims)
      expect(full).not.toMatch(/\bEUR\s*\d+/);
    }
  });
});

// ─── 4. Urgency ticker absence ────────────────────────────────────────────────

describe("Urgency ticker removed", () => {
  it("urgency-ticker.tsx file does not exist", () => {
    const tickerPath = resolve(
      cwd,
      "src/components/ai-native/urgency-ticker.tsx",
    );
    expect(existsSync(tickerPath)).toBe(false);
  });

  it("ai-native landing page.tsx does not import urgency-ticker", () => {
    const text = readText("src/app/ai-native/page.tsx");
    expect(text).not.toContain("urgency-ticker");
    expect(text).not.toContain("UrgencyTicker");
  });

  it('landing page does not render aria-label="Urgency"', () => {
    const text = readText("src/app/ai-native/page.tsx");
    expect(text).not.toContain('aria-label="Urgency"');
  });
});

// ─── 5. Grade-exercise feature flag ──────────────────────────────────────────

describe("Grade-exercise feature flag", () => {
  it("isGradeEnabled() is controlled by the shared Anthropic practice flag", async () => {
    const saved = process.env.AI_NATIVE_PRACTICE_ENABLED;
    delete process.env.AI_NATIVE_PRACTICE_ENABLED;

    const { isGradeEnabled } = await import(
      "@/app/api/ai-native/grade-exercise/engine"
    );
    expect(isGradeEnabled()).toBe(false);

    vi.stubEnv("AI_NATIVE_PRACTICE_ENABLED", "true");
    vi.stubEnv("ANTHROPIC_API_KEY", "obviously-fake-test-key");
    vi.stubEnv("ANTHROPIC_DPA_CONFIRMED_AT", "2026-07-01");
    vi.stubEnv("ANTHROPIC_RETENTION_DAYS", "30");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("SUPABASE_URL", "https://fake-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "fake-public-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "fake-service-key");
    expect(isGradeEnabled()).toBe(true);

    process.env.AI_NATIVE_PRACTICE_ENABLED = "on";
    expect(isGradeEnabled()).toBe(false);

    vi.unstubAllEnvs();
    if (saved === undefined) delete process.env.AI_NATIVE_PRACTICE_ENABLED;
    else process.env.AI_NATIVE_PRACTICE_ENABLED = saved;
  });

  it("contains no second grading flag that can bypass provider truth", () => {
    const deprecatedFlag = ["AI_NATIVE", "GRADE", "ENABLED"].join("_");
    expect(readText("src/app/api/ai-native/grade-exercise/engine.ts")).not.toContain(
      deprecatedFlag,
    );
    expect(readText("src/app/api/ai-native/grade-exercise/route.ts")).not.toContain(
      deprecatedFlag,
    );
  });
});

// ─── 6. Bundle copy check ─────────────────────────────────────────────────────

describe("OS Bundle ghost copy removed", () => {
  it("content.ts does not contain ghost artifact-count strings", () => {
    const text = readText("src/lib/ai-native/content.ts");
    expect(text).not.toContain("Alles bei dir");
    expect(text).not.toContain("13 Vault");
    expect(text).not.toContain("50 Prompts");
    expect(text).not.toContain("96 Artefakt");
    expect(text).not.toContain("~96");
  });

  it("bundle-showcase.tsx does not contain ghost artifact strings", () => {
    const text = readText("src/components/ai-native/bundle-showcase.tsx");
    expect(text).not.toContain("Alles bei dir");
    expect(text).not.toContain("13 Vault");
    expect(text).not.toContain("50 Prompts");
  });
});

// ─── 7. Module 1 hostile framing removed ─────────────────────────────────────

describe("Module 1 hostile framing removed", () => {
  it("modules.json does not contain old shame title", () => {
    const text = readText("content/ai-native/modules.json");
    expect(text).not.toContain("Du machst deinen Job falsch");
    expect(text).not.toContain("Nobody's writing SQL");
    expect(text).not.toContain("Dieser Kurs zeigt dir");
  });

  it("module 1 has the new honest title", () => {
    const raw = readText("content/ai-native/modules.json");
    const data = JSON.parse(raw) as { modules: Array<{ id: string; title: string }> };
    const modul1 = data.modules.find((m) => m.id === "modul_1");
    expect(modul1?.title).toBe("Von der Aufgabe zum Workflow");
  });
});

// ─── 8. TierChip PREMIUM removed ─────────────────────────────────────────────

describe("TierChip PREMIUM removed", () => {
  it("primitives.tsx does not export PREMIUM tier", () => {
    const text = readText("src/components/ai-native/primitives.tsx");
    expect(text).not.toContain('"PREMIUM"');
    expect(text).not.toContain("'PREMIUM'");
  });
});
