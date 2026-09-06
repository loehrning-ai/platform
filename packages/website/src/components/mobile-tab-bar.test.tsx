import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

const { getRequestLocaleMock, cookieState } = vi.hoisted(() => ({
  getRequestLocaleMock: vi.fn(),
  cookieState: { names: [] as string[] },
}));

const pathnameState = vi.hoisted(() => ({ value: "/" as string | null }));

vi.mock("@/lib/i18n/request-locale", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

// The cookie store stays mocked even though the bar no longer reads it. It is
// the live half of the cache-variance guard below: put a session cookie in the
// request, and every destination must still be the signed-out one.
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => cookieState.names.map((name) => ({ name, value: "x" })),
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
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

import { MobileTabBar, buildMobileTabs } from "./mobile-tab-bar";
import { isActiveTab } from "./mobile-tab-bar-links";

const SESSION_COOKIE = "sb-abcdefghijklmnopqrst-auth-token";

async function renderTabBar({
  locale = "de",
  cookieNames = [] as readonly string[],
  pathname = "/" as string | null,
}: {
  readonly locale?: "de" | "en";
  readonly cookieNames?: readonly string[];
  readonly pathname?: string | null;
} = {}) {
  getRequestLocaleMock.mockResolvedValueOnce(locale);
  cookieState.names = [...cookieNames];
  pathnameState.value = pathname;
  render(await MobileTabBar());
}

function tabBar(): HTMLElement {
  const bar = document.querySelector<HTMLElement>("[data-mobile-tab-bar]");
  expect(bar).not.toBeNull();
  return bar as HTMLElement;
}

beforeEach(() => {
  getRequestLocaleMock.mockReset();
  cookieState.names = [];
  pathnameState.value = "/";
});

afterEach(() => {
  cleanup();
});

describe("mobile tab bar destinations and copy", () => {
  it("renders four German tabs on unprefixed destinations for a signed-out visitor", async () => {
    await renderTabBar({ locale: "de" });

    const bar = screen.getByRole("navigation", { name: "Schnellnavigation" });
    const links = within(bar).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Start",
      "Kurse",
      "Werkzeuge",
      "Konto",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/kurse",
      "/open-source",
      "/konto",
    ]);
  });

  it("renders reviewed English copy and keeps every destination under /en", async () => {
    await renderTabBar({ locale: "en" });

    const bar = screen.getByRole("navigation", { name: "Quick navigation" });
    const links = within(bar).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Home",
      "Courses",
      "Tools",
      "Account",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/en",
      "/en/kurse",
      "/en/open-source",
      "/en/konto",
    ]);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^\/en(?:\/|#|$)/);
    }
  });

  it("carries an accessible name distinct from the site navigation", async () => {
    await renderTabBar({ locale: "de" });

    expect(
      screen.queryByRole("navigation", { name: "Hauptnavigation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Schnellnavigation" }),
    ).toBe(tabBar());
  });

  it("keeps the Werkzeuge tab on the public tools surface, which has an anchor that exists", async () => {
    // `/konto#werkzeuge` was the earlier signed-in destination and no element
    // on the account page carries that id, so it resolved to the top of
    // `/konto` - the Konto tab's own destination.
    await renderTabBar({ locale: "de" });

    expect(screen.getByRole("link", { name: "Werkzeuge" })).toHaveAttribute(
      "href",
      "/open-source",
    );
  });
});

describe("mobile tab bar cache variance", () => {
  // Public documents carry `public, max-age=3600, s-maxage=3600` from
  // `src/proxy.ts` without `Vary: Cookie`, and this bar is in every one of
  // them. Anything here that varies by cookie makes one shared-cache entry
  // serve either audience the other's variant.
  const VARIANCE_COOKIES = [
    SESSION_COOKIE,
    `${SESSION_COOKIE}.0`,
    `${SESSION_COOKIE}.1`,
    `${SESSION_COOKIE}-code-verifier`,
    "loehrning-locale",
  ];

  it("renders the same German destinations with a session cookie present", async () => {
    await renderTabBar({ locale: "de", cookieNames: VARIANCE_COOKIES });

    const links = within(tabBar()).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/kurse",
      "/open-source",
      "/konto",
    ]);
  });

  it("renders the same English destinations with a session cookie present", async () => {
    await renderTabBar({ locale: "en", cookieNames: VARIANCE_COOKIES });

    const links = within(tabBar()).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/en",
      "/en/kurse",
      "/en/open-source",
      "/en/konto",
    ]);
  });

  it("reads no cookie at all, so the cached document cannot fragment", () => {
    // The behavioural guards above only catch a cookie that changes an href.
    // A cookie read that merely personalizes an attribute or a label would
    // fragment the same cached document just as badly, so the source itself is
    // pinned: `Vary: Cookie` belongs to route-level auth and protected paths,
    // never to a public document.
    const code = readFileSync(join(__dirname, "mobile-tab-bar.tsx"), "utf8")
      // Comments are stripped so the rule can be explained in the file it
      // governs without the explanation tripping the rule.
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    expect(code).not.toContain("next/headers");
    expect(code).not.toMatch(/\bcookies\s*\(/);
  });
});

