import { describe, expect, it } from "vitest";
import {
  dynamic,
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";
import { demos } from "@/lib/demos";
import { getDemoCopy } from "@/lib/demos-copy";

describe("/demos/[slug] static route contract", () => {
  it("rejects Dynamic APIs and unknown on-demand slugs", () => {
    expect(dynamic).toBe("error");
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
        `https://loehrning.ai/demos/${demo.slug}`,
      );
    }
  });

  it("does not emit indexable metadata for an unknown slug", async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "not-in-the-catalog" }),
      }),
    ).resolves.toEqual({ title: "Praxisbeispiel nicht gefunden" });
  });
});
