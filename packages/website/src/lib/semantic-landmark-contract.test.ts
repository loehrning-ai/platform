import { readFileSync, readdirSync } from "node:fs";
import { relative, join } from "node:path";
import { describe, expect, it } from "vitest";
import { GLOBAL_NAVIGATION_COPY } from "./i18n/global-copy";
import { SUPPORTED_LOCALES } from "./i18n/locale";

const SRC = join(__dirname, "..");

function productionTsx(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionTsx(path);
    return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")
      ? [path]
      : [];
  });
}

describe("semantic landmark contract", () => {
  it("keeps the root layout as the sole main landmark owner", () => {
    const owners = productionTsx(SRC).flatMap((path) => {
      const openingTags = readFileSync(path, "utf8")
        .split("\n")
        .filter((line) => line.trimStart().startsWith("<main"));
      return openingTags.map(() => relative(SRC, path));
    });

    expect(owners).toEqual(["app/layout.tsx"]);
  });

  it("mounts the companion tab bar after both the site nav and the footer", () => {
    // The tab bar is the shell's second navigation landmark. Its position in
    // the layout is load-bearing in two directions, so it is pinned here
    // rather than left to whoever next edits the layout:
    //   - it must follow <Nav />, because a11y-structure.spec.ts resolves the
    //     site navigation with `.first()` and axe needs the two landmarks
    //     told apart;
    //   - it must come last, so keyboard order matches its position at the
    //     bottom edge of the viewport.
    // Without the mount, the whole mobile-shell e2e spec fails on every
    // assertion instead of on one clear cause.
    const layout = readFileSync(join(SRC, "app", "layout.tsx"), "utf8");

    expect(layout).toContain(
      'import { MobileTabBar } from "@/components/mobile-tab-bar";',
    );

    const tabBar = layout.indexOf("<MobileTabBar />");
    const nav = layout.indexOf("<Nav />");
    const footer = layout.indexOf("<Footer />");

    expect(tabBar).toBeGreaterThan(-1);
    expect(nav).toBeGreaterThan(-1);
    expect(footer).toBeGreaterThan(-1);
    expect(tabBar).toBeGreaterThan(nav);
    expect(tabBar).toBeGreaterThan(footer);
  });

  it("gives the two navigation landmarks distinct names in every locale", () => {
    // `getByRole("navigation", { name })` is a single-match query, so a shared
    // name would make both landmarks unaddressable and axe would report a
    // landmark it cannot tell apart.
    const navSource = readFileSync(
      join(SRC, "components", "nav.tsx"),
      "utf8",
    );
    const tabBarSource = readFileSync(
      join(SRC, "components", "mobile-tab-bar.tsx"),
      "utf8",
    );

    expect(navSource).toContain("mainNavigation");
    expect(tabBarSource).toContain(
      "GLOBAL_NAVIGATION_COPY[locale].quickNavigation",
    );

    for (const locale of SUPPORTED_LOCALES) {
      const copy = GLOBAL_NAVIGATION_COPY[locale];
      expect(copy.quickNavigation).not.toBe(copy.mainNavigation);
      expect(copy.quickNavigation.length).toBeGreaterThan(0);
    }
  });
});
