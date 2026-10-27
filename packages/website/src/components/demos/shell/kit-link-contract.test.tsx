import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEMO_SLUGS, getDemoForLocale } from "@/lib/demos";
import { takeHomeFor } from "@/lib/demo-takehome";
import { resolveKit } from "@/lib/demo-takehome.server";
import { getWorkshopBySlug } from "@/lib/workshops";
import { ClosingBand } from "./closing-band";

/**
 * One kit per demo page and locale: the closing band, the take-home block and
 * the workshop's own kit material all point at the same zip, so a German
 * visitor never sees the English kit in one place and the German one in the
 * next.
 */
describe("every kit link on a demo page is the same URL", () => {
  const cases = DEMO_SLUGS.flatMap((slug) => (["de", "en"] as const).map((locale) => [slug, locale] as const));

  it.each(cases)("%s (%s)", (slug, locale) => {
    const demo = getDemoForLocale(slug, locale);
    const takeHome = takeHomeFor(slug);
    expect(demo).toBeDefined();
    expect(takeHome).toBeDefined();
    if (!demo || !takeHome) return;
    const expected = takeHome.kit[locale].href;
    expect(resolveKit(takeHome.kit[locale]).href).toBe(expected);

    const workshop = getWorkshopBySlug(slug, locale);
    const { container } = render(<ClosingBand demo={demo} workshop={workshop} locale={locale} />);
    const kitLinks = [...container.querySelectorAll<HTMLAnchorElement>('[data-closing-link="kit"]')];
    expect(kitLinks.map((link) => link.getAttribute("href"))).toEqual([expected]);

    const workshopKit = workshop?.materials.find((material) => material.role === "kit" && material.kind === "zip");
    expect(workshopKit?.href, "the workshop page offers the same kit").toBe(expected);
  });
});
