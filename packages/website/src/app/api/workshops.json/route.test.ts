import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { getMachineWorkshop } from "@/lib/machine-surfaces";
import { WORKSHOPS } from "@/lib/workshops";

interface ServedMaterial {
  readonly label: string;
  readonly path: string;
  readonly url: string;
}

describe("GET /api/workshops.json", () => {
  it("serves the public workshop catalog with open CORS and an hour of cache", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=3600, s-maxage=3600",
    );
    expect(response.headers.get("access-control-allow-origin")).toBe("*");

    const body = await response.json();
    expect(body.schema).toBe("https://loehrning.ai/schema/workshops/v1");
    expect(body.last_updated).toBe(SITE_CONTENT_DATE);
    expect(body.count).toBe(WORKSHOPS.length);
    expect(body.page_url).toBe("https://loehrning.ai/api/workshops.json");
    expect(body.index_url).toBe("https://loehrning.ai/workshops");
    expect(body.locales).toEqual(["de", "en"]);
  });

  it("returns every workshop in both locales, straight from the builder", async () => {
    const response = await GET();
    const body = await response.json();

    expect(
      body.workshops.map((workshop: { slug: string }) => workshop.slug),
    ).toEqual(WORKSHOPS.map((workshop) => workshop.slug));

    for (const workshop of body.workshops) {
      expect(workshop.localized.de).toEqual(
        JSON.parse(JSON.stringify(getMachineWorkshop(workshop.slug, "de"))),
      );
      expect(workshop.localized.en).toEqual(
        JSON.parse(JSON.stringify(getMachineWorkshop(workshop.slug, "en"))),
      );
    }
  });

  it("serves a materials manifest whose every file is really deployed", async () => {
    const response = await GET();
    const body = await response.json();

    for (const workshop of body.workshops) {
      const materials: readonly ServedMaterial[] =
        workshop.localized.de.materials;
      expect(materials.length, workshop.slug).toBe(workshop.material_count);
      expect(materials.length).toBeGreaterThan(0);

      for (const material of materials) {
        expect(material.url).toBe(`https://loehrning.ai${material.path}`);
        expect(
          existsSync(
            resolve(process.cwd(), "public", material.path.replace(/^\//, "")),
          ),
          `${material.label} is missing from public/`,
        ).toBe(true);
      }
    }
  });

  it("keeps typographic dashes out of the served payload", async () => {
    const response = await GET();
    expect(await response.text()).not.toMatch(/[\u2014\u2013]/);
  });
});
