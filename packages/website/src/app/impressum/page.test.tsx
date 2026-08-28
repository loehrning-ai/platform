import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestLocale = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: () => Promise.resolve(requestLocale.value),
}));

import ImpressumPage from "./page";

describe("Impressum", () => {
  beforeEach(() => {
    requestLocale.value = "de";
  });

  it("renders email-first contact without placeholder text while no address is published", async () => {
    const { container } = render(await ImpressumPage());
    expect(container.textContent).not.toMatch(/Launch-Blocker/);
    expect(container.textContent).not.toMatch(
      /ladungsfähige Anschrift ist noch nicht eingetragen/i,
    );
    expect(
      screen.getAllByText(/tim@loehrning\.ai/).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("links the published LinkedIn profile from the visible legal contact", async () => {
    render(await ImpressumPage());

    expect(
      screen.getByRole("link", {
        name: "linkedin.com/in/tim-loehr-821ba8188",
      }),
    ).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/tim-loehr-821ba8188/",
    );
  });

  it("does not repeat obsolete DDG liability boilerplate", async () => {
    const { container } = render(await ImpressumPage());
    expect(container.textContent).not.toMatch(/§§?\s*7|§§?\s*8\s*bis\s*10/);
    expect(container.textContent).toMatch(
      /Gesetzliche Haftungsregeln werden durch diesen Hinweis nicht eingeschränkt/,
    );
  });

  it("describes the repository as multi-licensed", async () => {
    render(await ImpressumPage());
    expect(
      screen.getByText(/unterschiedlichen Lizenzen und Nutzungsrechten/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/gewährt nicht automatisch Rechte an Kursprosa/i),
    ).toBeInTheDocument();
  });

  it("renders a complete English legal notice with the same legal boundaries", async () => {
    requestLocale.value = "en";
    const { container } = render(await ImpressumPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "Legal notice" }),
    ).toBeVisible();
    expect(screen.getByText("Information under Section 5 DDG")).toBeVisible();
    expect(container).toHaveTextContent(
      "This notice does not restrict statutory liability",
    );
    expect(container).toHaveTextContent(
      "does not automatically grant rights to course prose",
    );
    expect(container.textContent).not.toMatch(
      /Haftungsausschluss|Urheberrecht|Angaben gemäß/,
    );
  });
});
