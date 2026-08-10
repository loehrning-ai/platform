import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import LicensePolicyPage, { generateMetadata } from "./page";

describe("LicensePolicyPage", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
    getRequestLocaleMock.mockResolvedValue("de");
  });

  it.each([
    ["de", "Lizenzrichtlinie", "/open-source", "SHA-256 des Richtlinientexts"],
    ["en", "License policy", "/en/open-source", "SHA-256 of the policy text"],
  ] as const)(
    "renders the %s shell around the exact English policy source",
    async (locale, title, backHref, digestLabel) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const { container } = render(await LicensePolicyPage());

      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /open source/i })).toHaveAttribute(
        "href",
        backHref,
      );
      expect(screen.getByText(digestLabel)).toBeInTheDocument();
      expect(container.querySelector("pre")?.textContent).toContain(
        "# License Policy",
      );
      expect(container.querySelector("pre")?.textContent).toContain(
        "## Brand and trademarks: reuse not granted",
      );
    },
  );

  it.each([
    ["de", "/open-source/lizenzrichtlinie", "de_DE"],
    ["en", "/en/open-source/lizenzrichtlinie", "en_GB"],
  ] as const)(
    "uses the %s metadata canonical and locale",
    async (locale, canonical, openGraphLocale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.alternates).toMatchObject({ canonical });
      expect(metadata.openGraph).toMatchObject({
        locale: openGraphLocale,
        url: `https://loehrning.ai${canonical}`,
      });
    },
  );
});
