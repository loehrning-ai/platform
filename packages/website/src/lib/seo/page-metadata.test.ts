import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createNoindexPageMetadata,
  createPublicPageMetadata,
} from "./page-metadata";

describe("page metadata contract", () => {
  it("keeps canonical, Open Graph, and Twitter route identity aligned", () => {
    const metadata = createPublicPageMetadata({
      title: "Hilfe",
      description: "Antworten zur Lernplattform.",
      path: "/hilfe",
      locale: "de",
    });

    expect(metadata.alternates?.canonical).toBe("/hilfe");
    expect(metadata.openGraph).toMatchObject({
      title: "Hilfe",
      description: "Antworten zur Lernplattform.",
      url: "https://loehrning.ai/hilfe",
      locale: "de_DE",
      alternateLocale: ["en_GB"],
    });
    expect(metadata.twitter).toMatchObject({
      title: "Hilfe",
      description: "Antworten zur Lernplattform.",
    });
  });

  it("emits reciprocal English Open Graph locale metadata", () => {
    const metadata = createPublicPageMetadata({
      title: "Help",
      description: "Answers about the learning platform.",
      path: "/en/hilfe",
      locale: "en",
    });

    expect(metadata.openGraph).toMatchObject({
      locale: "en_GB",
      alternateLocale: ["de_DE"],
    });
  });

  it("suppresses inherited canonical and social metadata on noindex pages", () => {
    const metadata = createNoindexPageMetadata({
      title: "Login",
      description: "Lernkonto",
    });

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBeNull();
    expect(metadata.openGraph).toBeNull();
    expect(metadata.twitter).toBeNull();
  });

  it("forbids homepage route identity in the root metadata inheritance layer", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const start = source.indexOf("export const metadata");
    const end = source.indexOf("export const viewport");
    const metadataSource = source.slice(start, end);

    expect(metadataSource).not.toMatch(
      /openGraph:\s*{[^}]*\b(?:title|description|url)\s*:/s,
    );
    expect(metadataSource).not.toMatch(
      /twitter:\s*{[^}]*\b(?:title|description)\s*:/s,
    );
    expect(metadataSource).not.toMatch(/\balternates\s*:/);
  });
});
