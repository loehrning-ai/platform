import { expect } from "vitest";

/**
 * Render assertions for the poster scenes (Werkzeichnung v2, SPEC §1.3 and
 * §8.3), for the surface tests of the workshop, home, course, demo and blog
 * bands. The source scans in src/components/plakat/plakat.test.tsx are the
 * second net; these check what a surface really renders.
 */

/** Every element inside a lemons or autumn scene, by scope class or by page scene. */
const MENNIGE_FREE_SCENE = [
  ".plakat-lemons *",
  ".plakat-autumn *",
  '[data-plakat-page="lemons"] [data-plakat-band] *',
  '[data-plakat-page="autumn"] [data-plakat-band] *',
].join(", ");

/** Paper fills and labels: a Mennige or Kupfer edge falls to 2.21 on Ultramarin and 1.07 on Rost. */
const PAPER_FILL_CLASSES = ["bg-mennige", "bg-kupfer", "text-paper"] as const;

/** No Mennige or Kupfer fill and no paper label inside a lemons or autumn scene. */
export function expectNoMennigeInScene(container: ParentNode): void {
  for (const element of container.querySelectorAll(MENNIGE_FREE_SCENE)) {
    const classes = element.getAttribute("class")?.split(/\s+/) ?? [];
    for (const banned of PAPER_FILL_CLASSES) {
      expect(classes, `${banned} inside a lemons or autumn scene: <${element.tagName.toLowerCase()} class="${classes.join(" ")}">`).not.toContain(banned);
    }
  }
}

/** Every `.plakat-caps` line sits under a scene: a `plakat-*` scope or a band on a scene page. */
export function expectCapsInsideScene(container: ParentNode): void {
  for (const caps of container.querySelectorAll(".plakat-caps")) {
    expect(
      caps.parentElement?.closest('[class*="plakat-"]:not(.plakat-caps), [data-plakat-band]') ?? null,
      `.plakat-caps "${caps.textContent?.trim() ?? ""}" renders outside a scene`,
    ).not.toBeNull();
  }
}

/**
 * A text matcher for one whole caps line. Each " · " part of a caps line is
 * its own unbreakable run (CapsLine), so the plain string matcher, which
 * reads one element's own text nodes, cannot see the line as one text.
 */
export function capsLine(text: string): (content: string, element: Element | null) => boolean {
  return (_content, element) =>
    element?.classList.contains("plakat-caps") === true && element.textContent === text;
}
