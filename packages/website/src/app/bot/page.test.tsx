import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestLocale = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: () => Promise.resolve(requestLocale.value),
}));

import BotPage, { generateMetadata } from "./page";

describe("loehrningBot page", () => {
  beforeEach(() => {
    requestLocale.value = "de";
  });

  it("states the exact User-Agent and the opt-out in robots.txt", async () => {
    const { container } = render(await BotPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "loehrningBot" }),
    ).toBeVisible();
    expect(container).toHaveTextContent(
      "loehrningBot/1.0 (+https://loehrning.ai/bot)",
    );
    expect(container).toHaveTextContent("User-agent: loehrningBot");
    expect(container).toHaveTextContent("Disallow: /");
  });

  it("uses the contact address of the Impressum and states the guarantees", async () => {
    const { container } = render(await BotPage());

    expect(container).toHaveTextContent("tim@loehrning.ai");
    expect(container).toHaveTextContent("weniger als 5");
    expect(container).toHaveTextContent("tdm-reservation");
    expect(container).toHaveTextContent("§ 44b UrhG");
    expect(container.textContent).not.toMatch(/[–—]/);
    expect(container.textContent).not.toMatch(/compliant|certified/i);
  });

  it("renders a complete English page without German leftovers", async () => {
    requestLocale.value = "en";
    const { container } = render(await BotPage());

    expect(container).toHaveTextContent("Groups with fewer than 5 entries");
    expect(container).toHaveTextContent("not legal advice");
    expect(container.textContent).not.toMatch(/Rechtsgrundlage|Startseite/);
    expect(container.textContent).not.toMatch(/[–—]/);
  });

  it("publishes localized canonical and reciprocal alternates", async () => {
    requestLocale.value = "en";
    const metadata = await generateMetadata();

    expect(metadata.alternates?.canonical).toBe("/en/bot");
    expect(metadata.alternates?.languages).toMatchObject({
      de: "/bot",
      en: "/en/bot",
    });
  });
});
