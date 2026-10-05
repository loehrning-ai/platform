import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Design contract for the course app: every surface a learner sees after
 * entering one of the four Grundlagen courses (KI-Führerschein, KI und
 * Gesellschaft, EU AI Act, Mit KI arbeiten), from the hub through the
 * lessons, the final quiz and its result to the certificate.
 *
 * These surfaces left the Werkzeichnung poster system on purpose: rounded
 * 20-28px sheets, soft layered depth, a warm paper ground with brand light.
 * What stays non-negotiable is the shared floor: paper grounds (never black),
 * 44px targets (checked per control in lesson-engine-design-contract.test.ts
 * and course/interaction-design-contract.test.ts), visible focus, finite
 * motion that respects reduced motion, and live regions for feedback.
 */

const SRC = join(__dirname, "..", "..");
const read = (path: string) => readFileSync(join(SRC, path), "utf8");

const COURSE_APP_SURFACES = [
  "components/lesson-engine/module-overview.tsx",
  "components/lesson-engine/lesson-flow.tsx",
  "components/lesson-engine/lesson-checks.tsx",
  "components/lesson-engine/step-flow.tsx",
  "components/lesson-engine/course-outline.tsx",
  "components/lesson-engine/course-lesson-header.tsx",
  "components/lesson-engine/celebration-burst.tsx",
  "components/lesson-engine/progress-ring.tsx",
  "components/course/kurs/workshop-quiz-page.tsx",
  "components/course/kurs/certificate-page.tsx",
  "components/course/kurs/verification-page.tsx",
  "app/ki-fuehrerschein/kurs/error.tsx",
  "app/ki-fuehrerschein/kurs/[blockId]/error.tsx",
  "app/ki-und-gesellschaft/kurs/error.tsx",
  "app/ki-und-gesellschaft/kurs/[blockId]/error.tsx",
  "app/eu-ai-act-kurs/kurs/error.tsx",
  "app/eu-ai-act-kurs/kurs/[blockId]/error.tsx",
  "app/ai-native/kurs/error.tsx",
  "app/ai-native/kurs/[moduleId]/error.tsx",
  "app/ai-native/kurs/[moduleId]/[lessonId]/error.tsx",
] as const;

describe("course app design contract", () => {
  it.each(COURSE_APP_SURFACES)("drops the poster vocabulary in %s", (path) => {
    const source = read(path);
    // Kopflinien, mono caps eyebrows and hairline ledgers.
    expect(source).not.toMatch(/border-t-2 border-foreground/);
    expect(source).not.toMatch(/font-mono[^"]*uppercase|uppercase[^"]*font-mono/);
    expect(source).not.toMatch(/\btext-label\b/);
    expect(source).not.toMatch(/border-hairline/);
    // Scene-coloured headings and poster bands.
    expect(source).not.toMatch(/text-scene-line|PlakatBand|data-plakat-band|text-poster/);
  });

  it.each(COURSE_APP_SURFACES)("stays on paper with finite motion in %s", (path) => {
    const source = read(path);
    expect(source).not.toMatch(/\bbg-(?:black|foreground|graphit|stone-9\d\d|neutral-9\d\d|zinc-9\d\d)\b/);
    expect(source).not.toMatch(/\banimate-(?:pulse|bounce|spin|ping)\b/);
    expect(source).not.toMatch(/repeat:\s*Infinity/);
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*"framer-motion"/);
    expect(source).not.toContain("<motion.");
  });

  it.each(COURSE_APP_SURFACES.filter((path) => !path.includes("celebration") && !path.includes("progress-ring")))(
    "gives every interactive surface a visible focus ring in %s",
    (path) => {
      const source = read(path);
      if (!/<(?:button|Link|a)\b/.test(source)) return;
      expect(source).toMatch(/focus-visible:ring-2|APP_FOCUS|APP_PRIMARY|APP_SECONDARY|APP_GHOST/);
    },
  );

  it("puts every full-page course surface on the warm course-app ground", () => {
    for (const path of [
      "components/lesson-engine/module-overview.tsx",
      "components/course/kurs/workshop-quiz-page.tsx",
      "components/course/kurs/certificate-page.tsx",
      "components/course/kurs/verification-page.tsx",
      "components/course/kurs/block-page-shell.tsx",
    ]) {
      expect(read(path), path).toContain("course-app-ground");
    }
    const css = read("app/globals.css");
    expect(css).toMatch(/\.course-app-ground\s*\{[^}]*background-color:\s*#fbf8f2/);
    expect(css).toMatch(/\.course-app-frost\s*\{[^}]*background-color:\s*rgba\(255, 252, 245, 0\.97\)/);
  });

  it("runs the Grundlagen readers on the course-app shell", () => {
    expect(read("components/course/kurs/lesson-layout.tsx")).toMatch(/look=\{courseApp \? "app" : "werk"\}/);
    expect(read("components/ai-native/kurs/lesson-page-shell.tsx")).toContain('look="app"');
    // The reader bar leads to the next open lesson step on phones.
    expect(read("components/ai-native/kurs/lesson-page-shell.tsx")).toContain("engineSteps: true");
  });

  it("skips decorative motion under reduced motion and Save-Data", () => {
    const calm = read("components/lesson-engine/use-calm-motion.ts");
    expect(calm).toContain("useReducedMotion()");
    expect(calm).toContain("saveData");
    expect(read("components/lesson-engine/celebration-burst.tsx")).toMatch(/if \(!play \|\| calm\) return null/);
    expect(read("components/lesson-engine/module-overview.tsx")).toMatch(/initial=\{calm \? false/);
  });

  it("keeps quiz feedback announced and the quiz action within thumb reach", () => {
    const quiz = read("components/course/kurs/workshop-quiz-page.tsx");
    expect(quiz).toMatch(/role="status"\s+aria-live="polite"/);
    expect(quiz).toContain("data-quiz-action-bar");
    expect(quiz).toContain("bottom-[var(--tabbar-band-h)]");
    expect(quiz).toContain("lg:static");
  });
});
