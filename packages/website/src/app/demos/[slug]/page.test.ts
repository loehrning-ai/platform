import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(async () => "de"),
}));

import {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";
import { demos } from "@/lib/demos";
import { getDemoCopy } from "@/lib/demos-copy";

describe("/demos/[slug] static route contract", () => {
  it("rejects unknown on-demand slugs", () => {
    expect(dynamicParams).toBe(false);
  });

  it("prerenders every catalogued slug exactly once", async () => {
    expect(await generateStaticParams()).toEqual(
      demos.map((demo) => ({ slug: demo.slug })),
    );
  });

  it("emits canonical initial-document metadata for every static demo", async () => {
    for (const demo of demos) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: demo.slug }),
      });
      expect(metadata.description).toBe(
        getDemoCopy(demo.slug)?.ogSubtitle ?? demo.description,
      );
      expect(metadata.alternates?.canonical).toBe(
        `/demos/${demo.slug}`,
      );
    }
  });

  it("does not emit indexable metadata for an unknown slug", async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "not-in-the-catalog" }),
      }),
    ).resolves.toEqual({
      title: "Praxisbeispiel nicht gefunden",
      robots: { index: false, follow: false },
    });
  });
});
