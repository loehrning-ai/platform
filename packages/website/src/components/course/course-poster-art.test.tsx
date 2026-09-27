import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PosterArt, ROLE_FILL_CLASS } from "@/components/plakat";
import { POSTER_CANVAS } from "@/lib/plakat/motifs";
import { COURSE_PLAKAT, type CoursePlakatId } from "@/lib/plakat/palettes";
import { CoursePosterArt } from "./course-poster-art";
import { posterPathBounds } from "./poster-clip";

const COURSE_IDS = Object.keys(COURSE_PLAKAT) as CoursePlakatId[];
const FORMATS = ["portrait", "landscape"] as const;
const FILL_CLASSES = new Set(Object.values(ROLE_FILL_CLASS));

function attributes(element: Element | null): Record<string, string> {
  return Object.fromEntries(
    Array.from(element?.attributes ?? [], (attribute) => [attribute.name, attribute.value]),
  );
}

describe("CoursePosterArt", () => {
  for (const courseId of COURSE_IDS) {
    for (const format of FORMATS) {
      it(`draws the ${courseId} ${format} poster as PosterArt does, every shape inside the canvas`, () => {
        const scene = COURSE_PLAKAT[courseId];
        const cut = render(<CoursePosterArt scene={scene} format={format} />).container;
        const shared = render(
          <PosterArt
            plakat={scene.plakat}
            motif={scene.motif}
            numeral={scene.numeral}
            format={format}
            cornerDots={false}
          />,
        ).container;
        const root = cut.querySelector(":scope > svg");
        // The root is PosterArt's: same scene class, viewBox, alignment and
        // aria-hidden, so the band shows the same picture in the same place.
        expect(root).not.toBeNull();
        expect(attributes(root)).toEqual(attributes(shared.querySelector(":scope > svg")));
        // The numeral is PosterArt's own element, unchanged.
        expect(
          Array.from(cut.querySelectorAll("[data-poster-numeral-text]"), (text) => text.outerHTML),
        ).toEqual(
          Array.from(shared.querySelectorAll("[data-poster-numeral-text]"), (text) => text.outerHTML),
        );
        // Flat and cut: no nested viewport or transform places a shape, and
        // every shape's own geometry lies inside the root viewBox, so no
        // path box can leave the poster's box.
        expect(root?.querySelector("svg")).toBeNull();
        expect(root?.querySelector("[transform]")).toBeNull();
        const { width, height } = POSTER_CANVAS[format];
        const paths = Array.from(root?.querySelectorAll("path") ?? []);
        expect(paths.length).toBeGreaterThan(1);
        for (const path of paths) {
          expect(FILL_CLASSES.has(path.getAttribute("class") ?? "")).toBe(true);
          const d = path.getAttribute("d") ?? "";
          const bounds = posterPathBounds(d);
          expect(bounds, d).not.toBeNull();
          expect(bounds?.x0, d).toBeGreaterThanOrEqual(-0.001);
          expect(bounds?.y0, d).toBeGreaterThanOrEqual(-0.001);
          expect(bounds?.x1, d).toBeLessThanOrEqual(width + 0.001);
          expect(bounds?.y1, d).toBeLessThanOrEqual(height + 0.001);
        }
      });
    }
  }
});
