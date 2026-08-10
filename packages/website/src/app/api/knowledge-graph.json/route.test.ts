import { describe, expect, it } from "vitest";
import { KNOWLEDGE_GRAPH_SCHEMA_ID } from "@/lib/seo/knowledge-graph-schema";
import { GET } from "./route";

type LocalizedPage = {
  readonly url: string;
  readonly pageLanguage: string;
  readonly title: string;
  readonly summary?: string;
  readonly riskNotes?: readonly string[];
  readonly format?: string;
  readonly duration?: string;
};

type Payload = {
  readonly nodes: readonly {
    readonly id: string;
    readonly localizedUrls?: unknown;
    readonly localizedPages: Readonly<Record<"de" | "en", LocalizedPage>>;
    readonly sourceMaterialLanguages: readonly string[];
  }[];
  readonly catalogs: {
    readonly demos: readonly {
      readonly id: string;
      readonly riskNotes?: unknown;
      readonly localizedPages: Readonly<Record<"de" | "en", LocalizedPage>>;
    }[];
    readonly workshops: readonly {
      readonly id: string;
      readonly format?: unknown;
      readonly duration?: unknown;
      readonly sourceMaterialLanguages: readonly string[];
      readonly localizedPages: Readonly<Record<"de" | "en", LocalizedPage>>;
    }[];
  };
};

async function payload(): Promise<Payload> {
  return (await (await GET()).json()) as Payload;
}

describe("knowledge-graph locale representations", () => {
  it("advertises the resolvable versioned schema identifier", async () => {
    const response = await GET();
    const body = (await response.json()) as { schema: string };
    expect(body.schema).toBe(KNOWLEDGE_GRAPH_SCHEMA_ID);
  });

  it("binds each node URL to copy in the same page language", async () => {
    const body = await payload();
    const course = body.nodes.find(
      (node) => node.id === "course:ki-fuehrerschein",
    );

    expect(course?.localizedUrls).toBeUndefined();
    expect(course?.localizedPages.de).toMatchObject({
      url: "https://loehrning.ai/ki-fuehrerschein",
      pageLanguage: "de-DE",
      title: "KI-Führerschein",
    });
    expect(course?.localizedPages.en).toMatchObject({
      url: "https://loehrning.ai/en/ki-fuehrerschein",
      pageLanguage: "en-GB",
      title: "AI Fundamentals",
    });
    expect(course?.localizedPages.en.summary).toMatch(
      /how generative AI works/i,
    );
  });

  it("localizes demo risk notes inside the matching URL representation", async () => {
    const body = await payload();
    const demo = body.catalogs.demos.find(({ id }) => id === "demo:excel");

    expect(demo?.riskNotes).toBeUndefined();
    expect(demo?.localizedPages.de.riskNotes?.[0]).toMatch(/fachlich/);
    expect(demo?.localizedPages.en).toMatchObject({
      url: "https://loehrning.ai/en/demos/excel",
      pageLanguage: "en-GB",
      riskNotes: ["Formulas and forecasts require a subject-matter review."],
    });
  });

  it("separates workshop page copy from the linked material language", async () => {
    const body = await payload();
    const workshop = body.catalogs.workshops.find(
      ({ id }) => id === "workshop:ki-prognosen-einschaetzen",
    );

    expect(workshop?.format).toBeUndefined();
    expect(workshop?.duration).toBeUndefined();
    expect(workshop?.sourceMaterialLanguages).toEqual(["en"]);
    expect(workshop?.localizedPages.de.format).toBe("Selbstlern-Kit");
    expect(workshop?.localizedPages.en).toMatchObject({
      url: "https://loehrning.ai/en/workshops/ki-prognosen-einschaetzen",
      pageLanguage: "en-GB",
      format: "Self-study kit",
      duration: "About 90 minutes",
    });
  });
});
