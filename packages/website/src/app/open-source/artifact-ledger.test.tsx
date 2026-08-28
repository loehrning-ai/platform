import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import { localizeOpenSourceArtifact } from "@/lib/open-source/display-copy";
import { ArtifactLedger } from "./artifact-ledger";

describe("<ArtifactLedger>", () => {
  it("keeps the real preview dominant while actions and evidence remain available", () => {
    const artifact = localizeOpenSourceArtifact(OPEN_SOURCE_ARTIFACTS[0], "de");
    render(<ArtifactLedger locale="de" />);

    const detail = screen.getByRole("link", {
      name: `Detail ansehen: ${artifact.title}`,
    });
    expect(detail).toHaveAttribute("href", artifact.href);
    expect(detail).toHaveClass("min-h-11", "bg-brand-orange");

    const source = screen.getByRole("link", {
      name: `Quellcode: ${artifact.title}. Wird in einem neuen Tab geöffnet.`,
    });
    expect(source).toHaveAttribute("href", artifact.source.revisionHref);
    expect(source).toHaveAttribute("target", "_blank");
    expect(source).toHaveAttribute("rel", "noopener noreferrer");

    expect(screen.getByText("Lokal", { exact: true })).toBeVisible();
    expect(screen.getByText("MIT", { exact: true })).toBeVisible();
    expect(screen.getByText("Experimentell", { exact: true })).toBeVisible();
    expect(
      screen.getByRole("region", {
        name: `Produktansichten auswählen: ${artifact.title}`,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Editor anzeigen" }),
    ).toHaveAttribute("aria-pressed", "true");

    const previewSheet = document.querySelector(
      "[data-open-source-preview-sheet]",
    );
    const factRail = document.querySelector("[data-open-source-fact-rail]");
    expect(previewSheet).toHaveClass("order-1");
    expect(factRail?.children).toHaveLength(4);
    expect(
      Array.from(factRail?.children ?? []).every((fact) =>
        fact.getAttribute("style")?.includes("--color-brand-"),
      ),
    ).toBe(true);

    const disclosure = screen.getByText("Quellstand und Veröffentlichung");
    expect(disclosure).toHaveAttribute(
      "aria-label",
      `Quellstand und Veröffentlichung: ${artifact.title}`,
    );
    fireEvent.click(disclosure);
    const details = disclosure.closest("details");
    expect(details).toHaveAttribute("open");
    expect(
      within(details as HTMLElement).getByRole("link", {
        name: new RegExp(
          `^Gepinnter Quellstand ${artifact.source.revision.slice(0, 12)}.*Wird in einem neuen Tab geöffnet\\.$`,
        ),
      }),
    ).toHaveAttribute("href", artifact.source.revisionHref);
    expect(
      within(details as HTMLElement).getByRole("link", {
        name: `Lizenz: ${artifact.license.licenseId}`,
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

    expect(
      screen.getByRole("heading", { name: "Published now" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: `View details: ${artifact.title}`,
      }),
    ).toHaveAttribute("href", `/en${artifact.href}`);
    expect(screen.getByRole("button", { name: "Show Editor" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
