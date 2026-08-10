import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GITHUB_ORG, TIM_ENTITY } from "@/lib/seo/entity";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import UeberMichPage, { generateMetadata } from "./page";

type GraphNode = Record<string, unknown>;

async function renderPage(locale: "de" | "en") {
  getRequestLocaleMock.mockResolvedValue(locale);
  render(await UeberMichPage());
  const script = document.querySelector<HTMLScriptElement>("#ueber-mich-jsonld");
  expect(script).not.toBeNull();
  return JSON.parse(script?.textContent ?? "") as {
    "@graph": GraphNode[];
  };
}

describe("/ueber-mich locale metadata and structured data", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each([
    ["de", "/ueber-mich", "Über Tim Löhr", "de_DE"],
    ["en", "/en/ueber-mich", "About Tim Löhr", "en_GB"],
  ] as const)(
    "emits %s profile metadata with canonical and reciprocal hreflang",
    async (locale, canonical, title, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.title).toBe(title);
      expect(metadata.alternates).toMatchObject({
        canonical,
        languages: {
          de: "/ueber-mich",
          en: "/en/ueber-mich",
          "x-default": "/ueber-mich",
        },
      });
      expect(metadata.openGraph).toMatchObject({
        type: "profile",
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
        firstName: "Tim",
        lastName: "Löhr",
      });
      expect(metadata.twitter).toMatchObject({ card: "summary" });
    },
  );

  it("localizes the German ProfilePage and breadcrumb graph", async () => {
    const graph = await renderPage("de");
    const profile = graph["@graph"].find((node) => node["@type"] === "ProfilePage");
    const breadcrumb = graph["@graph"].find(
      (node) => node["@type"] === "BreadcrumbList",
    );
    const person = graph["@graph"].find((node) => node["@type"] === "Person");

    expect(profile).toMatchObject({
      url: "https://loehrning.ai/ueber-mich",
      name: "Über Tim Löhr",
      inLanguage: "de-DE",
    });
    expect(breadcrumb?.itemListElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Start", item: "https://loehrning.ai" }),
      ]),
    );
    expect(person).toMatchObject({
      jobTitle: "Kurator von loehrning.ai",
      url: "https://loehrning.ai/ueber-mich",
      sameAs: [TIM_ENTITY.linkedInUrl, TIM_ENTITY.personalGithubUrl],
    });
    expect(person?.sameAs).not.toContain(GITHUB_ORG.url);
    expect(screen.getByRole("heading", { name: /öffentliches Lernarchiv/ })).toBeVisible();
  });

  it("localizes the English ProfilePage, breadcrumb, Person copy, and visible page", async () => {
    const graph = await renderPage("en");
    const profile = graph["@graph"].find((node) => node["@type"] === "ProfilePage");
    const breadcrumb = graph["@graph"].find(
      (node) => node["@type"] === "BreadcrumbList",
    );
    const person = graph["@graph"].find((node) => node["@type"] === "Person");

    expect(profile).toMatchObject({
      url: "https://loehrning.ai/en/ueber-mich",
      name: "About Tim Löhr",
      inLanguage: "en-GB",
    });
    expect(breadcrumb?.itemListElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Home", item: "https://loehrning.ai/en" }),
      ]),
    );
    expect(person).toMatchObject({
      jobTitle: "Curator of loehrning.ai",
      url: "https://loehrning.ai/en/ueber-mich",
    });
    expect(person?.knowsAbout).toContain("AI literacy");
    expect(screen.getByRole("heading", { name: /public learning archive/ })).toBeVisible();
    expect(document.body).not.toHaveTextContent("Akademischer Hintergrund");
  });
});
