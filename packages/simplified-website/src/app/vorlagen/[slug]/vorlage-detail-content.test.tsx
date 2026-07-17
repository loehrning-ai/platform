import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getVorlageBySlug } from "@/lib/vorlagen";
import { VorlageDetailContent } from "./vorlage-detail-content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("VorlageDetailContent learning links", () => {
  it("links current educational content and never the retired Digify post", () => {
    const vorlage = getVorlageBySlug("ki-inventarliste");
    expect(vorlage).not.toBeNull();
    render(<VorlageDetailContent vorlage={vorlage!} related={[]} />);

    expect(
      screen.getByRole("link", { name: /EU AI Act Grundlagen lesen/ }),
    ).toHaveAttribute("href", "/blog/eu-ai-act-grundlagen");
    expect(document.querySelector('a[href="/blog/digify"]')).toBeNull();
    expect(
      screen.getByRole("navigation", { name: "Vorlagennavigation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zurück zu allen Vorlagen" }),
    ).toHaveAttribute("href", "/vorlagen");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Kontext vor dem Ausfüllen klären.",
      }),
    ).toBeInTheDocument();
  });
});
