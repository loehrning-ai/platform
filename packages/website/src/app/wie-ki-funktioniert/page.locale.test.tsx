import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WieKiFunktioniertPage, { generateMetadata } from "./page";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

describe("/wie-ki-funktioniert locale route", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockResolvedValue("de");
  });

  it("selects the English content bundle and localized links from the request locale", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    render(await WieKiFunktioniertPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "How Language Models Work",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Start lesson/ })).toHaveLength(
      4,
    );
    expect(
      screen.getAllByRole("link", { name: /Start lesson/ })[0],
    ).toHaveAttribute("href", "/en/wie-ki-funktioniert/lektion-1-vorhersage");

    const graph = JSON.parse(
      document.querySelector("#wie-ki-funktioniert-course-jsonld")
        ?.textContent ?? "{}",
    ) as { "@graph"?: Array<Record<string, unknown>> };
    expect(
      graph["@graph"]?.find((entry) => entry["@type"] === "Course"),
    ).toMatchObject({
      name: "How Language Models Work",
      inLanguage: "en",
      url: "https://loehrning.ai/en/wie-ki-funktioniert",
      isAccessibleForFree: true,
    });
  });

  it("emits English canonical, hreflang, and Open Graph locale", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("How Language Models Work: 4 Free Lessons");
    expect(metadata.alternates).toMatchObject({
      canonical: "/en/wie-ki-funktioniert",
      languages: {
        de: "/wie-ki-funktioniert",
        en: "/en/wie-ki-funktioniert",
        "x-default": "/wie-ki-funktioniert",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      locale: "en_GB",
      alternateLocale: ["de_DE"],
    });
  });
});
