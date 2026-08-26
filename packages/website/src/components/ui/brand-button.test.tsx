import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * brand-button.test.tsx (regression coverage)
 *
 * BrandButton has real branching logic worth pinning down:
 *   - href present  -> renders a next/link <a> (with external target/rel),
 *     unless disabled, when it renders inert text; href absent -> renders a native
 *     <button type="button"> whose onClick fires unless disabled;
 *   - variant/surface/size select the flat editorial class recipe, and
 *     `disabled` layers pointer-events-none + opacity.
 *
 * next/link is stubbed to a plain <a> that forwards href + all pass-through
 * props, so the link-branch assertions depend only on BrandButton's own logic.
 */

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: ({ href, children, prefetch, ...rest }: any) =>
      React.createElement(
        "a",
        {
          href: typeof href === "string" ? href : "#",
          "data-prefetch": String(prefetch),
          ...rest,
        },
        children,
      ),
  };
});

import { BrandButton } from "./brand-button";

describe("<BrandButton>", () => {
  describe("element branch: href vs button", () => {
    it("renders a native <button type=button> when no href is given", () => {
      render(<BrandButton>Start</BrandButton>);
      const btn = screen.getByRole("button", { name: "Start" });
      expect(btn.tagName).toBe("BUTTON");
      expect(btn).toHaveAttribute("type", "button");
    });

    it("renders a next/link <a> carrying the href when href is given", () => {
      render(<BrandButton href="/kontakt">Kontakt</BrandButton>);
      const link = screen.getByRole("link", { name: "Kontakt" });
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/kontakt");
    });

    it("can suppress Next.js prefetch for a protected destination", () => {
      render(
        <BrandButton href="/konto" prefetch={false}>
          Konto
        </BrandButton>,
      );
      expect(screen.getByRole("link", { name: "Konto" })).toHaveAttribute(
        "data-prefetch",
        "false",
      );
    });
  });

  describe("button interactions", () => {
    it("fires onClick when the button is clicked", () => {
      const onClick = vi.fn();
      render(<BrandButton onClick={onClick}>Klick</BrandButton>);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("is natively disabled and does not fire onClick while disabled", () => {
      const onClick = vi.fn();
      render(
        <BrandButton onClick={onClick} disabled>
          Klick
        </BrandButton>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("link external + disabled attributes", () => {
    it("adds target=_blank + rel=noopener noreferrer only when external", () => {
      const { rerender } = render(
        <BrandButton href="https://example.de" external>
          Extern
        </BrandButton>,
      );
      const external = screen.getByRole("link");
      expect(external).toHaveAttribute("target", "_blank");
      expect(external).toHaveAttribute("rel", "noopener noreferrer");

      rerender(<BrandButton href="/intern">Intern</BrandButton>);
      const internal = screen.getByRole("link");
      expect(internal).not.toHaveAttribute("target");
      expect(internal).not.toHaveAttribute("rel");
    });

    it("renders a disabled href as inert text instead of a link", () => {
      render(
        <BrandButton href="/x" disabled>
          Deaktiviert
        </BrandButton>,
      );
      expect(screen.queryByRole("link")).toBeNull();
      const inert = screen.getByText("Deaktiviert");
      expect(inert.tagName).toBe("SPAN");
      expect(inert).toHaveAttribute("aria-disabled", "true");
      expect(inert).not.toHaveAttribute("href");
    });
  });

  describe("variant / surface / size class recipe", () => {
    it("applies size classes: default md, sm override", () => {
      const { rerender } = render(<BrandButton>md</BrandButton>);
      expect(screen.getByRole("button").className).toContain("px-6");
      rerender(<BrandButton size="sm">sm</BrandButton>);
      expect(screen.getByRole("button").className).toContain("px-4");
    });

    it("uses a flat framed recipe with a 44px minimum target", () => {
      render(
        <BrandButton variant="primary" surface="light">
          Primaer
        </BrandButton>,
      );
      const cls = screen.getByRole("button").className;
      expect(cls).toContain("bg-brand-orange");
      expect(cls).toContain("rounded-md");
      expect(cls).toContain("min-h-11");
      expect(cls).toContain("border-brand-orange");
      expect(cls).not.toMatch(/shadow-(?:card|card-hover|tile)/);
      expect(cls).not.toMatch(/translate-[xy]/);
    });

    it("ghost keeps geometry stable with a transparent border", () => {
      render(<BrandButton variant="ghost">Ghost</BrandButton>);
      const cls = screen.getByRole("button").className;
      expect(cls).toContain("border-transparent");
      expect(cls).toContain("shadow-none");
    });

    it("disabled layers pointer-events-none + opacity onto the recipe", () => {
      render(<BrandButton disabled>Aus</BrandButton>);
      const cls = screen.getByRole("button").className;
      expect(cls).toContain("pointer-events-none");
      expect(cls).toContain("opacity-40");
    });
  });
});
