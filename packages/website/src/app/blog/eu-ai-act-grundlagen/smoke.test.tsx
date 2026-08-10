import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import EuAiActGrundlagenPage, { generateMetadata } from "./page";

describe("EuAiActGrundlagenPage", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it("renders the German article and all seven sections", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    render(await EuAiActGrundlagenPage());

    expect(
      screen.getByRole("heading", { level: 1, name: /EU AI Act/ }),
    ).toBeInTheDocument();
    for (const id of [
      "grundlagen",
      "risikoklassen",
      "zeitplan",
      "stand",
      "rechte",
      "praxis",
      "quellen",
    ]) {
      expect(document.getElementById(id), `section #${id}`).not.toBeNull();
    }
    const text = document.body.textContent ?? "";
    expect(text).toContain("veröffentlicht und in Kraft");
    expect(text).toContain("27. Juli 2026");
    expect(text).toContain("2. August 2026");
    expect(text).toContain("2. Dezember 2027");
    expect(text).toContain("28. Juli 2026");
  });

  it("renders the reviewed English article, links, and metadata without German UI copy", async () => {
    getRequestLocaleMock.mockResolvedValue("en");
    render(await EuAiActGrundlagenPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "The EU AI Act: what it means if you are not a lawyer.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "§ Reading points" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to the blog" }),
    ).toHaveAttribute("href", "/en/blog");
    expect(document.body).toHaveTextContent("Current to 28 July 2026");
    expect(document.body).not.toHaveTextContent("Deine Rechte");
    expect(document.body).not.toHaveTextContent("Weiterlesen");

    const metadata = await generateMetadata();
    expect(metadata.alternates).toMatchObject({
      canonical: "/en/blog/eu-ai-act-grundlagen",
      languages: {
        de: "/blog/eu-ai-act-grundlagen",
        en: "/en/blog/eu-ai-act-grundlagen",
        "x-default": "/blog/eu-ai-act-grundlagen",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      locale: "en_GB",
      url: "https://loehrning.ai/en/blog/eu-ai-act-grundlagen",
    });
  });
});
