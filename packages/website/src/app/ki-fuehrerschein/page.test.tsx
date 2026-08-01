import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import KiFuehrerscheinLandingPage from "./page";

describe("KI-Führerschein landing page", () => {
  it("does not prefetch the protected course from its public CTAs", async () => {
    render(await KiFuehrerscheinLandingPage());

    const startLinks = screen.getAllByRole("link", {
      name: /Kostenlos mit Lernkonto starten/,
    });
    expect(startLinks).toHaveLength(2);
    for (const link of startLinks) {
      expect(link).toHaveAttribute("href", "/ki-fuehrerschein/kurs");
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
  });
});
