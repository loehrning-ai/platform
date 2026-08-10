import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestLocaleMock } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
}));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

import NotFound from "./not-found";

afterEach(cleanup);

describe("root not-found boundary", () => {
  beforeEach(() => getRequestLocaleMock.mockReset());

  it.each([
    ["de", "Seite nicht gefunden.", "Zur Startseite", "/"],
    ["en", "Page not found.", "Back to home", "/en"],
  ] as const)(
    "renders the %s recovery path",
    async (locale, title, homeLabel, href) => {
      getRequestLocaleMock.mockResolvedValue(locale);
      render(await NotFound());

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        title,
      );
      expect(screen.getByRole("link", { name: homeLabel })).toHaveAttribute(
        "href",
        href,
      );
    },
  );
});
