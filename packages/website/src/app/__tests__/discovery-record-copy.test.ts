import { describe, expect, it } from "vitest";
import { HOME_COPY } from "@/components/home/home-copy";
import { COURSE_HUB_COPY } from "@/lib/courses/course-hub-copy";

describe("German discovery record copy", () => {
  it("keeps the homepage access description factual", () => {
    const description = HOME_COPY.de.metadata.description;

    expect(description).toContain("Kostenfreie KI-Kurse");
    expect(description).toContain("klaren Zugangsregeln");
    expect(description).not.toMatch(/zertifiziert/i);
  });

  it("states the course catalogue scope accurately in metadata", () => {
    const description = COURSE_HUB_COPY.de.metadataDescription;

    expect(description).toContain("Zehn Kurse auf Deutsch und Englisch");
    expect(description).toContain("Quellstand");
    expect(description).toContain("Workshops und Lernbücher");
    expect(description).not.toMatch(/\bZertifikat\b/i);
  });
});
