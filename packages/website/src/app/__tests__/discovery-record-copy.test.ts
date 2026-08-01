import { describe, expect, it } from "vitest";
import { metadata as homeMetadata } from "../page";
import { metadata as courseMetadata } from "../kurse/page";

function descriptionOf(metadata: typeof homeMetadata): string {
  return typeof metadata.description === "string" ? metadata.description : "";
}

describe("German discovery record copy", () => {
  it("keeps the homepage access description factual", () => {
    const description = descriptionOf(homeMetadata);

    expect(description).toContain("technische Kursreader sind ohne Konto nutzbar");
    expect(description).toContain("vier deutsche Kernkurse");
    expect(description).not.toMatch(/zertifiziert/i);
  });

  it("names the self-issued German records accurately in course metadata", () => {
    const description = descriptionOf(courseMetadata);

    expect(description).toContain("selbst ausgestellten Teilnahmebestätigungen");
    expect(description).toContain("Lernnachweisen");
    expect(description).toContain("öffentliche technische Kurse");
    expect(description).not.toMatch(/\bZertifikat\b/i);
  });
});
