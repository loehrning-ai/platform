import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import { localizeOpenSourceArtifact } from "@/lib/open-source/display-copy";
import { ArtifactLedger } from "./artifact-ledger";

describe("<ArtifactLedger>", () => {
  it("keeps detail primary and provenance available without motion", () => {
    const artifact = localizeOpenSourceArtifact(OPEN_SOURCE_ARTIFACTS[0], "de");
    render(<ArtifactLedger locale="de" />);

    const detail = screen.getByRole("link", {
      name: new RegExp(`Detail: ${artifact.title}`),
    });
    expect(detail).toHaveAttribute("href", artifact.href);
    expect(detail).toHaveClass("min-h-11", "bg-brand-orange");

    const disclosure = screen.getByText("Quellstand und Lizenz");
    expect(disclosure).toHaveAttribute(
      "aria-label",
      `Quellstand und Lizenz: ${artifact.title}`,
    );
    fireEvent.click(disclosure);
    const details = disclosure.closest("details");
    expect(details).toHaveAttribute("open");
    expect(
      within(details as HTMLElement).getByRole("link", {
        name: `Gepinnter Quellstand: ${artifact.title}. Wird in einem neuen Tab geöffnet.`,
      }),
    ).toHaveAttribute("href", artifact.source.revisionHref);
    expect(
      within(details as HTMLElement).getByRole("link", {
        name: `Lizenz: ${artifact.title}`,
      }),
    ).toHaveAttribute("href", artifact.license.href);

    const disclosureNames = Array.from(
      document.querySelectorAll("summary[aria-label]"),
      (control) => control.getAttribute("aria-label"),
    ).filter((name): name is string => Boolean(name));
    expect(new Set(disclosureNames).size).toBe(OPEN_SOURCE_ARTIFACTS.length);
  });

  it("localizes the ledger and artifact route", () => {
    const artifact = localizeOpenSourceArtifact(OPEN_SOURCE_ARTIFACTS[0], "en");
    render(<ArtifactLedger locale="en" />);

    expect(screen.getByRole("heading", { name: "Published" })).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: new RegExp(`Details: ${artifact.title}`),
      }),
    ).toHaveAttribute("href", `/en${artifact.href}`);
  });
});
