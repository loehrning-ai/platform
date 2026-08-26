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

import KiFuehrerscheinLandingPage, { generateMetadata } from "./page";

describe("KI-Führerschein landing page", () => {
  it("does not prefetch the protected course from its public CTAs", async () => {
    localeState.value = "de";
    render(await KiFuehrerscheinLandingPage());

    const startLinks = screen.getAllByRole("link", {
      name: /Kostenlos mit Lernkonto starten/,
    });
    expect(startLinks).toHaveLength(1);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
  });

  it("renders the reviewed English copy and keeps every internal CTA in /en", async () => {
    localeState.value = "en";
    render(await KiFuehrerscheinLandingPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /AI at work:\s*what you need to know\./,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("AI is already here")).toBeInTheDocument();
    expect(
      screen.getByText(/does not establish organization-wide compliance/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Article 4/)).toHaveLength(1);
    expect(
      screen.getByText(
        /locally generated PDF records completion of this course/,
      ),
    ).toBeInTheDocument();

    const startLinks = screen.getAllByRole("link", {
      name: /Start with a free learning account/,
    });
    expect(startLinks).toHaveLength(1);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/en/ki-fuehrerschein/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
    expect(
      screen.getByRole("link", { name: /Study the EU AI Act in depth/ }),
    ).toHaveAttribute("href", "/en/eu-ai-act-kurs");
  });

  it("emits locale-specific canonical, hreflang, and Open Graph metadata", async () => {
    localeState.value = "en";
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("Everyday AI Literacy: free foundation course");
    expect(metadata.alternates).toEqual({
      canonical: "/en/ki-fuehrerschein",
      languages: {
        de: "/ki-fuehrerschein",
        en: "/en/ki-fuehrerschein",
        "x-default": "/ki-fuehrerschein",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      url: "https://loehrning.ai/en/ki-fuehrerschein",
      locale: "en_GB",
    });
  });
});
