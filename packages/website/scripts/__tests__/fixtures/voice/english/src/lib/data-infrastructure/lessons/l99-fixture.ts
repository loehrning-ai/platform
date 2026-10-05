import type { FixtureLesson } from "../types";
import { buildSections } from "../blocks";

// Furthermore in a comment must not count as a finding.
const lesson: FixtureLesson = {
  id: "L99",
  title: "Let's explore the fixture",
  sections: buildSections([
    {
      id: "s1",
      blocks: [
        {
          kind: "prose",
          markdown:
            "Furthermore, the sandbox matters.\n\nMoreover, the diff matters.",
        },
        {
          kind: "pull-quote",
          text: `Imagine a ${"template"} literal
that spans lines and delves into detail.`,
        },
      ],
    },
  ]),
};

export default lesson;
