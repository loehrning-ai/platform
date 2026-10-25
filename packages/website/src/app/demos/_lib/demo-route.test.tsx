import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const localeRef = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(async () => localeRef.value),
}));

import { demoMetadata } from "./demo-route";
import UnknownDemoPage, {
  dynamicParams,
  generateMetadata as unknownMetadata,
  generateStaticParams,
} from "../[slug]/page";
import { DEMO_SLUGS } from "@/lib/demos";
import { demoLede, demos, getDemoForLocale } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { getWorkshopBySlug } from "@/lib/workshops";
import { expectCapsInsideScene, expectNoMennigeInScene } from "@/test/plakat-scene";

describe("/demos static route contract", () => {
  it("gives every demo its own route folder with page, share card and error boundary", () => {
    for (const slug of DEMO_SLUGS) {
      for (const file of ["page.tsx", "opengraph-image.tsx", "error.tsx"]) {
        expect(existsSync(join(__dirname, "..", slug, file)), `${slug}/${file}`).toBe(true);
      }
    }
  });

  it("keeps the catch-all guard static and empty, so unknown slugs 404", async () => {
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual([]);
    localeRef.value = "de";
    await expect(unknownMetadata()).resolves.toEqual({
      title: "Demo nicht gefunden",
      robots: { index: false, follow: false },
    });
    expect(() => UnknownDemoPage()).toThrow();
  });

  it("emits canonical metadata for every demo", async () => {
    localeRef.value = "de";
    for (const demo of demos) {
      const metadata = await demoMetadata(demo.slug);
      expect(metadata.description).toBe(demo.oneLiner);
      expect(metadata.alternates?.canonical).toBe(`/demos/${demo.slug}`);
    }
  });

  it("does not emit indexable metadata for an unknown slug", async () => {
    localeRef.value = "de";
    await expect(demoMetadata("not-in-the-catalog")).resolves.toEqual({
      title: "Demo nicht gefunden",
      robots: { index: false, follow: false },
    });
  });
});

describe("/demos/[slug] page shell", () => {
  for (const locale of ["de", "en"] as const) {
    for (const base of demos) {
      it(`${locale}: ${base.slug} renders the band in the workshop palette and mounts the demo`, async () => {
        localeRef.value = locale;
        const demo = getDemoForLocale(base.slug, locale);
        if (!demo) throw new Error("missing demo");
        // The route page itself: a v3 demo hands its beats to the shell there.
        const { default: RoutePage } = await import(`../${base.slug}/page.tsx`);
        const { container } = render(await RoutePage());

        const h1 = screen.getByRole("heading", { level: 1 });
        expect(h1).toHaveTextContent(demo.title);
        if (demo.shell === "v3") {
          expect(container.querySelector("[data-demo-v3]")).toHaveAttribute("data-plakat-page", demo.plakat);
          // The v3 page has a bar and an aside instead of the cover band.
          expect(h1.closest("[data-demo-bar]")).not.toBeNull();
          // The v3 shell has no cover band: the aside carries the caps line.
          expect(container.querySelector(".demo-aside-caps")).toHaveTextContent(
            DEMOS_PAGE_COPY[locale].detail.caps(demo.workshopNumber),
          );
        } else {
          const band = h1.closest("[data-cover-band]");
          expect(band).toHaveAttribute("data-plakat", demo.plakat);
          // CapsLine splits " · " parts into runs; the DOM text stays the same words.
          expect(band?.querySelector(".plakat-caps")).toHaveTextContent(
            DEMOS_PAGE_COPY[locale].detail.caps(demo.workshopNumber),
          );
        }
        expect(container.querySelector("[data-demo-question]")).toHaveTextContent(demoLede(demo));

        const workshop = getWorkshopBySlug(demo.workshopSlug, locale);
        const back = container.querySelector("[data-demo-workshop-link]");
        expect(back).toHaveAttribute(
          "href",
          `${locale === "en" ? "/en" : ""}/workshops/${demo.workshopSlug}`,
        );
        expect(back).toHaveTextContent(workshop?.title ?? "");

        expect(container.querySelector("[data-demo-promise]")).toHaveTextContent(demo.oneLiner.replace(/\u00a0/g, " "));
        expect(container.querySelector("[data-demo-synthetic]")).toHaveTextContent(
          demo.syntheticDataLabel,
        );
        const mount = container.querySelector(`[data-demo-mount="${demo.slug}"]`);
        expect(mount).not.toBeNull();
        // The demo itself is server-rendered content, not a loading state.
        // A demo may own an empty live region for its announcements; a
        // status that already speaks on load, or a busy mount, is a loader.
        // v2 demos open with their own h2; on v3 the shell's stage is the content.
        expect(mount?.querySelector(demo.shell === "v3" ? "[data-demo-stage]" : "h2")).not.toBeNull();
        expect(mount?.querySelector('[aria-busy="true"]')).toBeNull();
        for (const status of mount?.querySelectorAll('[role="status"]') ?? []) {
          expect(status.textContent?.trim() ?? "").toBe("");
        }
        // The band owns the only h1; no collapsible UI anywhere on the page.
        expect(container.querySelectorAll("h1")).toHaveLength(1);
        expect(container.querySelector("details, summary")).toBeNull();
        expectCapsInsideScene(container);
        expectNoMennigeInScene(container);
      });
    }
  }
});
