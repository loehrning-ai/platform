import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// Course readers are public but intentionally excluded from search indexing.
// This source-level contract test avoids importing the complete layout module
// graph merely to inspect static metadata.

type CourseReader = {
  readonly course: string;
  readonly source: string;
};

const COURSE_READERS: readonly CourseReader[] = [
  {
    course: "ki-fuehrerschein",
    source: "src/app/ki-fuehrerschein/kurs/layout.tsx",
  },
  {
    course: "eu-ai-act-kurs",
    source: "src/app/eu-ai-act-kurs/kurs/layout.tsx",
  },
  {
    course: "ki-und-gesellschaft",
    source: "src/app/ki-und-gesellschaft/kurs/layout.tsx",
  },
  {
    // ai-native's kurs/layout.tsx exports no metadata; the reader noindex is
    // on the kurs index page instead.
    course: "ai-native",
    source: "src/app/ai-native/kurs/page.tsx",
  },
];

describe("public-access course reader noindex metadata", () => {
  for (const reader of COURSE_READERS) {
    it(`${reader.course} reader declares robots index:false, follow:true (${reader.source})`, () => {
      const source = readFileSync(reader.source, "utf8");
      expect(source, `${reader.source} must export metadata`).toMatch(
        /export\s+const\s+metadata\s*:/,
      );
      expect(source, `${reader.source} must keep the reader noindex contract`).toMatch(
        /robots\s*:\s*\{\s*index\s*:\s*false\s*,\s*follow\s*:\s*true\s*\}/,
      );
    });
  }
});
