import { existsSync } from "node:fs";
import { join } from "node:path";
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
    expect(startLinks).toHaveLength(1);
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
        name: /Check numbers, fakes,\s*and fairness\./,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reading jobs figures")).toBeInTheDocument();
    // Outcomes are concrete abilities, one per module.
    expect(
      screen.getByText("Read any “X% of jobs” headline correctly"),
    ).toBeInTheDocument();
    expect(screen.getByText("Verify a viral clip in five steps")).toBeInTheDocument();
    expect(
      screen.getByText("Explain why two fairness measures cannot both hold"),
    ).toBeInTheDocument();
    expect(screen.getByText("3 modules, 8 hands-on lessons")).toBeInTheDocument();

    const startLinks = screen.getAllByRole("link", {
      name: /Start with a learning account/,
    });
    expect(startLinks).toHaveLength(1);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/en/ki-und-gesellschaft/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
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
      hasCourseInstance: { courseWorkload: "PT40M" },
    });
  });

  it("emits localized canonical, hreflang, Open Graph, and cover metadata", async () => {
    localeState.value = "en";
    const metadata = await generateMetadata();

    expect(metadata.title).toBe(
      "AI and Society: check jobs figures, fakes, and fairness",
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
    });
    // No page image: the route's opengraph-image.tsx (the Lemons card) is the
    // share image, and an explicit one here would replace it (SPEC §3.15).
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(existsSync(join(__dirname, "opengraph-image.tsx"))).toBe(true);
  });
});
