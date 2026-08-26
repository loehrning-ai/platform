import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SURFACES = [
  "components/nav.tsx",
  "components/footer.tsx",
  "components/home/hero.tsx",
  "components/home/offering.tsx",
  "components/home/workflow.tsx",
  "components/home/credibility-strip.tsx",
  "app/kurse/learning-atlas.tsx",
  "components/course-projects/lesson-mission-control.tsx",
  "components/course-projects/lesson-mission-frame.tsx",
  "components/course-projects/course-project-studio.tsx",
  "app/workshops/workshops-content.tsx",
  "app/buecher/buecher-content.tsx",
  "components/ui/brand-button.tsx",
  "components/ui/card.tsx",
  "components/ui/section-header.tsx",
] as const;

function source(relativePath: (typeof SURFACES)[number]): string {
  return readFileSync(join(__dirname, "..", relativePath), "utf8");
}

describe("learning surface density contract", () => {
  it.each(SURFACES)("keeps visible labels at 12px or larger in %s", (file) => {
    expect(source(file)).not.toMatch(
      /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]|\btext-\[0\.(?:5|6\d*|7(?:[0-4]\d*)?)rem\]/,
    );
  });

  it.each(SURFACES)("keeps motion bounded in %s", (file) => {
    const contents = source(file);

    expect(contents).not.toMatch(/\btransition-all\b/);
    expect(contents).not.toMatch(/animation\s*:[^;]*\binfinite\b/);
    expect(contents).not.toMatch(/\banimate-(?:pulse|bounce)\b/);
  });
});
