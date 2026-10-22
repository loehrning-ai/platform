import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const localeRef = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(async () => localeRef.value),
}));

import DemosPage, { generateMetadata } from "./page";
import { demoLede, getDemosForLocale } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { expectCapsInsideScene } from "@/test/plakat-scene";

describe("/demos hub", () => {
  for (const locale of ["de", "en"] as const) {
    it(`${locale}: an IDEA band, then one row per workshop demo, then the provenance line`, async () => {
      localeRef.value = locale;
      const copy = DEMOS_PAGE_COPY[locale].catalog;
      const { container } = render(await DemosPage());

      const h1 = screen.getByRole("heading", { level: 1, name: copy.heading });
      expect(h1).toHaveClass("poster-title", "text-scene-mid");
      const band = h1.closest("[data-cover-band]");
      expect(band).toHaveClass("plakat-idea");
      expect(band?.querySelectorAll("[data-halftone]")).toHaveLength(1);
      expect(within(band as HTMLElement).getByText(copy.introduction(getDemosForLocale(locale).length))).toBeTruthy();
      expectCapsInsideScene(container);

      const demos = getDemosForLocale(locale);
      const rows = screen.getAllByTestId("demo-row");
      expect(rows).toHaveLength(5);
      const prefix = locale === "en" ? "/en" : "";
      for (const [index, demo] of demos.entries()) {
        const row = rows[index] as HTMLElement;
        expect(within(row).getByRole("heading", { level: 3 })).toHaveTextContent(demo.title);
        expect(row.querySelector("[data-demo-row-question]")).toHaveTextContent(demoLede(demo));
        expect(row.querySelector("[data-demo-meta]")).toHaveTextContent(
          `${copy.workshopNumber(demo.workshopNumber)} · ${copy.minutes(demo.minutes)}`,
        );
        expect(within(row).getByRole("link")).toHaveAttribute(
          "href",
          `${prefix}/demos/${demo.slug}?source=gallery`,
        );
        // The poster thumb carries the workshop's own palette and number.
        expect(row.querySelector(`[data-plakat="${demo.plakat}"], .plakat-${demo.plakat}`)).not.toBeNull();
      }

      expect(container.querySelector("[data-demo-provenance]")).toHaveTextContent(copy.provenance);
      // No filters, no collapsible UI.
      expect(container.querySelector("select, details, summary, [role=combobox]")).toBeNull();
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
