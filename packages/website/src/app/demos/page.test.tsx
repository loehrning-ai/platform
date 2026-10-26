import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const localeRef = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(async () => localeRef.value),
}));

import DemosPage, { generateMetadata } from "./page";
import { getDemosForLocale } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";

describe("/demos hub", () => {
  for (const locale of ["de", "en"] as const) {
    it(`${locale}: a Glas hero with the intro, six tiles in workshop order, then the shared promise`, async () => {
      localeRef.value = locale;
      const copy = DEMOS_PAGE_COPY[locale].catalog;
      const hub = DEMOS_PAGE_COPY[locale].hub;
      const { container } = render(await DemosPage());

      const h1 = screen.getByRole("heading", { level: 1, name: copy.heading });
      // The hub is Glas in frost mode: the hero is the hub's own field, no live filter.
      expect(container.querySelector("[data-demos-hub-glas]")).toHaveAttribute("data-glas-mode", "frost");
      const hero = h1.closest("[data-demo-hub-hero]");
      expect(hero?.querySelector(".glas-stage")).not.toBeNull();
      // No halftone and no poster covers: the tiles are the picture.
      expect(container.querySelector("[data-halftone], [data-demo-cover], [data-demo-tile]")).toBeNull();
      // The four-sentence intro of language-standard B.8.
      expect(within(hero as HTMLElement).getByText(hub.lede)).toBeTruthy();
      expect(hub.lede.split(/(?<=\.)\s/)).toHaveLength(3);

      const demos = getDemosForLocale(locale);
      const tiles = screen.getAllByTestId("demo-tile");
      expect(tiles).toHaveLength(6);
      const prefix = locale === "en" ? "/en" : "";
      for (const [index, demo] of demos.entries()) {
        const tile = tiles[index] as HTMLElement;
        const item = tile.closest("li") as HTMLElement;
        // The workshop's own scene class resolves the anti colour of the block.
        expect(item).toHaveClass("dt-item", `plakat-${demo.plakat}`);
        expect(item).toHaveAttribute("data-scene", `w0${index + 1}`);
        expect(within(tile).getByRole("heading", { level: 3 })).toHaveTextContent(demo.title);
        // The job line is the biggest text and describes the demo link.
        const job = tile.querySelector("[data-demo-job]");
        expect(job).toHaveTextContent(demo.job);
        expect(demo.job.length).toBeLessThanOrEqual(56);
        const link = within(tile).getByRole("link", { name: demo.title });
        expect(link).toHaveAttribute("href", `${prefix}/demos/${demo.slug}?source=gallery`);
        expect(link).toHaveAccessibleDescription(demo.job);
        // The kicker "0N · topic" links to the workshop on its own.
        const kicker = tile.querySelector("[data-demo-workshop-kicker]");
        expect(kicker).toHaveAttribute("href", `${prefix}/workshops/${demo.workshopSlug}`);
        expect(kicker?.textContent).toMatch(new RegExp(`^${demo.workshopNumber} · \\S`));
        expect(within(tile).getAllByRole("link")).toHaveLength(2);
        expect(tile.querySelector("[data-demo-meta]")).toHaveTextContent(hub.meta(demo.minutes));
        const scene = tile.querySelector(".dt-scene");
        expect(scene).toHaveAttribute("aria-hidden", "true");
        expect(scene?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      }

      const promise = container.querySelector("[data-demo-promise-cell]");
      expect(promise).toHaveTextContent(copy.promiseTitle);
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
    expect(metadata.description).toBe(DEMOS_PAGE_COPY.de.metadata.description(6));
    expect(metadata.alternates?.canonical).toBe("/demos");
  });
});
