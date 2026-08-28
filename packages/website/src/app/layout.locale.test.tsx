import { Children, isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HydrationMarker } from "@/components/hydration-marker";
import { ScrollProgress } from "@/components/ui/scroll-progress";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "font-geist-test" }),
}));
vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import RootLayout, { generateMetadata } from "./layout";

describe("root layout locale", () => {
  beforeEach(() => {
    getRequestLocaleMock.mockReset();
  });

  it.each(["de", "en"] as const)(
    "sets the document language from the middleware-owned %s locale",
    async (locale) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const root = await RootLayout({ children: <p>content</p> });

      expect(root.type).toBe("html");
      expect(root.props.lang).toBe(locale);
    },
  );

  it("keeps the streamed main host outside client-provider ownership", async () => {
    getRequestLocaleMock.mockResolvedValue("de");
    const root = await RootLayout({ children: <p>content</p> });
    const body = Children.only(root.props.children);
    expect(isValidElement(body)).toBe(true);
    const bodyChildren = Children.toArray(
      (body as React.ReactElement<{ children: React.ReactNode }>).props
        .children,
    );
    const main = bodyChildren.find(
      (child) => isValidElement(child) && child.type === "main",
    );
    expect(isValidElement(main)).toBe(true);
    if (!isValidElement(main)) throw new Error("Root main is missing");

    const mainChildren = Children.toArray(
      (main as React.ReactElement<{ children: React.ReactNode }>).props.children,
    );
    expect(mainChildren).toHaveLength(2);
    expect(isValidElement(mainChildren[1]) && mainChildren[1].type).toBe("p");
    expect(
      bodyChildren.some(
        (child) => isValidElement(child) && child.type === HydrationMarker,
      ),
    ).toBe(true);
    expect(
      bodyChildren.filter(
        (child) => isValidElement(child) && child.type === ScrollProgress,
      ),
    ).toHaveLength(1);
  });

  it.each([
    [
      "de",
      "de_DE",
      "en_GB",
      "Freie KI- und Daten-Lernplattform",
      "/site.webmanifest",
    ],
    [
      "en",
      "en_GB",
      "de_DE",
      "Open AI and data learning platform",
      "/site.en.webmanifest",
    ],
  ] as const)(
    "owns the root metadata language for %s",
    async (
      locale,
      openGraphLocale,
      alternateLocale,
      descriptionStart,
      manifest,
    ) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      const metadata = await generateMetadata();

      expect(metadata.description).toContain(descriptionStart);
      expect(metadata.manifest).toBe(manifest);
      expect(metadata.openGraph).toMatchObject({
        locale: openGraphLocale,
        alternateLocale: [alternateLocale],
      });
    },
  );
});