describe("mobile tab bar active state", () => {
  it("marks exactly one tab as the current page inside a course tree", async () => {
    await renderTabBar({
      locale: "de",
      pathname: "/kurse/open-source/claude",
    });

    const current = within(tabBar()).getAllByRole("link", { current: "page" });
    expect(current.map((link) => link.textContent)).toEqual(["Kurse"]);
  });

  it("resolves the locale prefix before deciding the active tab", async () => {
    await renderTabBar({ locale: "en", pathname: "/en/konto" });

    const current = within(tabBar()).getAllByRole("link", { current: "page" });
    expect(current.map((link) => link.textContent)).toEqual(["Account"]);
  });

  it("keeps the Konto tab alone on the account page", async () => {
    await renderTabBar({
      locale: "de",
      pathname: "/konto",
    });

    const current = within(tabBar()).getAllByRole("link", { current: "page" });
    expect(current.map((link) => link.textContent)).toEqual(["Konto"]);
  });

  it("matches the start tab exactly and never as a prefix", () => {
    expect(isActiveTab("/", "/")).toBe(true);
    expect(isActiveTab("/", "/en")).toBe(true);
    expect(isActiveTab("/", "/kurse")).toBe(false);
    expect(isActiveTab("/kurse", "/kurse")).toBe(true);
    expect(isActiveTab("/kurse", "/kurse/open-source")).toBe(true);
    expect(isActiveTab("/kurse", "/kursebesteller")).toBe(false);
  });

  it("marks no tab when the router has no pathname yet", async () => {
    await renderTabBar({ locale: "de", pathname: null });

    expect(
      within(tabBar()).queryAllByRole("link", { current: "page" }),
    ).toHaveLength(0);
  });
});

describe("mobile tab bar shell contract", () => {
  it("hides itself from lg upwards and in both forms of reader focus mode", async () => {
    await renderTabBar({ locale: "de" });
    const className = tabBar().className;

    expect(className).toContain("lg:hidden");
    expect(className).toContain("[:root[data-reader=focus]_&]:hidden");
    expect(className).toContain("[body:has([data-reader=focus])_&]:hidden");
  });

  it("pads itself with the device insets and takes its height from the token", async () => {
    await renderTabBar({ locale: "de" });
    const bar = tabBar();

    expect(bar.className).toContain("pb-safe");
    expect(bar.className).toContain("px-safe");
    expect(bar.className).toContain("fixed inset-x-0 bottom-0 z-40");
    expect(bar.querySelector("[data-mobile-tab-row]")?.className).toContain(
      "h-[var(--tabbar-h)]",
    );
  });

  it("gives every tab the 44px product target floor", async () => {
    await renderTabBar({ locale: "de" });

    for (const link of within(tabBar()).getAllByRole("link")) {
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
    }
  });

  it("keeps tab icons decorative and labels visible above the 12px floor", async () => {
    await renderTabBar({ locale: "de" });
    const bar = tabBar();

    const icons = bar.querySelectorAll("svg");
    expect(icons).toHaveLength(4);
    for (const icon of icons) {
      expect(icon).toHaveAttribute("aria-hidden", "true");
    }
    for (const link of within(bar).getAllByRole("link")) {
      expect(link.querySelector("span")?.className).toContain("text-xs");
    }
  });

  it("does not prefetch its destinations from every route in the site", async () => {
    await renderTabBar({ locale: "de" });

    for (const link of within(tabBar()).getAllByRole("link")) {
      expect(link).toHaveAttribute("data-prefetch", "false");
    }
  });

  it("builds one tab per destination with a stable identity", () => {
    expect(buildMobileTabs("de").map((tab) => tab.id)).toEqual([
      "start",
      "kurse",
      "werkzeuge",
      "konto",
    ]);
    expect(buildMobileTabs("de").map((tab) => tab.matchPath)).toEqual([
      "/",
      "/kurse",
      "/open-source",
      "/konto",
    ]);
    // Every destination is the tab's own match path, locale prefix aside.
    expect(buildMobileTabs("en").map((tab) => tab.href)).toEqual([
      "/en",
      "/en/kurse",
      "/en/open-source",
      "/en/konto",
    ]);
  });
});
