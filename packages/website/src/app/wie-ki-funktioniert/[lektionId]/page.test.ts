import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WIE_KI_LEKTIONEN } from "@/lib/wie-ki-funktioniert";
import LektionPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

describe("/wie-ki-funktioniert/[lektionId] static route contract", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockResolvedValue("de");
  });

  it("prerenders every reviewed lesson and rejects unknown on-demand slugs", async () => {
    expect(dynamicParams).toBe(false);
    expect(await generateStaticParams()).toEqual(
      WIE_KI_LEKTIONEN.map(({ id }) => ({ lektionId: id })),
    );
  });

  it("does not emit indexable metadata for an unknown lesson", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        lektionId: "diese-lektion-gibt-es-nicht",
      }),
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toEqual({ canonical: null });
  });

  it("uses descriptive breadcrumb link text for the homepage", async () => {
    render(
      await LektionPage({
        params: Promise.resolve({ lektionId: "lektion-1-vorhersage" }),
      }),
    );
    expect(screen.getByRole("link", { name: "Startseite" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.queryByRole("link", { name: "Start" }),
    ).not.toBeInTheDocument();
  });

  it("renders English lesson copy, controls, links, and structured data", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    render(
      await LektionPage({
        params: Promise.resolve({ lektionId: "lektion-1-vorhersage" }),
      }),
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Token prediction/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quick self-check" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByRole("link", { name: /Next lesson/ })).toHaveAttribute(
      "href",
      "/en/wie-ki-funktioniert/lektion-2-trainingsdaten",
    );
    expect(
      JSON.parse(
        document.querySelector("#wie-ki-lesson-jsonld")?.textContent ?? "{}",
      ),
    ).toMatchObject({
      "@graph": expect.arrayContaining([
        expect.objectContaining({
          "@type": "LearningResource",
          inLanguage: "en",
          url: "https://loehrning.ai/en/wie-ki-funktioniert/lektion-1-vorhersage",
        }),
      ]),
    });
  });

  it("emits localized canonical, hreflang, Open Graph locale, and title", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    const metadata = await generateMetadata({
      params: Promise.resolve({ lektionId: "lektion-1-vorhersage" }),
    });

    expect(metadata.title).toContain("Token prediction");
    expect(metadata.alternates).toMatchObject({
      canonical: "/en/wie-ki-funktioniert/lektion-1-vorhersage",
      languages: {
        de: "/wie-ki-funktioniert/lektion-1-vorhersage",
        en: "/en/wie-ki-funktioniert/lektion-1-vorhersage",
      },
    });
    expect(metadata.openGraph).toMatchObject({ locale: "en_GB" });
  });
});
