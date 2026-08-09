import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const localeState = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(() => Promise.resolve(localeState.value)),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { readonly alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    readonly prefetch?: boolean;
    readonly children?: ReactNode;
  }) => (
    <a {...props} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
}));

import KiUndGesellschaftLandingPage, { generateMetadata } from "./page";

describe("KI und Gesellschaft course landing page", () => {
  it("does not prefetch the protected course from its public CTAs", async () => {
    localeState.value = "de";
    render(await KiUndGesellschaftLandingPage());

    const startLinks = screen.getAllByRole("link", {
      name: /Mit Lernkonto starten/,
    });
    expect(startLinks).toHaveLength(2);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/ki-und-gesellschaft/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
  });

  it("renders the reviewed English copy and keeps all internal CTAs localized", async () => {
    localeState.value = "en";
    render(await KiUndGesellschaftLandingPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Assess work, deepfakes,\s*and bias\./,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("AI and work")).toBeInTheDocument();
    expect(
      screen.getByText(/cannot be assessed with one checklist/),
    ).toBeInTheDocument();

    const startLinks = screen.getAllByRole("link", {
      name: /Start with a learning account/,
    });
    expect(startLinks).toHaveLength(2);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/en/ki-und-gesellschaft/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
    expect(screen.getByRole("link", { name: /All courses/ })).toHaveAttribute(
      "href",
      "/en/kurse",
    );
    expect(
      screen.getByRole("link", { name: /Continue to the EU AI Act/ }),
    ).toHaveAttribute("href", "/en/eu-ai-act-kurs");

    const graph = JSON.parse(
      document.getElementById("ki-und-gesellschaft-landing-jsonld")
        ?.textContent ?? "{}",
    ) as { "@graph"?: Array<Record<string, unknown>> };
    expect(
      graph["@graph"]?.find((entry) => entry["@type"] === "Course"),
    ).toMatchObject({
      inLanguage: "en",
      url: "https://loehrning.ai/en/ki-und-gesellschaft",
      isAccessibleForFree: true,
    });
  });

  it("emits localized canonical, hreflang, Open Graph, and cover metadata", async () => {
    localeState.value = "en";
    const metadata = await generateMetadata();

    expect(metadata.title).toBe(
      "AI and Society: assess work, deepfakes, and bias",
    );
    expect(metadata.alternates).toEqual({
      canonical: "/en/ki-und-gesellschaft",
      languages: {
        de: "/ki-und-gesellschaft",
        en: "/en/ki-und-gesellschaft",
        "x-default": "/ki-und-gesellschaft",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      url: "https://loehrning.ai/en/ki-und-gesellschaft",
      locale: "en_GB",
      alternateLocale: ["de_DE"],
      images: [
        {
          url: "https://loehrning.ai/course-covers/ki-und-gesellschaft-cover-v2.webp",
          width: 610,
          height: 610,
        },
      ],
    });
  });
});
