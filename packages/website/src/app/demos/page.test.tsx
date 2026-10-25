import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const localeRef = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(async () => localeRef.value),
}));

import DemosPage, { generateMetadata } from "./page";
import { getDemosForLocale } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { expectCapsInsideScene } from "@/test/plakat-scene";

describe("/demos hub", () => {
  for (const locale of ["de", "en"] as const) {
    it(`${locale}: an IDEA band, five tiles in workshop order, then the shared promise`, async () => {
      localeRef.value = locale;
      const copy = DEMOS_PAGE_COPY[locale].catalog;
      const { container } = render(await DemosPage());

      const h1 = screen.getByRole("heading", { level: 1, name: copy.heading });
      expect(h1).toHaveClass("poster-title", "text-scene-mid");
      const band = h1.closest("[data-cover-band]");
      expect(band).toHaveClass("plakat-idea");
      // No halftone and no poster covers: the tiles are the picture.
      expect(container.querySelector("[data-halftone], [data-demo-cover], [data-demo-tile]")).toBeNull();
      expect(within(band as HTMLElement).getByText(copy.introduction)).toBeTruthy();
      expectCapsInsideScene(container);

      const demos = getDemosForLocale(locale);
      const tiles = screen.getAllByTestId("demo-tile");
      expect(tiles).toHaveLength(5);
      const prefix = locale === "en" ? "/en" : "";
      for (const [index, demo] of demos.entries()) {
        const tile = tiles[index] as HTMLElement;
        const item = tile.closest("li") as HTMLElement;
        // The workshop's own scene class resolves the anti colour of the block.
        expect(item).toHaveClass("dt-item", `plakat-${demo.plakat}`);
        expect(item).toHaveAttribute("data-scene", `w0${index + 1}`);
        expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(demo.title);
        expect(tile.querySelector("[data-demo-hook]")).toHaveTextContent(demo.tile.hook.replace(/\u00a0/g, " "));
        expect(tile.querySelector("[data-demo-take]")).toHaveTextContent(demo.tile.take);
        // One link, with the workshop in its name; the miniature is silent.
        const link = within(tile).getByRole("link");
        expect(link).toHaveAttribute("href", `${prefix}/demos/${demo.slug}?source=gallery`);
        expect(link).toHaveAccessibleName(`${demo.title}, ${copy.workshopNumber(demo.workshopNumber)}`);
        expect(link).toHaveAccessibleDescription(demo.tile.hook);
        const scene = tile.querySelector(".dt-scene");
        expect(scene).toHaveAttribute("aria-hidden", "true");
        expect(scene?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
        // The hub sells the payoff, never the minutes.
        expect(tile.textContent).not.toMatch(/\bMin\b|minutes?/i);
      }

      const promise = container.querySelector("[data-demo-promise-cell]");
      expect(promise).toHaveTextContent(`${copy.promiseZero}${copy.promiseTitle}`);
      expect(container.querySelector("[data-demo-provenance]")).toHaveTextContent(copy.provenance);
      expect(screen.getByRole("link", { name: copy.toWorkshops })).toHaveAttribute(
        "href",
        `${prefix}/workshops`,
      );
      // No filters, no collapsible UI.
      expect(container.querySelector("select, details, summary, [role=combobox], [aria-expanded]")).toBeNull();
    });
  }

  it("states the count in the metadata", async () => {
    localeRef.value = "de";
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(DEMOS_PAGE_COPY.de.metadata.title);
    expect(metadata.description).toBe(DEMOS_PAGE_COPY.de.metadata.description(5));
    expect(metadata.alternates?.canonical).toBe("/demos");
  });
});
