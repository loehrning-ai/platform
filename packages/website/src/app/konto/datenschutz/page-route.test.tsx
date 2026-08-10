import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getRequestLocaleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

vi.mock("./datenschutz-client", () => ({
  DatenschutzClient: ({ locale }: { locale: string }) => locale,
}));

import DatenschutzPage from "./page";

afterEach(cleanup);

describe("account privacy route locale", () => {
  it.each(["de", "en"] as const)(
    "passes the %s request locale into the client island",
    async (locale) => {
      getRequestLocaleMock.mockResolvedValue(locale);

      render(await DatenschutzPage());

      expect(screen.getByText(locale)).toBeInTheDocument();
    },
  );
});
