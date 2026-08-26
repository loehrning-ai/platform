import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeState = vi.hoisted(() => ({ value: "de" as "de" | "en" }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: vi.fn(() => Promise.resolve(localeState.value)),
}));

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

import CapstoneGalleryPage, { generateMetadata } from "./capstone-gallery/page";

beforeEach(() => {
  localeState.value = "de";
});

afterEach(() => cleanup());

describe("AI-Native supplementary hub design contract", () => {
  const files = [
    "../../components/ai-native/demos-gallery-view.tsx",
    "../../components/ai-native/glossary-view.tsx",
    "../../components/ai-native/fluency-test.tsx",
    "capstone-gallery/page.tsx",
  ] as const;

  it.each(files)("keeps %s compact, flat, and legible", (file) => {
    const source = readFileSync(join(__dirname, file), "utf8");

    expect(source).not.toMatch(
      /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]|\btext-\[0\.(?:5|6\d*|7(?:[0-4]\d*)?)rem\]/,
    );
    expect(source).not.toMatch(/\bshadow-/);
    expect(source).not.toMatch(/hover:-translate/);
    expect(source).not.toMatch(/\brounded(?:-|\b)/);
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/\bbg-dot-pattern/);
    expect(source).not.toMatch(
      /(?<!scroll-)\b(?:mt|mb|gap|py)-(?:14|16|20|24|28|32)\b/,
    );
    expect(source).not.toMatch(/BrandButton|components\/ai-native\/primitives/);
  });

  it("renders the truthful capstone empty state with one early primary action", async () => {
    const { container } = render(await CapstoneGalleryPage());
    const frame = container.querySelector(
      '[data-technical-course="ai-native-capstone-policy"]',
    );
    expect(frame).not.toBeNull();

    const primary = frame?.querySelectorAll(
      '[data-workspace-primary-action="true"]',
    );
    expect(primary).toHaveLength(1);
    expect(frame?.querySelector("header")?.contains(primary?.[0] ?? null)).toBe(
      true,
    );
    expect(primary?.[0]).toHaveAttribute("href", "/ai-native/kurs/modul_1");
    expect(primary?.[0]).toHaveAttribute("data-prefetch", "false");
    expect(primary?.[0]).toHaveClass("min-h-12");
    expect(screen.getByRole("status")).toHaveTextContent("0 Einträge");
    expect(
      screen
        .getByText("Grenze zwischen Abschluss und Veröffentlichung")
        .closest("summary"),
    ).toHaveClass("min-h-12");
    expect(frame?.querySelector("img")).toBeNull();
  });

  it("retains every publication criterion and locale-safe metadata", async () => {
    const { container } = render(await CapstoneGalleryPage());
    expect(container.querySelectorAll("ol li")).toHaveLength(7);
    expect(
      screen.getByRole("heading", { name: "Problem ist echt" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ablösbar" })).toBeVisible();

    localeState.value = "en";
    expect(await generateMetadata()).toMatchObject({
      title: "Capstone publication policy: AI-Native course",
      robots: { index: false, follow: true },
      alternates: { canonical: "/en/ai-native/capstone-gallery" },
      openGraph: {
        url: "https://loehrning.ai/en/ai-native/capstone-gallery",
        locale: "en_GB",
      },
    });
  });
});
