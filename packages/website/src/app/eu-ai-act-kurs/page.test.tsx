import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(),
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

import { getRequestLocale } from "@/lib/i18n/request-locale";
import EuAiActKursLandingPage, { generateMetadata } from "./page";

describe("EU AI Act course landing page", () => {
  beforeEach(() => {
    vi.mocked(getRequestLocale).mockResolvedValue("de");
  });

  it("does not prefetch the protected course from its public CTAs", async () => {
    render(await EuAiActKursLandingPage());

    const startLinks = screen.getAllByRole("link", {
      name: /Kurs mit Lernkonto starten/,
    });
    expect(startLinks).toHaveLength(1);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/eu-ai-act-kurs/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
  });

  it("renders the audited English landing, localized links, and accurate lesson count", async () => {
    vi.mocked(getRequestLocale).mockResolvedValue("en");
    render(await EuAiActKursLandingPage());

    expect(
      screen.getByRole("heading", { name: /Map roles, risks, and duties/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("24 Lessons")).toBeInTheDocument();
    expect(
      screen.getByText(/Article 4 has applied since 2 February 2025/),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/not legal advice/)).toHaveLength(1);
    expect(
      screen.queryByText(
        /not accredited, server-signed, or evidence of legal compliance/,
      ),
    ).not.toBeInTheDocument();

    const startLinks = screen.getAllByRole("link", {
      name: /Start with a learning account/,
    });
    expect(startLinks).toHaveLength(1);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/en/eu-ai-act-kurs/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }

    const graph = JSON.parse(
      document.getElementById("eu-ai-act-landing-jsonld")?.textContent ?? "{}",
    ) as { "@graph"?: Array<Record<string, unknown>> };
    expect(
      graph["@graph"]?.find((entry) => entry["@type"] === "Course"),
    ).toMatchObject({
      inLanguage: "en",
      url: "https://loehrning.ai/en/eu-ai-act-kurs",
      isAccessibleForFree: true,
    });
  });

  it("emits localized canonical, hreflang, Open Graph, and cover metadata", async () => {
    vi.mocked(getRequestLocale).mockResolvedValue("en");
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("EU AI Act Course: roles, risks, and duties");
    expect(metadata.alternates).toMatchObject({
      canonical: "/en/eu-ai-act-kurs",
      languages: {
        de: "/eu-ai-act-kurs",
        en: "/en/eu-ai-act-kurs",
        "x-default": "/eu-ai-act-kurs",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      url: "https://loehrning.ai/en/eu-ai-act-kurs",
      locale: "en_GB",
      alternateLocale: ["de_DE"],
      images: [
        {
          url: "https://loehrning.ai/course-covers/eu-ai-act-kurs-cover-v3.webp",
          width: 1440,
          height: 630,
          alt: "Editorial process graphic showing image cards passing through review stages, colour-coded risk classes, and a final check",
        },
      ],
    });
  });
});
