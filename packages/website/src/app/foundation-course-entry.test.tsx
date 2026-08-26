import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeState = vi.hoisted(() => ({ value: "en" as "de" | "en" }));

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

import AiNativePage from "./ai-native/page";
import EuAiActPage from "./eu-ai-act-kurs/page";
import KiFuehrerscheinPage from "./ki-fuehrerschein/page";
import KiUndGesellschaftPage from "./ki-und-gesellschaft/page";
import { getModules } from "@/lib/ai-native/data";
import { getBlocks } from "@/lib/course/data";
import { __resetCacheForTests } from "@/lib/progress";

beforeEach(() => {
  localeState.value = "en";
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(() => cleanup());

const ROUTES = [
  {
    id: "ai-native",
    renderPage: AiNativePage,
    action: "Start with module 1",
    href: "/en/ai-native/kurs/modul_1",
  },
  {
    id: "eu-ai-act-kurs",
    renderPage: EuAiActPage,
    action: "Start with a learning account",
    href: "/en/eu-ai-act-kurs/kurs",
  },
  {
    id: "ki-fuehrerschein",
    renderPage: KiFuehrerscheinPage,
    action: "Start with a free learning account",
    href: "/en/ki-fuehrerschein/kurs",
  },
  {
    id: "ki-und-gesellschaft",
    renderPage: KiUndGesellschaftPage,
    action: "Start with a learning account",
    href: "/en/ki-und-gesellschaft/kurs",
  },
] as const;

describe("foundation course entry contract", () => {
  it.each(ROUTES)(
    "$id exposes one first-view primary action, progress, and collapsed boundaries",
    async ({ id, renderPage, action, href }) => {
      const { container } = render(await renderPage());
      const frame = container.querySelector(`[data-technical-course="${id}"]`);
      expect(frame).not.toBeNull();

      const primary = screen.getByRole("link", { name: action });
      expect(primary).toHaveAttribute("href", href);
      expect(primary).toHaveAttribute("data-prefetch", "false");

      const emphasizedLinks = Array.from(
        frame?.querySelectorAll("a") ?? [],
      ).filter((link) => link.classList.contains("bg-brand-orange"));
      expect(emphasizedLinks).toEqual([primary]);
      expect(frame?.querySelector("header")?.contains(primary)).toBe(true);
      expect(frame?.querySelector('[role="progressbar"]')).not.toBeNull();
      expect(frame?.querySelector("details")).not.toBeNull();
      expect(frame?.querySelector("img")).toBeNull();

      for (const link of frame?.querySelectorAll("a") ?? []) {
        expect(link.getAttribute("href")).toMatch(/^\/en\//);
      }
    },
  );

  it("keeps every audited module and block visible in the compact ledgers", async () => {
    render(await AiNativePage());
    for (const module of getModules("en")) {
      expect(screen.getByRole("heading", { name: module.title })).toBeVisible();
    }
    cleanup();

    for (const [courseSlug, renderPage] of [
      ["eu-ai-act-kurs", EuAiActPage],
      ["ki-fuehrerschein", KiFuehrerscheinPage],
      ["ki-und-gesellschaft", KiUndGesellschaftPage],
    ] as const) {
      render(await renderPage());
      for (const block of getBlocks(courseSlug, "en")) {
        expect(
          screen.getByRole("heading", { name: block.title }),
        ).toBeVisible();
      }
      cleanup();
    }
  });
});

const PAGE_FILES = [
  "ai-native/page.tsx",
  "eu-ai-act-kurs/page.tsx",
  "ki-fuehrerschein/page.tsx",
  "ki-und-gesellschaft/page.tsx",
] as const;

describe("foundation course source contract", () => {
  it.each(PAGE_FILES)("keeps %s dense, flat, and legible", (file) => {
    const source = readFileSync(join(__dirname, file), "utf8");

    expect(source).not.toMatch(
      /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]|\btext-\[0\.(?:5|6\d*|7(?:[0-4]\d*)?)rem\]/,
    );
    expect(source).not.toMatch(/shadow-\[/);
    expect(source).not.toMatch(/hover:-translate/);
    expect(source).not.toMatch(/\btransition-all\b/);
    expect(source).not.toMatch(/\b(?:mt|mb|gap)-(?:14|16|20|24|28|32)\b/);
    expect(source.match(/TECHNICAL_COURSE_PRIMARY_ACTION_CLASS/g)).toHaveLength(
      2,
    );
  });
});
